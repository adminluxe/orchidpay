'use strict';
// Explicitly disposable CI/lab only. Not imported by OrchidPay runtime.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const {
  requirePackages, getPinnedForgeryVector, verifyUpstreamForgery,
  makeDigestInfo, signRawDer, verifySignature, mustRejectVerification
} = require('./b6-r2-forks-adversarial.cjs');
const { originalBraces: oldB, patchedBraces: newB, originalForge: oldF, bundles } = requirePackages();

test('BR-01: vulnerable 3.0.3 accepts 101 nesting levels (bounded specimen)', {timeout: 15000}, () => {
  const pattern = '{'.repeat(101) + 'a,b' + '}'.repeat(101);
  assert.doesNotThrow(() => oldB.parse(pattern));
});
test('BR-02: patched braces rejects same bounded specimen', {timeout: 15000}, () => {
  assert.throws(() => newB.parse('{'.repeat(101) + 'a,b' + '}'.repeat(101)), /exceeds max depth/);
});
test('BR-03: nesting 100/101, parentheses, maxDepth/Length and fractional bounds', {timeout: 15000}, () => {
  assert.doesNotThrow(() => newB.parse('{'.repeat(100) + 'a,b' + '}'.repeat(100)));
  assert.throws(() => newB.parse('('.repeat(101) + 'a' + ')'.repeat(101)), /exceeds max depth/);
  assert.doesNotThrow(() => newB.parse('('.repeat(100) + 'a' + ')'.repeat(100)));
  assert.throws(() => newB.parse('{{a,b},c}', {maxDepth: 1}), /exceeds max depth/);
  assert.doesNotThrow(() => newB.parse('{{a,b},c}', {maxDepth: 2}));
  assert.throws(() => newB.parse('{{a,b},c}', {maxDepth: 1.5}), /exceeds max depth/);
  assert.throws(() => newB.parse('a'.repeat(25), {maxLength: 20}), /exceeds max characters/);
  assert.throws(() => newB.parse('{'.repeat(101) + 'a,b' + '}'.repeat(101), {maxDepth: 1000}), /exceeds max depth/);
});
test('BR-04: synthetic cyclic AST and malformed inputs remain bounded', {timeout: 15000}, () => {
  const root = { type: 'paren', nodes: [{type:'text', value:'a'}] };
  root.parent = root;
  assert.throws(() => newB.expand(root), /parent chain contains a cycle/);
  let nested = {type:'text', value:'x'};
  for(let i=0; i<101; i++) nested={type:'brace', nodes:[nested]};
  const ast={type:'root', nodes:[nested]};
  assert.throws(() => newB.compile(ast), /exceeds max depth/);
  assert.throws(() => newB.stringify(ast), /exceeds max depth/);
  assert.throws(() => newB.expand(ast), /exceeds max depth/);
  for(const str of ['{', '{{a', '((a', '}', 'a{,', 'a}z', 'x\\{y,z']) {
    const parsed=newB.parse(str);
    assert.equal(typeof newB.stringify(parsed), 'string');
  }
});
test('BR-05: ordinary expansion, parse/compile/stringify parity vs original', {timeout: 15000}, () => {
  const cases=['a{b,c}z','file-{1..3}.txt','{red,blue}/x','plain','x/{a,b}/y','a{b,c}{1,2}'];
  for(const str of cases) {
    assert.deepEqual(newB.expand(str), oldB.expand(str), str);
    const oldAst=oldB.parse(str), newAst=newB.parse(str);
    assert.equal(newB.compile(newAst), oldB.compile(oldAst), 'compile:'+str);
    assert.equal(newB.stringify(newAst), oldB.stringify(oldAst), 'stringify:'+str);
  }
});
test('BR-06: deterministic 240-case bounded fuzz corpus, zero unexplained divergence', {timeout: 20000}, () => {
  let state=0x6b6f7263;
  function rand(){state^=state<<13;state^=state>>>17;state^=state<<5;return state>>>0;}
  for(let i=0;i<240;i++) {
    const count=(rand()%4)+1;
    let p='test';
    for(let j=0;j<count;j++) p+='{'+String.fromCharCode(97+rand()%26)+','+String.fromCharCode(97+rand()%26)+'}';
    assert(p.length<80); 
    assert.deepEqual(newB.expand(p), oldB.expand(p), 'case='+i);
    assert.equal(newB.compile(newB.parse(p)), oldB.compile(oldB.parse(p)), 'case='+i);
  }
});
const vector = getPinnedForgeryVector();
test('FORGE-01: official 1.4.0 negative-control structural acceptance', {timeout: 15000}, () => {
  assert.equal(verifyUpstreamForgery(oldF, vector), true);
});
for(const [name, lib] of Object.entries(bundles)) {
  test('FORGE-02/05: reject pinned forged DigestAlgorithm signature in '+name, {timeout: 15000}, () => {
    assert.throws(() => verifyUpstreamForgery(lib, vector), /DigestInfo/);
  });
}
const keys2048=crypto.generateKeyPairSync('rsa', {modulusLength:2048,
  publicKeyEncoding:{type:'pkcs1',format:'pem'}, privateKeyEncoding:{type:'pkcs1',format:'pem'}});
test('FORGE-03: extra ASN.1 children, OID, digest and trailing bytes rejected', {timeout: 20000}, () => {
  const forge=bundles.lib;
  const payload='OP-B6-R2-SYNTHETIC-ONLY';
  const md=forge.md.sha256.create(); md.update(payload,'utf8');
  const dg=md.digest().getBytes();
  for(const variant of ['extra-alg','extra-alg2','extra-outer','trailing-der','unknown-oid','wrong-digest']) {
    const der=makeDigestInfo(forge, dg, variant);
    const signature=signRawDer(der, keys2048.privateKey, 256);
    for(const [name,lib] of Object.entries(bundles)) {
      assert(mustRejectVerification(lib, keys2048.publicKey, payload, signature), name+':'+variant);
    }
  }
});
test('FORGE-04/05: valid RSA-2048 and RSA-4096 SHA-256 on lib and both dist bundles', {timeout: 90000}, () => {
  const keys4096=crypto.generateKeyPairSync('rsa',{modulusLength:4096,
    publicKeyEncoding:{type:'pkcs1',format:'pem'}, privateKeyEncoding:{type:'pkcs1',format:'pem'}});
  for(const [bits,keys] of [[2048,keys2048],[4096,keys4096]]) {
    const payload='ORCHIDPAY_B6R2_VALID_RSA_'+bits;
    const nodeSig=crypto.sign('sha256', Buffer.from(payload), keys.privateKey).toString('binary');
    const md=bundles.lib.md.sha256.create();md.update(payload,'utf8');
    const jsSig=bundles.lib.pki.privateKeyFromPem(keys.privateKey).sign(md);
    for(const [name,lib] of Object.entries(bundles)) {
      assert.equal(verifySignature(lib, keys.publicKey, payload, nodeSig),true,name+bits);
      assert(mustRejectVerification(lib, keys.publicKey, payload+'changed', nodeSig), name+' tamper '+bits);
      assert.equal(verifySignature(lib, keys.publicKey, payload, jsSig),true,name+' forge-lib-js-sign '+bits);
    }
  }
});
test('FORGE-04: RSA-PSS positive/negative using public APIs where available', {timeout: 30000}, t => {
  const lib=bundles.lib;
  if (!lib.pss?.create || !lib.mgf?.mgf1?.create) { t.skip('node-forge PSS API not exposed'); return; }
  const createPss=()=>lib.pss.create({
    md:lib.md.sha256.create(), mgf:lib.mgf.mgf1.create(lib.md.sha256.create()), saltLength:32
  });
  const md=lib.md.sha256.create();md.update('B6-R2-PSS','utf8');
  const sig=lib.pki.privateKeyFromPem(keys2048.privateKey).sign(md,createPss());
  const publicKey=lib.pki.publicKeyFromPem(keys2048.publicKey);
  assert.equal(publicKey.verify(md.digest().getBytes(),sig,createPss()),true);
  const tampered=lib.md.sha256.create();tampered.update('B6-R2-PSS-TAMPER','utf8');
  assert.notEqual(publicKey.verify(tampered.digest().getBytes(),sig,createPss()),true);
});