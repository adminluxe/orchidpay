# ROADBOOK — OrchidPay OP-P0-RELEASE-NEGATIVE-CONTROL-20261016

Parent checkpoint: OrchidPay PR #21 `c4faa376f22b2616a3a10447e8733ebcdb45aa45`, with two exact-SHA GitHub native+compiled debug APK CI successes (`38865501445`, `38865505684`).

Purpose: certify that the *next* release stage refuses unauthorized production claims. Separate native compiler capability from commercial signing, device attestation and financial admission.

Source finding: iOS App Attest native API present but verifier not provisioned; EAS production environment declaration is not a signed entitlement; provider-root manufacturer date remains invalid for production; production trust/ledger/clock/KMS absent by policy; Expo native Android release template still selects a debug signer.

New QA-only branch from exact PR #21: source admission verifier + mutation tests, and GitHub Android `assembleRelease` debug signer **negative-control**. Capture exact GitHub workflow SHA, outputs, artifact digest, and expected refusal in next sealed addendum.

**No release keys / Mac build / Apple provisioning / Play Integrity hardware / PSP live or sandbox financial settlement changes. Production and Store: NO-GO.** VPS DelishAfrica metro workload preserved; no VPS compilation or cleanup authorized. After CI, update POG vault PR #46 with exact run IDs and blocker matrix.