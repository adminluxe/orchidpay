#!/usr/bin/env python3
"""Independent check of Android debug APK's COMPILED privacy rules.

QA ONLY: validates decoded bytes inside APK; does not certify a signed
release, production attestation, or financial operation.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

ANDROID = "{http://schemas.android.com/apk/res/android}"
EXPECTED_ID = "com.delishafrica.orchidpaymobile"
RULES = (
    ("orchidpay_no_backup", "full-backup-content", (None,)),
    ("orchidpay_no_data_extraction", "data-extraction-rules",
     ("cloud-backup", "device-transfer")),
)


def demand(test, why):
    if not test:
        raise ValueError(why)


def parse_xml(source, label):
    try:
        return ET.fromstring(source)
    except ET.ParseError as exc:
        raise ValueError("INVALID_XML_" + label) from exc


def validate_manifest(xml, blocked, resource_ids=None):
    root = parse_xml(xml, "MANIFEST")
    demand(root.tag == "manifest", "APK_MANIFEST_ROOT_CHANGED")
    demand(root.get("package") == EXPECTED_ID, "APK_APPLICATION_ID_WRONG")
    apps = root.findall("application")
    demand(len(apps) == 1, "APK_APPLICATION_AMBIGUOUS")
    app = apps[0]
    demand(app.get(ANDROID + "allowBackup") == "false",
           "APK_ALLOWBACKUP_NOT_FALSE")
    for name, resource in [
        ("fullBackupContent", "orchidpay_no_backup"),
        ("dataExtractionRules", "orchidpay_no_data_extraction"),
    ]:
        ref = app.get(ANDROID + name, "")
        symbolic = ("@xml/" + resource,
                    "@com.delishafrica.orchidpaymobile:xml/" + resource)
        if ref not in symbolic:
            # apkanalyzer may render compiled resource references numerically.
            # The number is acceptable ONLY if independently resolved from
            # the APK's own resource table to the expected named XML policy.
            demand(re.fullmatch(r"@0[xX][0-9a-fA-F]{8}", ref) is not None,
                   "APK_BACKUP_REFERENCE_INVALID_" + name)
            demand(resource_ids is not None and
                   int(ref[1:], 16) == resource_ids.get(resource),
                   "APK_BACKUP_REFERENCE_MISMATCH_" + name)
        elif resource_ids is not None:
            demand(resource in resource_ids,
                   "APK_BACKUP_RESOURCE_NOT_IN_COMPILED_TABLE_" + resource)
    demand(app.get(ANDROID + "debuggable") == "true",
           "APK_NOT_A_DEBUG_ONLY_BUILD")
    permissions = {
        p.get(ANDROID + "name") for p in root
        if p.tag in ("uses-permission", "uses-permission-sdk-23",
                     "uses-permission-sdk-m")
    }
    offending = sorted(set(blocked).intersection(permissions))
    demand(not offending, "APK_FORBIDDEN_PERMISSION_PRESENT:" + ",".join(offending))
    return app.get(ANDROID + "usesCleartextTraffic")


def validate_policy(xml, resource, expected_root, sections):
    tree = parse_xml(xml, resource)
    demand(tree.tag == expected_root, "APK_BACKUP_XML_WRONG_ROOT:" + resource)
    if sections == (None,):
        sections_to_check = [tree]
    else:
        sections_to_check = []
        for section in sections:
            matches = tree.findall(section)
            demand(len(matches) == 1, "APK_BACKUP_XML_SECTION_MISSING:" + section)
            sections_to_check.append(matches[0])
    for sec in sections_to_check:
        exclusions = [
            node for node in sec.findall("exclude")
            if node.get("domain") == "root" and node.get("path") == "."
        ]
        demand(len(exclusions) == 1,
               "APK_BACKUP_XML_ROOT_NOT_EXCLUDED:" + (sec.tag or resource))


def decode_xml(tool, apk, path, category):
    if category == "manifest":
        args = [str(tool), "manifest", "print", str(apk)]
    else:
        args = [str(tool), "resources", "xml", "--file", path, str(apk)]
    r = subprocess.run(args, capture_output=True, text=True, timeout=45)
    demand(r.returncode == 0,
           "APK_ANALYZER_FAILED:" + category + ":" + str(r.returncode) +
           ":" + r.stderr[:260].replace("\n", " "))
    demand(len(r.stdout) > 30 and len(r.stdout) < 250000,
           "APK_ANALYZER_OUTPUT_INVALID:" + category)
    return r.stdout


def parse_resource_ids(table):
    result = {}
    for line in table.splitlines():
        match = re.match(
            r"^\s*resource\s+(0x[0-9a-fA-F]{8})\s+"
            r"(?:[^\s:]+:)?xml/([A-Za-z0-9_.-]+)(?::|\s|$)",
            line,
        )
        if not match:
            continue
        resource = match.group(2)
        if resource not in {item[0] for item in RULES}:
            continue
        demand(resource not in result, "APK_RESOURCE_TABLE_DUPLICATE:" + resource)
        result[resource] = int(match.group(1), 16)
    for name, _, _ in RULES:
        demand(name in result, "APK_RESOURCE_TABLE_XML_NOT_FOUND:" + name)
    demand(len(set(result.values())) == len(result), "APK_RESOURCE_TABLE_ID_COLLISION")
    return result


def resource_ids_from_apk(aapt2, apk):
    result = subprocess.run(
        [str(aapt2), "dump", "resources", str(apk)],
        text=True, capture_output=True, timeout=60,
    )
    demand(result.returncode == 0, "AAPT2_RESOURCE_DUMP_FAILED:" +
           str(result.returncode) + ":" + result.stderr[:260])
    demand(50 < len(result.stdout) < 20000000, "AAPT2_RESOURCE_TABLE_SIZE_INVALID")
    return parse_resource_ids(result.stdout)


def inspect(apk, tool, aapt2, project):
    apk = apk.resolve(strict=True)
    tool = tool.resolve(strict=True)
    aapt2 = aapt2.resolve(strict=True)
    demand(tool.is_file() and os.access(tool, os.X_OK), "APK_ANALYZER_NOT_EXECUTABLE")
    demand(aapt2.is_file() and os.access(aapt2, os.X_OK), "AAPT2_NOT_EXECUTABLE")
    demand(apk.is_file() and apk.stat().st_size > 100000,
           "DEBUG_APK_MISSING_OR_TOO_SMALL")
    config = json.loads((project / "app.json").read_text())["expo"]
    demand(config["android"]["package"] == EXPECTED_ID,
           "PROJECT_APPLICATION_ID_UNEXPECTED")
    blocked = config["android"]["blockedPermissions"]

    with zipfile.ZipFile(apk, "r") as archive:
        entries = archive.namelist()
        demand(len(entries) == len(set(entries)), "APK_DUPLICATED_ZIP_ENTRIES")
        demand("AndroidManifest.xml" in entries, "APK_COMPILED_MANIFEST_ABSENT")
        demand("resources.arsc" in entries, "APK_COMPILED_RESOURCES_ABSENT")
        demand(any(re.fullmatch(r"classes\d*\.dex", x) for x in entries),
               "APK_CLASSES_DEX_MISSING")
        rules = []
        for resource, kind, sections in RULES:
            candidates = [x for x in entries
                          if re.fullmatch(
                              r"res/xml/" + re.escape(resource) + r"(?:_\d+)?\.xml", x)]
            demand(len(candidates) == 1,
                   "APK_BACKUP_COMPILED_RESOURCE_NOT_UNIQUE:" + resource)
            rules.append((candidates[0], resource, kind, sections))

    resources = resource_ids_from_apk(aapt2, apk)
    manifest = decode_xml(tool, apk, "AndroidManifest.xml", "manifest")
    cleartext = validate_manifest(manifest, blocked, resources)
    for path, resource, kind, sections in rules:
        content = decode_xml(tool, apk, path, "resource")
        validate_policy(content, resource, kind, sections)
        print("COMPILED_BACKUP_XML_ROOT_EXCLUSION=PASS:" + resource)

    print("APK_COMPILED_BACKUP_RESOURCE_IDS_LINKED=PASS")
    print("APK_COMPILED_MANIFEST_NO_BACKUP=PASS")
    print("APK_COMPILED_FORBIDDEN_PERMISSIONS_ABSENT=PASS")
    print("APK_COMPILED_APPLICATION_ID=PASS")
    print("APK_DEBUG_CLEAR_TEXT_SETTING=" + str(cleartext))
    print("APK_DEBUG_ONLY_BINARY_SECURITY_QA=PASS")
    print("PRODUCTION_SIGNED_RELEASE=NO_GO")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apk", required=True, type=Path)
    parser.add_argument("--apkanalyzer", required=True, type=Path)
    parser.add_argument("--aapt2", required=True, type=Path)
    parser.add_argument("--project", default=".", type=Path)
    args = parser.parse_args()
    try:
        inspect(args.apk, args.apkanalyzer, args.aapt2, args.project.resolve())
    except (ValueError, OSError, zipfile.BadZipFile, KeyError) as exc:
        print("APK_COMPILED_POLICY_QA=FAIL:" + str(exc), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
