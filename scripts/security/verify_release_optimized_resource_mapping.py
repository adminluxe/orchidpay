#!/usr/bin/env python3
"""Resolve compiled Android XML resource IDs to their *actual* APK file paths.

AAPT2/Gradle release optimization can rename res/xml/foo.xml to res/a.xml
(or even to an extensionless path). This does NOT excuse missing/corrupted
backup rules: map resource table names+IDs to physical paths and inspect
the actual compiled XML bytes. Strict failure if any link is missing.
"""
from __future__ import annotations
import re
import subprocess
from pathlib import Path

EXPECTED_NAMES = ("orchidpay_no_backup", "orchidpay_no_data_extraction")
RESOURCE = re.compile(
    r"^\s*resource\s+(0x[0-9A-Fa-f]{8})\s+"
    r"(?:[A-Za-z0-9_.-]+:)?xml/([A-Za-z0-9_.-]+)(?::|\s|$)"
)
NEXT_RESOURCE = re.compile(r"^\s*(?:spec\s+)?resource\s+0x[0-9A-Fa-f]{8}\b")
FILE = re.compile(r"\(file\)\s+(res/[A-Za-z0-9_./-]+)\s+type=XML(?:\s|$)")
STRING8 = re.compile(r'\(string8\)\s+"(res/[A-Za-z0-9_./-]+)"')


def require(ok, code):
    if not ok:
        raise ValueError("RELEASE_COMPILED_XML_RESOURCE_LINK:" + code)


def read_table(aapt2: Path, apk: Path):
    require(aapt2.is_file() and not aapt2.is_symlink(), "AAPT2_NOT_REGULAR_FILE")
    require(apk.is_file() and not apk.is_symlink(), "APK_NOT_REGULAR_FILE")
    result = subprocess.run(
        [str(aapt2), "dump", "resources", str(apk)],
        text=True, capture_output=True, timeout=60,
    )
    require(result.returncode == 0, "AAPT2_RESOURCE_DUMP_FAILED")
    require(80 < len(result.stdout) < 20_000_000, "AAPT2_RESOURCE_DUMP_SIZE")
    return result.stdout


def validate_path(path: str, actual_zip_paths: set):
    require(path.startswith("res/") and len(path) < 200, "BAD_XML_RESOURCE_PATH")
    require(".." not in Path(path).parts and "//" not in path and
            "\\" not in path and "\x00" not in path,
            "UNSAFE_XML_RESOURCE_PATH")
    require(path in actual_zip_paths, "MISSING_COMPILED_XML_RESOURCE_FILE:" + path)


def resolve(aapt2_resource_dump: str, actual_zip_paths: set):
    require(isinstance(aapt2_resource_dump, str) and
            80 < len(aapt2_resource_dump) < 20_000_000,
            "UNTRUSTED_RESOURCE_TABLE_TEXT")
    found = {
        key: {"id": None, "paths": set()}
        for key in EXPECTED_NAMES
    }
    active = None
    for line in aapt2_resource_dump.splitlines():
        m = RESOURCE.match(line)
        if m:
            name = m.group(2)
            active = name if name in found else None
            if active is not None:
                numeric = int(m.group(1), 16)
                previous = found[active]["id"]
                require(previous is None or previous == numeric,
                        "DUPLICATE_LOGICAL_RESOURCE_ID:" + active)
                found[active]["id"] = numeric
        elif NEXT_RESOURCE.match(line):
            active = None
        if active is None:
            continue
        for matcher in (FILE, STRING8):
            for hit in matcher.finditer(line):
                path = hit.group(1)
                validate_path(path, actual_zip_paths)
                found[active]["paths"].add(path)

    seen_paths = set()
    for name in EXPECTED_NAMES:
        item = found[name]
        require(item["id"] is not None, "LOGICAL_XML_RESOURCE_ID_NOT_FOUND:" + name)
        require(1 <= len(item["paths"]) <= 8,
                "XML_RESOURCE_PHYSICAL_PATH_COUNT_INVALID:" + name)
        require(not (seen_paths & item["paths"]),
                "TWO_XML_RESOURCES_SHARE_ONE_PHYSICAL_FILE")
        seen_paths.update(item["paths"])
    require(found[EXPECTED_NAMES[0]]["id"] != found[EXPECTED_NAMES[1]]["id"],
            "COMPILED_XML_IDS_COLLIDE")
    return found