#!/usr/bin/env python3
"""Fail-closed static checks of disposable Expo-generated native files.

This is QA only. It does not certify signed IPA/AAB or physical-device behavior.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import plistlib
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ANDROID_NS = "{http://schemas.android.com/apk/res/android}"
TOOLS_NS = "{http://schemas.android.com/tools}"
APP_ID = "com.delishafrica.orchidpaymobile"
LOCK_SHA256 = "dffe18e1ed925dd91e94717e8908e1108a0f016f952db1c013cf82e930b892f4"
SOURCE_SHA = os.getenv("OP_EXPECTED_GIT_SOURCE_SHA", "752dd4ab20fa39c1630cdc03b9f5f3a64899e759")


def require(ok: bool, message: str) -> None:
    if not ok:
        raise ValueError(message)


def validate(root: Path, release: bool = False) -> None:
    root = root.resolve()
    require(root.is_dir() and (root / "app.json").is_file(), "SOURCE_ROOT_MISSING")
    git_head = subprocess.check_output(["git", "-C", str(root), "rev-parse", "HEAD"], text=True).strip()
    require(git_head == SOURCE_SHA, "SOURCE_HEAD_CHANGED")

    raw_lock = (root / "package-lock.json").read_bytes()
    require(hashlib.sha256(raw_lock).hexdigest() == LOCK_SHA256, "LOCKFILE_SHA_CHANGED")

    # Expo prebuild can rewrite only two development shell scripts; no package changes allowed.
    original = json.loads(subprocess.check_output(["git", "-C", str(root), "show", "HEAD:package.json"]))
    actual = json.loads((root / "package.json").read_text())
    for platform in ("android", "ios"):
        require(actual["scripts"][platform] == "expo run:" + platform, "UNEXPECTED_PREBUILD_SCRIPT")
        actual["scripts"][platform] = original["scripts"][platform]
    require(actual == original, "PACKAGE_MANIFEST_DRIFT_OTHER_THAN_DEV_COMMANDS")

    app = json.loads((root / "app.json").read_text())["expo"]
    require(app["android"]["package"] == APP_ID, "ANDROID_APP_ID_MISMATCH")
    require(app["ios"]["bundleIdentifier"] == APP_ID, "IOS_APP_ID_MISMATCH")
    require(app["plugins"][-1] == "./plugins/withOrchidPayNoBackup.cjs", "SECURITY_PLUGIN_NOT_LAST")

    manifest = ET.parse(root / "android/app/src/main/AndroidManifest.xml").getroot()
    app_nodes = manifest.findall("application")
    require(len(app_nodes) == 1, "ANDROID_APPLICATION_NODE_AMBIGUOUS")
    attrs = app_nodes[0].attrib
    require(attrs.get(ANDROID_NS + "allowBackup") == "false", "ANDROID_AUTO_BACKUP_ENABLED")
    require(attrs.get(ANDROID_NS + "fullBackupContent") == "@xml/orchidpay_no_backup", "ANDROID_BACKUP_POLICY_UNPINNED")
    require(attrs.get(ANDROID_NS + "dataExtractionRules") == "@xml/orchidpay_no_data_extraction", "ANDROID_TRANSFER_POLICY_UNPINNED")
    require(attrs.get(ANDROID_NS + "usesCleartextTraffic") != "true", "ANDROID_RELEASE_CLEARTEXT_ENABLED")

    backup = ET.parse(root / "android/app/src/main/res/xml/orchidpay_no_backup.xml").getroot()
    require(backup.tag == "full-backup-content", "OLD_ANDROID_BACKUP_POLICY_INVALID")
    require(any(x.tag == "exclude" and x.attrib == {"domain": "root", "path": "."} for x in backup),
            "OLD_ANDROID_ROOT_NOT_EXCLUDED")

    extraction = ET.parse(root / "android/app/src/main/res/xml/orchidpay_no_data_extraction.xml").getroot()
    require(extraction.tag == "data-extraction-rules", "ANDROID_EXTRACTION_POLICY_INVALID")
    for section_name in ("cloud-backup", "device-transfer"):
        sections = extraction.findall(section_name)
        require(len(sections) == 1, "ANDROID_" + section_name.upper() + "_POLICY_MISSING")
        require(any(x.tag == "exclude" and x.attrib == {"domain": "root", "path": "."} for x in sections[0]),
                "ANDROID_" + section_name.upper() + "_ROOT_NOT_EXCLUDED")

    blocked = set(app["android"]["blockedPermissions"])
    for item in manifest.findall("uses-permission"):
        name = item.attrib.get(ANDROID_NS + "name")
        if name in blocked:
            require(item.attrib.get(TOOLS_NS + "node") == "remove", "BLOCKED_ANDROID_PERMISSION_ACTIVE:" + name)

    info = plistlib.loads((root / "ios/OrchidPay/Info.plist").read_bytes())
    ats = info.get("NSAppTransportSecurity", {})
    require(ats.get("NSAllowsArbitraryLoads") is False, "IOS_ATS_BYPASS")
    require(bool(info.get("NSFaceIDUsageDescription")), "IOS_FACEID_JUSTIFICATION_MISSING")
    require(bool(info.get("NSCameraUsageDescription")), "IOS_CAMERA_JUSTIFICATION_MISSING")
    require(not info.get("NSMicrophoneUsageDescription"), "IOS_MICROPHONE_UNEXPECTED")
    require(info.get("ITSAppUsesNonExemptEncryption") is False, "IOS_ENCRYPTION_DECLARATION_CHANGED")

    entitlement = plistlib.loads((root / "ios/OrchidPay/OrchidPay.entitlements").read_bytes())
    app_attest_env = entitlement.get("com.apple.developer.devicecheck.appattest-environment")
    require(app_attest_env in ("development", "production"), "IOS_APP_ATTEST_ENTITLEMENT_MISSING")

    wrapper = (root / "android/gradle/wrapper/gradle-wrapper.properties").read_text()
    jar_sha256 = hashlib.sha256((root / "android/gradle/wrapper/gradle-wrapper.jar").read_bytes()).hexdigest()
    require(jar_sha256 == "76805e32c009c0cf0dd5d206bddc9fb22ea42e84db904b764f3047de095493f3",
            "ANDROID_WRAPPER_JAR_SHA_MISMATCH")
    require("distributionUrl=https\\://services.gradle.org/distributions/gradle-9.0.0-bin.zip" in wrapper,
            "ANDROID_GRADLE_DISTRIBUTION_CHANGED")
    require("distributionSha256Sum=8fad3d78296ca518113f3d29016617c7f9367dc005f932bd9d93bf45ba46072b" in wrapper,
            "ANDROID_GRADLE_DISTRIBUTION_UNPINNED")

    gradle = (root / "android/app/build.gradle").read_text()
    release_section = re.search(r"(?m)^\s*release\s*\{([\s\S]*?)^\s{8}\}", gradle)
    require(release_section is not None, "ANDROID_RELEASE_BLOCK_MISSING")
    debug_signer = bool(re.search(r"(?m)^\s*signingConfig\s+signingConfigs\.debug\b", release_section.group(1)))
    require((root / "android/gradle/wrapper/gradle-wrapper.properties").is_file(), "GRADLE_WRAPPER_MISSING")

    print("ANDROID_CLOUD_AND_DEVICE_TRANSFER_ROOT_EXCLUDED=PASS")
    print("ANDROID_ALLOWBACKUP_FALSE_AND_BLOCKED_PERMISSIONS=PASS")
    print("IOS_ATS_STRICT_AND_PERMISSION_STRINGS=PASS")
    print("IOS_APP_ATTEST_PREBUILD_ENV=" + str(app_attest_env))
    print("ANDROID_TEMPLATE_RELEASE_DEBUG_SIGNING=" + str(debug_signer).lower())
    print("ANDROID_GRADLE9_WRAPPER_AND_DISTRIBUTION_HASH=PASS")
    print("SOURCE_AND_LOCKFILE_INTEGRITY=PASS")

    if release:
        # Enforced production refusal until signed artifacts prove production entitlements
        # and a dedicated release signer replace the native-template development defaults.
        require(not debug_signer, "RELEASE_BLOCKED_DEBUG_SIGNING_CONFIG")
        require(app_attest_env == "production", "RELEASE_BLOCKED_APP_ATTEST_DEVELOPMENT")
        raise ValueError("RELEASE_BLOCKED_NATIVE_SIGNED_BINARIES_UNVERIFIED")

    print("NATIVE_PREBUILD_SECURITY_STATIC_QA=PASS")
    print("NATIVE_SIGNED_RELEASE=NO_GO")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    parser.add_argument("--production", action="store_true")
    args = parser.parse_args()
    try:
        validate(Path(args.root), release=args.production)
    except Exception as error:
        print("NATIVE_PREBUILD_STATIC_QA=FAIL:" + str(error), file=sys.stderr)
        sys.exit(1)
