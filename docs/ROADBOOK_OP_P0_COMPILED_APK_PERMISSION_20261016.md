# ROADBOOK — OP-P0-APK-COMPILED-PERMISSION-20261016

**Date:** 2026-10-16. **Parent:** OrchidPay PR #21 `74c7d36a15c531e05d4b58cc1cff3028c2fa353d` (DRAFT, stacked on PR #20). **Scope:** Android debug APK privacy QA; no production mutation.

**Observation:** Native iOS/Android prebuild and debug APK assembly passed but compiled APK fail-closed detector found `android.permission.SYSTEM_ALERT_WINDOW`, despite its exclusion from `app.json`.

**Cause established:** Higher priority official Expo 55.0.31 `android/app/src/debug/AndroidManifest.xml` and `debugOptimized/AndroidManifest.xml` explicitly add the permission, overriding the removal declared by the main manifest.

**Surgical response:** Add exact-SHA-guarded, idempotent post-template removal in both development overlays. Neither ignore nor disable the compiled APK policy gate. Original manifest SHA256 `fb1795032c764d975376e1612ab7022058eca2268a45efbe731a47a5d3ac0f60`; patched SHA256 `8c267f6c625e2f346bc73c1f96ec480e5fee51872e9272dee3a14a24164270f8`. Unknown template drift halts the prebuild.

**Executed isolated VPS tests:** npm reproducible CI PASS, fork hashes PASS, 6/6 plugin adverse/positive tests PASS, Gradle Foojay PASS, iOS+Android prebuild PASS, variant no-permission SHA PASS, native static QA PASS, 6 native policy adversarial tests PASS and unsigned production refusal PASS, CI actionlint PASS. Exact source SHA and CI verification to follow publication.

**GitHub:** do not mark green before real updated compiled APK checks finish. Previous failing runs remain in history as proof of guard efficacy.

**FINANCE LIVE / SETTLEMENT / PAYOUT / STORE / MAIN MERGE = OFF/NO-GO.** POG vault addendum to be indexed by immutable SHA after successful external checks.

