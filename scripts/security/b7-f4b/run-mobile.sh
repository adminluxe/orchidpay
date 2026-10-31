#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
cd /repo
test "$(wc -l < /proc/net/route)" -eq 1
mkdir -p /work/evidence
python3 scripts/security/b7-f4b/verify_f4b.py --repo /repo --phase content \
 > /work/evidence/provenance-mobile.json
python3 scripts/security/test-e2-native-admission.py > /work/evidence/native-negative-controls.json
node node_modules/typescript/bin/tsc --noEmit > /work/evidence/typescript.log 2>&1
node scripts/security/b7/sdk55-consumers.cjs /repo /work/evidence/sdk55-consumers.json \
 > /work/evidence/sdk55-consumers.log 2>&1
node --test scripts/op-p0-qa-export-gate.test.cjs > /work/evidence/export-gate-negative.log 2>&1
python3 scripts/orchidpay_apple231_copy_gate.py > /work/evidence/store-copy.log 2>&1
python3 scripts/orchidpay_apple231_site_gate.py > /work/evidence/site-copy.log 2>&1
timeout -k 10s 600s node --max-old-space-size=2048 node_modules/expo/bin/cli \
 export --platform ios --max-workers 2 --output-dir /work/ios \
 > /work/evidence/ios-hermes-export.log 2>&1
timeout -k 10s 600s node --max-old-space-size=2048 node_modules/expo/bin/cli \
 export --platform android --max-workers 2 --output-dir /work/android \
 > /work/evidence/android-hermes-export.log 2>&1
node scripts/op-p0-qa-export-gate.cjs /work/ios /work/android \
 > /work/evidence/financial-off-fuses.log
echo 'UNSIGNED_HERMES_IOS_ANDROID_PASS_NOT_IPA_AAB_NOT_RELEASE' \
 > /work/evidence/MOBILE_QA_SCOPE.txt
