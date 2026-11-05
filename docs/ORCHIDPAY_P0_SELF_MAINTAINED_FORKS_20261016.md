# OrchidPay P0 — self-maintained security backports (QA CANDIDATE)

**16 October 2026 — DRAFT / NO PRODUCTION AUTHORIZATION.**

## Why not wait for official releases?

An exact-lockfile npm audit on Expo 55.0.31 / React Native 0.83.10 showed 21 HIGH / 0 CRITICAL, with only TWO primary advisories:

- braces <=3.0.3: GHSA-vfj7-8cjw-p6xm, excessive nesting / stack exhaustion.
- node-forge <=1.4.0: GHSA-86w9-cpqp-85rv, nested ASN.1 DigestAlgorithm signature validation.

The other 19 findings are dependency propagation via Expo, Metro, Jest and React Native. Maintainers had not released corrected npm versions as of our 15 October verification. We reconstructed patch candidates from original npm archives and exact upstream proposed commits; no Expo or React Native migration was forced.

## Content and provenance (not official upstream releases)

| Internal package | Verified official npm base | Public upstream patch | Verified local tarball SHA-256 |
| --- | --- | --- | --- |
| braces@3.0.4-orchidpay.1 | braces@3.0.3 | micromatch/braces PR #72, closed/unmerged, SHA 28d440b5dd449dbf1fe6f3506cf94ecca4d02660 | d19e3433e7b06239810c6cf160223d57fd2a1a19f069157bad3f87205455c3d4 |
| node-forge@1.4.1-orchidpay.1 | node-forge@1.4.0 | digitalbazaar/forge PR #1152, open/unmerged, SHA ceba34402e329f0365134f23fe19898756527d65 | 1e7fb7aedaee21e02cad9993edc4202885d8be03a4d1acf6f53a47c52cef7ccb |

Both upstream package names remain unchanged. Only changed source files from the reviewed proposals are overlaid onto verified official npm tarballs. The modified package manifests carry orchidpayPatchProvenance: original package version and registry SHA-512, exact upstream PR SHA, candidateOnly=true, officialUpstreamRelease=false and releaseApproved=false.

Both unmodified upstream LICENSE files are retained. braces is MIT; node-forge is offered under BSD-3-Clause OR GPL-2.0. No original or patched production secrets are packaged.

Local tarballs, exact root dependencies and npm $braces/$node-forge overrides are pinned in package-lock.json. Lock SHA-256: dffe18e1ed925dd91e94717e8908e1108a0f016f952db1c013cf82e930b892f4. Published original tarballs retain their npm SHA-512 integrities in each fork's provenance.

node-forge original dist was NOT retained: all minified bundles were rebuilt from patched lib/rsa.js. Build uses Node 20.20.2 plus the separately locked developer toolchain file vendor/orchidpay-security/node-forge-builder.package-lock.json (SHA-256 64a79e9fa88cfd83e9f989333becc05a2b6d5bb0819f5b82a2c152b9484760de). Webpack 4's --openssl-legacy-provider flag is used ONLY inside the isolated build runner, never in mobile runtime. A second npm ci + build generated bit-identical minified artifacts on VPS; CI replays this test.

## Reproducible security gates

1. Standard npm ci --ignore-scripts succeeds with the verified local packages; no installer hook or private registry.
2. Official npm audit --json (full tree) and npm audit --omit=dev --json (production) each report zero findings on this exact candidate, with native exit code 0.
3. A *negative control* substitutes the actual unpatched npm tarballs into an equivalent private temporary lockfile; the standard npm audit returns 21 HIGH again and identifies braces and node-forge as primary advisories. This demonstrates npm's local-file protocol does NOT automatically hide the advisories.
4. verify-local-security-forks.cjs checks archived tarball hashes, all changed library hashes, rebuilt dist hashes, lockfile SHA, manifest/source provenance, licenses, lack of vulnerable nested duplicates, depth limiting, and ordinary RSA-2048/SHA-256 valid-vs-tampered signatures in both lib and minified distribution.
5. TypeScript and explicit Expo Hermes JS exports for both iOS and Android passed on VPS. The existing PR #19 negative scanner checked both outputs: zero searched B11 legacy financial UI signatures and OFF financial fuses.
6. GitHub Actions must independently rebuild node-forge dist from the exact upstream PR SHA and pinned developer lock, then reproduce the minified SHA-256s.

## What 'audit 0' does NOT mean

npm audit matches advisory ranges against *declared versions*. A privately versioned fork is not an officially patched release. Therefore audit 0 alone is NOT security certification. The separate pinned-code, source, library regression, RSA, build and negative-control checks must all pass; independent review of code/maintenance and licensing remains mandatory.

These two unmerged upstream fixes may be amended, disputed or superseded. OrchidPay must accept ongoing fork maintenance and watch for future advisories if promoting such a backport. This review candidate contains no production payment changes.

**Release remains NO-GO** pending final exact-SHA GitHub CI, native Android/iOS builds, signed binaries, App Attest / Play Integrity validation, device tests, PSP financial integration, IAM/network review, business approval and explicit merge/deployment permission.

**Financial LIVE, payout and settlement remain OFF.**

