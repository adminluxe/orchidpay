# ROADBOOK — OP-P0-NATIVE-PRIVACY-20261016

Date: 2026-10-16 | Source: OrchidPay PR #20 approved, commit 752dd4ab20fa39c1630cdc03b9f5f3a64899e759.

Purpose: evolve prior dependency fork QA 21 HIGH→0 into certified source-to-native generation, while protecting user data. No production access changes and no paid signing/build.

Method: VPS disposable git clone from PR #20 (not protected monorepo), npm ci (scripts off), source attestation and Foojay1.0.0 check. Pinned official Expo 55.0.31 template verified SHA512/SHA256. `expo prebuild --clean --no-install --platform all` PASS. Source drift fail-closed: only two Expo-rewritten development shortcuts are allowed; lockfile unchanged.

Security finding: generated Android manifest originally `android:allowBackup=true` despite secure-store selective exclusions. Local custom config-plugin candidate now enforces allowBackup=false, explicit root backup exclusions for old Android, Android cloud backup and device transfer. Gradle wrapper binary and distro SHA pinned. Native Android+iOS prebuild completed; generated XML/manifest checks PASS. iOS ATS arbitrary loads false; camera/FaceID justified. Tests intentionally mutate backup, transfer, ATS, Gradle SHA, and validator rejects all.

Release safety: unsigned template Android release still carries `signingConfigs.debug`; unsigned iOS prebuild uses App Attest entitlement `development`. Dedicated fail-closed production checker rejects this state. This is NOT a signed-release certification.

New draft branch intended: qa/op-p0-native-privacy-20261016 on top of OrchidPay PR #20, with independent GitHub CI for static native security and Android debug assembly. Keep earlier approved PR #20 unmerged until policy gates pass.

TO DO: finish exact SHA GitHub CI; inspect Android debug compile results; integrate protected release keystore and Apple production provisioning through authorized separate path; actual signed binary security and device tests; PSP sandbox finance tests; explicit release authorization.

PAYMENTS/SETTLEMENT: OFF. PRODUCTION/MAIN/STORE: UNTOUCHED. GATE: NO-GO.
