#!/usr/bin/env bash
# B7-D HF1: standalone toolchain, disjoint disposable roots, hidden Git metadata.
set -Eeuo pipefail
umask 077
[[ $# -ge 5 ]] || { echo 'Usage: sandbox.sh REPO WORK offline|registry CWD COMMAND...' >&2; exit 80; }
repo=$1; work=$2; mode=$3; cwd=$4; shift 4
case "$mode" in offline) net=(); binding=--ro-bind;; registry) net=(--share-net); binding=--bind;; *) exit 84;; esac
python3 - "$repo" "$work" "$cwd" <<'PYPATH'
import os, pathlib, stat, sys

def checked(text):
    if not os.path.isabs(text) or text != os.path.normpath(text):
        raise ValueError('Canonical absolute root required')
    p = pathlib.Path(text)
    for q in list(reversed(p.parents)) + [p]:
        if q.is_symlink():
            raise ValueError('Symlink in root path')
    if not p.is_dir() or p == pathlib.Path('/'):
        raise ValueError('Missing or forbidden root')
    s = p.stat()
    if s.st_uid != os.getuid() or s.st_mode & 0o022:
        raise ValueError('Root must be owned and not writable by other users')
    return p

try:
    r, w = map(checked, sys.argv[1:3])
    if r == w or r in w.parents or w in r.parents:
        raise ValueError('Both directions of root overlap are forbidden')
    if w.stat().st_mode & 0o077:
        raise ValueError('Work root must be mode 0700')
    marker = r / 'security/B7_PACKAGE_MANIFEST.json'
    if not marker.is_file() or marker.is_symlink() or marker.stat().st_nlink != 1:
        raise ValueError('Invalid source marker')
    if not (r / '.git').is_dir() or (r / '.git').is_symlink():
        raise ValueError('Require dedicated clone with ordinary .git directory')
    c = sys.argv[3]
    if c != os.path.normpath(c) or not (c in ('/repo', '/work') or c.startswith('/work/')):
        raise ValueError('Invalid sandbox working directory')
    # Writable mounts must not expose shared inodes or external symlinks.
    for root in (r, w):
        for parent, dirs, files in os.walk(root, followlinks=False):
            if pathlib.Path(parent) == r:
                dirs[:] = [name for name in dirs if name != '.git']
            for name in dirs + files:
                f = pathlib.Path(parent) / name
                if f.is_symlink():
                    target = f.resolve(strict=True)
                    if root not in target.parents or (r / '.git') == target or (r / '.git') in target.parents:
                        raise ValueError('External or Git-directed symlink')
                elif f.is_file():
                    if f.stat().st_nlink != 1:
                        raise ValueError('Shared file inode in mounted root')
                elif not f.is_dir():
                    raise ValueError('Special file in mounted root')
except (OSError, ValueError, RuntimeError) as e:
    print('B7_SANDBOX_PATH_NO_GO: ' + str(e), file=sys.stderr)
    sys.exit(81)
PYPATH
node=$(realpath -e "$(command -v node)"); toolchain=$(dirname "$(dirname "$node")")
[[ "$toolchain" != / && "$toolchain" != /usr ]] || { echo 'Use a standalone pinned Node distribution' >&2; exit 85; }
[[ $("$node" --version) == v22.23.3 ]] || { echo NODE_VERSION_DRIFT >&2; exit 85; }
bwrap=$(command -v bwrap); [[ -x "$bwrap" ]] || exit 86
exec /usr/bin/env -i "$bwrap" --unshare-all "${net[@]}" --die-with-parent --new-session \
 --ro-bind /usr /usr --ro-bind /bin /bin --ro-bind /lib /lib --ro-bind /lib64 /lib64 \
 --dir /etc --ro-bind /etc/ssl /etc/ssl --ro-bind /etc/resolv.conf /etc/resolv.conf \
 --ro-bind /etc/hosts /etc/hosts --ro-bind /etc/nsswitch.conf /etc/nsswitch.conf \
 --ro-bind "$toolchain" /toolchain "$binding" "$repo" /repo --bind "$work" /work \
 --tmpfs /repo/.git --proc /proc --dev /dev --tmpfs /tmp --dir /home --dir /home/qa \
 --setenv HOME /home/qa --setenv PATH /toolchain/bin:/usr/bin:/bin --setenv LANG C.UTF-8 \
 --setenv TZ UTC --setenv CI 1 --setenv EXPO_OFFLINE 1 --setenv EXPO_NO_TELEMETRY 1 \
 --setenv NPM_CONFIG_USERCONFIG /tmp/npm-user.conf --setenv NPM_CONFIG_GLOBALCONFIG /tmp/npm-global.conf \
 --setenv NPM_CONFIG_CACHE /work/cache --setenv NPM_CONFIG_IGNORE_SCRIPTS true \
 --setenv NPM_CONFIG_REGISTRY https://registry.npmjs.org/ --setenv NODE_PATH /repo/node_modules \
 --setenv GIT_OPTIONAL_LOCKS 0 --chdir "$cwd" -- /bin/bash -c \
 'set -euo pipefail; umask 077; : > /tmp/npm-user.conf; : > /tmp/npm-global.conf; exec "$@"' -- "$@"
