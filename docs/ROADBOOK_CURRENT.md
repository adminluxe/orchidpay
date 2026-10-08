# OrchidPay — Roadbook Current

**Current checkpoint:** 2026-10-08
**Current candidate:** B12 Hardened Store Candidate
**Canonical repo:** `adminluxe/orchidpay`
**Protected base:** `main`

## Authoritative records

1. Architecture:
   `docs/ARCHITECTURE_PIN.md`

2. Detailed current roadbook:
   `docs/ROADBOOK_2026-10-08_ORCHIDPAY_B12_PREMIUM_STORE_READY.md`

3. B11 forensic audit:
   `docs/FORENSICS_2026-10-08_B11_TO_B12.md`

4. Current project state:
   `docs/POG/ORCHIDPAY_PROJECT_STATE_2026-10-08.md`

5. Security reservation:
   `docs/SECURITY_UPSTREAM_RESERVATION_2026-10-08.md`

6. One-shot gate:
   `scripts/TONTON_ORCHIDPAY_B12_GATE.sh`

## Current truth

- next iOS build: **12**
- next Android versionCode: **12**
- B11: **evidence source / not trusted baseline**
- B11 IPA forensic defects: **confirmed**
- Store financial mocks: **removed**
- Store engineering/lab routes: **removed from AppRoute/AppShell**
- Store QR: **verification only**
- payment live execution: **OFF**
- settlement: **OFF**
- `expo-dev-client`: **removed**
- `expo-notifications`: **removed**
- `expo-status-bar`: **removed**
- iOS Dev Launcher local-network / Bonjour keys: **absent in clean prebuild**
- Android audio/debug/storage permissions: **explicit removal directives**
- Android POST_NOTIFICATIONS: **absent**
- camera 5.1.1(iv) remediation: **preserved**
- packaged B11 signatures in current iOS/Android exports: **0 / 0**
- final exact-tree B12 gate: **PASS (RC=0)**
- B12 paid build / Store submit: **NOT AUTHORIZED / NOT PERFORMED**

## Promotion sequence

`DOCUMENT -> FULL GATE -> COMMIT -> PUSH -> PR -> CI/REVIEW -> BUILD DECISION -> SUBMIT DECISION`
