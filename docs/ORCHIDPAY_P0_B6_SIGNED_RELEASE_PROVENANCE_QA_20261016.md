# OrchidPay OP-P0-B6-R1 — signed-release provenance, QA negative only

**Date:** 2026-10-16. **Classification:** DRAFT candidate, NOT release-eligible.
**Authorization:** OP-P0-B6-R1 limited to isolated QA branch, synthetic tests,
DRAFT PR, GitHub Actions verification and private POG append-only custody.

## Immutable source and coverage

- Parent mobile code revision: `cfd1163d0f7d7d9ed589bcc4f638e0b73a39031d`
  (PR #22 negative Android release/debug signer QA).
- QA target branch: `qa/op-p0-signed-release-readiness-20261016`.
- PR base: `qa/op-p0-release-negative-control-20261016`. Do not target or merge main.
- Identifier: `com.delishafrica.orchidpaymobile`.
- No Gradle, EAS, Apple signing, Android upload key, paid build, PSP, IAM,
  finance, real device, new trust root or external provider service.
- All tests use synthetic in-memory descriptions and Node built-ins only.

## Strict separation of simulated fields and trusted evidence

`scripts/security/verify-signed-release-provenance.cjs` validates only the
**shape and fail-closed policy of SYNTHETIC fixtures**. A 64-character SHA
field in JSON is **not** proof of bytes hashed from a real AAB/IPA.
A certificate fingerprint field is **not** a checked signing certificate;
an entitlement field is **not** a decoded entitlement from a signed IPA.

The script refuses non-synthetic evidence modes and the CLI
`--require-production` deliberately always exits **3** with
`OP_B6_SIGNED_RELEASE_ADMISSION=NO_GO`.

### Android synthetic negative matrix

- package name and source revision must match exact checkpoint;
- AAB format and release variant must be declared consistently;
- valid-format distinct artifact/certificate digests (no fake all-zero digest);
- signer must not equal the DEBUG certificate fingerprint;
- `allowBackup=false`, full backup and data extraction exclusions required;
- no forbidden permissions (including `SYSTEM_ALERT_WINDOW`);
- fake claims of validated Play signing or server Play Integrity are rejected;
- unknown fields, misplaced artifact types or forged promotion fields are refused.

### iOS synthetic negative matrix

- package/bundle ID and source SHA must match;
- IPA and App Store context must be declared consistently;
- synthetic-only team identifier; real signing identities not accepted as fixtures;
- declared App Attest entitlement must be production and `getTaskAllow=false`;
- fake Apple signing chain / App Attest server verification claims are rejected;
- unknown fields and missing mandatory fields are refused.

### Additional source boundary

The CI independently runs the prior
`scripts/security/verify-native-release-admission.cjs --require-production`
and requires exit code **3**. This prevents this QA-only addition from
superseding the P0 fail-closed release boundary.

## What remains unverified (deliberate NO-GO)

For **real Android AAB**: independently hash the actual artifact bytes,
validate archive contents and package, non-debug upload signing certificate
and certificate rotation lineage / Play App Signing identity, install a
controlled test build, validate Google-signed Play Integrity verdict on
the server with nonce, audience and replay protection. No real AAB provided.

For **real iOS IPA**: independently hash signed IPA, inspect code signature
and provisioning profile, verify Apple team/bundle ID and embedded
`com.apple.developer.devicecheck.appattest-environment=production`,
exercise hardware-backed App Attest on an actual iPhone, and validate
the Apple chain/challenge/server anti-replay. No signed IPA provided.

For **finance**: separate isolated PG16/PSP sandbox, durable idempotency,
KYB/tenant/issuer/audience, signed webhook, ledger balance and
provider reconciliation. No financial server was contacted here.

## CI custody

`.github/workflows/orchidpay-b6-signed-release-provenance-qa.yml`
uses GitHub-hosted Ubuntu 24.04, SHA-pinned checkout/setup-node,
`contents: read`, `persist-credentials: false`, exact-SHA checkout,
two separate jobs, no package install, no artifact upload or release.

**PASS of tests means the guards correctly REFUSE; never a Store GO.**

`SIGNED_RELEASE=NO_GO` ; `PLAY_INTEGRITY=NOT_CERTIFIED` ;
`APP_ATTEST=NOT_CERTIFIED` ; `PSP_SANDBOX=NOT_CERTIFIED` ;
`PAYMENTS_LIVE/SETTLEMENT/PAYOUT=OFF` ; `MAIN_MERGE=NONE`.
