# OrchidPay — P0 signed-release negative-control and production admission boundary
Date: 2026-10-16. Parent: **PR #21**, pinned SHA `c4faa376f22b2616a3a10447e8733ebcdb45aa45`.

## Objective

Move beyond debug compilation **without authorizing a release or touching signatures**. The source currently has `eas.build.production.env.ORCHIDPAY_APP_ATTEST_ENVIRONMENT=production` but that is a configuration claim, not an entitlement verified in a signed IPA. The iOS source references Apple's `DCAppAttestService`, but a server-side production verifier is not provisioned in the device contract. The Android app does not have a certified production Play Integrity client/server verification chain in the reviewed mobile repository. The verified Android Gradle native *template* signs its `release` variant with `signingConfigs.debug`.

The mobile project's own policies document outstanding blockers: `productionAdmissionEnabled=false`, release/payment/settlement fuses false; manufacturer root current-time-invalid and production provider-root gate open. These must not be reinterpreted as production clearance because npm audit is green or debug APK privacy tests pass.

## New laboratory-only QA

1. `scripts/security/verify-native-release-admission.cjs`: verifies pinned application identity, privacy plugin/blocked permissions, EAS environment declarations, Apple module presence, explicit unprovisioned trust conditions across the source policies. Reports source posture **PASS** but `productionAdmission=NO_GO`. The `--require-production` flag ALWAYS refuses with exit code 3 because no independently authenticated signed release/device/provider evidence is supplied.
2. `scripts/security/test-native-release-admission.cjs`: isolated `node:test` fixtures with synthetic changes to flags, blocked permissions, environment, root validity, native module fail-closed bridge, plus the required production refusal.
3. `.github/workflows/orchidpay-release-admission-negative-qa.yml`: unprivileged, exact-SHA GitHub workflow. Static source+adversarial tests. **Separate optional cloud-runner negative-control** attempts `assembleRelease` from the Expo-provided debug-signed release template, checks APK policy, verifies signing certificate matches the *debug* keystore and **refuses production admission**. Never uploads the APK or uses real release keys. No local VPS compilation or macOS/Apple credential access.

**Important:** a successful `assembleRelease` with a debug certificate is *evidence of compiler capability and deliberate release refusal*, NOT a production signing certificate. No AAB/IPA trusted binary, Apple App Attest physical-device proof, Android Play Integrity proof, PSP sandbox reconciliation, financial LIVE, settlement, or Store release has been certified.

## Hard boundaries

Private production keys **never enter GitHub Actions**. The workflow has `permissions: contents: read`, SHA-pinned checkout/setup-node, `persist-credentials:false`; no artifact upload, publish, deployment, npm audit exemptions, GitHub merge, or financial mutation. All outputs are QA evidence only; retain PR #21 and this stacked PR DRAFT and unmerged.

**Formal milestone:** preproduction source safety fuses GREEN if the checks pass; signed release admission stays NO-GO until independent provisioning and explicit authorization.