'use strict';
/**
 * OrchidPay source-side release admission boundary.
 *
 * This proves only that the repository STILL REFUSES production admission.
 * It NEVER accepts a signed AAB/IPA, an attestation, or a PSP settlement.
 * --require-production MUST exit 3 until independent, hardware-backed
 * release verification is implemented as a separate reviewed trust boundary.
 */
const fs = require('node:fs');
const path = require('node:path');

const APP_ID = 'com.delishafrica.orchidpaymobile';
const POLICY_FIELDS = Object.freeze([
  ['src/security/deviceAttestationContract.ts', 'deviceAttestationPolicy', {
    productionVerifierProvisioned: false,
    providerTrustRootsProvisioned: false,
    challengeServiceProvisioned: false,
    networkExecutionEnabled: false,
    strongDeviceAttestationClaim: false,
  }],
  ['src/security/releaseReadinessGate.ts', 'releaseReadinessPolicy', {
    serverVerifierProvisioned: false,
    deviceVerifierProvisioned: false,
    serverLedgerProvisioned: false,
    trustedServerClockProvisioned: false,
    productionTrustAnchorProvisioned: false,
    networkExecutionEnabled: false,
    livePaymentExecutionEnabled: false,
    settlementEnabled: false,
    productionReleaseClaim: false,
  }],
  ['src/security/productionAdmissionShadowContract.ts', 'productionAdmissionPolicy', {
    productionAdmissionEnabled: false,
    productionReleaseClaim: false,
    networkExecutionEnabled: false,
    livePaymentExecutionEnabled: false,
    settlementEnabled: false,
  }],
  ['src/security/externalTrustReadinessGate.ts', 'externalTrustReadinessPolicy', {
    productionKmsProvisioned: false,
    serverVerifierProvisioned: false,
    providerTrustRootsProvisioned: false,
    serverReplayLedgerProvisioned: false,
    trustedServerClockProvisioned: false,
    networkExecutionEnabled: false,
    livePaymentExecutionEnabled: false,
    settlementEnabled: false,
    productionReleaseClaim: false,
  }],
  ['src/security/providerRootReviewContract.ts', 'providerRootReviewPolicy', {
    manufacturerRootCurrentTimeValid: false,
    stagingExceptionAccepted: true,
    productionProviderRootGateOpen: true,
    productionEligible: false,
    networkExecutionEnabled: false,
    livePaymentExecutionEnabled: false,
    settlementEnabled: false,
  }],
  ['src/security/stagingHsmP256Binding.ts', 'stagingHsmP256BindingPolicy', {
    manufacturerRootCurrentTimeValid: false,
    productionEligible: false,
    networkExecutionEnabled: false,
    livePaymentExecutionEnabled: false,
  }],
]);

function requireGate(ok, reason) {
  if (!ok) throw new Error('OP_RELEASE_SOURCE_GATE:' + reason);
}
function readFile(root, rel) {
  const source = path.resolve(root, rel);
  requireGate(source.startsWith(path.resolve(root) + path.sep), 'SOURCE_PATH_OUTSIDE_ROOT');
  const stat = fs.lstatSync(source);
  requireGate(stat.isFile() && !stat.isSymbolicLink(), 'SOURCE_NOT_REGULAR:' + rel);
  return fs.readFileSync(source, 'utf8');
}
function sourceBooleanPolicy(text, name, fields) {
  const re = new RegExp('export\\s+const\\s+' + name +
    '\\s*=\\s*Object\\.freeze\\(\\s*\\{([\\s\\S]*?)\\}\\s*\\)', 'g');
  const matches = [...text.matchAll(re)];
  requireGate(matches.length === 1, 'POLICY_DECLARATION_SHAPE:' + name);
  const body = matches[0][1];
  for (const [field, expected] of Object.entries(fields)) {
    const fieldRe = new RegExp('(?:^|,|\\n)\\s*' + field +
      '\\s*:\\s*(true|false)\\s+as\\s+const\\b', 'g');
    const found = [...body.matchAll(fieldRe)];
    requireGate(found.length === 1, 'POLICY_FIELD_MISSING_OR_DUPLICATE:' + name + ':' + field);
    requireGate((found[0][1] === 'true') === expected,
      'POLICY_PRODUCTION_FUSE_CHANGED:' + name + ':' + field);
  }
}
function inspect(root = process.cwd()) {
  const app = JSON.parse(readFile(root, 'app.json')).expo;
  const eas = JSON.parse(readFile(root, 'eas.json'));
  requireGate(app.ios.bundleIdentifier === APP_ID && app.android.package === APP_ID,
    'APPLICATION_IDENTIFIER_CHANGED');
  requireGate(Array.isArray(app.plugins) &&
    app.plugins.at(-1) === './plugins/withOrchidPayNoBackup.cjs',
    'FINAL_SECURITY_PLUGIN_MISSING');
  const blocked = new Set(app.android.blockedPermissions || []);
  for (const perm of [
    'android.permission.RECORD_AUDIO',
    'android.permission.SYSTEM_ALERT_WINDOW',
    'android.permission.READ_EXTERNAL_STORAGE',
    'android.permission.WRITE_EXTERNAL_STORAGE',
  ]) requireGate(blocked.has(perm), 'FORBIDDEN_ANDROID_PERMISSION_UNBLOCKED:' + perm);

  requireGate(eas.build?.production?.env?.ORCHIDPAY_APP_ATTEST_ENVIRONMENT === 'production',
    'EAS_PRODUCTION_APP_ATTEST_NOT_DECLARED');
  requireGate(eas.build?.development?.env?.ORCHIDPAY_APP_ATTEST_ENVIRONMENT === 'development' &&
    eas.build?.preview?.env?.ORCHIDPAY_APP_ATTEST_ENVIRONMENT === 'development',
    'EAS_DEVELOPMENT_SCOPE_DRIFT');
  requireGate(eas.build.production.android?.image === 'sdk-55',
    'ANDROID_RELEASE_IMAGE_UNEXPECTED');
  requireGate(eas.build.production.developmentClient !== true &&
    eas.build.production.distribution !== 'internal',
    'EAS_PRODUCTION_USES_DEVELOPMENT_SIGNING');

  for (const [filename, name, fields] of POLICY_FIELDS) {
    sourceBooleanPolicy(readFile(root, filename), name, fields);
  }
  const swift = readFile(root, 'modules/orchidpay-app-attest/ios/OrchidPayAppAttestModule.swift');
  const appAttestCalls = ['DCAppAttestService.shared', 'generateKey', 'attestKey', 'generateAssertion'];
  for (const call of appAttestCalls) {
    requireGate(swift.includes(call), 'IOS_APP_ATTEST_NATIVE_SOURCE_MISSING:' + call);
  }
  const jsBridge = readFile(root, 'modules/orchidpay-app-attest/src/OrchidPayAppAttestModule.ts');
  requireGate(jsBridge.includes('ORCHIDPAY_APP_ATTEST_NATIVE_MODULE_UNAVAILABLE'),
    'IOS_APP_ATTEST_MISSING_FAIL_CLOSED_BRIDGE');

  // Presence of Apple APIs or a "production" EAS profile is NOT a signed IPA,
  // not a server-side App Attest verifier, and NOT a release authorization.
  return Object.freeze({
    sourceGuard: 'PASS',
    compileAndBinary: 'NOT_ASSESSED_BY_THIS_SOURCE_GUARD',
    appleNativeModuleSource: 'PRESENT_NOT_HARDWARE_CERTIFIED',
    iosSignedProductionEntitlement: 'NOT_VERIFIED',
    androidSignedAab: 'NOT_VERIFIED',
    playIntegrityProduction: 'NOT_VERIFIED',
    appAttestServerVerifier: 'NOT_PROVISIONED_IN_CURRENT_CONTRACT',
    pspSandboxFinancialReconciliation: 'NOT_VERIFIED',
    productionAdmission: 'NO_GO',
    financeLive: 'OFF',
    settlement: 'OFF',
  });
}
function main(argv = process.argv.slice(2)) {
  const allowed = new Set(['--json', '--require-production']);
  requireGate(argv.every(arg => allowed.has(arg)), 'UNKNOWN_CLI_ARGUMENT');
  const status = inspect();
  if (argv.includes('--json')) console.log(JSON.stringify(status));
  else console.log('OP_PRE_RELEASE_SOURCE_SECURITY_FUSES=PASS');
  if (argv.includes('--require-production')) {
    console.error('OP_PRODUCTION_RELEASE_ADMISSION=NO_GO:SIGNED_ARTIFACTS_DEVICE_PROVIDER_AND_FINANCIAL_EVIDENCE_UNVERIFIED');
    return 3;
  }
  console.log('OP_SIGNED_STORE_RELEASE_AND_FINANCE_LIVE=NO_GO');
  return 0;
}
if (require.main === module) {
  try { process.exitCode = main(); }
  catch (err) {
    console.error('OP_PRE_RELEASE_SOURCE_SECURITY_FUSES=FAIL:' + err.message);
    process.exitCode = 1;
  }
}
module.exports = {inspect, main, sourceBooleanPolicy, POLICY_FIELDS};