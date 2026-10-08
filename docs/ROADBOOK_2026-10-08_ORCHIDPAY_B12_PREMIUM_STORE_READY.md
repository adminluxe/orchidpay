# OrchidPay — Roadbook — B12 Hardened Store Candidate — 2026-10-08

## 0. Mission

Reconcile the true Store lineage with canonical Git source, audit B11 rather than blindly inheriting it, close the camera/privacy defect, remove synthetic financial and engineering surfaces from the Store bundle, harden native permissions and produce a reproducible B12 gate.

No paid build or Store mutation is part of this milestone.

## 1. Starting problem

The project had overlapping truths:
- canonical `main` lagged behind the latest Store lineage;
- App Review had previously rejected the custom camera primer under Guideline 5.1.1(iv);
- build sequencing had become ambiguous because a build 10 was generated/submitted after build 11;
- B11 itself had errors and testing had been suspended;
- the old B11 gate did not qualify the complete Store surface.

The correct response was therefore **forensic reconciliation**, not “copy B11 and increment to B12.”

## 2. Canonical base

Repository:
`adminluxe/orchidpay`

Protected base at materialization:
`4cec70daad7f0c25ad681da8690cf82d85bacf8c`

Candidate:
`reconcile/b12-premium-store-ready-20261008`

## 3. Store lineage recovered

Read-only EAS / App Store inspection established:
- B9: camera-remediation lineage;
- B10: approved icon-restoration lineage;
- B11: exact-brand icon lineage;
- a later B10 was generated/submitted after B11.

Decision:
**B12 is the only acceptable next candidate.**

No B10/B11 number is to be reused.

## 4. B11 forensic requalification

B11 is now formally classified:

**EVIDENCE SOURCE / NOT TRUSTED BASELINE**

Historical B11 gate evidence:
`/home/afripayadmin/ORCHIDPAY_BUILD11_EXACT_BRAND_20261007/GATES.txt`

That gate validated icon/camera/build/runtime/ASC/TypeScript items but did not validate:
- Store-route separation;
- synthetic financial data;
- engineering/lab surfaces;
- packaged JavaScript content.

Direct scan of the actual B11 IPA `main.jsbundle` found packaged signatures including:
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

Detailed matrix:
`docs/FORENSICS_2026-10-08_B11_TO_B12.md`

## 5. B12 identity

- product version: `1.0.0`;
- iOS build: `12`;
- Android versionCode: `12`;
- runtime: `1.0.0-public-ready-b12-premium-brand-v1`;
- iOS bundle: `com.delishafrica.orchidpaymobile`;
- Android package: `com.delishafrica.orchidpaymobile`;
- EAS project: `31e42526-bb26-42d9-9bcb-6ec23853aee2`;
- App Store Connect app: `6808431270`.

## 6. B12 Store surface correction

The correction is architectural, not cosmetic.

### Store tabs
- Home;
- Verify QR;
- Activity;
- Profile.

### Store flows
- Security;
- Authorized device;
- Limits & security;
- Data protection;
- Help;
- Security center.

### Engineering-only routes
- Send;
- Receive;
- Deposit;
- Card control;
- Integration readiness;
- Backend contract lab.

Engineering routes remain in source but are excluded from `AppRoute` and are not imported by `AppShell`.

## 7. Synthetic financial data removal

Removed from the Store product surface and packaged bundles:
- fake balance;
- fake user `Raoul F.`;
- alias `@raoulf`;
- mock card/account identifiers;
- mock merchant transaction list;
- OrchidPay Black synthetic card presentation;
- release candidate / R13 labels;
- internal backend/lab vocabulary.

Shared `SessionContext` no longer carries synthetic account identity fields.

## 8. QR and Apple camera/privacy closure

`src/screens/ScanScreen.tsx` now presents a QR verifier:
- camera purpose is explained;
- CTA is neutral: `Continuer`;
- native OS dialog owns permission choice;
- scanned content is displayed locally;
- no automatic payment;
- no automatic external navigation.

Native contract:
- camera purpose present;
- Face ID purpose present;
- microphone purpose absent;
- Expo Dev Launcher local-network purpose absent;
- Bonjour Dev Launcher services absent;
- arbitrary ATS loads not enabled.

## 9. Dependency and native-permission hardening

Removed from Store candidate:
- `expo-dev-client`;
- `expo-notifications`;
- `expo-status-bar`.

Reasons:
- no Store code required them;
- dev-client caused local prebuild to emit Expo Dev Launcher local-network / Bonjour keys;
- notifications were not imported and were explicitly excluded from autolinking;
- status-bar package was unused after the current UI rewrite.

Android `blockedPermissions` now explicitly includes:
- RECORD_AUDIO;
- SYSTEM_ALERT_WINDOW;
- READ_EXTERNAL_STORAGE;
- WRITE_EXTERNAL_STORAGE.

Generated manifest contract:
- CAMERA active;
- USE_BIOMETRIC active;
- the four blocked permissions emitted as `tools:node="remove"`;
- POST_NOTIFICATIONS absent.

## 10. Brand closure

### Store icon
`assets/icon.png`

SHA-256:
`5f35922b1dae387c344da2e8d91396243392fd08f33e7171afd87a6752b9d7b3`

Exact B11 Store icon lineage.

### In-app mark
`assets/in-app-mark.png`

SHA-256:
`f807a3d2c11f9b15f75fccea29526df684caf4ccc5a21e9b9eb4527dc4a4d40e`

Premium compact mark with restrained golden-ratio-derived geometry.

## 11. Current direct dependency set

- Expo `~55.0.31`;
- expo-camera `~55.0.23`;
- expo-crypto `~55.0.19`;
- expo-local-authentication `~55.0.18`;
- expo-secure-store `~55.0.18`;
- React `19.2.0`;
- React Native `0.83.10`;
- react-native-safe-area-context `~5.6.2`.

## 12. Packaged-bundle proof

Fresh iOS and Android exports are part of the gate.

The generated Hermes bundles are scanned for B11 signatures.

Pre-gate development verification after the corrective work already returned:
- iOS forbidden B11 signatures: 0;
- Android forbidden B11 signatures: 0.

The official one-shot repeats this check on the exact candidate tree.

## 13. Fail-closed financial boundary

Still OFF / not represented as completed:
- live payment execution;
- settlement;
- production PSP/provider activation;
- live card-network control;
- deposit execution;
- executable receive QR;
- remote push;
- production KYC/KYB/AML;
- regulated-payment authorization.

This boundary remains in code even though internal engineering labels are no longer shown to Store users.

## 14. Dependency-security reservation

Current `npm audit --omit=dev` baseline after pruning:
- critical: 1;
- high: 23;
- moderate: 0;
- low: 0;
- total: 24.

The set remains bounded to the known Expo/Metro/Jest/React Native framework/tooling lineage.

No unsupported SDK-breaking override is accepted.

See:
`docs/SECURITY_UPSTREAM_RESERVATION_2026-10-08.md`.

## 15. Official one-shot

`scripts/TONTON_ORCHIDPAY_B12_GATE.sh`

The hardened gate now verifies:
- Store identity/build monotonicity;
- no committed service-account path;
- absence of dev-client/notifications/status-bar direct dependencies and lock entries;
- clean install;
- Expo Doctor 20/20;
- TypeScript;
- Expo public config;
- financial fail-closed contract;
- Store vs engineering route boundary;
- Store-visible static truth;
- Apple camera neutral CTA;
- bounded upstream audit;
- secret scan;
- diff hygiene;
- brand hashes;
- iOS/Android exports;
- packaged HBC forensic scan;
- native iOS privacy;
- native Android permission directives;
- Android POST_NOTIFICATIONS absent.

Required verdict:
`FINAL_ORCHIDPAY_B12_GATE=PASS`

## 16. Current checkpoint

At documentation time:
- B11 forensic audit: COMPLETE;
- corrective Store surface: COMPLETE;
- dependency prune: COMPLETE;
- fresh clean install: PASS;
- Expo Doctor: PASS;
- TypeScript: PASS;
- iOS/Android export labs: PASS;
- iOS/Android prebuild labs: PASS;
- final exact-tree one-shot: **PASS (RC=0)**.

No paid B12 EAS build has been started.

## 17. Promotion sequence

`DOCUMENT -> FULL GATE -> COMMIT -> PUSH -> PR -> CI/REVIEW -> BUILD DECISION -> SUBMIT DECISION`

Do not skip from source readiness directly to Store submission.

## 18. Android Release-manifest evidence hardening

The B12 gate has been strengthened beyond source-manifest inspection.

It now performs a real Gradle Release manifest merge in the disposable prebuild tree and asserts the effective permission surface.

Validation-lab environment:
- Android SDK 36;
- Android build-tools 36.0.0;
- local OpenJDK 17;
- isolated Metro temporary cache;
- no JDK download required.

React Native 0.83.10 includes Foojay resolver 0.5.0 in its Gradle included build. That resolver is incompatible with this Gradle 9.0.0 validation path and throws IBM_SEMERU during remote toolchain resolution. The gate removes the resolver declaration only inside the disposable validation copy after confirming the expected declaration is present. Product source and package metadata are not modified by this workaround.

Required final markers now additionally include:
- RN_FOOJAY_VALIDATION_LAB_DISABLE=PASS;
- ANDROID_RELEASE_MANIFEST_MERGE=PASS;
- ANDROID_MERGED_REQUIRED_PERMISSIONS=PASS;
- ANDROID_MERGED_FORBIDDEN_PERMISSIONS=ABSENT_PASS.

The effective Release manifest must retain CAMERA and USE_BIOMETRIC while excluding microphone, overlay, external-storage, notification, contacts, SMS and call permissions.

No paid EAS build or Store submission is authorized by this gate extension.

## 19. Hardened exact-tree R3 — PASS

The strengthened one-shot completed on the exact candidate tree with RC=0.

Final markers:
- FINAL_ORCHIDPAY_B12_GATE=PASS;
- RN_FOOJAY_VALIDATION_LAB_DISABLE=PASS;
- ANDROID_RELEASE_MANIFEST_MERGE=PASS;
- ANDROID_MERGED_REQUIRED_PERMISSIONS=PASS;
- ANDROID_MERGED_FORBIDDEN_PERMISSIONS=ABSENT_PASS.

The candidate remains source/release-ready only. No paid EAS build or Store submission is authorized by this result.

The next integrity sequence is:
R3 EVIDENCE -> SHA256 REFRESH -> STAGE -> R4 EXACT-TREE -> COMMIT -> PUSH -> PR/CI -> BUILD DECISION.
