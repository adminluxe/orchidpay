#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
cd /repo
mkdir -p /work/evidence
[[ $(wc -l < /proc/net/route) -eq 1 ]] || { echo NETWORK_ROUTE_NOT_ISOLATED; exit 90; }
[[ ! -e /home/tontoncestcarre && ! -e /root/.config ]] || exit 91
node scripts/security/verify-local-security-forks.cjs > /work/evidence/provenance.json
python3 scripts/security/b7/boundary-check.py --repo /repo
python3 scripts/security/b7/release-admission.py --self-test > /work/evidence/admission-self-tests.json
node scripts/security/b7/provenance-negative.cjs /work /repo > /work/evidence/provenance-negative.log
node scripts/security/b7/sdk55-consumers.cjs /repo /work/evidence/sdk55-consumers.json > /work/evidence/sdk55-consumers.log
export B7_FIXTURE_ROOT=/work B7_BRACES_CANDIDATE=/repo/node_modules/braces
export B7_BRACES_REPORT=/work/evidence/braces.json
 timeout -k 5s 180s node --max-old-space-size=256 scripts/security/b7/braces-differential.cjs > /work/evidence/braces.log 2>&1
export B7_FORGE_EXTRA='{"candidateLib":"/repo/node_modules/node-forge/lib/index.js","candidateCore":"/repo/node_modules/node-forge/dist/forge.min.js","candidateAll":"/repo/node_modules/node-forge/dist/forge.all.min.js"}'
export B7_REPORT=/work/evidence/rsa.json
 timeout -k 10s 600s node --max-old-space-size=384 scripts/security/b7/rsa-differential.cjs > /work/evidence/rsa.log 2>&1
python3 - <<'PYQ'
import json,pathlib
p=pathlib.Path('/work/evidence');r=json.load(open(p/'rsa.json'));b=json.load(open(p/'braces.json'));s=json.load(open(p/'sdk55-consumers.json'));n=json.load(open(p/'PROVENANCE_NEGATIVE_CONTROLS.json'))
assert r['testVectors']==300 and r['verifierEvaluations']==2100 and r['errors']==[] and r['pr1159Vs1160Divergences']==0
assert r['baselineNoncanonicalAcceptances']==108
assert b['functionalMismatches']==[] and b['boundedErrors']==[] and b['patterns']==324
assert s['checks']==20 and n['tests']==8
result={'qualification':'PASS_TARGETED_ONLY','rsaVectors':300,'rsaEvaluations':2100,'baselineNoncanonicalAcceptances':108,'bracesComparisons':b['functionalComparisons'],'bracesSecurityEvaluations':b['securityChecks'],'consumerChecks':20,'negativeProvenanceChecks':8,'release':'NO_GO_SEPARATE_GATE','externalCertification':False}
(p/'QA_SUMMARY.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
PYQ
