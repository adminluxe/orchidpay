'use strict';
// Local parser-verification tests. Malformed signatures are made with disposable
// TEST private keys. This is not a claim of a keyless cryptographic forgery.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(process.env.B7_FIXTURE_ROOT);
assert(process.env.B7_FIXTURE_ROOT, 'B7_FIXTURE_ROOT missing');
const modules = {
  original: path.join(root,'variants/original-node-forge/lib/index.js'),
  b6: path.join(root,'variants/b6-forge/lib/index.js'),
  pr1159: path.join(root,'variants/forge1159/lib/index.js'),
  pr1160: path.join(root,'variants/forge1160/lib/index.js'),
};
if(process.env.B7_FORGE_EXTRA) Object.assign(modules, JSON.parse(process.env.B7_FORGE_EXTRA));
global.window = {crypto: crypto.webcrypto}; global.jQuery = {};
const vm = require('node:vm');
function loadVerifier(file) {
  if(!file.includes('/dist/')) return require(file);
  // Browser distribution is tested in its intended environment, without Node's
  // process/module/require detection. Real Node WebCrypto supplies secure entropy.
  // This is a VM browser-like harness, not a physical browser certification.
  const context={console, crypto:crypto.webcrypto, setTimeout, clearTimeout, setImmediate, clearImmediate, navigator:{userAgent:'OrchidPay-B7-VM-QA'}, jQuery:{}};
  context.window=context;context.self=context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file,timeout:10000});
  assert(context.forge && context.forge.pki, 'Browser bundle did not export forge');
  return context.forge;
}
const libs = Object.fromEntries(Object.entries(modules).map(([n,p])=>[n,loadVerifier(p)]));
const outcomes = [], errors=[];
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
function length(n, mode) {
  if(mode === 'overlong') return Buffer.from([0x82,0,n]);
  if(mode === 'long') return Buffer.from([0x81,n]);
  if(n < 128) return Buffer.from([n]);
  if(n < 256) return Buffer.from([0x81,n]);
  return Buffer.from([0x82,n >> 8,n & 255]);
}
function tlv(t,b,mode) { b=Buffer.from(b); return Buffer.concat([Buffer.from([t]),length(b.length,mode),b]); }
const concat = xs => Buffer.concat(xs);
const OIDS={sha1:'2b0e03021a',sha256:'608648016503040201',sha384:'608648016503040202',sha512:'608648016503040203'};
function di(algorithm,digest,v='canonical') {
  const oid = tlv(6,Buffer.from(v==='unknown-oid'?'2a0304':OIDS[algorithm],'hex'), v==='oid-long'?'long':undefined);
  let params = v==='no-null' ? Buffer.alloc(0) : tlv(v==='integer-param'?2:5,v==='null-content'?Buffer.alloc(100,0x58):v==='integer-param'?Buffer.from([1]):Buffer.alloc(0),v==='null-long'?'long':undefined);
  if(v==='constructed-null') params=tlv(0x25,Buffer.alloc(0));
  let inner=concat([oid,params]);
  if(v==='extra-inner') inner=concat([inner,tlv(4,Buffer.from('extra'))]);
  let octet=tlv(4,digest,v==='digest-long'?'long':undefined);
  if(v==='constructed-octet') octet=tlv(0x24,tlv(4,digest));
  let outer=concat([tlv(0x30,inner,v==='inner-long'?'long':v==='inner-overlong'?'overlong':undefined),octet]);
  if(v==='extra-outer') outer=concat([outer,tlv(5,Buffer.alloc(0))]);
  let der=tlv(0x30,outer,v==='outer-long'?'long':v==='outer-overlong'?'overlong':undefined);
  if(v==='trailing') der=concat([der,Buffer.from([0])]);
  if(v==='indefinite-outer') der=concat([Buffer.from([0x30,0x80]),outer,Buffer.from([0,0])]);
  if(v==='truncated') der=der.subarray(0,der.length-1);
  return der;
}
function signRaw(der,key,bits,mutation) {
  const size=bits/8; assert(der.length<=size-11);
  const em=concat([Buffer.from([0,1]),Buffer.alloc(size-der.length-3,255),Buffer.from([0]),der]);
  if(mutation==='wrong-padding-byte') em[8]=254;
  if(mutation==='wrong-block-type') em[1]=2;
  return crypto.privateEncrypt({key,padding:crypto.constants.RSA_NO_PADDING},em);
}
function verify(lib,pem,digest,sig,opts) {
  try { return {accept:lib.pki.publicKeyFromPem(pem).verify(digest.toString('binary'),sig.toString('binary'),undefined,opts)===true}; }
  catch(e) { return {accept:false,error:e.name+': '+e.message}; }
}
function record(label, info, digest, sig, pair, expectCandidate, baselineRequirement) {
  const r={label,...info,results:{}};
  for(const [name,lib] of Object.entries(libs)) {
    const result=verify(lib,pair.publicKey,digest,sig);
    r.results[name]=result;
    if(!['original','b6'].includes(name) && result.accept!==expectCandidate) errors.push(label+' '+name+' unexpected '+JSON.stringify(result));
    if(baselineRequirement && name==='b6' && result.accept!==baselineRequirement.accept) errors.push(label+' baseline expectation not reproduced');
  }
  outcomes.push(r);
}
for(const [bits,exponent] of [[2048,3],[2048,65537],[3072,65537]]) {
  const pair=crypto.generateKeyPairSync('rsa',{modulusLength:bits,publicExponent:exponent,publicKeyEncoding:{type:'pkcs1',format:'pem'},privateKeyEncoding:{type:'pkcs1',format:'pem'}});
  const payload=Buffer.from('ORCHIDPAY B7 controlled DER verification fixture '+bits+'/'+exponent);
  for(const algorithm of ['sha1','sha256','sha384','sha512']) {
    console.log('RUNNING_RSA '+bits+'/'+exponent+'/'+algorithm);
    const digest=crypto.createHash(algorithm).update(payload).digest();
    const info={bits,exponent,algorithm,publicKeySha256:sha(pair.publicKey)};
    const stem=bits+'/'+exponent+'/'+algorithm+'/';
    const validSig=crypto.sign(algorithm,payload,pair.privateKey);
    record(stem+'openssl-valid',info,digest,validSig,pair,true);
    record(stem+'openssl-tamper',info,crypto.createHash(algorithm).update(Buffer.concat([payload,Buffer.from('altered')])).digest(),validSig,pair,false);
    for(const variant of ['canonical','no-null']) record(stem+variant,info,digest,signRaw(di(algorithm,digest,variant),pair.privateKey,bits),pair,true);
    const variants=['null-content','outer-long','inner-long','oid-long','null-long','digest-long','outer-overlong','inner-overlong','extra-inner','extra-outer','integer-param','constructed-null','constructed-octet','trailing','indefinite-outer','truncated'];
    for(const variant of variants) record(stem+variant,info,digest,signRaw(di(algorithm,digest,variant),pair.privateKey,bits),pair,false,
      ['null-content','outer-long','inner-long'].includes(variant)?{accept:true}:undefined);
    record(stem+'unknown-oid',info,digest,signRaw(di(algorithm,digest,'unknown-oid'),pair.privateKey,bits),pair,false);
    for(const variant of ['wrong-padding-byte','wrong-block-type']) record(stem+variant,info,digest,signRaw(di(algorithm,digest),pair.privateKey,bits,variant),pair,false);
    record(stem+'signature-truncated',info,digest,validSig.subarray(1),pair,false);
    record(stem+'signature-oversized',info,digest,Buffer.concat([validSig,Buffer.from([0])]),pair,false);
    // Interoperability of normal forge-produced signatures with OpenSSL.
    for(const [name,lib] of Object.entries(libs)) {
      const md=lib.md[algorithm].create(); md.update(payload.toString('binary'));
      const sig=lib.pki.privateKeyFromPem(pair.privateKey).sign(md);
      if(!crypto.verify(algorithm,payload,pair.publicKey,Buffer.from(sig,'binary'))) errors.push(stem+' forge-to-openssl '+name);
    }
  }
  const digest=crypto.createHash('sha256').update(payload).digest();
  // PSS is a separate scheme: ensure the PKCS1 v1.5 patch has no regression.
  const sig=crypto.sign('sha256',payload,{key:pair.privateKey,padding:crypto.constants.RSA_PKCS1_PSS_PADDING,saltLength:32});
  for(const [name,lib] of Object.entries(libs)) {
    const pss=lib.pss.create({md:lib.md.sha256.create(),mgf:lib.mgf.mgf1.create(lib.md.sha256.create()),saltLength:32});
    try {
      assert.equal(lib.pki.publicKeyFromPem(pair.publicKey).verify(digest.toString('binary'),sig.toString('binary'),pss),true);
      const bad=crypto.createHash('sha256').update('wrong').digest('binary');
      let accepted=false; try { accepted=lib.pki.publicKeyFromPem(pair.publicKey).verify(bad,sig.toString('binary'),pss)===true; } catch(_) {}
      assert.equal(accepted,false);
    } catch(e) { errors.push('PSS '+bits+'/'+exponent+' '+name+': '+e.message); }
  }
}
const report={suite:'B7_RSA_DER_DIFFERENTIAL_R1',scope:'Controlled test keys; no keyless-forgery claim; default public verifier flags; no live credentials',modules,
  testVectors:outcomes.length,verifierEvaluations:outcomes.length*Object.keys(libs).length,
  baselineNoncanonicalAcceptances:outcomes.filter(r=>r.results.b6.accept && !r.results.pr1160.accept).length,
  pr1159Vs1160Divergences:outcomes.filter(r=>r.results.pr1159.accept!==r.results.pr1160.accept).length,
  errors,results:outcomes,status:errors.length?'FAIL':'PASS_TARGETED_NOT_EXTERNAL_CERTIFICATION'};
const out=process.env.B7_REPORT || path.join(root,'evidence/RSA_DER_DIFFERENTIAL.json');
fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({suite:report.suite,vectors:report.testVectors,evaluations:report.verifierEvaluations,baselineAcceptedNoncanonical:report.baselineNoncanonicalAcceptances,challengerDivergences:report.pr1159Vs1160Divergences,errors,status:report.status},null,2));
process.exitCode=errors.length?1:0;
