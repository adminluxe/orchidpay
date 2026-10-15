#!/usr/bin/env bash
# Security canary, never a production install.
set -Eeuo pipefail
umask 077
ROOT="$(cd -- "$(dirname -- "$0")/../.." && pwd -P)"
TEMP="$(mktemp -d)"
mkdir -p "$TEMP/vendor/orchidpay-security"
cp "$ROOT/package.json" "$ROOT/package-lock.json" "$TEMP/"
export npm_config_userconfig=/dev/null npm_config_audit=false npm_config_fund=false
npm pack braces@3.0.3 --ignore-scripts --pack-destination "$TEMP/vendor/orchidpay-security" --silent >/dev/null
npm pack node-forge@1.4.0 --ignore-scripts --pack-destination "$TEMP/vendor/orchidpay-security" --silent >/dev/null
verify_sri(){
 local file="$1" expected="$2" result
 result="$(openssl dgst -sha512 -binary "$file" | openssl base64 -A)"
 test "$result" = "$expected" || { echo 'ORIGINAL_TARBALL_SRI_FAILURE';exit 32;}
}
verify_sri "$TEMP/vendor/orchidpay-security/braces-3.0.3.tgz" 'yQbXgO/OSZVD2IsiLlro+7Hf6Q18EJrKSEsdoMzKePKXct3gvD8oLcOQdIzGupr5Fj+EDe8gO/lxc1BzfMpxvA=='
verify_sri "$TEMP/vendor/orchidpay-security/node-forge-1.4.0.tgz" 'LarFH0+6VfriEhqMMcLX2F7SwSXeWwnEAJEsYm5QKWchiVYVvJyV9v7UDvUv+w5HO23ZpQTXDv/GxdDdMyOuoQ=='
node - "$TEMP/package.json" <<'NODE'
const fs=require('fs');
const p=process.argv[2],doc=JSON.parse(fs.readFileSync(p));
doc.dependencies.braces='file:vendor/orchidpay-security/braces-3.0.3.tgz';
doc.dependencies['node-forge']='file:vendor/orchidpay-security/node-forge-1.4.0.tgz';
fs.writeFileSync(p,JSON.stringify(doc,null,2)+'\n');
NODE
cd "$TEMP"
npm install --package-lock-only --ignore-scripts --no-audit --no-fund >/dev/null
set +e
npm audit --omit=dev --json > "$TEMP/unpatched_audit.json" 2> "$TEMP/audit_stderr.log"
AUDIT_RC=$?
set -e
node - "$TEMP/unpatched_audit.json" "$AUDIT_RC" <<'NODE'
const assert=require('node:assert/strict'),fs=require('node:fs');
const report=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
assert.equal(Number(process.argv[3]),1);
const counts=report.metadata?.vulnerabilities;
assert(counts && counts.high>=2 && counts.critical===0);
const primaries=Object.entries(report.vulnerabilities||{}).filter(([k,v])=>v.via?.some(q=>typeof q==='object')).map(([k])=>k).sort();
assert.deepEqual(primaries,['braces','node-forge']);
console.log('NPM_AUDIT_LOCAL_FILE_NEGATIVE_CONTROL=PASS');
console.log('ORIGINAL_UNPATCHED_HIGH='+counts.high);
NODE
echo 'AUDIT_CANARY_RESULT=PASS;PRODUCTION_RELEASE=NO_GO'
