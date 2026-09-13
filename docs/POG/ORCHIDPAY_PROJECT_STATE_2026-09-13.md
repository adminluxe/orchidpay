# OrchidPay — Current Project State

**Snapshot date:** 2026-09-13  
**Purpose:** technical current-state snapshot for Purple Orchid Group formation records and project governance  
**Repository:** `adminluxe/orchidpay`  
**Default branch:** `main`

## 1. Executive status

OrchidPay is the payment-platform project of Purple Orchid Group. The repository now contains the integrated premium mobile foundation and the frozen security-authority surface that were previously developed on separate branches.

The canonical integration was merged to `main` through PR #4. The project is intentionally **fail-closed**: production payment execution, settlement and production activation remain disabled.

Current technical status:

- canonical source integration: **MERGED**
- post-merge GitHub CI: **SUCCESS**
- dependency-security gate: **CLOSED / ZERO AUDIT**
- protected infrastructure hardening through M5-R6A: **PASS / CERTIFIED**
- payment live execution: **OFF**
- settlement: **OFF**
- production: **NO-GO**

This document is a technical status record. It is not a representation that OrchidPay is licensed, regulated, live, or authorized to provide payment services.

## 2. GitHub canonical state

Current `main` commit:

`f416e7e88c6009c7faef09c39a657d11a749c3bc`

Commit title:

`Merge pull request #4 from adminluxe/orchidpay/op-live-00-canonical-candidate-20260909`

PR #4 integrated:

- premium mobile product foundation
- frozen security-authority materialization
- transitive security-lineage closure
- dependency-security remediation

PR #4 candidate head before merge:

`04d14124b95ee1e6dd033c747355afc146d05584`

Post-merge GitHub Actions:

- workflow: `OrchidPay CI`
- run: `#36`
- run id: `34663470434`
- branch: `main`
- head: `f416e7e88c6009c7faef09c39a657d11a749c3bc`
- conclusion: **SUCCESS**

There are currently no open pull requests and no open GitHub issues.

## 3. Repository governance

The `main` branch is covered by active repository ruleset `13361819`.

Current enforced controls include:

- branch deletion protection
- non-fast-forward protection
- pull request required
- minimum 1 approving review
- strict required status check
- required status context: `build`
- no bypass actors

Current governance improvements still to consider in a later hardening pass:

- dismiss stale reviews on push
- require approval of the last push
- require review-thread resolution
- narrow allowed merge methods if governance policy requires it

These are governance improvements, not blockers to the current technical-state snapshot.

## 4. Product and mobile foundation

The canonical mobile source includes:

- OrchidPay premium mobile shell
- dashboard and primary navigation
- send / receive / deposit UX flows
- cards, scan, activity and profile surfaces
- centralized mock data
- guarded API behavior
- secure-session surfaces
- native mobile identifiers for iOS and Android
- native Apple App Attest integration surface
- secure-store / local-authentication / camera integration configuration

The mobile product remains guarded against real financial execution.

## 5. Security milestones completed

### M1 — compiler and security-lineage closure

Status: **PASS**

The canonical candidate was rebuilt against the frozen security authority and completed real TypeScript compilation with fail-closed behavior preserved.

### M2 — dependency security

Status: **PASS / ZERO AUDIT / CLOSED**

The dependency-remediation commit changed only the dependency manifests and closed the previously observed audit findings.

Final audit state:

- low: 0
- moderate: 0
- high: 0
- critical: 0

### M3 — canonical GitHub integration

Status: **PASS / MERGED / POST-MERGE CERTIFIED**

PR #4 was merged to `main`, producing the current canonical commit.

Post-merge CI #36 completed successfully on that exact commit.

### M4 — protected data-vault and recovery controls

Status: **PASS**

Protected project-data storage, backup, access permissions and recovery testing were established and certified.

Sensitive recovery details are intentionally not published in this public project-state record.

### M5 — infrastructure and privilege hardening

Status: **PASS through M5-R6A**

The M5 hardening sequence established, among other controls:

- SSH public-key-only administration
- dedicated limited operations identity
- rotated dedicated administrative SSH key
- removal of obsolete UDP/60001 firewall exposure
- cleanup of certified disposable M2 lab data
- continued service health after hardening
- removal of standing broad `NOPASSWD` access from the OrchidPay admin identity
- removal of standing Docker-group access from the OrchidPay admin identity
- Docker socket constrained to root-only access
- fixed limited OrchidPay maintenance control delegated to the operations identity
- no Docker daemon restart, container restart, or PurpleCRM service mutation during the final containment cutover

Final M5-R6A verdict:

`PASS_M5_R6A_PRIVILEGE_CONTAINMENT_CERTIFIED`

## 6. Current fail-closed safety state

The following remain deliberately disabled or unprovisioned for production use:

- live payment execution
- settlement
- production provider credentials
- production provider activation
- production KYC/KYB/AML integration
- production PSP tokenization
- production deposit connectors
- production release authorization

Current state:

`PAYMENT=OFF`

`SETTLEMENT=OFF`

`PRODUCTION=NO-GO`

## 7. Next planned gates

The technical roadmap after the current M5 checkpoint is:

- **M6:** payment-rail sandbox/provider decision, compliance responsibility mapping and attestation integration
- **M7:** pre-production end-to-end certification and mobile release certification
- **M8:** production credential ceremony and controlled micro-canary, only after separate authorization
- **M9:** settlement and reconciliation controls
- **M10:** progressive rollout and monitoring

No later milestone is authorized merely by this status document.

## 8. Historical documentation note

The repository contains earlier OP-LIVE documents dated 2026-09-09 / 2026-09-10. Those files are retained as historical audit records and describe the project before the M2 closure, PR #4 merge and M5 infrastructure hardening.

This current-state snapshot supersedes those historical documents **for present-status reporting only**. It does not rewrite or delete the historical audit trail.
