# ORCHIDPAY — P0 FINAL CLOSURE / STORE FACTUAL CONVERGENCE (QA CANDIDATE)
Date: 2026-10-16. Priority P0. **DRAFT / NOT DEPLOYED / STORE NO-GO**.
Scope: OrchidPay ONLY. Other POG products, POG vault, DelishAfrica runtime, VPS and financial providers are out of scope.

## Exact lineage and independent safety branch
- Protected `main` at start: `c017b893839d02243e7fc7a0717fdbe8efa39fde`. This source is NOT deployed or merged by this QA work.
- OrchidPay PR #24 head `126aa865c00842440a17a941373c11a0b795aaec`, OPEN/DRAFT, independently 2/2 push CI jobs and 2/2 PR CI jobs SUCCESS for the B6-R2 security forks.
- Upstream Apple 2.3.1 copy/site source: OrchidPay PR #15 exact HEAD `7cb5ed8520ee6e70f6e5e956e9a56655d21b9149`, OPEN/DRAFT; its 16 paths are imported as a bounded QA candidate on top of PR #24. Source includes six factual site pages, Home copy without falsely always-green biometric indicators, App Store metadata EN/FR, offline Python gates, Roadbook and architecture notes. The imported Apple workflow checkout action was replaced by the pinned SHA that passed B6-R2.
- Source `.github/workflows/npm-publish-github-packages.yml` on the protected `main` still publishes automatically when a GitHub release is created, using a writable package token. SECURITY PR #25, DRAFT, is proposed directly to `main` with an exact one-file fail-closed replacement; it is **not yet effective on main**. This QA candidate contains the same publishing lock. **Do not create a GitHub release before PR #25 is reviewed and merged.**
- The independent Apple factual-convergence QA workflow validates source lineage, precise changed paths, truthful website/App Store claims, publisher lock, package fork provenance, registry audit, TypeScript, unsigned iOS and Android Hermes exports and financial OFF gates.
- The isolated PR #14 legacy `package-lock.json` change is deliberately NOT cherry-picked, since it would overwrite B6-R2's exact custom patched fork lockfile. PR #14 publication workflow is superseded by the safer fail-closed publisher lock.

## Truth about the submitted Apple binary
- **B12 (iOS 1.0.0 build 12) was built and submitted on 2026-10-09 and rejected**, according to existing project Roadbook and Apple correspondence.
- Apple stated on 2026-10-12 it would continue reviewing the message. **This is not approval, release or evidence of the current ASC state.** Direct official App Store Connect verification is still mandatory.
- B12's current user-facing screen has hardcoded optimistic security status (e.g. `PROTÉGÉ`, `FORTE`). The QA Home copy removes those unsupported assurances. **This does not retroactively edit Apple's submitted B12 binary.**
- Next replacement must use a fresh reviewed artifact with higher iOS build number than 12, plus authorized submission; Android code must advance relative to the Play Console's true last artifact, not blindly bump based on local files. No real commercial build was created here.
- QR content reader provides no recipient validation and cannot initiate payments. No bank accounts, payment cards, balances, transfers, settlement or customer funds in the current Store UI. Metadata must not claim otherwise.
- The six corrected site pages are drafts. Legal identity, company constitution status, privacy processing details, actual support channel and obligations must be reviewed before Vercel production deployment. Source QA != legal approval or HTTPS deployment.

## Gates / decisions (mandatory, exact-SHA fail closed)
| Gate | Criterion | This candidate |
|---|---|---|
| G0 | Single frozen commit; source files / SHA and declared release target | QA commit only; signed binary NO-GO |
| G1 | Apple/Google live status and signing chain checked on provider dashboards | PENDING |
| G2 | npm native audit, forks, TypeScript, CI push+PR exact SHA, workflow SHA pins | CI PENDING until verified; B6-R2 independent QA already PASS |
| G3 | Device storage, camera/Face ID, privacy, account deletion where applicable, supported accessibility | DEVICE QA PENDING |
| G4 | Real iPhone + Android end-to-end flow, QR and safe failures, background locking | DEVICE QA PENDING |
| G5 | Screenshots and text correspond to actual signed artifact, site live matches reviewed legal text | PENDING |
| G6 | Separately authenticated owner / security / device approvers with SHA digest | PENDING; second account != independent external assessor if same controller |
| G7 | Explicit authorized signed build, Apple/Google submission and ID receipt | PENDING / NO-GO |

## Closure and cleanup discipline
- Do not delete worktrees, logs, protected main, archives or provisional PRs while they are the sole copies of evidence. Inventory first; hash and archive before any quarantining.
- Keep PR #14 and PR #15 open for traceability until the final QA convergence is independently reviewed. Avoid duplicate/cherry-picked lockfile changes and do not bypass GitHub main protection.
- No release package or npm publish, no EAS production build, no Vercel production deployment, no App Store / Play production mutations, no PSP/Stripe LIVE, no settlement/payout, no TLS/IAM/secret mutations, no merges into main without separate G0–G7 release authorization.
- Next action after exact SHA CI: second-account review of PR #25 publisher kill-switch, independent check of this site-copy branch, Apple status inquiry, real device QA, then prepare a *new* B13 artifact only after artifact identity/signing and version gates.
- The two privately maintained forks are NOT official vendor security releases. Re-audit advisories and upstream merge status before live promotion and keep ownership for updates.

**Release decision: NO-GO; QA CANDIDATE only. Payment/settlement/payout OFF; main unchanged.**
