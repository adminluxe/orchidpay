#!/usr/bin/env python3
"""Adversarial tests against the actual generated files, restoring every byte."""
from __future__ import annotations
import hashlib
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
CHECK = [sys.executable, "scripts/security/verify-generated-native-security.py"]

def exercise(rel: str, before: bytes, after: bytes, expected: bytes) -> None:
    dest = ROOT / rel
    original = dest.read_bytes()
    assert original.count(before) == 1, "Unexpected native source pattern: " + rel
    tampered = original.replace(before, after, 1)
    assert tampered != original
    try:
        dest.write_bytes(tampered)
        proc = subprocess.run(CHECK, cwd=ROOT, capture_output=True, env=os.environ.copy())
        if proc.returncode == 0 or expected not in proc.stderr:
            raise AssertionError("Security checker failed to reject: " + rel + " stderr=" + repr(proc.stderr[:180]))
        print("NATIVE_SECURITY_MUTATION_REJECTED=PASS:" + rel)
    finally:
        dest.write_bytes(original)
    assert hashlib.sha256(dest.read_bytes()).digest() == hashlib.sha256(original).digest(), "RESTORE_DIGEST_MISMATCH"

def main() -> None:
    run = subprocess.run(CHECK, cwd=ROOT, capture_output=True, env=os.environ.copy())
    assert run.returncode == 0, "Positive test must pass first"
    exercise(
      "android/app/src/main/AndroidManifest.xml",
      b'android:allowBackup="false"', b'android:allowBackup="true"',
      b'ANDROID_AUTO_BACKUP_ENABLED')
    exercise(
      "android/app/src/main/res/xml/orchidpay_no_data_extraction.xml",
      b'<device-transfer>\n    <exclude domain="root" path="." />',
      b'<device-transfer>\n    <include domain="root" path="." />',
      b'ROOT_NOT_EXCLUDED')
    exercise(
      "ios/OrchidPay/Info.plist",
      b'<key>NSAllowsArbitraryLoads</key>\n      <false/>',
      b'<key>NSAllowsArbitraryLoads</key>\n      <true/>',
      b'IOS_ATS_BYPASS')
    exercise(
      "android/gradle/wrapper/gradle-wrapper.properties",
      b'distributionSha256Sum=8fad3d78296ca518113f3d29016617c7f9367dc005f932bd9d93bf45ba46072b',
      b'distributionSha256Sum=' + b'0'*64,
      b'ANDROID_GRADLE_DISTRIBUTION_UNPINNED')
    release = subprocess.run(CHECK + ["--production"], cwd=ROOT, capture_output=True, env=os.environ.copy())
    assert release.returncode != 0 and b'RELEASE_BLOCKED_DEBUG_SIGNING_CONFIG' in release.stderr
    print("UNSIGNED_DEVELOPMENT_RELEASE_REFUSAL=PASS")
    run = subprocess.run(CHECK, cwd=ROOT, capture_output=True, env=os.environ.copy())
    assert run.returncode == 0, "Positive test must still pass after all restoration"
    print("NATIVE_SECURITY_CHECKER_ADVERSARIAL_TESTS=PASS")

if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print("NATIVE_SECURITY_CHECKER_ADVERSARIAL_TESTS=FAIL:"+str(error), file=sys.stderr)
        raise
