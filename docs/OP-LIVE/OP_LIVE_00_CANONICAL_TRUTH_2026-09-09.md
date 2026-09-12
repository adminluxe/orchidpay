# OrchidPay — OP-LIVE-00 Canonical Truth

Date: 2026-09-09
Status: INTEGRATION CANDIDATE / NO LIVE PAYMENT AUTHORIZATION

## Purpose

Materialize one isolated candidate tree containing the two already-reviewed OrchidPay workstreams that currently diverge from `main`:

1. Premium mobile product foundation from PR #2.
2. Frozen security-authority materialization from PR #3 / R65-A.

This branch exists only to prove that the product shell and the security authority can coexist. It does not authorize merge to `main`, release, provider mutation, live attestation, payment execution, settlement, or production activation.

## Pinned parents

- `main`: `49ccaab2ea5f9a29f1e3c55faf3e9950d43b7f01`
- PR #2 head (`feature/premium-mobile-v1`): `17db87e95f659c16e7178a6fe3d5a57f23110548`
- PR #3 head (`orchidpay/r65a-security-authority-materialization`): `7042319ba97fa9db33b3781d5e995852f9e3532e`

## Construction rule

The candidate is based on the exact PR #3 tree and overlays exactly the 18 changed paths from PR #2. No hand-edited product/security source is introduced in this first materialization.

Expected functional union relative to `main`:

- 22 paths from PR #3 security authority
- 18 paths from PR #2 premium mobile foundation
- this OP-LIVE documentation only

## Mandatory gates before any promotion

- exact ancestry and changed-path audit
- TypeScript/build/test PASS
- no real payment execution
- `paymentSecurityPolicy.liveExecutionEnabled === false`
- backend live activation fuse remains OFF
- live host allowlist remains empty
- no KYC/AML, PSP tokenization or deposit connector represented as provisioned unless evidenced
- no secrets committed
- no provider mutation
- no merge to `main`

## OP-LIVE-01 provider decision gate

Provider/rail selection is deliberately NOT encoded in this branch yet. Before any live integration code is added, a separate decision record must pin:

- legal contracting entity
- launch country
- settlement country/account
- launch currency
- first payment rail
- provider and product
- custody / safeguarding model
- KYC/KYB/AML responsibilities
- PCI scope where applicable
- webhook trust model
- refunds / disputes / chargebacks
- settlement and reconciliation files/APIs
- sandbox and production credential ceremony

Until that decision record is approved, all provider-facing live capabilities remain blocked.
