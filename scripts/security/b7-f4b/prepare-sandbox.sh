#!/usr/bin/env bash
# Disposable GitHub-hosted Ubuntu 24.04 runner only, never production hosts.
set -Eeuo pipefail
umask 077
test -n "$RUNNER_TEMP" && test -d "$RUNNER_TEMP"
test -n "$GITHUB_JOB" && test -n "$GITHUB_ENV" && test -n "$GITHUB_WORKSPACE"
test "$(node --version)" = "v22.23.3"
test "$(npm --version)" = "10.9.9"
test "$GITHUB_REPOSITORY" = "adminluxe/orchidpay"
B7_WORK="$RUNNER_TEMP/op-b7-f4b-$GITHUB_JOB"
test ! -e "$B7_WORK"
mkdir -m 0700 "$B7_WORK"
mkdir -m 0700 "$B7_WORK/evidence"
printf 'B7_WORK=%s\n' "$B7_WORK" >> "$GITHUB_ENV"
{ node --version; npm --version; python3 --version; } > "$B7_WORK/evidence/toolchain.txt"
command -v bwrap || { sudo apt-get update -qq; sudo apt-get install -y bubblewrap; }
if ! bash scripts/security/b7/sandbox.sh "$PWD" "$B7_WORK" offline /repo /bin/bash -c \
 'test ! -e /home/runner; test "$(wc -l < /proc/net/route)" -eq 1' > "$B7_WORK/evidence/bwrap-baseline.log" 2>&1; then
 grep -Fq 'loopback: Failed RTM_NEWADDR: Operation not permitted' "$B7_WORK/evidence/bwrap-baseline.log" \
  || { cat "$B7_WORK/evidence/bwrap-baseline.log"; exit 88; }
 . /etc/os-release
 test "$ID" = "ubuntu" && test "$VERSION_ID" = "24.04"
 test "$(sysctl -n kernel.apparmor_restrict_unprivileged_userns)" = "1"
 sudo apt-get update -qq
 sudo apt-get install -y apparmor-profiles apparmor-utils
 P=/usr/share/apparmor/extra-profiles/bwrap-userns-restrict
 test -f "$P" && test ! -L "$P"
 sha256sum "$P" > "$B7_WORK/evidence/apparmor-profile.sha256"
 sha512sum "$P" > "$B7_WORK/evidence/apparmor-profile.sha512"
 if sudo test -e /etc/apparmor.d/bwrap-userns-restrict; then
  sudo cmp -s "$P" /etc/apparmor.d/bwrap-userns-restrict || exit 89
 else
  sudo install -m 0644 "$P" /etc/apparmor.d/bwrap-userns-restrict
 fi
 sudo apparmor_parser -r /etc/apparmor.d/bwrap-userns-restrict
 test "$(sysctl -n kernel.apparmor_restrict_unprivileged_userns)" = "1"
 echo UBUNTU_DISTRIBUTION_SCOPED_PROFILE_ONLY > "$B7_WORK/evidence/apparmor-mode.txt"
fi
bash scripts/security/b7/sandbox.sh "$PWD" "$B7_WORK" offline /repo /bin/bash -c \
 'test ! -e /home/runner; test "$(wc -l < /proc/net/route)" -eq 1'
echo B7_F4B_OFFLINE_SANDBOX_ACTIVE
