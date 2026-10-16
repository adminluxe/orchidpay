# OrchidPay — Roadbook Current
> **Checkpoint 2026-10-16 — source candidate B6-R2 / Store factual convergence.** PR OrchidPay #24 QA DRAFT (SHA `126aa865c00842440a17a941373c11a0b795aaec`) passed two push jobs and two PR jobs on the same SHA, certifying the bounded `braces` / `node-forge` fork tests, Hermes unsigned exports, and negative finance gates. This does **not** certify a signed IPA/AAB, independent human review, Apple/Google approval, PSP or any financial functionality. The proposed Store/site factual copy and Home screen from PR #15 are being combined only in a separate QA candidate (not live). iOS B12 was already submitted and rejected; the 12 October Apple message said review would continue, not approve. The next real build would need an independently verified build number >12, signer checks, exact binary, device QA and a fresh express release authorization. No production, Store, GitHub Package release or `main` merge is authorized by this checkpoint. Finance LIVE/settlement/payout OFF. See `docs/ORCHIDPAY_P0_FINAL_CLOSURE_20261016.md` for the current clearance matrix.


**Current checkpoint:** 2026-10-12 — Apple acknowledged our 2.3.1(a) reply and continues reviewing; metadata copy QA prepared, release HOLD
**Current candidate:** B12 R5 Cloud Build Hardened Candidate
**Canonical repo:** `adminluxe/orchidpay`
**Protected base:** `main`

**LATEST RELEASE WARNING:** iOS build 12 was actually built and submitted on 2026-10-09, then REJECTED by Apple. Prior 2026-10-08 statements that the build had not been submitted are historical checkpoints, NOT current authorization or Store state. Do not resubmit or enable financial features without a reviewed correction.



## Mise à jour 12 octobre — alignement site en QA isolée

Un deuxième worktree isolé suit les métadonnées canoniques du commit `4cccc5d` et corrige les sources complètes de `site/index.html`, `site/support/index.html`, `site/terms/index.html`, `site/privacy/index.html`, `site/privacy-choices/index.html`, `site/legal/index.html`. Les pages décrivent uniquement le parcours B12 Accueil/Sécurité/Vérifier un QR/Activité/Profil ; elles séparent explicitement toute éventuelle ambition financière future. Le test `scripts/orchidpay_apple231_site_gate.py` vérifie la cohérence avec le pack App Store existant et les liens statiques.

**Source de vérité :** textes App Store `docs/ORCHIDPAY_APPSTORE_COPY_B12_EN_FR_2026-10-12.json` ; passation du site `docs/ORCHIDPAY_SITE_231_ALIGNMENT_2026-10-12.md`. Toutes les corrections restent **NON PUBLIÉES** ; ni App Store Connect, ni Vercel production, ni binaire B12 n'ont été touchés. Une anomalie potentielle des statuts de sécurité hardcodés sur Home doit être testée sur appareil. Apple poursuit sa revue, **pas de nouvelle soumission**.

## Authoritative records

1. Architecture:
   `docs/ARCHITECTURE_PIN.md`

2. Detailed current roadbook:
   `docs/ROADBOOK_2026-10-08_ORCHIDPAY_B12_R5_CLOUD_BUILD_CHAIN.md`

   Previous B12 Store-hardening roadbook:
   `docs/ROADBOOK_2026-10-08_ORCHIDPAY_B12_PREMIUM_STORE_READY.md`

3. B11 forensic audit:
   `docs/FORENSICS_2026-10-08_B11_TO_B12.md`

4. Current project state:
   `docs/POG/ORCHIDPAY_PROJECT_STATE_2026-10-08.md`

5. Security reservation:
   `docs/SECURITY_UPSTREAM_RESERVATION_2026-10-08.md`

6. One-shot gate:
   `scripts/TONTON_ORCHIDPAY_B12_GATE.sh`

## Current truth

- submitted iOS build: **12** (9 October); any later replacement needs a new, higher build number **and explicit approval**
- next Android versionCode: **12**
- B11: **evidence source / not trusted baseline**
- B11 IPA forensic defects: **confirmed**
- Store financial mocks: **removed**
- Store engineering/lab routes: **removed from AppRoute/AppShell**
- Store QR: **verification only**
- payment live execution: **OFF**
- settlement: **OFF**
- `expo-dev-client`: **removed**
- `expo-notifications`: **removed**
- `expo-status-bar`: **removed**
- iOS Dev Launcher local-network / Bonjour keys: **absent in clean prebuild**
- Android audio/debug/storage permissions: **explicit removal directives**
- Android POST_NOTIFICATIONS: **absent**
- camera 5.1.1(iv) remediation: **preserved**
- packaged B11 signatures in current iOS/Android exports: **0 / 0**
- R4 exact-tree B12 gate: **PASS (RC=0)**
- R5 pre-documentation full gate: **PASS**
- R5 staged exact-tree gate: **PASS (RC=0)**
- R5 commit-boundary gate: **PASS (RC=0)**; one final sealed-tree no-mutation rerun is required immediately before commit
- B12 was actually submitted on **9 October**; any new paid build, resubmission or Store action is **NOT AUTHORIZED**

## Promotion sequence

`DOCUMENT -> FULL GATE -> COMMIT -> PUSH -> PR -> CI/REVIEW -> BUILD DECISION -> SUBMIT DECISION`

### 2026-10-08 — B11 forensic / B12 Store hardening

B11 is historical evidence, not a trusted baseline.

B12 now enforces:
- Store/engineering route separation;
- removal of packaged B11 synthetic financial identities and mock transaction signatures;
- neutral Apple camera permission primer;
- no expo-dev-client in the Store candidate;
- iOS privacy prebuild assertions;
- Android blocked-permission directives;
- packaged iOS/Android Hermes forensics;
- effective Android Release-manifest permission assertions.

The Android Release-manifest gate uses a disposable validation-only workaround for the Foojay 0.5.0 / Gradle 9 IBM_SEMERU incompatibility. Product source remains unchanged by that workaround.

Paid build and Store submission remain HOLD until the hardened exact-tree one-shot passes.

### 2026-10-08 — B12 hardened exact-tree R3 GREEN

The hardened OrchidPay B12 one-shot completed with RC=0 after adding effective Android Release-manifest verification.

Key final markers:
- packaged B11 signatures absent on iOS and Android;
- Apple camera primer neutral;
- iOS native privacy clean;
- Expo dev-client absent;
- Android Gradle Release merge PASS;
- required CAMERA/BIOMETRIC permissions present;
- forbidden microphone/overlay/storage/notification/contacts/SMS/call permissions absent;
- FINAL_ORCHIDPAY_B12_GATE=PASS.

No paid build or Store mutation has been performed. Promotion remains gated by final evidence checksum, R4 exact-tree rerun, commit/push, PR/CI/review and a separate build decision.

### 2026-10-08 — B12 R5 cloud-build chain hardening

R4 remains the sealed historical source-readiness checkpoint at `362695f` / `orchidpay/b12-r4-green-20261008`.

R5 supersedes the R4 validation-only Foojay workaround for future Android cloud-build readiness:
- production Android EAS image pinned to `sdk-55`;
- official `eas-build-post-install` hook added;
- tracked, hash-pinned `scripts/fix-rn-foojay-gradle9.cjs`;
- React Native Gradle plugin version constrained to `0.83.10`;
- Foojay resolver upgraded in the build workspace from `0.5.0` to `1.0.0`;
- non-Android EAS builds are not mutated by the compatibility script;
- the one-shot verifies the patch before Gradle;
- Gradle Release manifest merging remains mandatory.

A disposable EAS-order lab, the pre-documentation gate and the R5 stage-1 staged exact-tree gate all passed, including the real Release-manifest merge. The R5 evidence seal/checksums are generated from that RC=0 result. A second full gate is mandatory at the commit boundary; the seal is void if that final gate is not RC=0 or if any file changes afterward.

Paid build and Store submission remain HOLD.


### 2026-10-09 — App Review 2.3.1(a) refusal and recovery

**Store truth:** App Store Connect shows OrchidPay iOS 1.0 (build 12) **REJECTED**, reported on 2026-10-09 at 18:51, Guideline 2.3.1(a) (inaccurate metadata / hidden or undocumented financial functionality). The reviewer cited balances, virtual cards and money-transfer flows and an Extended Review warning. Repeated unresolved submissions risk further action.

**Strongly corroborated metadata inconsistency:** ASC English description/promotion currently advertised dashboard and balance overview, account history, send/receive/deposit, cards, and phased financial availability. The current `AppShell.tsx` Store router makes only `home`, `scan`, `activity`, `profile`, and local security/support/privacy screens accessible. B11 engineering-only financial routes are not imported by that Store router.

**IPA validation:** The exact submitted B12 IPA was retrieved as a valid ZIP. Its Hermes bundle does not contain the historical B11 financial identity signatures, or plaintext `wallet`, `balance`, `banking`, `payment` and `deposit` strings. This is limited static evidence, **not proof that the binary contains no dormant financial behavior**.

**Website:** The publicly served `www.orchidpay.online` still references a private payment pilot, balances, cards, transfers and demonstration. The application, Store listing, and public website must be reconciled. App Review notes did not explicitly discuss the financial features promised by the listing.

**Release HOLD and surgical next actions:**
- Freeze submission and paid build changes while exact finding is clarified;
- Request from Apple reproduction steps/screenshots if reviewers reached an unexpected screen;
- Choose an honest product scope: useful security utility with truthful metadata, or genuinely functional/legally authorized financial service;
- Align description, promo, keywords, screenshots, notes, legal site, category, and binary with that product;
- Assess Apple 2.2 (demonstration), 2.3.1(a), 4.2 (minimum utility), and financial-regulation provisions if relevant;
- No concealment or feature toggles after review, no OTA unlocking banking functionality;
- Re-evaluate iPhone/iPad and bundled executable before deciding whether metadata-only correction or new build is required.

**Actions completed:** forensic audit and documentation draft only, no ASC metadata mutation, no reply sent, no rebuild, no resubmission.

**Source of truth / full private remediation drafts on Toshiba:**
`/home/tontoncestcarre/Téléchargements/ORCHIDPAY_APPLE_231_AUDIT_20261009/`

**Developer program maintenance:** Check Apple Developer Program membership renewal due 2026-10-24.

### 2026-10-12 — Apple continues review; truthful Store metadata prepared

- **New Apple response (12 Oct, around 21:48 local):** “Thank you for providing this information. We will continue the review, and we will notify you if there are any further issues.” This is **not acceptance**, nor a request to rebuild.
- Earlier 09 Oct audit paragraphs remain historical facts. The user confirms that the initial clarification message was **actually sent**; the prior draft status is superseded as to that reply, but **the corrected metadata is NOT yet applied**.
- Source B12 routes inspected again: Accueil/Home, Vérifier un QR/Scan, Activité/Activity, Profil/Profile; local session and security screens, on-device QR preview only.
- Drafted complete EN-US and FR-FR App Store name/subtitle/promo/description/keywords with a ready-to-paste package; EN/French length limits and App Review Notes bytes checked offline by `scripts/orchidpay_apple231_copy_gate.py`.
- Apple notes in English explicitly cite the app's **French** navigation labels and no financial activity.
- `www.orchidpay.online` (12 Oct, read-only) still publicly describes SEND/RECEIVE, demo balances and financial pilot. The legal/support pages must be aligned and then deployed only after source QA + explicit approval; another local audit worktree has parallel work in progress and MUST NOT be overwritten.
- No App Store Connect API write, screenshot replacement, site deploy, OTA, EAS build, resubmission or store release has occurred **in this metadata worktree**.
- iOS 1.0.0 (12) remains subject to open review; reconcile its precise live ASC state and screenshots before choosing any permitted metadata action.
- Apple 2.3.1(a) documentation alignment is necessary but **insufficient** for 4.2 minimum utility. Real on-device functional review and screenshot verification remain release blockers.

**Artifacts:** `docs/ORCHIDPAY_APPSTORE_COPY_B12_EN_FR_2026-10-12.json`, `docs/ORCHIDPAY_APPSTORE_READY_TO_PASTE_B12_2026-10-12.md`, `docs/ORCHIDPAY_APPLE_REVIEW_REPLY_HOLD_2026-10-12.md`.

**HOLD:** Do not withdraw ongoing Apple review, claim approval, deploy website, reuse the same build for a new submission, spend on EAS or enable finance without explicit certification and approval.
