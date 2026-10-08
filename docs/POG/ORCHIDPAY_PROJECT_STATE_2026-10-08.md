# OrchidPay — Current Project State — 2026-10-08

**Classification:** technical management state / pre-release evidence
**Repository:** `adminluxe/orchidpay`
**Canonical main at materialization:** `4cec70daad7f0c25ad681da8690cf82d85bacf8c`
**Candidate:** `reconcile/b12-premium-store-ready-20261008`

## Executive state

B12 is no longer treated as a simple evolution of B11.

B11 has been independently audited and is now classified as:

**HISTORICAL EVIDENCE / NOT TRUSTED BASELINE**

The current B12 candidate is a hardened Store surface that preserves the security foundation while removing packaged synthetic financial presentation and engineering/lab surfaces from the user route graph.

Current checkpoint:

**B12 HARDENED EXACT-TREE GATE GREEN — SOURCE SEAL PREPARATION**

No paid B12 build or Store submission is authorized yet.

## B11 finding that changed the release decision

The actual B11 IPA contained packaged strings including:
- `@raoulf`;
- `Raoul F.`;
- `12 450`;
- `OrchidPay Black`;
- backend/gate engineering wording;
- `FAIL-CLOSED`;
- `R13.`;
- `SIMULATION_ONLY`;
- synthetic transaction labels.

The historical B11 gate did not inspect these categories.

Therefore TestFlight existence is no longer accepted as proof of product-surface compliance.

Detailed evidence:
`docs/FORENSICS_2026-10-08_B11_TO_B12.md`.

## Current B12 Store surface

Store routes now expose:
- Home;
- QR verification;
- Activity from the local security audit ledger;
- Profile;
- Security;
- Authorized device;
- Limits & security;
- Data protection;
- Help;
- Security center.

Engineering routes retained in source but excluded from the Store router:
- Send;
- Receive;
- Deposit;
- Cards;
- Integration readiness;
- Backend contract lab.

## Privacy / native state

Verified in clean dependency-pruned prebuild labs:
- iOS camera purpose present;
- iOS Face ID purpose present;
- iOS microphone purpose absent;
- iOS Dev Launcher local-network purpose absent;
- iOS Bonjour services absent;
- ATS arbitrary loads not enabled;
- Android CAMERA active;
- Android RECORD_AUDIO removal directive;
- Android SYSTEM_ALERT_WINDOW removal directive;
- Android READ/WRITE_EXTERNAL_STORAGE removal directives;
- Android POST_NOTIFICATIONS absent.

## Dependency state

Removed from the Store candidate:
- `expo-dev-client`;
- `expo-notifications`;
- `expo-status-bar`.

Current clean candidate:
- `npm ci`: PASS;
- Expo Doctor: PASS;
- TypeScript: PASS;
- diff check: PASS.

Current upstream audit reservation:
- 1 critical;
- 23 high;
- 0 moderate;
- 0 low;
- 24 total.

## Packaged export state

Fresh corrected exports:
- iOS export: PASS;
- Android export: PASS;
- iOS B11 forbidden signatures: 0;
- Android B11 forbidden signatures: 0.

The official one-shot repeats these checks on the exact documented candidate tree.

## Payment / compliance boundary

Still OFF / not represented as completed:
- live payment execution;
- settlement;
- provider production activation;
- live card-network control;
- deposit execution;
- executable receive QR;
- remote push;
- production KYC/KYB/AML;
- production PSP tokenization;
- regulated-payment authorization.

## Promotion state

At this snapshot:
- B11 forensic audit: complete;
- B12 correction: complete;
- documentation refresh: complete;
- final exact-tree gate: PASS (RC=0);
- candidate commit: pending;
- branch push: pending;
- PR: pending;
- B12 EAS build: not started;
- App Store submission: not started;
- Google Play submission: not started.

Next safe sequence:
1. complete documentation;
2. run hardened B12 one-shot on the exact tree;
3. record evidence;
4. stage and re-run diff hygiene;
5. commit;
6. push;
7. open PR;
8. require CI/review;
9. only then make a separate paid-build / submission decision.
