'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const plugin = require('../../plugins/withOrchidPayNoBackup.cjs');
const strip = plugin.testStripDevelopmentOverlayPermission;
const pristine = [
  '<manifest xmlns:android="http://schemas.android.com/apk/res/android"',
  '    xmlns:tools="http://schemas.android.com/tools">',
  '',
  '    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>',
  '',
  '    <application android:usesCleartextTraffic="true" tools:targetApi="28" tools:ignore="GoogleAppIndexingWarning" tools:replace="android:usesCleartextTraffic" />',
  '</manifest>',
  ''
].join('\n');
const sha = x => crypto.createHash('sha256').update(x).digest('hex');
const PRISTINE = 'fb1795032c764d975376e1612ab7022058eca2268a45efbe731a47a5d3ac0f60';
const SECURED = '8c267f6c625e2f346bc73c1f96ec480e5fee51872e9272dee3a14a24164270f8';
assert.equal(sha(pristine),PRISTINE,'EXPO_TEMPLATE_FIXTURE_MISMATCH');
assert.equal(typeof strip,'function');

function withFixture(callback) {
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'op-debug-overlay-'));
  try {
    const locations={};
    for(const variant of ['debug','debugOptimized']){
      const dir=path.join(tmp,'app','src',variant);
      fs.mkdirSync(dir,{recursive:true,mode:0o700});
      const file=path.join(dir,'AndroidManifest.xml');
      fs.writeFileSync(file,pristine);
      locations[variant]=file;
    }
    callback(tmp,locations);
  } finally {
    fs.rmSync(tmp,{recursive:true,force:true});
  }
}

test('removes a forbidden high-priority debug permission in both variants',()=>withFixture((base,loc)=>{
  for (const variant of ['debug','debugOptimized']){
    strip(base,variant);
    const text=fs.readFileSync(loc[variant]);
    assert.equal(sha(text),SECURED);
    assert(!text.includes(Buffer.from('android.permission.SYSTEM_ALERT_WINDOW')));
  }
}));

test('running twice is explicitly idempotent and preserves the fixed SHA',()=>withFixture((base,loc)=>{
  strip(base,'debug');
  const first=fs.readFileSync(loc.debug);
  strip(base,'debug');
  assert.deepEqual(fs.readFileSync(loc.debug),first);
}));

test('modified template permission or arbitrary extra policy rejects before mutation',()=>withFixture((base,loc)=>{
  const mutated=pristine.replace('android:usesCleartextTraffic="true"','android:usesCleartextTraffic="false"');
  fs.writeFileSync(loc.debug,mutated);
  assert.throws(()=>strip(base,'debug'),/ORCHIDPAY_DEBUG_TEMPLATE_DRIFT/);
  assert.equal(fs.readFileSync(loc.debug,'utf8'),mutated);
}));

test('missing debugOptimized overlay fails closed',()=>withFixture((base,loc)=>{
  fs.unlinkSync(loc.debugOptimized);
  assert.throws(()=>strip(base,'debugOptimized'));
}));

test('symlinked debug manifest is rejected',()=>withFixture((base,loc)=>{
  const target=loc.debug;
  fs.unlinkSync(target);
  const real=path.join(base,'trusted-copy');
  fs.writeFileSync(real,pristine);
  fs.symlinkSync(real,target);
  assert.throws(()=>strip(base,'debug'),/ORCHIDPAY_DEBUG_MANIFEST_TYPE_INVALID/);
}));

test('unknown manifest variant is rejected',()=>withFixture((base)=>{
  assert.throws(()=>strip(base,'release'),/ORCHIDPAY_UNSUPPORTED_ANDROID_VARIANT/);
}));

console.log('ORCHIDPAY_HIGH_PRIORITY_ANDROID_PERMISSION_PLUGIN_SELFTEST_READY');
