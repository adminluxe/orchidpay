# RoadBook Delta — OrchidPay M2 → M5-R6A — 2026-09-13

## Decision

Freeze the current OrchidPay checkpoint after M5-R6A and publish a sanitized current-state record to GitHub without rewriting historical OP-LIVE evidence.

The canonical repository remains fail-closed for live money movement.

## Canonical GitHub state

- repository: `adminluxe/orchidpay`
- default branch: `main`
- current `main`: `f416e7e88c6009c7faef09c39a657d11a749c3bc`
- PR #4: merged
- PR #4 candidate head: `04d14124b95ee1e6dd033c747355afc146d05584`
- post-merge CI: OrchidPay CI #36
- workflow run id: `34663470434`
- CI conclusion: `success`
- open pull requests: 0
- open issues: 0

## M2 — dependency security

Final M2 commit:

`04d14124b95ee1e6dd033c747355afc146d05584`

Final dependency audit:

- low: 0
- moderate: 0
- high: 0
- critical: 0

Verdict:

`M2=PASS/CERTIFIED/CLOSED`

## M3 — canonical integration

Merge commit:

`f416e7e88c6009c7faef09c39a657d11a749c3bc`

Post-merge CI #36:

`SUCCESS`

Verdict:

`M3=PASS/MERGED/POST-MERGE CERTIFIED`

## M4 — protected data and recovery

Protected data-vault, backup permissions and recovery drill completed.

Verdict:

`M4=PASS`

Detailed recovery material remains outside the public repository.

## M5 — infrastructure hardening

### SSH and operations

- SSH public-key-only
- dedicated operations identity
- dedicated encrypted admin key active
- old remote admin key authorization removed
- fail2ban maintained

### Network hygiene

- obsolete UDP/60001 exposure removed
- no UDP/60001 listener
- no systemd socket dependency
- UFW cleanup certified

### Storage hygiene

Certified disposable M2 lab/apply directories removed after dependency checks.

Approximate space reclaimed:

`~4.20 GiB`

### Privilege containment

M5-R6A final state:

- `afripayadmin` standing `sudo` membership: removed
- `afripayadmin` standing Docker membership: removed
- broad admin `NOPASSWD`: removed
- ATM-specific admin `NOPASSWD`: removed
- old-session arbitrary sudo: denied
- fresh-session arbitrary sudo: denied
- Docker socket: `0600 root:root`
- Docker daemon: active
- running containers before/after containment: unchanged
- non-root Docker socket FD at commit: 0
- fixed OrchidPay operations maintenance control: PASS
- OrchidPay health endpoints: PASS
- process termination: none
- Docker/container restart: none
- PurpleCRM service mutation: none

Verdict:

`M5-R6A=PASS/CERTIFIED/CLOSED`

## Governance state

Active `main` ruleset:

`13361819`

Current enforcement:

- deletion protection
- non-fast-forward protection
- PR required
- 1 approval required
- strict required `build` status check
- no bypass actors

Future governance hardening remains separate.

## Current safety envelope

`PAYMENT=OFF`

`SETTLEMENT=OFF`

`PRODUCTION=NO-GO`

Provider-facing production capabilities remain blocked pending later explicit gates.

## Next

M6 → sandbox/provider/compliance/attestation.

M7 → pre-production E2E + mobile-release certification.

No live payment or settlement activation is authorized.
