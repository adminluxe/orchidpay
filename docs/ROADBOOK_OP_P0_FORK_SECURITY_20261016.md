# ROADBOOK — OP-P0-FORK-SECURITY-20261016

Date: 16 October 2026. Scope: QA candidate only; no deployment, merge or payment authorization.

INPUT: 21 HIGH / 0 CRITICAL on old Expo 55 lock, two primary advisory sources. PR #19 independently GREEN and approved; POG private PR #45 confirmed two candidate source fixes and 904/101 upstream regression tests.

RESOLUTION CANDIDATE: local documented security backports to braces 3.0.4-orchidpay.1 and node-forge 1.4.1-orchidpay.1; official tarball SHA-512 pinning, exact upstream PR commit pinning, distributed source+license, rebuilt Forge minified dist with frozen developer toolchain, file: dependency tarballs checked into candidate source and complete lockfile integrity.

VALIDATIONS: npm ci PASS; audit full 0 total, audit prod 0 total; negative control original packages -> 21 HIGH; installed backport source digests pinned; standard RSA signed message accepted and changed message denied by both Forge library and rebuilt distribution; braces 101 nested patterns rejected; source TypeScript PASS; Hermes JS iOS and Android PASS; B11 signature/fuse scanner PASS. Rebuilt minified Forge distribution bit-identical on repeated frozen-toolchain build.

UNRESOLVED: official upstream releases unmerged, third-party security code review, native signed packages, device tests, provider and financial integration, regulatory approval, future ongoing dependency maintenance. No claim of native/financial release GREEN.

NEXT: independent exact-commit GitHub QA of candidate, security review of Fork source+license, validate native and operational gates before authorized promotion.

DECISION: candidate SCA test GREEN; production financial release NO-GO.

