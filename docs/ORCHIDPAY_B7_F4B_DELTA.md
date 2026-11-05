# ORCHIDPAY — B7-F4B: Controlled CI Convergence

- Baseline for stacked PR: `c31f277f20a3b4e26716131be00cd8f0e6e905a8` (PR #27; not main).
- Exact F4A parent is pinned from the LOCAL `97f5bdef...` object, checked by `verify_f4b.py`.
- The candidate commit must be the **single direct child** of F4A-R1; no history rewriting.
- No modification of pre-existing B7 workflow, B7 provenance harness, native sandbox, npm publisher, or financial OFF fuses.

## Dependency lineage

Forge 1.4.2 and Zod 4.6.7 are official registry packages pinned to exact version, URL and lockfile SRI. Braces 3.0.3 is a bounded, privately maintained archive; the exact archive hash is checked and all installed files are compared byte for byte to the archive. This does NOT certify official upstream approval or eliminate hypothetical vulnerabilities.

## CI, not release

The jobs are separate so native npm FULL/omit=dev audit failures do not suppress TypeScript, SDK55 consumers, financial OFF-fuse tests or unsigned Android/iOS Hermes exports. Native npm audit HIGH/CRITICAL findings block their job with raw reports archived. No suppressions or audit exceptions.

CI uses SHA-pinned GitHub actions, a no-credential checkout, no write permissions, Ubuntu 24.04 restricted Bubblewrap isolation, a pinned Node toolchain, `npm ci --ignore-scripts`, and no iOS/Android native signing.

## Vercel containment

The source QA branch and PR #27 branch are explicitly disabled by `vercel.json` source switches and a fail-safe ignoreCommand. Source configuration is NOT equivalent to independent service-side verification. Deployment is not authorized.

## Governance

The GitHub publisher containment PR #25 is a separate prerequisite for any release: merely being open does not protect `main`. No merge, GitHub Release, npm publish, EAS signing, Store submission, financial LIVE, settlement, payout, production release or audit exception is authorized.

**Status: DRAFT QA / RELEASE NO-GO.**
