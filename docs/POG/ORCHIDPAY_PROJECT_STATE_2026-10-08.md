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

**B12 R5 CLOUD-BUILD HARDENING — PRE-DOC GATE GREEN / FINAL EXACT-TREE SEAL PENDING**

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

## Android merged Release evidence

The release-readiness proof now includes an effective Gradle Release manifest merge, not only prebuild source directives.

The validation copy uses local JDK 17 and Android SDK 36. Foojay resolver 0.5.0 is disabled only inside that disposable copy because its Gradle 9 IBM_SEMERU failure concerns JDK provisioning rather than OrchidPay application behavior.

Store submission remains unauthorized until the hardened full gate passes on the final candidate tree.

## B12 hardened R3 checkpoint

The corrective B12 candidate has now passed the hardened exact-tree source/release gate with RC=0, including effective Android Release-manifest permission assertions.

This is a source/readiness milestone only:
- no paid EAS build;
- no TestFlight upload;
- no App Store or Google Play submission;
- no provider activation;
- no live-payment claim.

The evidence remains non-production until the branch is sealed through final R4, commit/push and PR/CI/review.

## B12 R5 cloud-build checkpoint

R4 has been committed, pushed and tagged:
- commit: `362695fec25fe6f9402b243fa8c18890876d8c31`;
- tag: `orchidpay/b12-r4-green-20261008`.

R5 is an incremental build-chain hardening layer above that sealed checkpoint.

R5 current worktree adds:
- production Android EAS image `sdk-55`;
- official Android EAS post-install compatibility hook;
- tracked/hash-pinned Foojay compatibility script;
- exact React Native Gradle plugin version guard;
- Foojay `0.5.0 -> 1.0.0` patch in the build workspace;
- gate assertions proving the patch is effective before Gradle.

A disposable EAS-order lab passed through the real Gradle Release-manifest task.

The R5 worktree also completed a full pre-documentation gate with `FINAL_ORCHIDPAY_B12_GATE=PASS`.

Current promotion state:
- R4 commit/push/tag: COMPLETE;
- R5 code/build-chain hardening: COMPLETE;
- R5 pre-documentation full gate: PASS;
- R5 roadbook/architecture/forensics refresh: COMPLETE;
- R5 staged exact-tree gate: PASS (RC=0);
- R5 final no-mutation gate: PENDING;
- R5 commit/push/tag: PENDING;
- PR/CI: PENDING;
- paid B12 EAS build: NOT STARTED;
- Store submission: NOT STARTED.
