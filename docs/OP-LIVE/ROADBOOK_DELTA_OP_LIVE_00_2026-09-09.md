# RoadBook Delta — OP-LIVE-00 — 2026-09-09

## Decision

Start canonicalization from the frozen R65-A security-authority head and overlay the exact 18-path premium mobile foundation head. This avoids merging either open PR into `main` and preserves the stronger security configuration as the base.

## Frozen source refs

- main = `49ccaab2ea5f9a29f1e3c55faf3e9950d43b7f01`
- premium mobile = `17db87e95f659c16e7178a6fe3d5a57f23110548`
- security authority = `7042319ba97fa9db33b3781d5e995852f9e3532e`
- first canonical materialization = `462a2441478aa4b0bf89f4d998cdf9fe7c693354`

## Materialization result

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

GitHub Actions run `#26` / id `34395258947` returned SUCCESS, but the inherited workflow used:

- `npm run build --if-present`
- `npm test --if-present`

The candidate `package.json` contains neither a `build` nor a `test` script. Therefore those green steps did **not** prove TypeScript compilation or tests. This run is retained as dependency-install evidence only and must not be cited as full certification.

### Certification harness

On the isolated candidate only, `.github/workflows/ci.yml` was strengthened with:

`npx tsc --noEmit`

No product/security source was altered by this certification harness.

### Run #28 — STOP_SAFE

GitHub Actions run `#28` / id `34395461090`:

- Checkout = PASS
- Setup Node = PASS
- `npm ci` = PASS
- Typecheck = **FAIL**
- Build/Test = skipped after fail

Missing security-lineage modules proven by TypeScript:

1. `src/security/integrationBoundaryPassport.ts`
2. `src/security/passportLineage.ts`
3. `src/security/stagingTrustPolicyPassport.ts`
4. `src/security/productionAdmissionShadowContract.ts`
5. `src/security/stagingHsmP256Binding.ts`
6. `src/security/remoteAuthorizationPassport.ts`
7. `src/security/serverLedgerAnchor.ts`
8. `src/security/releaseReadinessGate.ts`

Secondary strict-mode errors in `productionFoundationBlueprint.ts` are downstream of the missing contract typing and are not to be patched speculatively before lineage recovery.

`npm ci` also reported 22 dependency vulnerabilities (1 low, 10 moderate, 10 high, 1 critical). No blind `npm audit fix` or forced dependency mutation is authorized; dependency remediation requires a dedicated evidence-backed pass after canonical source recovery.

## Fail-closed posture re-checked on candidate

- `paymentSecurityPolicy.liveExecutionEnabled = false`
- `apiConfig.mode = mock`
- `backendBoundaryPolicy.liveActivationFuse = false`
- `liveApiProvisioned = false`
- `serverVerifyKeyProvisioned = false`
- `serverIntentVerifierProvisioned = false`
- `kycAmlProviderProvisioned = false`
- `pspTokenizationProvisioned = false`
- `depositConnectorsProvisioned = false`
- `allowedLiveHosts = []`

## Safety posture

- production payment: OFF
- settlement: OFF
- provider mutation: NONE
- release: NONE
- main mutation: NONE
- integration branch only
- PR remains DRAFT / NO MERGE AUTHORIZED

## Verdict

`OP_LIVE_00_CANONICAL_MATERIALIZATION=STOP_SAFE_MISSING_SECURITY_LINEAGE`

The first brick successfully exposed that the R65-A GitHub materialization is not a self-contained canonical source tree. The correct response is source recovery, not stub generation and not weakening TypeScript.

## Recovery gate

Recover the exact eight missing security modules from authoritative OrchidPay evidence/runtime/history, pin their source SHA-256 / Git provenance, materialize them unchanged on the integration branch, then rerun TypeScript and dependency audit gates.

OP-LIVE-01 provider/rail selection remains BLOCKED until OP-LIVE-00 reaches a genuine compiler-certified PASS.
