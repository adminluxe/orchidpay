# RoadBook Delta — OP-LIVE-00 — 2026-09-10

## Decision

Start canonicalization from the frozen R65-A security-authority head and overlay the exact 18-path premium mobile foundation head. This avoids merging either open PR into `main` and preserves the stronger security configuration as the base.

## Frozen source refs

- main = `49ccaab2ea5f9a29f1e3c55faf3e9950d43b7f01`
- premium mobile = `17db87e95f659c16e7178a6fe3d5a57f23110548`
- security authority = `7042319ba97fa9db33b3781d5e995852f9e3532e`
- first canonical materialization = `462a2441478aa4b0bf89f4d998cdf9fe7c693354`
- current PR #4 source head before lineage materialization = `3b409ec6fc7535c033ecde37bee7355abd5db424`

## Materialization result before lineage closure

- isolated branch = `orchidpay/op-live-00-canonical-candidate-20260909`
- draft PR = `#4`
- compare vs pinned main = `ahead`, `behind_by=0`
- initial materialization changed paths vs main = `42`
  - exact PR #2 premium-mobile paths = 18
  - exact PR #3/R65-A security-authority paths = 22
  - OP-LIVE evidence/docs = 2
- certification harness adds `.github/workflows/ci.yml` as path 43 only on the integration branch.
- no merge to `main` has occurred.

## Certification chronology

### Run #26 — INSUFFICIENT GREEN

GitHub Actions run `#26` / id `34395258947` returned SUCCESS, but the inherited workflow used `npm run build --if-present` and `npm test --if-present`; the candidate `package.json` had neither script. This run is dependency-install evidence only and is not a compiler certification.

### Run #28 — STOP_SAFE

The isolated CI harness added `npx tsc --noEmit`. Run `#28` / id `34395461090` then proved eight missing security-lineage modules and stopped safely. `npm ci` also reported 22 dependency vulnerabilities (1 low, 10 moderate, 10 high, 1 critical). No blind dependency mutation was authorized.

## First-order lineage recovery — PASS

READ-ONLY Toshiba/VPS recovery found all eight first-order missing modules with one unique SHA-256 per module and matching local/remote recovered bytes:

1. `integrationBoundaryPassport.ts` — `925d6c4e485fecb5266b71b8449328292c9879a0cf9c7b04f35a82edc347c29b`
2. `passportLineage.ts` — `2a0a4b7ed667dec85b5d7230680f79361cc2ba48b9f23fb4aac495aa0f563428`
3. `stagingTrustPolicyPassport.ts` — `a0b64a4dea65d88e501520a054a5b29591e2b901f40e212c28f931e899fc4190`
4. `productionAdmissionShadowContract.ts` — `19ccc058f2ded94ed69a51fb2af9b2180601fde4fb1120a73bed747e7dbb62b1`
5. `stagingHsmP256Binding.ts` — `44517ba896847dfa828bf92676bb61353f21f52e4e8eefc69df5d24fafe5a270`
6. `remoteAuthorizationPassport.ts` — `0989ed40c73cc36c576be9223d8c9f54d6431f8f228f2d1f6380cfaf8308de46`
7. `serverLedgerAnchor.ts` — `d69fc2e47c260b38add8ff971eae1c0d694581d9392a0d5580cc666bec0d374c`
8. `releaseReadinessGate.ts` — `8bf8c00de201413ba9fda265ddd6949ce7dc1820ab213048a037a3e9e69bfeb4`

## Full security-tree closure capture — PASS

Return `20260910T004107Z` captured the exact locked VPS source tree:

`/home/afripayadmin/DA_LOCKED_SOURCES/ORCHIDPAY_ADVANCED_EXACT_V3_20260904T172623Z/src/security`

Evidence:

- `REMOTE_TS_FILES=41`
- remote/local SHA-256 manifests are byte-identical
- four second-order seeds are present
- final verdict = `SECURITY_TREE_CLOSURE_CAPTURE_COMPLETE_REVIEW_REQUIRED`
- return ZIP SHA-256 = `124f34ddbf2ff8cd6fd2a7be3a11c3d08aa10b887d50189a79a6d48082107bbc`

Static import closure from the 15 existing R65-A TypeScript security modules requires exactly 16 absent modules, not the entire 41-file historical security tree:

- `executionPermit.ts`
- `externalTrustPassport.ts`
- `externalTrustReadinessGate.ts`
- `integrationBoundaryPassport.ts`
- `intentAuthorizationEnvelope.ts`
- `intentAuthorizationPassport.ts`
- `intentReplayGuard.ts`
- `intentReplayPassport.ts`
- `passportLineage.ts`
- `productionAdmissionShadowContract.ts`
- `releaseReadinessGate.ts`
- `remoteAuthorizationBoundary.ts`
- `remoteAuthorizationPassport.ts`
- `serverLedgerAnchor.ts`
- `stagingHsmP256Binding.ts`
- `stagingTrustPolicyPassport.ts`

The 15 overlapping TypeScript security files already present on PR #4 were independently checked against the locked VPS capture by reproducing their Git blob SHA-1 from the captured bytes; all 15 match exactly. Therefore existing R65-A bytes are preserved and only the 16 missing transitive dependencies need materialization.

The 10 other historical security-tree files are not in the transitive closure rooted at the current R65-A candidate and are intentionally excluded from this materialization gate.

Static safety review of the 16-file closure found no `fetch()` calls, no HTTP(S) URLs, no `process.env` usage, no obvious private-key/token markers, and no true values for production/live payment/network/settlement enable flags. The `productionProviderRootGateOpen=true` staging-review field is a blocker-state marker; production release/network/payment/settlement remain false and production paths explicitly fail closed.

## Current safety posture

- production payment: OFF
- settlement: OFF
- provider mutation: NONE
- release: NONE
- main mutation: NONE
- integration branch only
- PR remains DRAFT / NO MERGE AUTHORIZED

## Current verdict

`OP_LIVE_00_CANONICAL_MATERIALIZATION=READY_FOR_16_FILE_LINEAGE_MATERIALIZATION_AND_COMPILER_GATE`

This is not production authorization. The next gate is to materialize exactly the 16 recovered files on the isolated PR #4 branch, verify their pinned SHA-256 values, run `npm ci`, `npx tsc --noEmit`, preserve fail-closed flags, and only then evaluate dependency-security remediation.

OP-LIVE-01 provider/rail selection remains BLOCKED until OP-LIVE-00 reaches a genuine compiler-certified PASS.
