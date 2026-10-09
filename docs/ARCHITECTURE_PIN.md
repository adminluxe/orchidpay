# OrchidPay — Architecture Pin — 2026-10-08

**Status:** B12 R5 CLOUD-BUILD HARDENED / COMMIT-BOUNDARY GREEN / FAIL-CLOSED / NO LIVE PAYMENT AUTHORIZATION
**Canonical repository:** `adminluxe/orchidpay`
**Canonical base at materialization:** `4cec70daad7f0c25ad681da8690cf82d85bacf8c`
**Candidate branch:** `reconcile/b12-premium-store-ready-20261008`

## 1. Product boundary

The current Store-routed OrchidPay application is a protected private client centered on:
- strong local authentication;
- secure device/session state;
- QR content verification without automatic financial action;
- local security activity;
- privacy, device and security controls.

Financial execution foundations remain in the repository for controlled engineering work, but the current Store router does **not** expose Send, Receive, Deposit, Card-control or backend-lab routes.

The application does **not** claim or authorize:
- live payment execution;
- settlement;
- live card-network control;
- regulated payment-service availability;
- production KYC/KYB/AML completion;
- production PSP/tokenization availability;
- production banking-provider activation.

The fail-closed truth is enforced technically. The client UI no longer exposes internal engineering labels such as `LIVE OFF`, `FAIL-CLOSED`, R13/lab vocabulary or mock-financial status as user-facing product content.

## 2. Store route architecture

### Store TabRoute
- `home`
- `scan`
- `activity`
- `profile`

### Store FlowRoute
- `security`
- `authorized-devices`
- `limits-security`
- `compliance`
- `help`
- `notifications`

### EngineeringRoute — not Store-routed
- `send`
- `receive`
- `deposit`
- `cards`
- `integration-readiness`
- `backend-contract-lab`

`AppRoute` and `EngineeringRoute` are intentionally separate types. `src/AppShell.tsx` imports only Store-routed surfaces.

## 3. Canonical mobile identity

| Surface | Value |
| --- | --- |
| Product version | `1.0.0` |
| iOS bundle | `com.delishafrica.orchidpaymobile` |
| iOS next build | `12` |
| Android package | `com.delishafrica.orchidpaymobile` |
| Android next versionCode | `12` |
| iOS runtime | `1.0.0-public-ready-b12-premium-brand-v1` |
| EAS project | `31e42526-bb26-42d9-9bcb-6ec23853aee2` |
| App Store Connect app | `6808431270` |

Build 12 is intentional. B10 was generated/submitted after B11 already existed. The next candidate therefore moves monotonically to B12.

## 4. B11 provenance rule

B11 is a historical evidence source, **not a trusted baseline**.

Reference source:
`/home/afripayadmin/ORCHIDPAY_BUILD11_EXACT_BRAND_20261007/source`

Reference IPA:
`/home/afripayadmin/ORCHIDPAY_BUILD11_EXACT_BRAND_20261007/ipa/Payload/OrchidPay.app`

Forensic evidence shows that the B11 IPA itself packaged synthetic identities/financial values and engineering labels. Its historical gate did not test Store-route separation or packaged-bundle content.

Detailed evidence:
`docs/FORENSICS_2026-10-08_B11_TO_B12.md`

## 5. Security architecture

### Store-facing local security
- strong native biometric authentication;
- SecureStore-backed state;
- device binding;
- local audit ledger;
- automatic session lock;
- no raw PAN/CVV storage;
- no raw security identifiers displayed.

### Engineering / future activation boundary
- server-signed intent required before future live execution;
- idempotency required;
- provider/backend contract-verification modules retained;
- production execution remains disabled;
- provider readiness is a separate authorization gate.

### Apple App Attest
A native App Attest integration surface is present in the source lineage. Its presence does not itself authorize or imply regulated payment execution.

## 6. Camera and privacy boundary

The App Review 5.1.1(iv) remediation is preserved:
- pre-permission CTA: **Continuer**;
- the native OS dialog owns the allow/deny decision;
- camera is used to verify QR content;
- scanning performs no automatic payment or external navigation.

Camera permission copy:

`OrchidPay utilise l’appareil photo uniquement pour scanner des QR à vérifier avant confirmation.`

Fresh native-prebuild invariants:
- iOS `NSCameraUsageDescription`: present;
- iOS `NSFaceIDUsageDescription`: present;
- iOS `NSMicrophoneUsageDescription`: absent;
- iOS `NSLocalNetworkUsageDescription`: absent;
- iOS `NSBonjourServices`: absent;
- iOS `NSAllowsArbitraryLoads`: not true;
- Android CAMERA: active;
- Android RECORD_AUDIO: `tools:node="remove"`;
- Android SYSTEM_ALERT_WINDOW: `tools:node="remove"`;
- Android READ_EXTERNAL_STORAGE: `tools:node="remove"`;
- Android WRITE_EXTERNAL_STORAGE: `tools:node="remove"`;
- Android POST_NOTIFICATIONS: absent.

## 7. Dependency boundary

Store direct dependencies are deliberately minimal:
- `expo ~55.0.31`
- `expo-camera ~55.0.23`
- `expo-crypto ~55.0.19`
- `expo-local-authentication ~55.0.18`
- `expo-secure-store ~55.0.18`
- `react 19.2.0`
- `react-native 0.83.10`
- `react-native-safe-area-context ~5.6.2`

Removed from the Store candidate because they are not required:
- `expo-dev-client`;
- `expo-notifications`;
- `expo-status-bar`.

Their absence is enforced in both `package.json` and `package-lock.json`.

## 8. Brand architecture

### Store icon
`assets/icon.png`

SHA-256:
`5f35922b1dae387c344da2e8d91396243392fd08f33e7171afd87a6752b9d7b3`

This is the exact icon from the B11 Store lineage.

### In-app premium mark
`assets/in-app-mark.png`

SHA-256:
`f807a3d2c11f9b15f75fccea29526df684caf4ccc5a21e9b9eb4527dc4a4d40e`

`src/components/OrchidMark.tsx` uses the premium mark with restrained golden-ratio-derived corner geometry.

## 9. Store UX truth

The Store surface intentionally avoids synthetic financial presentation:
- no fake balance;
- no fake account/card number;
- no synthetic user identity;
- no mock merchant transaction list;
- no engineering release-passport UI;
- no backend-contract lab UI;
- no internal R13/gate labels.

Current experience:
- Home: protected OrchidPay space and security shortcuts;
- Scan: QR verification only;
- Activity: local security audit activity;
- Profile: security/device/privacy entry points;
- Security: biometric/session/device protection;
- Help/Compliance/Limits: user-facing product and privacy information.

The engineering foundations remain in source but are not imported by the Store router.

## 10. Packaged-bundle invariant

The official gate exports both platforms and scans the generated Hermes bundles.

Forbidden B11 signatures include synthetic identity/balance values, OrchidPay Black, backend-lab labels, R13, `SIMULATION_ONLY`, internal fail-closed wording and historical mock transactions.

Required result:
- iOS forbidden signature count: 0;
- Android forbidden signature count: 0.

## 11. Security-advisory boundary

Current supported SDK 55 graph:
- critical: 1;
- high: 23;
- moderate: 0;
- low: 0;
- total: 24.

This is a bounded upstream reservation in Expo/Metro/Jest/React Native tooling/framework lineage. The gate rejects:
- any unknown advisory package;
- count growth;
- an additional critical;
- a critical package other than the pinned `shell-quote` leaf.

See:
`docs/SECURITY_UPSTREAM_RESERVATION_2026-10-08.md`.

## 12. Official release gate

One-shot:

`scripts/TONTON_ORCHIDPAY_B12_GATE.sh`

It enforces:
- identity/version monotonicity;
- dependency pruning;
- clean install;
- Expo Doctor 20/20;
- TypeScript;
- Expo public config;
- fail-closed financial contract;
- Store-route type/router boundary;
- Store-visible static truth;
- neutral camera primer;
- bounded upstream security reservation;
- secret scan;
- diff hygiene;
- brand hashes;
- iOS and Android exports;
- packaged HBC forensics;
- native iOS privacy;
- native Android permission removal directives;
- absence of Android POST_NOTIFICATIONS.

Required final verdict:

`FINAL_ORCHIDPAY_B12_GATE=PASS`

## 13. Promotion boundary

A source-level PASS does **not** authorize:
- paid EAS build;
- TestFlight upload;
- App Store submission;
- Google Play submission;
- provider activation;
- live payment execution.

Promotion sequence:

`DOCUMENT -> FULL GATE -> COMMIT -> PUSH -> PR -> CI/REVIEW -> BUILD DECISION -> SUBMIT DECISION`

## B12 validation-lab invariant — 2026-10-08

Store source and validation tooling are deliberately separated.

The tracked product keeps the supported Expo 55 / React Native 0.83.10 dependency graph.

For local Android Release-manifest verification, the disposable prebuild:
- uses Android SDK 36 and build-tools 36.0.0;
- uses local JDK 17;
- disables the Foojay 0.5.0 resolver only in the temporary React Native Gradle-plugin copy;
- isolates Metro temporary state;
- merges the Release manifest with Gradle;
- asserts effective permissions after manifest merging.

This validation-only compatibility step must never be confused with a production-source patch.

### B12 exact-tree R3 status

The validation-lab invariant above has now been exercised successfully by the hardened exact-tree R3 gate.

FINAL_ORCHIDPAY_B12_GATE=PASS with effective Android Release-manifest assertions is the minimum source-readiness evidence required before any future B12 build decision.

## 14. Android cloud-build invariant — R5

R4's disposable validation copy remains valid historical evidence for the merged Android Release permission surface.

R5 adds a stronger invariant for the actual future EAS Android build:

- production Android EAS image is pinned to `sdk-55`;
- Node remains pinned to `20.19.4`;
- `package.json` declares the official `eas-build-post-install` hook;
- `scripts/fix-rn-foojay-gradle9.cjs` is tracked and SHA-pinned by the one-shot;
- the compatibility script accepts only `@react-native/gradle-plugin 0.83.10`;
- it replaces only the exact Foojay `0.5.0` declaration with `1.0.0`;
- unknown upstream states fail closed;
- non-Android EAS builds no-op;
- the gate requires Foojay `1.0.0` to be effective before Gradle;
- the gate then performs `:app:processReleaseMainManifest` and parses the effective permissions.

This makes the build-chain correction reproducible on the same lifecycle boundary used by EAS rather than existing only in a local validation copy.

### R5 promotion invariant

A future B12 build decision requires all of the following on the final tracked tree:

- `EAS_ANDROID_IMAGE_SDK55=PASS`;
- `EAS_BUILD_POST_INSTALL_HOOK=PASS`;
- `FOOJAY_FIX_SCRIPT_TRACKED=PASS`;
- `FOOJAY_FIX_SCRIPT_PROVENANCE=PASS`;
- `RN_FOOJAY_GRADLE9_COMPAT=PASS`;
- `RN_FOOJAY_1_0_EFFECTIVE=PASS`;
- `ANDROID_RELEASE_MANIFEST_MERGE=PASS`;
- `ANDROID_MERGED_REQUIRED_PERMISSIONS=PASS`;
- `ANDROID_MERGED_FORBIDDEN_PERMISSIONS=ABSENT_PASS`;
- `FINAL_ORCHIDPAY_B12_GATE=PASS`.

R5 does not authorize payment execution or Store submission.

## Apple 2026-10-09 — App Store surface / metadata boundary

iOS `1.0.0 (12)` is REJECTED under 2.3.1(a), not released. Previous B12 green technical gates do NOT equal App Store compliance.

Canonical distributed route surface (source `src/AppShell.tsx`):
- `home`, `scan`, `activity`, `profile`;
- `security`, `authorized-devices`, `limits-security`, `compliance`, `help`, `notifications`.
- QR camera **reads and displays content only**; it does not validate the payee, process a transfer or call a payment API.
- Activity shows **local security events**, not financial transaction records.
- No user-facing live wallet balances, virtual card issuance, deposits, money transfer or settlement are represented as enabled.
- Internal financial engineering modules remain outside the route graph; a source-only scan is insufficient to prove absent compiled behavior.

Current ASC metadata, however, promises financial balance overview, account activity, cards and send/receive/deposit features, while website `www.orchidpay.online` presents a private payment pilot. This mismatch is a credible primary cause of Apple rejection.

**Hard release boundary:** The App Store listing, screenshots, notes, public website, binary, real end-user product, and any OTA channel must describe/deliver the SAME functionality. Undisclosed financial features must not be reactivated post-review. Regulated banking services require their own legal/provider compliance review.

**Before any resubmission:** Confirm product scope + meaningful 4.2 utility, remediate the documentary discrepancy, request App Review reproduction details, inspect actual b12 IPA/runtime, do review-device QA. Treat the B12 submission as rejected, not as a releasable baseline.

No changes to product code, EAS, Apple metadata or Stores have been made during this documentation update.
