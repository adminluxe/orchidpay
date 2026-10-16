#!/usr/bin/env python3
"""Parse apksigner certificate SHA-256 safely across Android Build Tools formats.

Accept one unique signer certificate across V2/V3 scheme reports or the
pre-37 'Signer #1' display. Reject unknown labels, extra signers, malformed
digests, and conflicting certificates. apksigner VERIFY must separately pass.
"""
import argparse
import re
import sys
from pathlib import Path

HEX64 = re.compile(r"[0-9a-fA-F]{64}")
LABEL = re.compile(
    r"^(?:Signer #1|V2 Signer|V3\.0 Signer|V3\.1 Signer):? "
    r"certificate SHA-256 digest: ([0-9a-fA-F]{64})$"
)
COUNT = re.compile(r"^Number of signers: ([0-9]+)$")


def parse(text: str) -> str:
    if not isinstance(text, str) or not 1 <= len(text) <= 500_000:
        raise ValueError("APKSIGNER_OUTPUT_INVALID_SIZE")
    if "\x00" in text or "DOES NOT VERIFY" in text:
        raise ValueError("APKSIGNER_VERIFICATION_FAILURE")
    relevant = [
        line.strip() for line in text.splitlines()
        if "certificate SHA-256 digest:" in line
    ]
    if not relevant:
        raise ValueError("APKSIGNER_CERTIFICATE_DIGEST_MISSING")
    digests = set()
    for line in relevant:
        match = LABEL.fullmatch(line)
        if not match:
            raise ValueError("APKSIGNER_UNKNOWN_CERTIFICATE_LABEL_OR_ADDITIONAL_SIGNER")
        digests.add(match.group(1).lower())
    if len(digests) != 1:
        raise ValueError("APKSIGNER_INCONSISTENT_SIGNER_CERTIFICATES")
    counters = [COUNT.fullmatch(line.strip()) for line in text.splitlines()
                if "Number of signers:" in line]
    if counters:
        if len(counters) != 1 or counters[0] is None or int(counters[0][1]) != 1:
            raise ValueError("APKSIGNER_SIGNER_COUNT_INVALID")
    return next(iter(digests))


def main():
    args = argparse.ArgumentParser()
    args.add_argument("--input", type=Path, required=True)
    p = args.parse_args()
    try:
        if not p.input.is_file() or p.input.is_symlink():
            raise ValueError("APKSIGNER_EVIDENCE_FILE_INVALID")
        print(parse(p.input.read_text(encoding="utf-8")))
    except (OSError, UnicodeError, ValueError) as exc:
        print("APKSIGNER_SIGNER_CERT_QA=FAIL:" + str(exc), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
