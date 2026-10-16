'use strict';

const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const {withAndroidManifest, withDangerousMod} = require('@expo/config-plugins');

const FULL_BACKUP_XML = [
  '<?xml version="1.0" encoding="utf-8"?>',
  '<full-backup-content>',
  '  <exclude domain="root" path="." />',
  '</full-backup-content>',
  ''
].join('\n');

const EXTRACTION_XML = [
  '<?xml version="1.0" encoding="utf-8"?>',
  '<data-extraction-rules>',
  '  <cloud-backup disableIfNoEncryptionCapabilities="true">',
  '    <exclude domain="root" path="." />',
  '  </cloud-backup>',
  '  <device-transfer>',
  '    <exclude domain="root" path="." />',
  '  </device-transfer>',
  '</data-extraction-rules>',
  ''
].join('\n');


// Expo 55.0.31's development and debugOptimized manifest overlays
// re-add SYSTEM_ALERT_WINDOW at higher merge priority than app/src/main.
// Fail-closed exact-template pin; never mask a blocked compiled permission.
const ORIGINAL_DEV_MANIFEST_SHA256 = 'fb1795032c764d975376e1612ab7022058eca2268a45efbe731a47a5d3ac0f60';
const SECURED_DEV_MANIFEST_SHA256 = '8c267f6c625e2f346bc73c1f96ec480e5fee51872e9272dee3a14a24164270f8';
const OVERLAY_FORBIDDEN_LINE = '    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>\n';

function stripDevelopmentOverlayPermission(androidRoot, variant) {
  if (!['debug', 'debugOptimized'].includes(variant)) {
    throw new Error('ORCHIDPAY_UNSUPPORTED_ANDROID_VARIANT');
  }
  const file = path.join(androidRoot, 'app', 'src', variant, 'AndroidManifest.xml');
  if (!fs.statSync(file).isFile() || fs.lstatSync(file).isSymbolicLink()) {
    throw new Error('ORCHIDPAY_DEBUG_MANIFEST_TYPE_INVALID:' + variant);
  }
  const before = fs.readFileSync(file);
  const digest = value => crypto.createHash('sha256').update(value).digest('hex');
  const originalHash = digest(before);
  if (originalHash === SECURED_DEV_MANIFEST_SHA256) {
    return; // explicitly idempotent, without weakening template checks.
  }
  if (originalHash !== ORIGINAL_DEV_MANIFEST_SHA256) {
    throw new Error('ORCHIDPAY_DEBUG_TEMPLATE_DRIFT:' + variant);
  }
  const marker = Buffer.from(OVERLAY_FORBIDDEN_LINE, 'utf8');
  const where = before.indexOf(marker);
  if (where === -1 || before.indexOf(marker, where + marker.length) !== -1) {
    throw new Error('ORCHIDPAY_UNEXPECTED_DEBUG_OVERLAY_PERMISSION_COUNT:' + variant);
  }
  const fixed = Buffer.concat([before.subarray(0, where), before.subarray(where + marker.length)]);
  if (digest(fixed) !== SECURED_DEV_MANIFEST_SHA256) {
    throw new Error('ORCHIDPAY_DEBUG_OVERLAY_PATCH_SHA_MISMATCH:' + variant);
  }
  fs.writeFileSync(file, fixed, {mode: 0o644});
}

module.exports = function withOrchidPayNoBackup(config) {
  config = withAndroidManifest(config, value => {
    const apps = value.modResults.manifest.application;
    if (!Array.isArray(apps) || apps.length !== 1 || !apps[0].$) {
      throw new Error('ORCHIDPAY_ANDROID_MANIFEST_APPLICATION_SHAPE_CHANGED');
    }
    const attrs = apps[0].$;
    attrs['android:allowBackup'] = 'false';
    attrs['android:fullBackupContent'] = '@xml/orchidpay_no_backup';
    attrs['android:dataExtractionRules'] = '@xml/orchidpay_no_data_extraction';
    return value;
  });

  return withDangerousMod(config, ['android', async value => {
    const dir = path.join(value.modRequest.platformProjectRoot,'app','src','main','res','xml');
    fs.mkdirSync(dir, {recursive: true, mode: 0o755});
    for (const [name, data] of [
      ['orchidpay_no_backup.xml', FULL_BACKUP_XML],
      ['orchidpay_no_data_extraction.xml', EXTRACTION_XML],
    ]) {
      const dest = path.join(dir, name);
      fs.writeFileSync(dest, data, {encoding: 'utf8', mode: 0o644});
    }

    // High-priority debug manifests must never restore a blocked permission.
    for (const variant of ['debug', 'debugOptimized']) {
      stripDevelopmentOverlayPermission(value.modRequest.platformProjectRoot, variant);
    }

    // Supply-chain pin for the official Gradle 9.0.0 distribution and wrapper
    // shipped by the SHA512-pinned Expo 55.0.31 bare template.
    const wrapper = path.join(value.modRequest.platformProjectRoot,
      'gradle', 'wrapper', 'gradle-wrapper.properties');
    const jar = path.join(value.modRequest.platformProjectRoot,
      'gradle', 'wrapper', 'gradle-wrapper.jar');
    const expectedURL = 'distributionUrl=https\\://services.gradle.org/distributions/gradle-9.0.0-bin.zip';
    const expectedSHA = '8fad3d78296ca518113f3d29016617c7f9367dc005f932bd9d93bf45ba46072b';
    const expectedJar = '76805e32c009c0cf0dd5d206bddc9fb22ea42e84db904b764f3047de095493f3';
    const lines = fs.readFileSync(wrapper, 'utf8').split(/\r?\n/);
    const urls = lines.filter(line => line.startsWith('distributionUrl='));
    if (urls.length !== 1 || urls[0] !== expectedURL) {
      throw new Error('ORCHIDPAY_UNEXPECTED_GRADLE_DISTRIBUTION');
    }
    const jarSha = crypto.createHash('sha256').update(fs.readFileSync(jar)).digest('hex');
    if (jarSha !== expectedJar) {
      throw new Error('ORCHIDPAY_GRADLE_WRAPPER_JAR_SHA256_MISMATCH');
    }
    const existing = lines.filter(line => line.startsWith('distributionSha256Sum='));
    const expectedLine = 'distributionSha256Sum=' + expectedSHA;
    if (existing.length > 1 || (existing.length === 1 && existing[0] !== expectedLine)) {
      throw new Error('ORCHIDPAY_GRADLE_DISTRIBUTION_SHA256_MISMATCH');
    }
    if (existing.length === 0) {
      fs.appendFileSync(wrapper, '\n' + expectedLine + '\n', 'utf8');
    }
    return value;
  }]);
};

// Pure build-side helper for isolated, dependency-free adversarial tests.
module.exports.testStripDevelopmentOverlayPermission = stripDevelopmentOverlayPermission;
