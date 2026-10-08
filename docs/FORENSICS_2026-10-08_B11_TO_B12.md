# OrchidPay — B11 Forensic Audit and B12 Corrective Matrix — 2026-10-08

**Classification:** release-forensics evidence
**B11 status:** historical Store/TestFlight evidence, **not a trusted product baseline**
**B12 status:** corrective pre-release candidate; paid build and Store submission remain unauthorized

## 1. Why this audit exists

Build 11 had already been built, submitted and tested, but testing was suspended because the product surface still contained defects.

The critical rule established by this audit is:

> A build that exists in TestFlight is evidence. It is not automatically a compliant baseline.

B12 must therefore not be a cosmetic copy of B11. Every inherited surface has to be independently requalified.

## 2. B11 evidence inspected

Reference source:

`/home/afripayadmin/ORCHIDPAY_BUILD11_EXACT_BRAND_20261007/source`

Reference evidence:

`/home/afripayadmin/ORCHIDPAY_BUILD11_EXACT_BRAND_20261007/GATES.txt`

Reference IPA:

`/home/afripayadmin/ORCHIDPAY_BUILD11_EXACT_BRAND_20261007/ipa/Payload/OrchidPay.app`

B11 packaged JavaScript:

`main.jsbundle` — 2,444,826 bytes

## 3. What the historical B11 gate actually proved

The historical B11 gate reported PASS for:
- exact Store icon;
- forbidden camera wording absent;
- neutral camera CTA;
- bundle/build/runtime identity;
- App Store Connect app identity;
- TypeScript;
- camera plugin;
- microphone disabled.

The historical gate did **not** test:
- Store-route separation;
- engineering/lab screens in the production bundle;
- synthetic financial identities or balances;
- mock transaction strings;
- packaged-bundle forensics;
- dependency pruning;
- development-client dependency removal;
- native local-network / Bonjour development markers as a candidate-source invariant.

Therefore `BUILD11=PASS` meant that the checks selected at the time passed. It did **not** mean global Store-product compliance.

## 4. B11 IPA packaged findings

Direct forensic scan of the actual B11 IPA found these signatures inside the packaged application:
- `@raoulf`;
- `Raoul F.`;
- `12 450`;
- `OrchidPay Black`;
- `Contrats backend`;
- `Trace de gate`;
- `FAIL-CLOSED`;
- `R13.`;
- `SIMULATION_ONLY`;
- `Paiement marchand`;
- `Achat en ligne`.

These are not merely unused source files: they were present in the delivered B11 application package.

This validates the decision to suspend B11 testing and requalify the product surface before creating B12.

## 5. Important B11 native nuance

B11's final Store IPA did **not** contain the Expo Dev Launcher local-network privacy keys:
- `NSLocalNetworkUsageDescription`: absent;
- `NSBonjourServices`: absent;
- `NSAllowsArbitraryLoads`: false.

Therefore the B11 defect is **not** described as “the final B11 IPA shipped Expo Dev Launcher privacy keys.”

The B12 source candidate nevertheless initially produced those keys during local prebuild because `expo-dev-client` remained a direct dependency. B12 removes that dependency so the candidate source itself is clean and no longer relies on a later EAS cleanup step.

## 6. Corrective matrix

| B11 condition | B12 correction | Enforcement |
| --- | --- | --- |
| Synthetic user `Raoul F.` / `@raoulf` packaged | Removed from shared `SessionContext`; no synthetic identity in Store surface | HBC forensic gate |
| Synthetic balance / financial presentation packaged | Home no longer presents a fake banking balance or live-wallet illusion | Static Store scan + HBC forensic gate |
| Mock merchant/activity strings packaged | Store Activity reads only the local security audit ledger | HBC forensic gate |
| Engineering labels / R13 / internal gate language packaged | Engineering routes are not part of `AppRoute` and are not imported by `AppShell` | Route-boundary gate |
| Send / Receive / Deposit / Card-control engineering flows reachable | Classified under `EngineeringRoute`, outside the Store router | Type boundary + router scan |
| QR surface could be understood as a payment flow | Store QR is a verifier only; it displays content and performs no automatic action | Source gate + camera gate |
| B11 gate did not inspect packaged JS | B12 exports iOS + Android and scans the generated `.hbc` bundles | Packaged forensics gate |
| `expo-dev-client` was a direct dependency in the B12 draft | Removed from package and lock | Dependency-prune + native privacy gate |
| Unused `expo-notifications` dependency | Removed; `POST_NOTIFICATIONS` must be absent | Dependency-prune + Android manifest gate |
| Unused `expo-status-bar` dependency | Removed | Dependency-prune gate |
| Audio permission inherited from `expo-camera` | Explicitly blocked; generated Android manifest must contain `tools:node="remove"` | Native permission gate |
| Debug overlay/storage permissions inherited from dependencies | Explicitly blocked: SYSTEM_ALERT_WINDOW, READ/WRITE_EXTERNAL_STORAGE | Native permission gate |
| Source-visible internal wording mixed with client wording | Store-visible surfaces use client-facing security/privacy language | Static Store scan |
| TestFlight existence treated as implicit baseline confidence | B11 explicitly classified as evidence, not trusted baseline | Final gate marker |

## 7. B12 Store route truth

Store-routed tabs:
- `home`;
- `scan`;
- `activity`;
- `profile`.

Store-routed flows:
- `security`;
- `authorized-devices`;
- `limits-security`;
- `compliance`;
- `help`;
- `notifications`.

Engineering-only routes:
- `send`;
- `receive`;
- `deposit`;
- `cards`;
- `integration-readiness`;
- `backend-contract-lab`.

Engineering files remain available for controlled internal work but are not imported by the Store router.

## 8. B12 package-level evidence already obtained

Fresh iOS and Android exports after the corrective work:
- export: PASS on both platforms;
- B11 forbidden signature count: 0 on iOS;
- B11 forbidden signature count: 0 on Android.

Fresh prebuild after dependency pruning:
- iOS camera purpose: present;
- iOS Face ID purpose: present;
- iOS microphone purpose: absent;
- iOS local-network Dev Launcher purpose: absent;
- iOS Bonjour Dev Launcher service: absent;
- iOS arbitrary ATS loads: not enabled;
- Android CAMERA: active;
- Android RECORD_AUDIO: removal directive;
- Android SYSTEM_ALERT_WINDOW: removal directive;
- Android READ_EXTERNAL_STORAGE: removal directive;
- Android WRITE_EXTERNAL_STORAGE: removal directive;
- Android POST_NOTIFICATIONS: absent.

## 9. Security boundary preserved

The financial backend/security modules remain fail-closed:
- live payment execution OFF;
- live card-network control OFF;
- deposit execution OFF;
- receive-QR execution OFF;
- remote push OFF;
- external live-host allowlist empty;
- server-signed intent required before any future live execution;
- no regulated-payment authorization is represented as complete.

The correction is therefore not a concealment of an active payment system. It narrows the Store product surface to what is actually defensible today while preserving the engineering foundation for later authorized activation.

## 10. Promotion rule

B12 is not releasable merely because this forensic audit is complete.

Required sequence:

`DOCUMENT -> FULL B12 GATE -> COMMIT -> PUSH -> PR -> CI/REVIEW -> BUILD DECISION -> SUBMIT DECISION`

No paid EAS build or Store mutation is authorized by this document.

## 11. Hardened Android Release-manifest validation

The B12 evidence chain now distinguishes three Android permission layers:

1. app configuration intent in app.json;
2. generated source-manifest removal directives after Expo prebuild;
3. the effective merged Release manifest produced by Gradle.

The third layer is authoritative for the permission surface evaluated by Google Play.

A successful isolated Release-manifest lab confirmed these effective active permissions:
- CAMERA;
- INTERNET;
- USE_BIOMETRIC;
- USE_FINGERPRINT;
- VIBRATE;
- ACCESS_NETWORK_STATE;
- the app-scoped dynamic receiver permission;
- Google Play install-referrer binding.

The merged Release manifest did not contain:
- RECORD_AUDIO;
- SYSTEM_ALERT_WINDOW;
- READ_EXTERNAL_STORAGE;
- WRITE_EXTERNAL_STORAGE;
- POST_NOTIFICATIONS;
- READ_CONTACTS;
- WRITE_CONTACTS;
- READ_SMS;
- CALL_PHONE.

### Validation-lab toolchain note

React Native 0.83.10 ships a Gradle included-build settings file that pins org.gradle.toolchains.foojay-resolver-convention 0.5.0. With Gradle 9.0.0 this resolver can throw java.lang.NoSuchFieldError: IBM_SEMERU while attempting JDK provisioning.

JDK 17 is already installed locally and is the toolchain requested by the React Native Gradle plugin.

For the disposable validation prebuild only, the gate therefore:
- verifies that the expected Foojay resolver declaration is present;
- removes that resolver declaration only from the temporary node_modules copy;
- uses the preinstalled JDK 17;
- resolves Android SDK 36 / build-tools 36.0.0 explicitly;
- uses an isolated Metro temporary cache;
- executes app:processReleaseMainManifest;
- parses the resulting merged Release manifest.

No tracked OrchidPay source dependency is patched to hide this Gradle-toolchain incompatibility.

## 12. Hardened exact-tree R3 verdict

The hardened B12 exact-tree gate was rerun after the Release-manifest and Foojay validation-lab controls were added.

Verdict:
- gate RC: 0;
- FINAL_ORCHIDPAY_B12_GATE=PASS;
- RN_FOOJAY_VALIDATION_LAB_DISABLE=PASS;
- ANDROID_RELEASE_MANIFEST_MERGE=PASS;
- ANDROID_MERGED_REQUIRED_PERMISSIONS=PASS;
- ANDROID_MERGED_FORBIDDEN_PERMISSIONS=ABSENT_PASS.

The effective merged Android Release manifest exposed only the expected application/network/biometric permission set. No microphone, overlay, external-storage, notification, contacts, SMS or phone-call permission survived the Release merge.

This R3 verdict supersedes earlier partial green checkpoints that did not yet require the merged Release manifest proof.
