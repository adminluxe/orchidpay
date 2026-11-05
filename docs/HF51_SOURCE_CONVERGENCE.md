# HF51 source convergence only

PR #25 was merged on 2026-10-31, commit 35973e0ce244ea81c89406e7365ccf12c0bf6158. The historical PR #28 description saying it is unmerged is obsolete.

This QA branch keeps PR #28 at 28eb8d240ffc1f5e2eef13511dbbd747e0b508bc as an ancestor and incorporates the actual main ancestry. The publication-lock workflow was already byte-identical in both trees; the ancestry merge does not replace application code, locks or B7 proofs.

Only this note, a preservation verifier and an explicit no-deployment rule for this QA branch are added. Original F4B evidence remains attached to its exact source SHA; it is not relabelled as a new signed mobile build.

No npm/GitHub Packages release, production deployment, OTA, EAS build, Store submission or financial operation is authorized by this convergence. LIVE payment, settlement and payout rails remain OFF. Existing Store binaries must be reconciled separately before replacement.
