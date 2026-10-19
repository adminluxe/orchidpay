# OrchidPay B7-D R2 - review-only promotion

## Scope and inherited evidence
Base PR26: 1d7e215a0547532fff5bf1b5f7803d3584a73391. Security revision OP-P0-B7-C-R2. The two archives, app lock, package manifest and builder lock are unchanged from the tested B7-C R2 snapshot. Full historical proof pack SHA256: 988bf628a78430ff1c3f315529df70bcdb69cb425af49600ea6cc607ec476b4c.

B7-C: 300 RSA vectors / 2100 verification evaluations, 108 old noncanonical acceptances rejected; braces upstream 904/904; Forge 834 pass, 4 pending; 20 SDK55 consumer tests; 8 tamper tests; two clean installs and 9 byte-identical Forge build outputs. These are archived local results, not claims of new CI or external certification.

## New QA-only work
A portable protocol adds immutable public negative controls, isolated no-network behavioral tests, exact SHA and file-scope checks, separate raw npm audit evidence, and unsigned Hermes exports. Workflow actions and Node are pinned. The release-admission job fails for HIGH/CRITICAL and does not use continue-on-error. The actual outcomes must be read from runs on this PR's exact head, never assumed from this document.

## Release admission is unchanged
B7-C native npm audit full and omit-dev were 21 HIGH / 0 CRITICAL from the braces and node-forge advisories plus propagation. Both raw reports and exit 1 are preserved. Packages retain upstream names/versions and explicit private backport provenance; changing revision numbers must not hide findings. No exception or risk acceptance is approved. A green QA job does not authorize release or merge.

## No deployment
vercel.json denies only qa/op-p0-b7-der-ast-r2-20261019 through git.deploymentEnabled and an ignoreCommand returning 0 on that exact branch. Other branches retain their prior behavior. No Vercel project setting, production deployment or domain is changed. https://vercel.com/docs/project-configuration/git-configuration documents the branch switch; service-side non-deployment must be observed after push.

## Separation and limits
Second device/account checks, when executed, are automated counter-executions, not independent human approval or external certification. No review is automatically submitted as APPROVE. No native signing credentials, PSP/LIVE, settlement, Store submission, GitHub release or main merge is authorized. PR25 remains the separate publisher lock to review before ANY GitHub release.

## Rollback
Only a QA branch is being prepared. Stop promotion and retain the exact evidence. Production has not been mutated; do not roll back production or delete proof files.
