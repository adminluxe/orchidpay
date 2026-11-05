# OrchidPay P0 — Android compiled debug permission: exact root-cause remediation

**Checkpoint 16 October 2026 — QA CANDIDATE ONLY.** Exact parent `adminluxe/orchidpay` PR #21 SHA `74c7d36a15c531e05d4b58cc1cff3028c2fa353d`. All work below occurred in the disposable VPS clone `/home/afripayadmin/OP_NATIVE_LABS/OP_R2_20261016/mobile/`; production, payment rails, main, Store and signing credentials untouched.

## Compiled APK—not merely app configuration

Both GitHub Actions runs `38830510494` and `38830507459` compiled debug APKs successfully; the final **actual compiled manifest** verification then failed with `APK_FORBIDDEN_PERMISSION_PRESENT:android.permission.SYSTEM_ALERT_WINDOW`. The security detector was **correct**, never waived.

The published `app.json` explicitly blocks `android.permission.SYSTEM_ALERT_WINDOW`. In generated `android/app/src/main/AndroidManifest.xml` its entry has `tools:node="remove"`; however the official Expo 55.0.31 template has a higher-priority `android/app/src/debug/AndroidManifest.xml` **and** `android/app/src/debugOptimized/AndroidManifest.xml` that each reintroduce `<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>`. Android manifest merging applies the higher-priority debug variant and the forbidden permission survives into the compiled APK.

## Minimal, supply-chain-pinned fix

Extend the existing last-ordered `plugins/withOrchidPayNoBackup.cjs` **without touching npm versions, financial code, security gate, or compiled APK checker**. In the Expo native generation step, remove just that one exact permission line in both generated higher-priority debug variant manifests. Enforce the **official original full-template SHA-256** `fb1795032c764d975376e1612ab7022058eca2268a45efbe731a47a5d3ac0f60` and the **fixed complete-file SHA-256** `8c267f6c625e2f346bc73c1f96ec480e5fee51872e9272dee3a14a24164270f8`. Unknown template shape, missing variant, symlink, altered permissions or corrupt output **fail closed**; already-fixed files remain idempotent.

Supplement native source validator with checks that both high-priority variants contain zero blocked permissions and match the expected fixed SHA. Add two adversarial tests: deliberately reinsert SYSTEM_ALERT_WINDOW in `debug` and `debugOptimized`, verify detection and restore bytes. Add six dependency-free JS plugin tests: two-variant removal, idempotence, altered original template, missing file, symlink and invalid build variant. Run them on each independent GitHub Actions native job before its prebuild; do **not** remove the existing compiled APK inspection gate.

## Local isolated preflight

- `npm ci --ignore-scripts` and security fork-source attestation: PASS.
- `node --test scripts/security/test-debug-overlay-plugin.cjs`: **6/6 PASS**.
- `actionlint v1.7.12` on updated YAML: PASS.
- `npm run eas-build-post-install`, `npm run verify:foojay`: PASS.
- Offline Expo 55.0.31, SHA-pinned template, Android + iOS `prebuild --clean --no-install`: **PASS**.
- Both debug manifest files SHA-256 `8c267f6c...`; no SYSTEM_ALERT_WINDOW in either: PASS.
- Existing iOS ATS and Android no-backup policies, Gradle JAR/distribution pin, financial safety gates: PASS.
- Native source mutation tests expanded to include the two variant overlays: **6/6 PASS**, production unsigned/release status still rejected.

**Pending at the time of this note:** fresh GitHub CI must rebuild actual debug APK and prove `verify_compiled_android_policy.py` succeeds on its binary manifest while still rejecting other forbidden permissions. A source-only green light is insufficient.

## Release boundaries

Even a fully passing **debug APK** test does not sign a release AAB/IPA, certify hardware Play Integrity/App Attest, approve provider settlement, or approve a Store submission. Keep PR #21 DRAFT, branch `main` unchanged, finance LIVE and settlement OFF. Independent security review of the self-maintained node-forge/braces backports is still required.

