# OrchidPay B12 — Hardened Store Candidate Gate — GREEN

**Checkpoint:** 2026-10-08
**Gate completed:** 2026-10-08T16:55+02:00
**Candidate:** `reconcile/b12-premium-store-ready-20261008`
**Canonical base:** `4cec70daad7f0c25ad681da8690cf82d85bacf8c`
**Gate verdict:** `FINAL_ORCHIDPAY_B12_GATE=PASS`
**Gate return code:** `HARDENED_EXACTTREE_GATE_RC=0`

## Scope of this seal

This seal certifies source-level and locally reproducible pre-release readiness for B12.

It does **not** authorize:
- a paid EAS build;
- TestFlight upload;
- App Store submission;
- Google Play submission;
- provider activation;
- live payment execution.

## B11 forensic prerequisite

B11 is treated as historical evidence, not a trusted baseline.

Direct scan of the actual B11 IPA proved that synthetic financial/user data and engineering labels were present in the packaged application.

The B12 gate therefore includes controls that B11 did not have:
- Store route boundary;
- Store surface forbidden-string scan;
- packaged iOS/Android Hermes forensic scan;
- dependency pruning;
- native privacy/dev-client checks;
- Android permission-removal checks.

Detailed evidence:
`docs/FORENSICS_2026-10-08_B11_TO_B12.md`

## Identity

- product version: `1.0.0`;
- iOS build: `12`;
- Android versionCode: `12`;
- bundle/package: `com.delishafrica.orchidpaymobile`;
- runtime: `1.0.0-public-ready-b12-premium-brand-v1`;
- EAS project: `31e42526-bb26-42d9-9bcb-6ec23853aee2`.

## Gate results

- identity/version monotonicity: PASS;
- Android blocked-permission config: PASS;
- committed EAS service-account path absent: PASS;
- `expo-dev-client` absent: PASS;
- `expo-notifications` absent: PASS;
- `expo-status-bar` absent: PASS;
- pruned packages absent from lock: PASS;
- clean `npm ci`: PASS;
- Expo Doctor: 20/20 PASS;
- TypeScript: PASS;
- public Expo config: PASS;
- fail-closed financial contract: PASS;
- Store route type boundary: PASS;
- Store router internal imports absent: PASS;
- Store forbidden wording/data absent: PASS;
- Store mock imports absent: PASS;
- Store engineering imports absent: PASS;
- neutral camera CTA: PASS;
- known upstream audit boundary: PASS;
- secret scan: PASS;
- diff hygiene: PASS;
- Store icon provenance: PASS;
- in-app mark provenance: PASS;
- iOS export: PASS;
- Android export: PASS;
- iOS packaged B11 signatures absent: PASS;
- Android packaged B11 signatures absent: PASS;
- native prebuild: PASS;
- iOS native privacy: PASS;
- iOS Dev Launcher markers absent: PASS;
- Android required permissions: PASS;
- Android blocked-permission removal directives: PASS;
- Android POST_NOTIFICATIONS absent: PASS.

## Store surface truth

Store tabs:
- Home;
- Verify QR;
- Activity;
- Profile.

Store flows:
- Security;
- Authorized device;
- Limits & security;
- Data protection;
- Help;
- Security center.

Engineering-only routes are retained in source but excluded from the Store route graph:
- Send;
- Receive;
- Deposit;
- Cards;
- Integration readiness;
- Backend contract lab.

## Packaged B11-signature invariant

The generated iOS and Android Hermes bundles contain none of the forbidden B11 signatures checked by the gate, including:
- synthetic account identity;
- synthetic balance/account identifiers;
- OrchidPay Black;
- internal backend/gate labels;
- R13;
- SIMULATION_ONLY;
- historical mock transaction labels;
- release-passport mock markers.

## Native privacy invariant

iOS:
- camera purpose present;
- Face ID purpose present;
- microphone purpose absent;
- Expo Dev Launcher local-network purpose absent;
- Bonjour Dev Launcher services absent;
- arbitrary ATS loads not enabled.

Android:
- CAMERA active;
- USE_BIOMETRIC active;
- RECORD_AUDIO removal directive;
- SYSTEM_ALERT_WINDOW removal directive;
- READ_EXTERNAL_STORAGE removal directive;
- WRITE_EXTERNAL_STORAGE removal directive;
- POST_NOTIFICATIONS absent.

## Security reservation

Current supported SDK 55 audit baseline remains:
- critical: 1;
- high: 23;
- moderate: 0;
- low: 0;
- total: 24.

The gate rejects advisory-set drift outside the documented reservation.

## Financial boundary

Still OFF / unauthorized:
- live payment execution;
- settlement;
- production provider/PSP activation;
- live card-network control;
- deposit execution;
- executable receive QR;
- remote push;
- regulated-payment representation.

## Promotion rule

The next allowed actions after a final staged-tree rerun are:
1. commit the candidate;
2. push the branch;
3. open a PR against protected `main`;
4. require CI/review;
5. make a separate decision before any paid build or Store submission.

No source mutation may be introduced between the final staged-tree gate and commit.

## Hardened Release-manifest gate extension

After the original GREEN seal, the Android evidence requirement was made stricter.

The gate now requires a real Gradle Release manifest merge and parses the effective merged permissions. It also neutralizes the incompatible Foojay 0.5.0 JDK resolver only inside the disposable validation copy, using the already installed JDK 17 instead.

Until the hardened exact-tree rerun returns FINAL_ORCHIDPAY_B12_GATE=PASS, this seal is considered GREEN evidence under active revalidation and does not authorize a paid build or Store mutation.

## Hardened exact-tree revalidation — R3 GREEN

The pending hardened revalidation referenced above has completed.

Result:
- RC=0;
- FINAL_ORCHIDPAY_B12_GATE=PASS;
- packaged iOS/Android B11-signature forensics: PASS;
- iOS native privacy: PASS;
- Android source permission directives: PASS;
- Android Gradle Release manifest merge: PASS;
- effective required permissions present: PASS;
- effective forbidden permissions absent: PASS.

This establishes GREEN source-level and locally reproducible Release-manifest evidence for B12.

It still does not authorize a paid build, TestFlight upload, App Store submission, Google Play submission, provider activation or live-payment execution.
