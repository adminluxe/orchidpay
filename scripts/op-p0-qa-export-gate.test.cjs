'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {inspect,checkFuses}=require('./op-p0-qa-export-gate.cjs');
const MAGIC=Buffer.from('c61fbc03c103191f','hex');
function withExport(fn){
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'op-hermes-'));
 try{
  fs.mkdirSync(path.join(base,'_expo'));
  fs.writeFileSync(path.join(base,'metadata.json'),'{}');
  fs.writeFileSync(path.join(base,'_expo','index.hbc'),Buffer.concat([MAGIC,Buffer.from('PASS')]));
  fn(base);
 }finally{fs.rmSync(base,{recursive:true,force:true});}
}
test('accepts synthetic positive Hermes bundle',()=>withExport(d=>{const r=inspect('ios',d);assert.equal(r.hermes,1);assert.match(r.treeSha256,/^[a-f0-9]{64}$/);}));
test('rejects missing bundle',()=>withExport(d=>{fs.unlinkSync(path.join(d,'_expo','index.hbc'));assert.throws(()=>inspect('ios',d),/MISSING_HERMES/);}));
test('rejects fake Hermes magic',()=>withExport(d=>{fs.writeFileSync(path.join(d,'_expo','index.hbc'),'fake');assert.throws(()=>inspect('android',d),/BAD_HERMES_MAGIC/);}));
test('rejects historical synthetic signature',()=>withExport(d=>{fs.appendFileSync(path.join(d,'_expo','index.hbc'),'12 450');assert.throws(()=>inspect('ios',d),/B11_SIGNATURE/);}));
test('rejects exposed engineering signature',()=>withExport(d=>{fs.appendFileSync(path.join(d,'_expo','index.hbc'),'FAIL-CLOSED');assert.throws(()=>inspect('android',d),/B11_SIGNATURE/);}));
test('rejects symlink',()=>withExport(d=>{fs.symlinkSync(path.join(d,'metadata.json'),path.join(d,'link'));assert.throws(()=>inspect('ios',d),/SYMLINK/);}));
test('rejects corrupt metadata',()=>withExport(d=>{fs.writeFileSync(path.join(d,'metadata.json'),'{bad');assert.throws(()=>inspect('ios',d),SyntaxError);}));
test('rejects unknown platform',()=>withExport(d=>{assert.throws(()=>inspect('web',d),/BAD_PLATFORM/);}));
test('financial OFF policy is preserved in tracked code',()=>{assert.equal(checkFuses(path.resolve(__dirname,'..')),true);});

