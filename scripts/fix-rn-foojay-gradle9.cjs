#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const EXPECTED_PLUGIN_VERSION = '0.83.10';
const FROM = 'plugins { id("org.gradle.toolchains.foojay-resolver-convention").version("0.5.0") }';
const TO = 'plugins { id("org.gradle.toolchains.foojay-resolver-convention").version("1.0.0") }';
const checkOnly = process.argv.includes('--check');
const easPlatform = process.env.EAS_BUILD_PLATFORM || '';

function fail(message) {
  console.error('RN_FOOJAY_GRADLE9_PATCH=FAIL ' + message);
  process.exit(1);
}

if (easPlatform && easPlatform !== 'android') {
  console.log('RN_FOOJAY_GRADLE9_PATCH=SKIP_NON_ANDROID platform=' + easPlatform);
  process.exit(0);
}

const root = process.cwd();
const pkgPath = path.join(root, 'node_modules', '@react-native', 'gradle-plugin', 'package.json');
const settingsPath = path.join(root, 'node_modules', '@react-native', 'gradle-plugin', 'settings.gradle.kts');

if (!fs.existsSync(pkgPath) || !fs.existsSync(settingsPath)) {
  fail('react-native gradle plugin files missing');
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
if (pkg.version !== EXPECTED_PLUGIN_VERSION) {
  fail('unexpected @react-native/gradle-plugin version ' + pkg.version + ' expected ' + EXPECTED_PLUGIN_VERSION);
}

let text = fs.readFileSync(settingsPath, 'utf8');
const fromCount = text.split(FROM).length - 1;
const toCount = text.split(TO).length - 1;

if (checkOnly) {
  if (fromCount !== 0 || toCount !== 1) {
    fail('check expected exactly foojay 1.0.0 and no 0.5.0');
  }
  console.log('RN_GRADLE_PLUGIN_VERSION=' + pkg.version);
  console.log('FOOJAY_RESOLVER_VERSION=1.0.0');
  console.log('RN_FOOJAY_GRADLE9_PATCH=PASS');
  process.exit(0);
}

if (toCount === 1 && fromCount === 0) {
  console.log('RN_GRADLE_PLUGIN_VERSION=' + pkg.version);
  console.log('FOOJAY_RESOLVER_VERSION=1.0.0');
  console.log('RN_FOOJAY_GRADLE9_PATCH=ALREADY_APPLIED_PASS');
  process.exit(0);
}

if (fromCount !== 1 || toCount !== 0) {
  fail('unexpected foojay declaration state from=' + fromCount + ' to=' + toCount);
}

text = text.replace(FROM, TO);
fs.writeFileSync(settingsPath, text, 'utf8');

const verify = fs.readFileSync(settingsPath, 'utf8');
if ((verify.split(FROM).length - 1) !== 0 || (verify.split(TO).length - 1) !== 1) {
  fail('post-write verification failed');
}

console.log('RN_GRADLE_PLUGIN_VERSION=' + pkg.version);
console.log('FOOJAY_RESOLVER_VERSION=1.0.0');
console.log('RN_FOOJAY_GRADLE9_PATCH=APPLIED_PASS');
