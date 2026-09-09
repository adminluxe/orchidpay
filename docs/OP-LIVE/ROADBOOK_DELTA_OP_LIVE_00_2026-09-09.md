# RoadBook Delta — OP-LIVE-00 — 2026-09-09

## Decision

Start canonicalization from the frozen R65-A security-authority head and overlay the exact 18-path premium mobile foundation head. This avoids merging either open PR into `main` and preserves the stronger security configuration as the base.

## Frozen source refs

- main = `49ccaab2ea5f9a29f1e3c55faf3e9950d43b7f01`
- premium mobile = `17db87e95f659c16e7178a6fe3d5a57f23110548`
- security authority = `7042319ba97fa9db33b3781d5e995852f9e3532e`

## Safety posture

- production payment: OFF
- settlement: OFF
- provider mutation: NONE
- release: NONE
- main mutation: NONE
- integration branch only

## Next gate

Run GitHub CI and inspect the exact compare against `main`. Any compile/test failure is STOP_SAFE and must be resolved only on the integration branch. OP-LIVE-01 provider/rail selection remains a separate decision gate.
