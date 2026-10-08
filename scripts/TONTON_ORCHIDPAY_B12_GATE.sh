#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$(pwd)}"
cd "$ROOT"

EXPECTED_STORE_ICON_SHA="5f35922b1dae387c344da2e8d91396243392fd08f33e7171afd87a6752b9d7b3"
EXPECTED_INAPP_MARK_SHA="f807a3d2c11f9b15f75fccea29526df684caf4ccc5a21e9b9eb4527dc4a4d40e"

TMP_WORK="$(mktemp -d /tmp/orchidpay-b12-gate-XXXXXX)"
TMP_EXPORT=""
TMP_PREBUILD=""

cleanup() {
  [ -z "$TMP_EXPORT" ] || rm -rf "$TMP_EXPORT"
  [ -z "$TMP_PREBUILD" ] || rm -rf "$TMP_PREBUILD"
  rm -rf "$TMP_WORK"
}
trap cleanup EXIT

say() {
  printf '\n=== %s ===\n' "$*"
}

say "IDENTITY + STORE VERSION"
node - <<'NODE'
const fs = require('fs');
const e = JSON.parse(fs.readFileSync('app.json', 'utf8')).expo;
const blocked = new Set(e.android?.blockedPermissions || []);
const requiredBlocked = [
  'android.permission.RECORD_AUDIO',
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
];
const ok =
  e.version === '1.0.0' &&
  e.ios?.bundleIdentifier === 'com.delishafrica.orchidpaymobile' &&
  e.ios?.buildNumber === '12' &&
  e.android?.package === 'com.delishafrica.orchidpaymobile' &&
  e.android?.versionCode === 12 &&
  e.ios?.runtimeVersion === '1.0.0-public-ready-b12-premium-brand-v1' &&
  e.extra?.eas?.projectId === '31e42526-bb26-42d9-9bcb-6ec23853aee2' &&
  requiredBlocked.every((x) => blocked.has(x));
if (!ok) {
  console.error(JSON.stringify(e, null, 2));
  process.exit(10);
}
console.log('IDENTITY=PASS');
console.log('STORE_VERSION_MONOTONIC_B12=PASS');
console.log('ANDROID_BLOCKED_PERMISSION_CONFIG=PASS');
NODE

if grep -q 'serviceAccountKeyPath' eas.json; then
  echo "EAS_SECRET_PATH=FAIL"
  exit 11
fi
echo "EAS_SECRET_PATH=PASS"

say "STORE DEPENDENCY PRUNE"
node - <<'NODE'
const p = require('./package.json');
const forbidden = ['expo-dev-client', 'expo-notifications', 'expo-status-bar'];
const found = forbidden.filter((name) => p.dependencies?.[name] || p.devDependencies?.[name]);
if (found.length) {
  console.error('FORBIDDEN_STORE_DEPENDENCIES=' + found.join(','));
  process.exit(12);
}
const excluded = p.expo?.autolinking?.exclude || [];
if (excluded.includes('expo-notifications')) {
  console.error('STALE_EXPO_NOTIFICATIONS_AUTOLINK_EXCLUDE');
  process.exit(13);
}
console.log('FORBIDDEN_STORE_DEPENDENCIES=ABSENT_PASS');
console.log('STALE_NOTIFICATION_AUTOLINK_CONFIG=ABSENT_PASS');
NODE
if grep -Eq '"expo-(dev-client|notifications|status-bar)"' package-lock.json; then
  echo "FORBIDDEN_STORE_DEPENDENCY_LOCK=FAIL"
  exit 14
fi
echo "FORBIDDEN_STORE_DEPENDENCY_LOCK=ABSENT_PASS"

say "CLEAN INSTALL"
npm ci --no-audit --no-fund >"$TMP_WORK/npm-ci.log" 2>&1
echo "NPM_CI=PASS"

say "EXPO DOCTOR"
npx expo-doctor | tee "$TMP_WORK/expo-doctor.log"
grep -q '20/20 checks passed' "$TMP_WORK/expo-doctor.log"
echo "EXPO_DOCTOR_20_20=PASS"

say "TYPESCRIPT"
npx tsc --noEmit
echo "TYPESCRIPT=PASS"

say "PUBLIC EXPO CONFIG"
npx expo config --type public --json > "$TMP_WORK/expo-config.json"
node - "$TMP_WORK/expo-config.json" <<'NODE'
const fs = require('fs');
const d = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const cam = (d.plugins || []).find((x) => Array.isArray(x) && x[0] === 'expo-camera');
const blocked = new Set(d.android?.blockedPermissions || []);
const requiredBlocked = [
  'android.permission.RECORD_AUDIO',
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
];
const ok =
  d.version === '1.0.0' &&
  d.ios?.bundleIdentifier === 'com.delishafrica.orchidpaymobile' &&
  d.ios?.buildNumber === '12' &&
  d.android?.package === 'com.delishafrica.orchidpaymobile' &&
  d.android?.versionCode === 12 &&
  requiredBlocked.every((x) => blocked.has(x)) &&
  cam &&
  cam[1]?.microphonePermission === false &&
  cam[1]?.recordAudioAndroid === false &&
  cam[1]?.cameraPermission === 'OrchidPay utilise l’appareil photo uniquement pour scanner des QR à vérifier avant confirmation.';
if (!ok) {
  console.error(JSON.stringify({
    version: d.version,
    ios: d.ios,
    android: d.android,
    cam,
  }, null, 2));
  process.exit(20);
}
console.log('EXPO_CONFIG=PASS');
NODE

say "FAIL-CLOSED FINANCIAL CONTRACT"
python3 - <<'PY'
from pathlib import Path

checks = {
    "src/security/paymentPolicy.ts": [
        "liveExecutionEnabled: false",
        "requiresStrongCustomerAuthentication: true",
        "requiresServerSignedIntent: true",
        "requiresIdempotencyKey: true",
    ],
    "src/security/surfacePolicy.ts": [
        "remotePushEnabled: false",
        "liveCardControlEnabled: false",
        "depositExecutionEnabled: false",
        "receiveQrExecutable: false",
        "externalLinksEnabled: false",
    ],
    "src/security/backendBoundary.ts": [
        "liveActivationFuse: false",
        "liveApiProvisioned: false",
        "serverVerifyKeyProvisioned: false",
        "serverIntentVerifierProvisioned: false",
        "kycAmlProviderProvisioned: false",
        "pspTokenizationProvisioned: false",
        "depositConnectorsProvisioned: false",
        "allowedLiveHosts: [] as readonly string[]",
    ],
    "src/services/orchidpayApi.ts": [
        "mode: 'mock'",
        "executable: false",
        "serverSigned: false",
        "Live transfer execution is intentionally disabled until authenticated signed API contracts are wired.",
    ],
}

missing = []
for rel, expected in checks.items():
    text = Path(rel).read_text(encoding="utf-8")
    for item in expected:
        if item not in text:
            missing.append(rel + ": " + item)

if missing:
    raise SystemExit("FAIL_CLOSED_CONTRACT_DRIFT\n" + "\n".join(missing))

print("PAYMENT_LIVE_OFF=PASS")
print("API_MOCK_ONLY_INTERNAL_BOUNDARY=PASS")
print("LIVE_HOST_ALLOWLIST_EMPTY=PASS")
print("REMOTE_PUSH_OFF=PASS")
print("LIVE_CARD_CONTROL_OFF=PASS")
print("DEPOSIT_EXECUTION_OFF=PASS")
print("RECEIVE_QR_EXECUTION_OFF=PASS")
print("FAIL_CLOSED_FINANCIAL_CONTRACT=PASS")
PY

say "STORE ROUTE BOUNDARY"
python3 - <<'PY'
from pathlib import Path

types = Path("src/types.ts").read_text(encoding="utf-8")
if "export type EngineeringRoute =" not in types:
    raise SystemExit("ENGINEERING_ROUTE_TYPE_MISSING")
before = types.split("export type EngineeringRoute =", 1)[0]
forbidden = [
    "send",
    "receive",
    "deposit",
    "cards",
    "integration-readiness",
    "backend-contract-lab",
]
leaked = [x for x in forbidden if ("'" + x + "'") in before]
if leaked:
    raise SystemExit("STORE_ROUTE_TYPE_BOUNDARY=FAIL " + ",".join(leaked))

router = Path("src/AppShell.tsx").read_text(encoding="utf-8")
for marker in [
    "SendScreen",
    "ReceiveScreen",
    "DepositScreen",
    "CardsScreen",
    "IntegrationReadinessScreen",
    "BackendContractLabScreen",
]:
    if marker in router:
        raise SystemExit("STORE_ROUTER_INTERNAL_IMPORT=FAIL " + marker)

required_routes = [
    "security",
    "authorized-devices",
    "limits-security",
    "compliance",
    "help",
    "notifications",
    "scan",
    "activity",
    "profile",
    "home",
]
missing = [x for x in required_routes if ("case '" + x + "'") not in router and x != "home"]
if missing:
    raise SystemExit("STORE_REQUIRED_ROUTE_MISSING " + ",".join(missing))

print("STORE_ROUTE_TYPE_BOUNDARY=PASS")
print("STORE_ROUTER_INTERNAL_IMPORTS=PASS")
PY

say "STORE SURFACE STATIC TRUTH"
STORE_FILES="src/screens/HomeScreen.tsx src/screens/SecurityScreen.tsx src/screens/TabScreens.tsx src/screens/ProfileDetailScreens.tsx src/screens/ScanScreen.tsx src/screens/NotificationsScreen.tsx src/security/LockScreen.tsx src/AppShell.tsx src/components/BottomNav.tsx"
FORBIDDEN_STORE='R1[0-9]\.|Release Candidate|Backend Contract|backend & live|Contrats backend|Préparation backend|lab guidé|mode mock|SIMULATION_ONLY|FAIL-CLOSED|fail-closed|Paiement live|Transferts live|Backend live|PRIVATE MONEY OS|ORCHESTRATION PRIVÉE|prototype|démonstration|DÉMO|blockers|provider-root|production shadow|provisioning|mockTransactions|walletSnapshot|@raoulf|Raoul F\.|2874|12 450|OrchidPay Black'
if grep -nHE "$FORBIDDEN_STORE" $STORE_FILES; then
  echo "STORE_SURFACE_FORBIDDEN=FAIL"
  exit 21
fi
echo "STORE_SURFACE_FORBIDDEN=PASS"

if grep -nHE '../data/mock|mockTransactions|walletSnapshot' $STORE_FILES; then
  echo "STORE_REACHABLE_MOCK_IMPORTS=FAIL"
  exit 22
fi
echo "STORE_REACHABLE_MOCK_IMPORTS=ABSENT_PASS"

if grep -nHE 'releasePassport|acceptanceSuite|backendContractSuite|backendBoundarySuite' $STORE_FILES; then
  echo "STORE_REACHABLE_ENGINEERING_IMPORTS=FAIL"
  exit 23
fi
echo "STORE_REACHABLE_ENGINEERING_IMPORTS=ABSENT_PASS"

say "APPLE CAMERA REVIEW GATE"
grep -q '<Text style={styles.primaryText}>Continuer</Text>' src/screens/ScanScreen.tsx
if grep -RIniE --exclude-dir=node_modules --exclude-dir=.git   'Allow Camera|Autoriser la caméra'   src App.tsx App.js app.json >"$TMP_WORK/forbidden-camera-copy.txt"; then
  cat "$TMP_WORK/forbidden-camera-copy.txt"
  exit 24
fi
echo "CAMERA_NEUTRAL_CTA=PASS"

say "KNOWN UPSTREAM SECURITY RESERVATION"
npm audit --omit=dev --json > "$TMP_WORK/npm-audit.json" 2>/dev/null || true
node - "$TMP_WORK/npm-audit.json" <<'NODE'
const fs = require('fs');
const d = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const v = d.metadata?.vulnerabilities || {};
const found = Object.keys(d.vulnerabilities || {}).sort();
const allowed = [
  '@expo/cli',
  '@expo/code-signing-certificates',
  '@expo/metro',
  '@expo/metro-config',
  '@jest/environment',
  '@jest/fake-timers',
  '@jest/transform',
  '@react-native/community-cli-plugin',
  'babel-jest',
  'brace-expansion',
  'braces',
  'expo',
  'jest-environment-node',
  'jest-haste-map',
  'jest-message-util',
  'metro',
  'metro-config',
  'metro-file-map',
  'metro-transform-worker',
  'micromatch',
  'node-forge',
  'react-native',
  'shell-quote',
  'source-map-js',
].sort();
const unknown = found.filter((x) => !allowed.includes(x));
if (
  unknown.length ||
  v.total !== 24 ||
  v.critical !== 1 ||
  v.high !== 23 ||
  v.moderate !== 0 ||
  v.low !== 0
) {
  console.error('AUDIT_DRIFT', JSON.stringify({ v, unknown, found }, null, 2));
  process.exit(30);
}
for (const [name, item] of Object.entries(d.vulnerabilities || {})) {
  if (item.severity === 'critical' && name !== 'shell-quote') {
    console.error('UNEXPECTED_CRITICAL', name);
    process.exit(31);
  }
}
console.log('AUDIT_BOUNDARY=PASS ' + JSON.stringify(v));
NODE

say "SECRET SCAN"
if grep -RIlE --exclude-dir=node_modules --exclude-dir=.git --binary-files=without-match   -e '-----BEGIN [A-Z ]*PRIVATE KEY-----|sk_(live|test)_[A-Za-z0-9]{12,}|AIza[0-9A-Za-z_-]{30,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{20,}|access_token=[A-Za-z0-9._-]{12,}|client_secret=[A-Za-z0-9._-]{8,}'   . | grep -q .; then
  echo "SECRET_SCAN=FAIL"
  exit 40
fi
echo "SECRET_SCAN=PASS"

say "DIFF HYGIENE"
git diff --check
git diff --cached --check
echo "DIFF_CHECK=PASS"

say "BRAND PROVENANCE"
STORE_SHA="$(sha256sum assets/icon.png | awk '{print $1}')"
INAPP_SHA="$(sha256sum assets/in-app-mark.png | awk '{print $1}')"
if [ "$STORE_SHA" != "$EXPECTED_STORE_ICON_SHA" ]; then
  echo "STORE_ICON_PROVENANCE=FAIL"
  exit 41
fi
if [ "$INAPP_SHA" != "$EXPECTED_INAPP_MARK_SHA" ]; then
  echo "INAPP_MARK_PROVENANCE=FAIL"
  exit 42
fi
echo "STORE_ICON_B11_EXACT=PASS"
echo "INAPP_MARK_PREMIUM=PASS"

say "IOS + ANDROID EXPORTS"
TMP_EXPORT="$(mktemp -d /tmp/orchidpay-b12-export-XXXXXX)"
mkdir -p "$TMP_EXPORT/tmp"
TMPDIR="$TMP_EXPORT/tmp" npx expo export --platform ios --clear --output-dir "$TMP_EXPORT/ios" >"$TMP_WORK/export-ios.log" 2>&1
echo "IOS_EXPORT=PASS"
TMPDIR="$TMP_EXPORT/tmp" npx expo export --platform android --clear --output-dir "$TMP_EXPORT/android" >"$TMP_WORK/export-android.log" 2>&1
echo "ANDROID_EXPORT=PASS"

say "PACKAGED B11 SIGNATURE FORENSICS"
python3 - "$TMP_EXPORT" <<'PY'
from pathlib import Path
import sys

root = Path(sys.argv[1])
needles = [
    "@raoulf",
    "Raoul F.",
    "12 450",
    "2874",
    "OrchidPay Black",
    "Backend Contract Lab",
    "Préparation backend",
    "Contrats backend",
    "Trace de gate",
    "Simulation sécurisée",
    "NON EXÉCUTABLE",
    "PRIVATE MONEY OS",
    "FAIL-CLOSED",
    "R13.",
    "500 001",
    "1 234",
    "SIMULATION_ONLY",
    "Paiement marchand",
    "Transfert reçu",
    "Facture électricité",
    "Achat en ligne",
    "MOCK_ONLY_NO_LIVE",
    "R12.8-RC-LOCAL",
]

for platform in ("ios", "android"):
    files = list((root / platform).rglob("*.hbc"))
    if len(files) != 1:
        raise SystemExit(platform.upper() + "_HBC_COUNT=" + str(len(files)))
    data = files[0].read_bytes()
    found = [n for n in needles if n.encode("utf-8") in data]
    if found:
        raise SystemExit(platform.upper() + "_PACKAGED_B11_SIGNATURES=FAIL " + repr(found))
    print(platform.upper() + "_PACKAGED_B11_SIGNATURES=ABSENT_PASS")

print("PACKAGED_B11_SIGNATURES=PASS")
PY

say "NATIVE PREBUILD PRIVACY + PERMISSION GATE"
TMP_PREBUILD="$(mktemp -d /tmp/orchidpay-b12-prebuild-XXXXXX)"
rsync -a --exclude=node_modules --exclude=.git "$ROOT/" "$TMP_PREBUILD/"
cd "$TMP_PREBUILD"
npm ci --no-audit --no-fund >"$TMP_WORK/prebuild-npm-ci.log" 2>&1

node - <<'NODE'
const p = require('./package.json');
for (const name of ['expo-dev-client', 'expo-notifications', 'expo-status-bar']) {
  if (p.dependencies?.[name] || p.devDependencies?.[name]) {
    console.error('PREBUILD_FORBIDDEN_DEPENDENCY=' + name);
    process.exit(1);
  }
}
console.log('PREBUILD_FORBIDDEN_DEPENDENCIES=ABSENT_PASS');
NODE

npx expo prebuild --clean --no-install >"$TMP_WORK/prebuild.log" 2>&1
echo "NATIVE_PREBUILD=PASS"

INFO="$(find ios -maxdepth 3 -name Info.plist -type f | head -1)"
if [ -z "$INFO" ]; then
  echo "IOS_INFO_PLIST=FAIL"
  exit 50
fi
python3 - "$INFO" <<'PY'
import plistlib
import sys

path = sys.argv[1]
with open(path, "rb") as fh:
    d = plistlib.load(fh)

expected_camera = "OrchidPay utilise l’appareil photo uniquement pour scanner des QR à vérifier avant confirmation."
assert d.get("CFBundleVersion") == "12", d.get("CFBundleVersion")
assert d.get("NSCameraUsageDescription") == expected_camera, d.get("NSCameraUsageDescription")
assert d.get("NSFaceIDUsageDescription"), "NSFaceIDUsageDescription missing"
assert d.get("NSMicrophoneUsageDescription") is None, "microphone purpose present"
assert d.get("NSLocalNetworkUsageDescription") is None, "dev local-network purpose present"
assert d.get("NSBonjourServices") is None, "Bonjour dev services present"
ats = d.get("NSAppTransportSecurity") or {}
assert ats.get("NSAllowsArbitraryLoads") is not True, "ATS arbitrary loads enabled"
print("IOS_NATIVE_PRIVACY=PASS")
PY

if grep -RIlE --exclude-dir=Pods 'Expo Dev Launcher|EXDevLauncher|_expo\._tcp' ios | grep -q .; then
  echo "IOS_DEV_LAUNCHER_MARKERS=FAIL"
  exit 51
fi
echo "IOS_DEV_LAUNCHER_MARKERS=ABSENT_PASS"

MANIFEST="android/app/src/main/AndroidManifest.xml"
if [ ! -f "$MANIFEST" ]; then
  echo "ANDROID_MANIFEST=FAIL"
  exit 52
fi
python3 - "$MANIFEST" <<'PY'
import sys
import xml.etree.ElementTree as ET

path = sys.argv[1]
root = ET.parse(path).getroot()
ANDROID = "{http://schemas.android.com/apk/res/android}"
TOOLS = "{http://schemas.android.com/tools}"

perms = {}
for el in root.findall("uses-permission"):
    name = el.attrib.get(ANDROID + "name", "")
    action = el.attrib.get(TOOLS + "node", "") or "ACTIVE"
    perms[name] = action

required = [
    "android.permission.CAMERA",
    "android.permission.USE_BIOMETRIC",
]
blocked = [
    "android.permission.RECORD_AUDIO",
    "android.permission.SYSTEM_ALERT_WINDOW",
    "android.permission.READ_EXTERNAL_STORAGE",
    "android.permission.WRITE_EXTERNAL_STORAGE",
]

for item in required:
    if perms.get(item) != "ACTIVE":
        raise SystemExit("ANDROID_REQUIRED_PERMISSION=FAIL " + item + "=" + str(perms.get(item)))
for item in blocked:
    if perms.get(item) != "remove":
        raise SystemExit("ANDROID_BLOCKED_PERMISSION=FAIL " + item + "=" + str(perms.get(item)))
if "android.permission.POST_NOTIFICATIONS" in perms:
    raise SystemExit("ANDROID_POST_NOTIFICATIONS=FAIL " + str(perms["android.permission.POST_NOTIFICATIONS"]))

print("ANDROID_REQUIRED_PERMISSIONS=PASS")
print("ANDROID_BLOCKED_PERMISSION_DIRECTIVES=PASS")
print("ANDROID_POST_NOTIFICATIONS=ABSENT_PASS")
PY

cd "$ROOT"

say "FINAL"
echo "B11_TREATED_AS_EVIDENCE_NOT_TRUSTED_BASELINE=PASS"
echo "STORE_SURFACE_TRUTH=PASS"
echo "FINAL_ORCHIDPAY_B12_GATE=PASS"
