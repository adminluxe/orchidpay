# OrchidPay — Roadbook — B12 R5 Cloud Build Chain — 2026-10-08

**Status:** PRE-RELEASE / CLOUD-BUILD HARDENED / COMMIT-BOUNDARY GATE GREEN / PAID BUILD NOT STARTED
**Repository:** `adminluxe/orchidpay`
**Candidate branch:** `reconcile/b12-premium-store-ready-20261008`
**R4 sealed base:** `362695fec25fe6f9402b243fa8c18890876d8c31`
**R4 tag:** `orchidpay/b12-r4-green-20261008`
**Paid build:** NOT STARTED
**Store mutation:** NOT AUTHORIZED

## 1. Why R5 exists

R4 proved the corrected B12 Store surface, native privacy contract, packaged-bundle cleanliness and effective Android Release permissions.

During the R4 Android Release-manifest validation, a build-tooling incompatibility was isolated:

- React Native / `@react-native/gradle-plugin`: `0.83.10`;
- Gradle wrapper: `9.0.0`;
- React Native included-build settings pinned `org.gradle.toolchains.foojay-resolver-convention` `0.5.0`;
- Foojay `0.5.0` can fail on Gradle 9 with `java.lang.NoSuchFieldError: IBM_SEMERU`.

R4 neutralized that resolver only in a disposable validation copy. That was sufficient to prove the effective merged manifest, but it did not make the future EAS Android build itself immune to the same upstream incompatibility.

R5 closes that gap.

## 2. R5 build-chain correction

Tracked script:

`scripts/fix-rn-foojay-gradle9.cjs`

Expected SHA-256:

`d5731db4d02e860aae00b6d3f76265dd7cfba79a5d8804ffc69154a1ffabb96c`

The script:

- accepts only `@react-native/gradle-plugin 0.83.10`;
- accepts exactly the known Foojay `0.5.0` declaration;
- replaces exactly one occurrence with Foojay `1.0.0`;
- is idempotent;
- supports `--check`;
- refuses unknown upstream states;
- no-ops when `EAS_BUILD_PLATFORM` explicitly identifies a non-Android build.

The patch is therefore version-bounded and fail-closed.

## 3. Official EAS lifecycle integration

`package.json` now declares:

`eas-build-post-install = node scripts/fix-rn-foojay-gradle9.cjs`

and:

`verify:foojay = node scripts/fix-rn-foojay-gradle9.cjs --check`

The EAS post-install hook is used because, on Android, it runs after package installation and prebuild and before the Gradle build.

The future Android cloud build therefore receives the compatibility correction at the correct lifecycle boundary, instead of relying on a validation-only mutation.

## 4. EAS Android image pin

Production Android EAS profile is pinned to:

`image: sdk-55`

The candidate continues to pin:

`node: 20.19.4`

This reduces toolchain drift and aligns the cloud environment with the Expo SDK 55 / Java 17 generation used by the candidate.

## 5. Exact-flow laboratory proof

A disposable lab reproduced the EAS Android order:

`npm ci -> expo prebuild -> eas-build-post-install -> Gradle Release manifest merge`

Observed markers:

- `NPM_CI=PASS`;
- pre-hook Foojay `0.5.0` confirmed;
- `ANDROID_PREBUILD=PASS`;
- `EAS_BUILD_POST_INSTALL=PASS`;
- `FOOJAY_RESOLVER_VERSION=1.0.0`;
- `RN_FOOJAY_GRADLE9_PATCH=PASS`;
- `GRADLE_RELEASE_MANIFEST=PASS`;
- merged Release manifest present;
- Gradle `BUILD SUCCESSFUL`;
- 54 actionable tasks executed.

This lab did not mutate the tracked R4 source.

## 6. R5 one-shot strengthening

`scripts/TONTON_ORCHIDPAY_B12_GATE.sh` now additionally requires:

- production Android EAS image `sdk-55`;
- official EAS post-install hook declaration;
- local Foojay verification script declaration;
- tracked Foojay-fix file;
- exact Foojay-fix SHA-256 provenance;
- successful compatibility patch after a fresh install;
- successful patch after clean native prebuild;
- effective Foojay `1.0.0` in the React Native Gradle included build;
- absence of Foojay `0.5.0` before the Release-manifest merge;
- real Gradle Release manifest merge;
- effective merged-permission allow/deny assertions.

## 7. Pre-documentation R5 result

The R5 worktree completed a full pre-documentation gate with:

- Expo Doctor 20/20: PASS;
- TypeScript: PASS;
- Store-route boundary: PASS;
- Store static truth: PASS;
- packaged B11 signatures on iOS: 0;
- packaged B11 signatures on Android: 0;
- iOS native privacy: PASS;
- Android source permission directives: PASS;
- EAS post-install Foojay patch: PASS;
- effective Foojay `1.0.0`: PASS;
- Android Release manifest merge: PASS;
- required merged permissions: PASS;
- forbidden merged permissions absent: PASS;
- `FINAL_ORCHIDPAY_B12_GATE=PASS`.

Because the gate itself was subsequently strengthened with tracked-file and SHA provenance assertions, this result is **pre-documentation evidence**, not the final R5 seal.

## 8. Effective Android Release permission truth

Required and present:

- CAMERA;
- USE_BIOMETRIC.

Observed active Release permissions also include the expected platform/network set:

- ACCESS_NETWORK_STATE;
- INTERNET;
- USE_FINGERPRINT;
- VIBRATE;
- app-scoped dynamic receiver permission.

Forbidden and absent:

- RECORD_AUDIO;
- SYSTEM_ALERT_WINDOW;
- READ_EXTERNAL_STORAGE;
- WRITE_EXTERNAL_STORAGE;
- POST_NOTIFICATIONS;
- READ_CONTACTS;
- WRITE_CONTACTS;
- READ_SMS;
- CALL_PHONE.

## 9. Product boundary unchanged

R5 changes the build chain, not the financial authorization boundary.

Still OFF / unauthorized:

- live payment execution;
- settlement;
- production PSP/provider activation;
- live card-network control;
- deposit execution;
- executable receive QR;
- remote push;
- production KYC/KYB/AML;
- regulated-payment representation.

## 10. Final seal sequence

Required before R5 can be committed as GREEN:

`DOCS -> STAGE -> EXACT-TREE FULL GATE -> R5 SEAL + CHECKSUMS -> STAGE EVIDENCE -> FINAL FULL GATE -> COMMIT -> PUSH -> TAG -> PR/CI -> BUILD DECISION`

No paid EAS build, TestFlight upload, App Store submission or Google Play submission is authorized by this document.

## 11. Staged exact-tree R5 gate — PASS

After the R5 code/build-chain changes and the R5 roadbook/architecture refresh were staged, the complete one-shot was executed again.

Result:
- gate RC: `0`;
- `FOOJAY_FIX_SCRIPT_TRACKED=PASS`;
- `FOOJAY_FIX_SCRIPT_PROVENANCE=PASS`;
- `RN_FOOJAY_GRADLE9_COMPAT=PASS`;
- `RN_FOOJAY_1_0_EFFECTIVE=PASS`;
- `ANDROID_RELEASE_MANIFEST_MERGE=PASS`;
- `ANDROID_MERGED_REQUIRED_PERMISSIONS=PASS`;
- `ANDROID_MERGED_FORBIDDEN_PERMISSIONS=ABSENT_PASS`;
- `FINAL_ORCHIDPAY_B12_GATE=PASS`.

A pre-seal, gate-marker file and SHA-256 manifest are now created from this staged tree.

One complete no-mutation gate remains mandatory after those evidence files are staged. No tree mutation is permitted after that final PASS and before commit.

## 11. R5 staged exact-tree Stage-1 gate

The fully staged R5 tree completed the hardened one-shot with RC=0.

Additional R5 markers proven on that staged tree:
- EAS Android image sdk-55: PASS;
- Foojay fix script tracked: PASS;
- Foojay fix SHA provenance: PASS;
- EAS post-install compatibility patch: PASS;
- effective Foojay resolver 1.0.0: PASS;
- Android Release manifest merge: PASS;
- required merged permissions: PASS;
- forbidden merged permissions absent: PASS;
- final OrchidPay B12 gate marker: PASS.

This Stage-1 result is the source for the R5 runtime seal and checksum manifest.

Commit boundary rule: after the seal/checksum files are staged, the complete one-shot must run again and return RC=0. No tracked or staged file may change between that final successful run and the R5 commit.

## 12. Commit-boundary proof — PASS

After the R5 evidence files were aligned and staged, the complete hardened one-shot returned RC=0.

Observed proof markers:
- `RN_FOOJAY_1_0_EFFECTIVE=PASS`;
- `ANDROID_RELEASE_MANIFEST_MERGE=PASS`;
- `ANDROID_MERGED_REQUIRED_PERMISSIONS=PASS`;
- `ANDROID_MERGED_FORBIDDEN_PERMISSIONS=ABSENT_PASS`;
- `FINAL_ORCHIDPAY_B12_GATE=PASS`.

This establishes the R5 commit-boundary proof. After this final documentation/checksum stamp, the complete gate must be executed once more on the sealed staged tree. No tracked or staged file may change after that final successful run and before commit.
