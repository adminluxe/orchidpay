#!/usr/bin/env python3
"""OrchidPay B12 / Apple 2.3.1(a): offline QA for metadata copy only.

READ-ONLY; NO APP STORE CONNECT API, NO EAS, NO SITE DEPLOY.
"""
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / "docs/ORCHIDPAY_APPSTORE_COPY_B12_EN_FR_2026-10-12.json").read_text(encoding="utf-8"))
assert data["draftStatus"] == "QA_ONLY_NOT_APPLIED_APP_STORE_CONNECT"
assert data["iosBuild"] == "1.0.0 (12)"
limits = dict(name=30, subtitle=30, promotionalText=170, description=4000, keywords=100)
for locale in ("en-US", "fr-FR"):
    record = data["locales"][locale]
    for key, limit in limits.items():
        value = record[key]
        length = len(value.encode("utf-8")) if key == "keywords" else len(value)
        assert 1 <= length <= limit, (locale, key, length, limit)
        print(f"COPY_LENGTH_{locale}_{key}={length}/{limit}")
    assert record["name"] == "OrchidPay"
    assert "," in record["keywords"]
    assert all(len(k.strip()) > 2 for k in record["keywords"].split(","))
    assert "https://www.orchidpay.online/support/" in record["description"]
    # Financial capabilities may only be mentioned as explicit absences.
    if locale == "en-US":
        assert "no banking account" in record["description"].lower()
        assert "does not hold or move customer funds" in record["description"]
        assert "does not verify" in record["description"]
        assert "No banking, card or money-transfer" in record["promotionalText"]
    else:
        assert "aucun compte bancaire" in record["description"].lower()
        assert "ne conserve ni ne transfère" in record["description"]
        assert "ne vérifie aucune transaction" in record["description"]
        assert "Aucun compte bancaire" in record["promotionalText"]
    assert not re.search(r"(?:wallet|deposit|transfer|bank),", record["keywords"], re.I)
    print(f"QA_{locale}_METADATA_COPY=PASS")
assert len(data["reviewNotesEn"].encode("utf-8")) <= 4000
route = (ROOT / "src/AppShell.tsx").read_text(encoding="utf-8")
for label in ("'home'", "'scan'", "'activity'", "'profile'",
              "case 'security'", "case 'scan'", "case 'activity'"):
    assert label in route, label
for disallowed in ("case 'send'", "case 'receive'", "case 'deposit'", "case 'cards'"):
    assert disallowed not in route, disallowed
scan = (ROOT / "src/screens/ScanScreen.tsx").read_text(encoding="utf-8")
assert "slice(0, 4096)" in scan and "slice(0, 180)" in scan
assert "ne déclenche aucune action ni aucun paiement" in scan
activity = (ROOT / "src/screens/TabScreens.tsx").read_text(encoding="utf-8")
assert "readAuditTrail(12)" in activity
security = (ROOT / "src/screens/SecurityScreen.tsx").read_text(encoding="utf-8")
assert "60 secondes en arrière-plan" in security
assert "Le QR" in data["reviewNotesEn"] or "QR" in data["reviewNotesEn"]
# Release-candidate Home copy is NOT retroactively part of Apple's submitted B12.
# This tests the next candidate's truthful claims only, without altering B12.
home = (ROOT / "src/screens/HomeScreen.tsx").read_text(encoding="utf-8")
for forbidden in (
    "sécurisé par design.",
    "Biométrie forte, stockage sécurisé",
    ">VAULT<",
    ">PROTÉGÉ<",
    ">FORTE<",
    ">RENFORCÉE<",
    "PAY. SECURE. GROW.",
):
    assert forbidden not in home, f"unsupported home claim: {forbidden}"
for required in (
    "SELON APPAREIL",
    "TRANSFERTS",
    "DÉSACTIVÉS",
    "Aucun transfert dans cette version.",
    "Le lecteur QR n’exécute aucune transaction",
    "Aucun solde bancaire, carte, dépôt, retrait ni transfert",
):
    assert required in home, f"missing accurate home scope: {required}"
print("QA_NEXT_CANDIDATE_HOME_FINANCIAL_TRUTH=PASS")
print("IOS_B12_SUBMITTED_BINARY=UNCHANGED")
print("QA_B12_SOURCE_ROUTER_QR_ACTIVITY_LOCK=PASS")
print("QA_APPSTORE_COPY=READY_FOR_OWNER_REVIEW_ONLY")
print("ASC_METADATA_EDIT=NOT_PERFORMED")
print("WEBSITE_DEPLOY=NOT_PERFORMED")
print("APPLE_SUBMISSION=UNTOUCHED")
print("APPLE_APPROVAL=NOT_CLAIMED")
