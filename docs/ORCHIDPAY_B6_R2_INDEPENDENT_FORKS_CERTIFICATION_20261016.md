# OrchidPay OP-P0-B6-R2 — independent fork adversarial QA CANDIDATE
Date: 2026-10-16. Classification: DRAFT / LAB ONLY / RELEASE NO-GO.

## Authorized perimeter / immutable lineage
- Parent OrchidPay PR #23 HEAD: `90a18b620ce898d6ecdff194b94d8d9249c39d22`.
- Branch: `qa/op-p0-forks-adversarial-cert-20261016`; PR target: `qa/op-p0-signed-release-readiness-20261016`; DRAFT only.
- Exactly five **new** files: two test modules, one audit module, this document, one QA workflow. No runtime source or package mutation.
- External production/VPS/Toshiba, real payment, payout, settlement, Store, signed build, merge, commercial signature and secrets remain forbidden.

## Baseline / upstream origin (not official fixed releases)
- Original `braces@3.0.3` official registry tarball SHA512 SRI: `yQbXgO/OSZVD2IsiLlro+7Hf6Q18EJrKSEsdoMzKePKXct3gvD8oLcOQdIzGupr5Fj+EDe8gO/lxc1BzfMpxvA==`.
- Patched `braces@3.0.4-orchidpay.1` archive SHA256 `d19e3433e7b06239810c6cf160223d57fd2a1a19f069157bad3f87205455c3d4`; upstream micromatch/braces PR #72 commit `28d440b5dd449dbf1fe6f3506cf94ecca4d02660` (closed/unmerged).
- Original `node-forge@1.4.0` official registry tarball SHA512 SRI: `LarFH0+6VfriEhqMMcLX2F7SwSXeWwnEAJEsYm5QKWchiVYVvJyV9v7UDvUv+w5HO23ZpQTXDv/GxdDdMyOuoQ==`.
- Patched `node-forge@1.4.1-orchidpay.1` archive SHA256 `1e7fb7aedaee21e02cad9993edc4202885d8be03a4d1acf6f53a47c52cef7ccb`; upstream digitalbazaar/forge PR #1152 commit `ceba34402e329f0365134f23fe19898756527d65` (open/unmerged).
- Upstream RSA specimen comes directly from `tests/unit/rsa.js` at the pinned upstream SHA. File SHA256 `5079066b184c54f17d1dd6b286eb62a0330f91af94124b0f7a5786dc69a9be68`. The signature is extracted **only in runner memory**; not committed, logged or distributed as a stand-alone artifact.

## ASUS isolated lab — observed evidence before remote writes
Lab root: `C:\Users\Valérie\source\ORCHIDPAY_B6_R2_FORKS_20261016\`.
- Original npm tarballs independently checked against pinned SRI, then both source versions extracted to disposable folders.
- Patched source archives downloaded against commit `752dd4ab20fa39c1630cdc03b9f5f3a64899e759`, independently SHA256-verified, extracted to separate disposable folders; scripts run with Node V24.14.0 in bounded test invocation, no production checkout touched.
- Three test source modules pass `node --check`.
- Dynamic `node --test` result: **13 tests PASS, 0 FAIL, 0 SKIP** (BR-01..06, FORGE-01..05). Baseline braces accepted 101-deep specimen while patch rejected; original forge accepted pinned structural specimen under upstream internal isolation flag while patch library and both minified bundles rejected.
- Normal RSA 2048/4096 SHA256 signs and verifies; RSA-PSS synthetic positive/negative and invalid DER, unknown OID, tampering, extra nesting and trailing bytes tested.
- Original/patch braces parity: deterministic 240-case seeded corpus, bounded inputs, plus selected normal patterns.
- Bundled `forge.all.min.js` requires browser `jQuery` global at module initialization; an inert shim is used solely for the narrow Node crypto verification tests. JavaScript signing is exercised by the patch library, and its signatures are verified by the two bundles. This is **not** full browser/DOM/mobile-device attestation.

## CI matrix — must pass on exact HEAD push and PR
| ID | Gate | Evidence location / expected |
| --- | --- | --- |
| BR-01..06 | Braces vulnerable versus patched, bounds 100/101, malformed AST, parity, fuzz | `b6-r2-forks-adversarial.test.cjs` |
| FORGE-01..05 | upstream forged DigestAlgorithm specimen versus patched lib and both dist bundles; ASN.1 negative corpus, 2048/4096 and PSS | same test / pinned upstream original vector |
| FORGE-06 | rebuild all three node-forge minified distributions using Node 20.20.2 and pinned builder lock | second GitHub Actions job / exact SHA256 |
| SCA-01 | official npm full / omit-dev audit reports exactly zero, native exit code | first job |
| SCA-02 | official vulnerable tarball negative control exposes `braces` and `node-forge` advisories | first job, existing fail-closed script |
| SCA-03 | tarball SHA256, SRI, license equality, source SHA, registry version provenance, no nested originals | independent supply-chain script + existing verifier |
| SCA-04 | TypeScript + Expo iOS/Android Hermes unsigned JS exports + legacy financial OFF gate | second job |
| GOV-01 | **two** jobs successful for both push and PR on identical immutable commit SHA | GitHub run metadata; PENDING until witnessed |
| GOV-02 | mandatory exit failure for SHA drift, wrong parent, extra paths, hash mismatch or failing tests; no release | both workflow jobs |

## Reproducibility and audit limits
- The test runner has bounded CI job timeouts, per-test timeouts, Node heap cap 384MiB, Linux `ulimit` and `timeout` around potentially adversarial input. The old versions are never used outside this disposable research lab.
- The signed output fixture uses ephemeral newly generated local RSA test keys only. No key or signature is published. Upstream source file is SHA-pinned; the script reads the fixture as data, never evaluates it.
- The internal `_skipPaddingChecks` is used **only** for reproducing the upstream structural parser regression. Success does **not** prove ordinary production-path exploitability or full signature-policy correctness. Separate ordinary-path positive and tampered checks are mandatory and included.
- `npm audit 0` matches private version labels and cannot establish vendor remediation; fixes remain unsupported upstream. Ongoing fork maintenance, independent human code review, security advisory watch, organizational acceptance, mobile device attestation, signing, banking provider, PSP and release approvals remain pending.
- This document reflects isolated ASUS laboratory results only until the corresponding GitHub Actions **push and PR runs** are inspected on their final exact SHA. Never classify the entire OP-P0-B6-R2 operation PASS solely from this document.

## Operational boundary
FINANCE_LIVE=OFF / SETTLEMENT=OFF / PAYOUT=OFF / MAIN=UNTOUCHED / PR=DRAFT / STORES=NO-GO.
POG evidence is separately append-only; no modification of earlier Roadbook facts and no assertion of approved release.