# RoadBook Delta — OP-LIVE-00 — 2026-09-10

## Decision

Canonicalization starts from the frozen R65-A security-authority head and overlays the exact 18-path premium mobile foundation head. Neither predecessor PR is merged into `main`; the stronger fail-closed security authority remains the integration base.

## Frozen refs

- `main` = `49ccaab2ea5f9a29f1e3c55faf3e9950d43b7f01`
- premium mobile PR #2 = `17db87e95f659c16e7178a6fe3d5a57f23110548`
- security authority PR #3 / R65-A = `7042319ba97fa9db33b3781d5e995852f9e3532e`
- isolated branch = `orchidpay/op-live-00-canonical-candidate-20260909`
- draft PR = `#4`
- pre-M1 evidence head = `a588db43571e701053e83b47c5b9e0d59aab9da2`
- M1 source commit = `75f9bba052e1761228469f318fe5d68363cbb353`

## Certification chronology

### Run #26 — insufficient green

The inherited workflow used `npm run build --if-present` and `npm test --if-present`; the candidate `package.json` had neither script. The green result did not prove TypeScript compilation or substantive tests.

### Run #28 — STOP_SAFE

The isolated CI harness added a real `npx tsc --noEmit` gate. Run `#28` / id `34395461090` then failed safely and exposed missing security-lineage modules. `npm ci` also reported 22 dependency vulnerabilities: 1 low, 10 moderate, 10 high, 1 critical. No blind dependency mutation was authorized.

## Lineage recovery and closure — PASS

READ-ONLY Toshiba/VPS recovery found the eight first-order modules with unique SHA-256 values and byte-identical local/remote copies. A subsequent closure capture from the exact locked VPS tree:

`/home/afripayadmin/DA_LOCKED_SOURCES/ORCHIDPAY_ADVANCED_EXACT_V3_20260904T172623Z/src/security`

captured 41 TypeScript files with byte-identical remote/local SHA-256 manifests. Static dependency closure from the existing R65-A roots proved that exactly 16 absent files were required; 10 historical files outside that closure were intentionally excluded.

The 15 overlapping TypeScript security files already on PR #4 were independently matched byte-for-byte to the locked VPS source. The 16 missing files were pinned by source SHA-256 and expected Git blob identity before mutation.

## OP-LIVE-00 M1 — AUTHORIZED AND EXECUTED

Authorization request:

`ORCHIDPAY_OP_LIVE_00_M1_AUTHORIZATION_REQUEST_20260910.txt`

Authorization-request SHA-256:

`77ef1ededc2c6c1e763eeefaf03005d4d4189cb66a7648d67980d514d454895c`

M1 materialized exactly these 16 new files on the isolated candidate branch:

- `src/security/executionPermit.ts`
- `src/security/externalTrustPassport.ts`
- `src/security/externalTrustReadinessGate.ts`
- `src/security/integrationBoundaryPassport.ts`
- `src/security/intentAuthorizationEnvelope.ts`
- `src/security/intentAuthorizationPassport.ts`
- `src/security/intentReplayGuard.ts`
- `src/security/intentReplayPassport.ts`
- `src/security/passportLineage.ts`
- `src/security/productionAdmissionShadowContract.ts`
- `src/security/releaseReadinessGate.ts`
- `src/security/remoteAuthorizationBoundary.ts`
- `src/security/remoteAuthorizationPassport.ts`
- `src/security/serverLedgerAnchor.ts`
- `src/security/stagingHsmP256Binding.ts`
- `src/security/stagingTrustPolicyPassport.ts`

Mutation proof:

- M1 commit = `75f9bba052e1761228469f318fe5d68363cbb353`
- parent = `a588db43571e701053e83b47c5b9e0d59aab9da2`
- branch update = fast-forward only, `force=false`
- compare parent → M1 = `ahead_by=1`, `behind_by=0`
- exactly 16 changed paths
- all 16 statuses = `added`
- zero deletion
- zero pre-existing product/security source modification
- `main` untouched
- PR #4 remains DRAFT and unmerged

## M1 compiler gate — PASS

GitHub Actions OrchidPay CI run `#31`, id `34426979241`, job `102714193579`:

- checkout = PASS
- dependency install / `npm ci` = PASS
- real TypeScript gate / `npx tsc --noEmit` = PASS
- workflow conclusion = SUCCESS

The workflow's later `build` and `test` steps still use `--if-present`; because no substantive `build` or `test` scripts exist in `package.json`, those steps remain non-certifying and must not be represented as functional test coverage.

Dependency install still reports 22 vulnerabilities: 1 low, 10 moderate, 10 high, 1 critical. No `npm audit fix`, no `--force`, and no dependency mutation were performed. Dependency-security remediation remains a separate open gate.

## Fail-closed invariant review — PASS

Direct inspection at M1 commit `75f9bba052e1761228469f318fe5d68363cbb353` confirms:

- `paymentSecurityPolicy.liveExecutionEnabled = false`
- `apiConfig.mode = mock`
- mock transfer intents are `executable: false`
- live transfer execution throws intentionally until signed API contracts are wired
- `backendBoundaryPolicy.liveActivationFuse = false`
- `liveApiProvisioned = false`
- `serverVerifyKeyProvisioned = false`
- `serverIntentVerifierProvisioned = false`
- `kycAmlProviderProvisioned = false`
- `pspTokenizationProvisioned = false`
- `depositConnectorsProvisioned = false`
- `allowedLiveHosts = []`
- backend readiness remains `BLOCKED_EXTERNAL_DEPENDENCIES`, `readyForLive=false`
- execution permit scope remains `DRY_RUN_EXECUTION_GATE_ONLY`
- execution permit `networkExecutionEnabled=false`
- execution permit `livePaymentExecutionEnabled=false`
- execution permit `settlementEnabled=false`
- remote authorization production verifiers/replay ledger/trusted clock remain unprovisioned and network/live-payment execution remain false
- release readiness is `DRY_RUN_RELEASE_READINESS_ONLY`
- release readiness production trust/verifier/ledger/clock capabilities remain false
- production release/network/live-payment/settlement remain false

## Current verdict

`OP_LIVE_00_M1=PASS_COMPILER_CERTIFIED_FAIL_CLOSED`

`OP_LIVE_00_DEPENDENCY_SECURITY_GATE=OPEN`

This PASS certifies canonical source closure, exact M1 materialization, real TypeScript compilation and preserved fail-closed behavior. It does **not** certify production readiness, provider readiness, functional test coverage, live attestation, payment execution or settlement.

## Next gate

Perform dependency-vulnerability triage against the frozen lockfile without blind upgrades. Identify the direct/transitive packages behind the 22 findings, classify runtime reachability and exploitability, then prepare a minimal remediation plan with frozen version deltas and regression gates.

Until that dependency-security gate is reviewed, OP-LIVE-01 provider/rail work may be designed on paper but no provider-facing mutation, credential ceremony, live network execution, payment or settlement is authorized.
