# OrchidPay B12 R5 - Cloud Build Chain Seal - 2026-10-08

Status: COMMIT-BOUNDARY GREEN / FINAL SEALED-TREE RERUN REQUIRED IMMEDIATELY BEFORE COMMIT
Branch: reconcile/b12-premium-store-ready-20261008
R4 sealed base: 362695fec25fe6f9402b243fa8c18890876d8c31
R4 tag: orchidpay/b12-r4-green-20261008
Paid EAS build: NOT STARTED
Store mutation: NOT AUTHORIZED

## Purpose

R5 closes the Android cloud-build reproducibility gap identified after R4.

The application product boundary is unchanged. R5 hardens the build chain so the future EAS Android build does not depend on the incompatible React Native Foojay resolver 0.5.0 under Gradle 9.

## Tracked compatibility control

Tracked file: scripts/fix-rn-foojay-gradle9.cjs
SHA-256: d5731db4d02e860aae00b6d3f76265dd7cfba79a5d8804ffc69154a1ffabb96c

The control is fail-closed:
- expected @react-native/gradle-plugin: 0.83.10;
- expected upstream resolver before patch: 0.5.0;
- required resolver after patch: 1.0.0;
- unknown upstream states fail;
- non-Android EAS builds no-op.

## EAS production build-chain invariant

Production Android profile:
- EAS image: sdk-55;
- Node: 20.19.4.

Package lifecycle:
- eas-build-post-install: tracked compatibility patch;
- verify:foojay: exact post-patch assertion.

The hardened gate also verifies the compatibility script is tracked and matches the pinned SHA.

## Stage-1 exact-tree evidence

The fully staged R5 tree completed:
- clean install: PASS;
- Expo Doctor 20/20: PASS;
- TypeScript: PASS;
- Store route boundary: PASS;
- Store static truth: PASS;
- packaged B11 signatures absent on iOS and Android: PASS;
- native iOS privacy: PASS;
- Android source permission directives: PASS;
- EAS Android image pin: PASS;
- compatibility script tracked/provenance: PASS;
- Foojay patch and verification: PASS;
- effective Foojay 1.0.0: PASS;
- Android Gradle Release manifest merge: PASS;
- merged required permissions: PASS;
- merged forbidden permissions absent: PASS;
- FINAL_ORCHIDPAY_B12_GATE=PASS.

Stage-1 gate RC: 0

Marker evidence:
docs/runtime-seals/2026-10-08/ORCHIDPAY_B12_R5_GATE_PASS_MARKERS.txt

## Effective merged Android permissions

Required/present:
- android.permission.CAMERA;
- android.permission.USE_BIOMETRIC.

Forbidden/absent:
- RECORD_AUDIO;
- SYSTEM_ALERT_WINDOW;
- READ_EXTERNAL_STORAGE;
- WRITE_EXTERNAL_STORAGE;
- POST_NOTIFICATIONS;
- READ_CONTACTS;
- WRITE_CONTACTS;
- READ_SMS;
- CALL_PHONE.

## Product and regulatory boundary

Still OFF or unauthorized:
- live payment execution;
- settlement;
- production PSP/provider activation;
- live card-network control;
- deposit execution;
- executable receive QR;
- remote push;
- production KYC/KYB/AML;
- regulated-payment representation.

## Final commit-boundary condition

This seal is valid for promotion to an R5 commit only if:
1. this seal and SHA256SUMS_B12_R5.txt are staged;
2. the complete TONTON_ORCHIDPAY_B12_GATE.sh is run again on that final staged tree;
3. the second run returns RC=0 and FINAL_ORCHIDPAY_B12_GATE=PASS;
4. no tracked or staged file changes after that run and before commit.

If any condition fails, this seal is void and no build/store action is authorized.

## Authorization boundary

This seal does not authorize:
- a paid EAS build;
- TestFlight upload;
- App Store submission;
- Google Play submission;
- provider activation;
- live payment execution.

## Commit-boundary proof obtained

The aligned R5 evidence tree completed the full hardened gate with RC=0 and `FINAL_ORCHIDPAY_B12_GATE=PASS`.

This proof includes Foojay 1.0.0 effective in the generated React Native Gradle included build, Android Release manifest merge PASS, required merged permissions present, forbidden merged permissions absent, iOS/Android packaged B11 signatures absent, and native privacy/dependency gates PASS.

A final sealed-tree rerun remains a mechanical pre-commit requirement after this status/checksum stamp. No tracked or staged mutation is allowed after that final PASS.
