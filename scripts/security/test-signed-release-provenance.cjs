'use strict';
/* Adversarial fixtures only: no AAB, IPA, real keys or provider traffic. */
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const path = require('node:path');
const gate = require('./verify-signed-release-provenance.cjs');

function negative(name, platform, mutate, expected) {
  test(name, () => {
    const item = gate.fixture(platform);
    mutate(item);
    assert.throws(() => gate.assessSyntheticEvidence(item),
      new RegExp('B6_PROVENANCE_REFUSED:' + expected));
  });
}
for (const platform of ['android', 'ios']) {
  test(platform + ': purely synthetic description never grants production', () => {
    const result = gate.assessSyntheticEvidence(gate.fixture(platform));
    assert.equal(result.syntheticFixtureSchema, 'PASS');
    assert.equal(result.signingReleaseAdmission, 'NO_GO');
    assert.equal(result.signedArtifactByteVerification, 'NOT_PERFORMED');
    assert.equal(result.appleGoogleTrustChain, 'NOT_VERIFIED');
    assert.equal(result.financeLive, 'OFF');
    assert.equal(result.settlement, 'OFF');
  });
  negative(platform + ': cannot label fixture as real evidence', platform,
    x => { x.mode = 'PRODUCTION'; }, 'NON_SYNTHETIC_EVIDENCE_REFUSED');
  negative(platform + ': no arbitrary signing source', platform,
    x => { x.artifact.signerSource = 'APPLE_OR_GOOGLE_VERIFIED'; },
    'UNVERIFIED_SIGNER_OR_REAL_ARTIFACT_CLAIM');
  negative(platform + ': exact source commit is mandatory', platform,
    x => { x.sourceSha = '4'.repeat(40); }, 'SOURCE_CHECKPOINT_DRIFT');
  negative(platform + ': exact bundle identity is mandatory', platform,
    x => { x.appId = 'com.attacker.fake'; }, 'APPLICATION_IDENTITY_DRIFT');
  negative(platform + ': fingerprint must be real-shape digest', platform,
    x => { x.artifact.certificateSha256 = 'invalid'; }, 'CERTIFICATE_INVALID_SHA256');
  negative(platform + ': cannot use all-zero artifact digest', platform,
    x => { x.artifact.sha256 = '0'.repeat(64); }, 'ARTIFACT_INVALID_SHA256');
  negative(platform + ': rejects fake digest alias collision', platform,
    x => { x.artifact.sha256 = x.artifact.certificateSha256; },
    'ARTIFACT_CERTIFICATE_DIGEST_COLLISION');
  negative(platform + ': cannot smuggle approval metadata', platform,
    x => { x.releaseApproved = true; }, 'ROOT_MISSING_OR_EXTRA_FIELDS');
  negative(platform + ': cannot embed production secret fields', platform,
    x => { x.artifact.privateKey = 'NOT_A_REAL_SECRET'; },
    'ARTIFACT_MISSING_OR_EXTRA_FIELDS');
  negative(platform + ': unknown or downgraded contract is refused', platform,
    x => { x.contract = 'legacy'; }, 'CONTRACT_DRIFT');
  negative(platform + ': required property omission is refused', platform,
    x => { delete x.artifact.sha256; }, 'ARTIFACT_MISSING_OR_EXTRA_FIELDS');
}
negative('android: actual debug certificate cannot be simulated as release', 'android',
  x => { x.artifact.certificateSha256 = x.platformEvidence.debugCertificateSha256; },
  'DEBUG_CERTIFICATE_CANNOT_SIGN_RELEASE');
negative('android: variant must be release', 'android',
  x => { x.platformEvidence.buildVariant = 'debug'; }, 'ANDROID_VARIANT_NOT_RELEASE');
negative('android: backup must be disabled', 'android',
  x => { x.platformEvidence.allowBackup = true; }, 'ANDROID_BACKUP_ENABLED');
negative('android: backup extraction filters mandatory', 'android',
  x => { x.platformEvidence.dataExtractionRulesExcludesAll = false; },
  'ANDROID_EXTRACTION_RULES_MISSING');
negative('android: transfer exclusion mandatory', 'android',
  x => { x.platformEvidence.fullBackupContentExcludesAll = false; },
  'ANDROID_BACKUP_RULES_MISSING');
negative('android: system alert window is forbidden', 'android',
  x => { x.platformEvidence.permissions = ['android.permission.SYSTEM_ALERT_WINDOW']; },
  'ANDROID_FORBIDDEN_PERMISSION');
negative('android: duplicate permissions refused', 'android',
  x => { x.platformEvidence.permissions = ['android.permission.INTERNET',
    'android.permission.INTERNET']; }, 'ANDROID_PERMISSION_LIST_INVALID');
negative('android: bogus or unexpected permission schema refused', 'android',
  x => { x.platformEvidence.permissions = [false]; }, 'ANDROID_PERMISSION_LIST_INVALID');
negative('android: fake verified Play signing rejected', 'android',
  x => { x.platformEvidence.playSigningVerified = true; },
  'UNVERIFIED_PLAY_SIGNING_CLAIM');
negative('android: fake verified Play Integrity rejected', 'android',
  x => { x.platformEvidence.playIntegrityServerVerified = true; },
  'UNVERIFIED_PLAY_INTEGRITY_CLAIM');
negative('android: reject IPA mislabeled as Android', 'android',
  x => { x.artifact.type = 'ipa'; }, 'BINARY_FORMAT_MISMATCH');
negative('ios: reject Android artifact mislabeled as IPA', 'ios',
  x => { x.artifact.type = 'aab'; }, 'BINARY_FORMAT_MISMATCH');
negative('ios: enforce synthetic team only', 'ios',
  x => { x.platformEvidence.teamId = 'ABCDE12345'; },
  'REAL_APPLE_TEAM_NOT_ALLOWED_IN_FIXTURE');
negative('ios: release entitlement must describe production', 'ios',
  x => { x.platformEvidence.appAttestEntitlement = 'development'; },
  'IOS_APP_ATTEST_ENTITLEMENT_MISMATCH');
negative('ios: prohibit get-task-allow', 'ios',
  x => { x.platformEvidence.getTaskAllow = true; }, 'IOS_GET_TASK_ALLOW_NOT_FALSE');
negative('ios: refuse development distribution', 'ios',
  x => { x.platformEvidence.distribution = 'development'; },
  'IOS_DISTRIBUTION_NOT_APP_STORE');
negative('ios: fake verified Apple signature rejected', 'ios',
  x => { x.platformEvidence.signingChainVerified = true; },
  'UNVERIFIED_APPLE_SIGNING_CLAIM');
negative('ios: fake verified App Attest rejected', 'ios',
  x => { x.platformEvidence.appAttestServerVerified = true; },
  'UNVERIFIED_APP_ATTEST_CLAIM');
negative('ios: reject unexpected extra entitlements', 'ios',
  x => { x.platformEvidence.keychainAccess = 'production'; },
  'IOS_MISSING_OR_EXTRA_FIELDS');
test('unknown platform never falls back to permissive validation', () => {
  const x = gate.fixture('android');
  x.platform = 'web';
  assert.throws(() => gate.assessSyntheticEvidence(x),
    /B6_PROVENANCE_REFUSED:UNKNOWN_PLATFORM/);
});
test('null-prototype and proto poison cannot inject release approval', () => {
  const x = gate.fixture('android');
  const pollution = JSON.parse('{"contract":"orchidpay.b6.synthetic-provenance.v1","__proto__":{"releaseApproved":true}}');
  x.platformEvidence = pollution;
  assert.throws(() => gate.assessSyntheticEvidence(x),
    /B6_PROVENANCE_REFUSED:ANDROID_MISSING_OR_EXTRA_FIELDS/);
});
test('no evidence supplied: the production CLI must refuse with code 3', () => {
  const cmd = spawnSync(process.execPath,
    [path.join(__dirname, 'verify-signed-release-provenance.cjs'),
      '--require-production'],
    {encoding: 'utf8', timeout: 10000});
  assert.equal(cmd.status, 3);
  assert.match(cmd.stderr, /OP_B6_SIGNED_RELEASE_ADMISSION=NO_GO/);
});
test('unknown CLI flag is a refusal, not an ignored option', () => {
  const cmd = spawnSync(process.execPath,
    [path.join(__dirname, 'verify-signed-release-provenance.cjs'),
      '--release'],
    {encoding: 'utf8', timeout: 10000});
  assert.equal(cmd.status, 1);
  assert.match(cmd.stderr, /OP_B6_SYNTHETIC_GATE=FAIL/);
});
test('synthetic CLI smoke has no production acceptance', () => {
  const cmd = spawnSync(process.execPath,
    [path.join(__dirname, 'verify-signed-release-provenance.cjs'),
      '--synthetic-smoke', '--json'],
    {encoding: 'utf8', timeout: 10000});
  assert.equal(cmd.status, 0);
  assert.match(cmd.stdout, /B6_SYNTHETIC_ANDROID_SCHEMA=PASS;PRODUCTION=NO_GO/);
  assert.match(cmd.stdout, /B6_SYNTHETIC_IOS_SCHEMA=PASS;PRODUCTION=NO_GO/);
  assert.match(cmd.stdout, /"productionAdmission":"NO_GO"/);
});
