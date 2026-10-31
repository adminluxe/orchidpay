#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
cd /repo
mkdir -p /work/evidence
python3 scripts/security/b7-f4b/verify_f4b.py --repo /repo --phase content \
 > /work/evidence/provenance-audit.json
python3 scripts/security/test-e2-native-admission.py \
 > /work/evidence/native-admission-negative-controls.json
gate=0
for kind in full prod; do
 set +e
 if [[ "$kind" = full ]]; then
  timeout -k 10s 240s npm audit --json --audit-level=high \
   > "/work/evidence/$kind-native.json" 2> "/work/evidence/$kind-native.stderr"
 else
  timeout -k 10s 240s npm audit --json --audit-level=high --omit=dev \
   > "/work/evidence/$kind-native.json" 2> "/work/evidence/$kind-native.stderr"
 fi
 rc=$?
 set -e
 printf '%s\n' "$rc" > "/work/evidence/$kind-native.exit"
 sha256sum "/work/evidence/$kind-native.json" >> /work/evidence/NATIVE_SHA256SUMS.txt
 sha512sum "/work/evidence/$kind-native.json" >> /work/evidence/NATIVE_SHA512SUMS.txt
 set +e
 python3 scripts/security/verify-e2-native-admission.py \
  --report "/work/evidence/$kind-native.json" --native-exit "$rc" \
  > "/work/evidence/$kind-admission.json" 2> "/work/evidence/$kind-admission.stderr"
 status=$?
 set -e
 printf '%s\n' "$status" > "/work/evidence/$kind-admission.exit"
 if [[ "$status" -ne 0 ]]; then gate=1; fi
done
if [[ "$gate" -ne 0 ]]; then
 echo ORCHIDPAY_B7_F4B_NATIVE_HIGH_CRITICAL_NO_GO
 exit 1
fi
echo ORCHIDPAY_B7_F4B_AUDIT_THRESHOLD_PASS_NOT_RELEASE \
 > /work/evidence/AUDIT_THRESHOLD_PASS_NOT_RELEASE.txt
