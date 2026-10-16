'use strict';

/*
 * OrchidPay OP-P0-B6-R1: synthetic provenance negative-control ONLY.
 * A JSON declaration is never evidence of a signed binary or trust in Apple/Google.
 * This tool deliberately has NO production acceptance mode, no network and no keys.
 */
const crypto = require('node:crypto');

const CHECKPOINT = 'cfd1163d0f7d7d9ed589bcc4f638e0b73a39031d';
const APP_ID = 'com.delishafrica.orchidpaymobile';
const CONTRACT = 'orchidpay.b6.synthetic-provenance.v1';
const HEX64 = /^[a-f0-9]{64}$/;
const FORBIDDEN_PERMISSIONS = new Set([
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.RECORD_AUDIO',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
]);

function refuse(code) {
  throw new Error('B6_PROVENANCE_REFUSED:' + code);
}
function record(value, keys, where) {
  if (value === null || typeof value !== 'object' || Array.isArray(value) ||
      (Object.getPrototypeOf(value) !== Object.prototype &&
       Object.getPrototypeOf(value) !== null)) refuse(where + '_NOT_PLAIN_RECORD');
  const actual = Object.keys(value);
  if (actual.length !== keys.length ||
      actual.some(key => !keys.includes(key)) ||
      keys.some(key => !Object.prototype.hasOwnProperty.call(value, key))) {
    refuse(where + '_MISSING_OR_EXTRA_FIELDS');
  }
}
function sha(value, where) {
  if (typeof value !== 'string' || !HEX64.test(value) || /^0{64}$/.test(value)) {
    refuse(where + '_INVALID_SHA256');
  }
}
function exact(value, expected, code) {
  if (value !== expected) refuse(code);
}
function compareSha(a, b) {
  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}
function assessSyntheticEvidence(e) {
  record(e, ['contract', 'mode', 'sourceSha', 'platform', 'appId',
    'artifact', 'platformEvidence'], 'ROOT');
  exact(e.contract, CONTRACT, 'CONTRACT_DRIFT');
  exact(e.mode, 'SYNTHETIC_ONLY', 'NON_SYNTHETIC_EVIDENCE_REFUSED');
  exact(e.sourceSha, CHECKPOINT, 'SOURCE_CHECKPOINT_DRIFT');
  exact(e.appId, APP_ID, 'APPLICATION_IDENTITY_DRIFT');
  if (!['android', 'ios'].includes(e.platform)) refuse('UNKNOWN_PLATFORM');

  record(e.artifact, ['type', 'sha256', 'certificateSha256', 'signerSource'],
    'ARTIFACT');
  exact(e.artifact.signerSource, 'SYNTHETIC_FIXTURE_ONLY',
    'UNVERIFIED_SIGNER_OR_REAL_ARTIFACT_CLAIM');
  exact(e.artifact.type, e.platform === 'android' ? 'aab' : 'ipa',
    'BINARY_FORMAT_MISMATCH');
  sha(e.artifact.sha256, 'ARTIFACT');
  sha(e.artifact.certificateSha256, 'CERTIFICATE');
  if (compareSha(e.artifact.sha256, e.artifact.certificateSha256)) {
    refuse('ARTIFACT_CERTIFICATE_DIGEST_COLLISION');
  }

  if (e.platform === 'android') {
    const a = e.platformEvidence;
    record(a, ['buildVariant', 'debugCertificateSha256', 'allowBackup',
      'fullBackupContentExcludesAll', 'dataExtractionRulesExcludesAll',
      'permissions', 'playSigningVerified', 'playIntegrityServerVerified'],
    'ANDROID');
    exact(a.buildVariant, 'release', 'ANDROID_VARIANT_NOT_RELEASE');
    sha(a.debugCertificateSha256, 'DEBUG_CERTIFICATE');
    if (compareSha(e.artifact.certificateSha256, a.debugCertificateSha256)) {
      refuse('DEBUG_CERTIFICATE_CANNOT_SIGN_RELEASE');
    }
    exact(a.allowBackup, false, 'ANDROID_BACKUP_ENABLED');
    exact(a.fullBackupContentExcludesAll, true, 'ANDROID_BACKUP_RULES_MISSING');
    exact(a.dataExtractionRulesExcludesAll, true, 'ANDROID_EXTRACTION_RULES_MISSING');
    if (!Array.isArray(a.permissions) || a.permissions.length > 30 ||
        a.permissions.some(p => typeof p !== 'string' ||
          !/^android\.permission\.[A-Z0-9_]+$/.test(p)) ||
        new Set(a.permissions).size !== a.permissions.length) {
      refuse('ANDROID_PERMISSION_LIST_INVALID');
    }
    if (a.permissions.some(p => FORBIDDEN_PERMISSIONS.has(p))) {
      refuse('ANDROID_FORBIDDEN_PERMISSION');
    }
    exact(a.playSigningVerified, false, 'UNVERIFIED_PLAY_SIGNING_CLAIM');
    exact(a.playIntegrityServerVerified, false, 'UNVERIFIED_PLAY_INTEGRITY_CLAIM');
  } else {
    const i = e.platformEvidence;
    record(i, ['distribution', 'teamId', 'appAttestEntitlement',
      'getTaskAllow', 'signingChainVerified', 'appAttestServerVerified'], 'IOS');
    exact(i.distribution, 'app-store', 'IOS_DISTRIBUTION_NOT_APP_STORE');
    exact(i.teamId, 'SYNTHETIC_TEAM_ID', 'REAL_APPLE_TEAM_NOT_ALLOWED_IN_FIXTURE');
    exact(i.appAttestEntitlement, 'production', 'IOS_APP_ATTEST_ENTITLEMENT_MISMATCH');
    exact(i.getTaskAllow, false, 'IOS_GET_TASK_ALLOW_NOT_FALSE');
    exact(i.signingChainVerified, false, 'UNVERIFIED_APPLE_SIGNING_CLAIM');
    exact(i.appAttestServerVerified, false, 'UNVERIFIED_APP_ATTEST_CLAIM');
  }

  return Object.freeze({
    syntheticFixtureSchema: 'PASS',
    examinedPlatform: e.platform,
    signedArtifactByteVerification: 'NOT_PERFORMED',
    appleGoogleTrustChain: 'NOT_VERIFIED',
    deviceServerAttestation: 'NOT_CERTIFIED',
    signingReleaseAdmission: 'NO_GO',
    financeLive: 'OFF',
    settlement: 'OFF',
    payout: 'OFF',
    mainMerge: 'NONE',
  });
}
function fixture(platform) {
  const common = {
    contract: CONTRACT,
    mode: 'SYNTHETIC_ONLY',
    sourceSha: CHECKPOINT,
    platform: platform,
    appId: APP_ID,
    artifact: {
      type: platform === 'android' ? 'aab' : 'ipa',
      sha256: '1'.repeat(64),
      certificateSha256: '2'.repeat(64),
      signerSource: 'SYNTHETIC_FIXTURE_ONLY',
    },
  };
  if (platform === 'android') {
    common.platformEvidence = {
      buildVariant: 'release',
      debugCertificateSha256: '3'.repeat(64),
      allowBackup: false,
      fullBackupContentExcludesAll: true,
      dataExtractionRulesExcludesAll: true,
      permissions: [],
      playSigningVerified: false,
      playIntegrityServerVerified: false,
    };
  } else if (platform === 'ios') {
    common.platformEvidence = {
      distribution: 'app-store',
      teamId: 'SYNTHETIC_TEAM_ID',
      appAttestEntitlement: 'production',
      getTaskAllow: false,
      signingChainVerified: false,
      appAttestServerVerified: false,
    };
  } else refuse('UNKNOWN_FIXTURE_PLATFORM');
  return common;
}
function main(argv = process.argv.slice(2)) {
  const options = new Set(['--json', '--synthetic-smoke', '--require-production']);
  if (argv.length !== new Set(argv).size || argv.some(x => !options.has(x))) {
    refuse('UNKNOWN_OR_REPEATED_CLI_ARGUMENT');
  }
  if (argv.includes('--synthetic-smoke')) {
    for (const platform of ['android', 'ios']) {
      const result = assessSyntheticEvidence(fixture(platform));
      exact(result.signingReleaseAdmission, 'NO_GO', 'FIXTURE_PRODUCTION_ESCALATION');
      console.log('B6_SYNTHETIC_' + platform.toUpperCase() + '_SCHEMA=PASS;PRODUCTION=NO_GO');
    }
  }
  const status = {
    sourceCheckpoint: CHECKPOINT,
    trustedProductionArtifactProvided: false,
    signedAabVerified: false,
    signedIpaVerified: false,
    deviceProviderVerifierProvisioned: false,
    productionAdmission: 'NO_GO',
    financeLive: 'OFF',
    settlement: 'OFF',
    payout: 'OFF',
    mainMerge: 'NONE',
  };
  if (argv.includes('--json')) console.log(JSON.stringify(status));
  if (argv.includes('--require-production')) {
    console.error('OP_B6_SIGNED_RELEASE_ADMISSION=NO_GO:REAL_BINARY_AND_PROVIDER_PROOF_ABSENT');
    return 3;
  }
  console.log('OP_B6_SYNTHETIC_PROVENANCE_ONLY=PASS;SIGNED_RELEASE=NO_GO');
  return 0;
}
if (require.main === module) {
  try { process.exitCode = main(); }
  catch (error) {
    console.error('OP_B6_SYNTHETIC_GATE=FAIL:' + error.message);
    process.exitCode = 1;
  }
}
module.exports = {assessSyntheticEvidence, fixture, main, CHECKPOINT, APP_ID};
