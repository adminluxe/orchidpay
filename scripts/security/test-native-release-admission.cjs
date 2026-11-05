'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const policy = require('./verify-native-release-admission.cjs');
const ROOT = path.resolve(__dirname, '..', '..');

function fixture(fn) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'op-release-guard-'));
  try {
    const files = new Set([
      'app.json', 'eas.json',
      'modules/orchidpay-app-attest/ios/OrchidPayAppAttestModule.swift',
      'modules/orchidpay-app-attest/src/OrchidPayAppAttestModule.ts',
      ...policy.POLICY_FIELDS.map(x => x[0]),
    ]);
    for (const rel of files) {
      fs.mkdirSync(path.dirname(path.join(tmp, rel)), {recursive: true});
      fs.copyFileSync(path.join(ROOT, rel), path.join(tmp, rel));
    }
    return fn(tmp);
  } finally { fs.rmSync(tmp, {recursive: true, force: true}); }
}
function mutate(root, rel, from, to) {
  const filename = path.join(root, rel);
  const content = fs.readFileSync(filename, 'utf8');
  assert.equal(content.split(from).length, 2, 'Expected exactly one mutation anchor: ' + rel);
  fs.writeFileSync(filename, content.replace(from, to));
}
test('real source baseline is a transparent NO-GO, not production-ready', () => {
  const result = policy.inspect(ROOT);
  assert.equal(result.sourceGuard, 'PASS');
  assert.equal(result.productionAdmission, 'NO_GO');
  assert.equal(result.androidSignedAab, 'NOT_VERIFIED');
  assert.equal(result.iosSignedProductionEntitlement, 'NOT_VERIFIED');
});
test('EAS production App Attest environment downgrade is rejected', () => fixture(root => {
  const p = path.join(root, 'eas.json');
  const doc = JSON.parse(fs.readFileSync(p, 'utf8'));
  doc.build.production.env.ORCHIDPAY_APP_ATTEST_ENVIRONMENT = 'development';
  fs.writeFileSync(p, JSON.stringify(doc));
  assert.throws(() => policy.inspect(root), /EAS_PRODUCTION_APP_ATTEST_NOT_DECLARED/);
}));
test('Android overlay permission cannot be unblocked in app config', () => fixture(root => {
  const p = path.join(root, 'app.json');
  const doc = JSON.parse(fs.readFileSync(p, 'utf8'));
  doc.expo.android.blockedPermissions = doc.expo.android.blockedPermissions
    .filter(x => x !== 'android.permission.SYSTEM_ALERT_WINDOW');
  fs.writeFileSync(p, JSON.stringify(doc));
  assert.throws(() => policy.inspect(root), /FORBIDDEN_ANDROID_PERMISSION_UNBLOCKED/);
}));
test('production attestation verifier cannot be declared provisioned in a lab contract', () =>
  fixture(root => {
    const file = 'src/security/deviceAttestationContract.ts';
    mutate(root, file, 'productionVerifierProvisioned: false as const',
      'productionVerifierProvisioned: true as const');
    assert.throws(() => policy.inspect(root), /POLICY_PRODUCTION_FUSE_CHANGED/);
  }));
test('production admission cannot be enabled by source-only declaration', () =>
  fixture(root => {
    mutate(root, 'src/security/productionAdmissionShadowContract.ts',
      'productionAdmissionEnabled: false as const', 'productionAdmissionEnabled: true as const');
    assert.throws(() => policy.inspect(root), /POLICY_PRODUCTION_FUSE_CHANGED/);
  }));
test('expired manufacturer root may never be accepted as a production root', () =>
  fixture(root => {
    mutate(root, 'src/security/providerRootReviewContract.ts',
      'productionProviderRootGateOpen: true as const',
      'productionProviderRootGateOpen: false as const');
    assert.throws(() => policy.inspect(root), /POLICY_PRODUCTION_FUSE_CHANGED/);
  }));
test('release readiness false claim cannot be silently switched true', () =>
  fixture(root => {
    mutate(root, 'src/security/releaseReadinessGate.ts',
      'productionReleaseClaim: false as const',
      'productionReleaseClaim: true as const');
    assert.throws(() => policy.inspect(root), /POLICY_PRODUCTION_FUSE_CHANGED/);
  }));
test('iOS native bridge cannot quietly discard missing-module refusal', () =>
  fixture(root => {
    mutate(root, 'modules/orchidpay-app-attest/src/OrchidPayAppAttestModule.ts',
      'ORCHIDPAY_APP_ATTEST_NATIVE_MODULE_UNAVAILABLE', 'ALWAYS_AVAILABLE');
    assert.throws(() => policy.inspect(root), /IOS_APP_ATTEST_MISSING_FAIL_CLOSED_BRIDGE/);
  }));
test('missing source policy property is rejected instead of treated false', () =>
  fixture(root => {
    mutate(root, 'src/security/stagingHsmP256Binding.ts',
      'productionEligible: false as const', 'productionEligible: undefined as const');
    assert.throws(() => policy.inspect(root), /POLICY_FIELD_MISSING_OR_DUPLICATE/);
  }));
test('production CLI must reject without signed binary and hardware evidence', () => {
  const child = spawnSync(process.execPath,
    [path.join(__dirname, 'verify-native-release-admission.cjs'), '--require-production'],
    {cwd: ROOT, encoding: 'utf8', timeout: 15000});
  assert.equal(child.status, 3);
  assert.match(child.stderr, /OP_PRODUCTION_RELEASE_ADMISSION=NO_GO/);
});