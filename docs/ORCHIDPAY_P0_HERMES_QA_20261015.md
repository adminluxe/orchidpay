# OrchidPay P0 — independent Hermes bundle QA (2026-10-15)

**DRAFT QA ONLY.** Stacked on the existing SCA fail-closed candidate at SHA \`76a5a746c4dff604d1f94fa52f9826be3f1d920b\`. This does not change application execution or any production service.

## Why
The existing workflow's optional build/test scripts do not prove iOS/Android bundle compilation, especially when the mandatory vulnerability audit blocks downstream steps. This independent workflow tests the **actual exports** while preserving the audit failure and NO-GO.

## VPS isolated pre-validation
Private QA path: \`/home/afripayadmin/OP_SECURITY_LABS/OP_20261015/orchidpay-mobile\`. Node 20, npm 11. \`npm ci --ignore-scripts\` PASS; TypeScript PASS; Expo config PASS; both iOS and Android Hermes exports PASS on the exact source SHA. B11 forbidden literal signature counts were 0 on both exports. Local iOS export tree hash: \`9d3a804048538edd4b7b8a0f31d51ceafcb8f3519b0b6773c9f8f726c3a8e768\`; Android: \`d1252b11a1310ac05b84b17635f624f1b3ccbd7796f2a6867dad2b857179da6c\`.

The new scanner requires Hermes bytecode magic and metadata, detects historical synthetic/engineering literals and checks source-level OFF fuses. Negative tests ensure it rejects deliberate tampering. No bundles, maps or financial data are uploaded.

**Limits:** literal scanning does not certify all rendered strings, obfuscated content, iOS/Android native binaries, signed release packages, provider authorization or runtime payment security. This gate is **not** an EAS build, APK, IPA, TestFlight or Store approval. It cannot substitute native QA.

## Unresolved
\`npm audit --omit=dev\` still finds 21 HIGH / 0 CRITICAL; upstream published \`braces\` and \`node-forge\` do not have verified compatible patched releases. Existing fail-closed SCA must remain RED. No \`npm audit fix --force\`, dependency concealment, auto-merge, live payments, payouts, settlement, IAM mutation or Store submission.

**Verdict: JS BUNDLE QA ONLY; production release NO-GO.**

