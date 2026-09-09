# RoadBook Delta — OP-LIVE-00 — 2026-09-09

## Decision

Start canonicalization from the frozen R65-A security-authority head and overlay the exact 18-path premium mobile foundation head. This avoids merging either open PR into `main` and preserves the stronger security configuration as the base.

## Frozen source refs

- main = `49ccaab2ea5f9a29f1e3c55faf3e9950d43b7f01`
- premium mobile = `17db87e95f659c16e7178a6fe3d5a57f23110548`
- security authority = `7042319ba97fa9db33b3781d5e995852f9e3532e`
- first canonical candidate = `462a2441478aa4b0bf89f4d998cdf9fe7c693354`

## Materialization result

- isolated branch = `orchidpay/op-live-00-canonical-candidate-20260909`
- draft PR = `#4`
- compare vs pinned main = `ahead`, `behind_by=0`
- changed paths vs main = `42`
  - exact PR #2 premium-mobile paths = 18
  - exact PR #3/R65-A security-authority paths = 22
  - OP-LIVE evidence/docs = 2
- no source path outside that declared union was introduced

## Certification gates

GitHub Actions OrchidPay CI run `#26` / id `34395258947`:

- Checkout = PASS
- Setup Node = PASS
- npm ci = PASS
- Build = PASS
- Test = PASS
- workflow conclusion = SUCCESS

Vercel commit status = SUCCESS.

Fail-closed re-check on the canonical candidate:

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

`OP_LIVE_00_CANONICAL_MATERIALIZATION=PASS`

This PASS certifies only coexistence/materialization of the frozen premium-mobile and security-authority workstreams under the current CI. It is **not** authorization for production network execution, provider integration, payment, settlement or release.

## Next gate

OP-LIVE-01 — select and evidence exactly one launch corridor: legal contracting entity, launch country, settlement country/account, currency, first payment rail, provider/product, custody/safeguarding model, KYC/KYB/AML split, PCI scope if applicable, webhook trust, refunds/disputes/chargebacks, reconciliation interface and sandbox→production credential ceremony.

Until OP-LIVE-01 is approved, all provider-facing live capabilities remain blocked.
