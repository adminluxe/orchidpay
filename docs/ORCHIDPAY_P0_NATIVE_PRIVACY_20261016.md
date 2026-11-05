# OrchidPay P0 — pinned native security prebuild and Android no-backup hardening

Date: 16 October 2026. Scope: DRAFT QA-only; stacked on **OrchidPay PR #20** exact SHA `752dd4ab20fa39c1630cdc03b9f5f3a64899e759`.

## Why this is needed

The prior dependency security fork candidate is independently CI GREEN (two GitHub workflow runs: `38819334536` and `38819341446`, npm audit full and production zero total in the pinned internal-fork lockfile). None of those checks validates AndroidManifest or iOS entitlements. Native generation was therefore investigated in an isolated VPS clone. Production `/srv/orchidpay`, database, cloud and payment rails have not been touched.

### New discovery: backup risk in the default generated Android manifest

The stock pinned Expo 55.0.31 native template generated `android:allowBackup="true"` in the app manifest, with expo-secure-store's selective backup exclusions. For our financial/security posture, selective exclusion of SecureStore is insufficient to authorize backup/transfer of other app-local data. We therefore require **no application backup or device-to-device transfer**.

The last Expo config plugin, `plugins/withOrchidPayNoBackup.cjs`, writes:

- `android:allowBackup="false"`, `android:fullBackupContent="@xml/orchidpay_no_backup"` and `android:dataExtractionRules="@xml/orchidpay_no_data_extraction"`.
- XML rules with `exclude domain="root" path="."` for older Android cloud backup, Android 12+ cloud backup and device transfer.
- Supply-chain pinning of Gradle 9.0.0 `-bin.zip` SHA256 `8fad3d78296ca518113f3d29016617c7f9367dc005f932bd9d93bf45ba46072b`, and wrapper JAR SHA256 `76805e32c009c0cf0dd5d206bddc9fb22ea42e84db904b764f3047de095493f3`. A changed Gradle URL/JAR/hash is **rejected**, never automatically trusted.

### Pin the exact SDK template

Official `expo-template-bare-minimum@55.0.31` downloaded as a `.tgz` in the isolated laboratory. Its registry SHA-512 integrity is `sha512-m95LaAA8DjDDiNKgndiyd4sSBGvgMJfevbGaQ3LcELJKJP2dedE/YwOvVysjzF2KZRG8bI/CO6GalW5uMp+3DQ==`. Tarball SHA256 `7920a96e7096dfdf66822f2ed434c65c51bc023f6b915230b5a47c4839820d53`.

Prebuild in isolation: `expo prebuild --clean --no-install --platform all --template <verified local tgz> --skip-dependency-update expo,react,react-native,expo-camera,expo-local-authentication,expo-secure-store`. CI also uses `EXPO_OFFLINE=1` and no credentials. The only package.json drift observed is Expo switching two local development shortcuts `expo start --android`/`expo start --ios` to `expo run:android`/`expo run:ios`. New fail-closed source checker explicitly allows only this known post-prebuild drift and pins the **original unchanged dependency lockfile SHA** `dffe18e1ed925dd91e94717e8908e1108a0f016f952db1c013cf82e930b892f4`.

## Isolated VPS results (source from approved PR #20)

Lab: `/home/afripayadmin/OP_NATIVE_LABS/OP_R1_20261016/mobile`.

- npm ci: PASS, internal fork source-hash and provenance: PASS.
- RN0.83.10 Foojay Gradle9 `1.0.0` local patch and check: PASS, applied exclusively to disposable node_modules.
- Android+iOS native prebuild using official exact pinned template: PASS.
- Generated Android main manifest: no backup, root excluded from cloud/transfer, explicitly blocked microphone/overlay/storage permissions remain removed.
- Generated iOS Info.plist: ATS arbitrary loading disabled, Face ID and camera justification present, microphone permission absent.
- Android Gradle-wrapper SHA and Gradle 9.0.0 distribution checksum: PINNED/PASS.
- Adversarial tests: rewriting `allowBackup` to true, removing Android device-transfer root exclusion, enabling iOS arbitrary ATS loads, or corrupting Gradle distro SHA was correctly rejected. All test edits restored byte-for-byte.
- Intentionally expected **RELEASE BLOCK**: stock native generated Android `release` build configuration still uses debug signing and iOS App Attest entitlements are `development` for un-signed lab projects. These are *never* accepted as Store-ready. `verify-generated-native-security.py --production` fails closed.

## CI separation

New GitHub Actions workflow has two strictly isolated Ubuntu jobs: (1) exact-SHA pinned Android and iOS native generation, static privacy/security, adversarial tests and explicit production refusal; (2) Android **debug-only** Gradle assembly to establish native compiler capability without uploading an APK or attaching signing credentials. Neither job invokes EAS cloud build nor macOS runners, and no binary is signed as a release.

## Remaining release blockers

App Attest production entitlement must be verified **on the actual signed iOS binary** using an authorized Apple provisioning profile. Android release must use a dedicated, protected signing key — never the Expo stock debug signing. Android debug assembly alone does not provide Android AAB or Play Integrity validation. A real Xcode/iOS build, hardware tests, provider sandbox settlement/idempotence and a controlled release review remain mandatory.

**Status: native prebuild QA PASS; signed iOS/Android and financial production STILL NO-GO.**
