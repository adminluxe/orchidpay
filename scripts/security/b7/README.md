# OrchidPay B7-D portable review protocol

QA only, based on PR26 at 1d7e215a0547532fff5bf1b5f7803d3584a73391. No native signing, Store submission, package publication, deployment, merge or financial operation.

Run only in a disposable checkout, with standalone Node 22.23.3, npm 10.9.9, Python 3 and bubblewrap. Read the scripts first. The work directory must be outside the checkout. sandbox.sh exposes only the disposable checkout/work directory and a read-only toolchain. Registry mode has network for acquisition with an empty HOME; offline mode has no network namespace routes. This is not a per-destination network firewall.

The workflow is the executable all-in-one protocol: ignored lifecycle scripts on all installs, immutable public controls SHA256/SHA512 checked, library and VM-browser distribution tests, bounded children, native audits retained in separate files, and explicit release gate failure at HIGH/CRITICAL. VM bundle testing is not physical-browser or hardware certification.

300 controlled DER vectors are also evaluated against old controls; malformed signatures use ephemeral TEST private keys, not keyless forgeries. No private keys are written. Original/B6 controls live only in the isolated work directory, never the application dependency tree.

The 904 braces and 834-pass/4-pending Forge upstream runs, reproducible bundle builds and two clean installs from B7-C are reused only for their unchanged package and lock hashes. This portable CI does not claim to rerun those full upstream suites.

A successful qualification job is NOT a release authorization. The release-admission job must remain failing when native npm reports HIGH/CRITICAL. No advisory allowlist or exception is authorized here.

## B7-D HF1 execution preflight

The launcher rejects root overlaps in both directions, non-canonical or symlinked roots, external symlinks, and shared file inodes in mounted trees. Work must be private (0700). Git metadata is masked. Offline source is read-only; registry acquisition can write only in the disposable mounts. User/global npm config files are distinct and created inside private sandbox tmpfs, never by truncating host files. Registry mode is not a destination-filtering firewall.

Admission now compares native vulnerability entries against all severity counts and the native exit code. Contradictory reports, duplicate JSON keys, missing fields and malformed reports are UNVERIFIED. Zero HIGH/CRITICAL remains mandatory and does not authorize a release. Both reports and raw bytes are retained.

HF1 changes only the QA envelope, not the R2 archives, application lock or package manifest. Preflight results are not a new RSA, full upstream, Hermes, CI or Store certification.
