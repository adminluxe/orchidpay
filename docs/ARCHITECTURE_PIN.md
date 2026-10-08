# OrchidPay — Architecture Pin — 2026-10-08

**Status:** B12 HARDENED PRE-RELEASE CANDIDATE / FAIL-CLOSED / NO LIVE PAYMENT AUTHORIZATION
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
