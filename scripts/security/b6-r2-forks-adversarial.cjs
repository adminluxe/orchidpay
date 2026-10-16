'use strict';
// B6-R2 independent QA only. No runtime import path, no production side effects.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const upstreamTestSha = '5079066b184c54f17d1dd6b286eb62a0330f91af94124b0f7a5786dc69a9be68';
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function requirePackages() {
  const oldRoot = process.env.B6_R2_ORIGINAL_ROOT;
  const patchRoot = process.env.B6_R2_PATCHED_ROOT || path.join(root, 'node_modules');
  assert(oldRoot && path.isAbsolute(oldRoot), 'B6_R2_ORIGINAL_ROOT missing');
  assert.notEqual(fs.realpathSync(oldRoot), fs.realpathSync(patchRoot), 'Original and candidate cannot share a root');
  function checked(location, name, version) {
    const file = path.join(location, name, 'package.json');
    const meta = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.equal(meta.name, name); assert.equal(meta.version, version);
    return require(path.join(location, name));
  }
  global.window = global.window || { crypto: crypto.webcrypto };
  global.jQuery = global.jQuery || {}; // browser-only all.bundle initialization shim; no DOM attestation
  const originalBraces = checked(oldRoot, 'braces', '3.0.3');
  const patchedBraces = checked(patchRoot, 'braces', '3.0.4-orchidpay.1');
  const originalForge = checked(oldRoot, 'node-forge', '1.4.0');
  const patchedForge = checked(patchRoot, 'node-forge', '1.4.1-orchidpay.1');
  const bundles = {
    'lib': patchedForge,
    'forge.min.js': require(path.join(patchRoot, 'node-forge', 'dist', 'forge.min.js')),
    'forge.all.min.js': require(path.join(patchRoot, 'node-forge', 'dist', 'forge.all.min.js'))
  };
  return { originalBraces, patchedBraces, originalForge, patchedForge, bundles };
}
function extractQuotedHex(snippet) {
  const arr = [...snippet.matchAll(/'([0-9a-fA-F]+)'/g)].map(x => x[1]);
  assert(arr.length >= 1, 'hex source extraction failed');
  return arr.join('');
}
function getPinnedForgeryVector() {
  const file = process.env.B6_R2_FORGE_UPSTREAM_TEST;
  assert(file && path.isAbsolute(file), 'B6_R2_FORGE_UPSTREAM_TEST not set');
  const raw = fs.readFileSync(file);
  assert.equal(sha256(raw), upstreamTestSha, 'upstream RSA fixture SHA drift');
  const src = raw.toString('utf8');
  const nMatch = src.match(/var N = new JSBN\.BigInteger\(\s*([\s\S]*?),\s*16\s*\)/);
  assert(nMatch, 'missing public modulus in pinned upstream RSA tests');
  const anchor = "it('should check nested DigestAlgorithm element count'";
  const start = src.indexOf(anchor);
  assert(start > 0, 'missing CVE-2026-85393 upstream test');
  const section = src.slice(start, src.indexOf('_checkBadDigestInfo(publicKey, S)', start));
  const sigMatch = section.match(/var S = UTIL\.binary\.hex\.decode\(\s*([\s\S]*?)\s*\)/);
  assert(sigMatch, 'missing upstream signature fixture');
  const modulusHex = extractQuotedHex(nMatch[1]);
  const signatureHex = extractQuotedHex(sigMatch[1]);
  assert.equal(signatureHex.length, 512, 'upstream RSA signature length changed');
  return { modulusHex, signature: Buffer.from(signatureHex, 'hex') };
}
function verifyUpstreamForgery(lib, vector) {
  const n = new lib.jsbn.BigInteger(vector.modulusHex, 16);
  const e = new lib.jsbn.BigInteger('3');
  const pub = lib.pki.rsa.setPublicKey(n, e);
  const md = lib.md.sha256.create();
  md.update('hello world!');
  // Internal flag strictly isolates DigestInfo validation in an upstream regression.
  return pub.verify(md.digest().getBytes(), vector.signature.toString('binary'), undefined, {
    _parseAllDigestBytes: true, _skipPaddingChecks: true
  });
}
function makeDigestInfo(lib, digestBytes, variant) {
  const a = lib.asn1, U = a.Class.UNIVERSAL, T = a.Type;
  const node = (t, built, value) => a.create(U, t, built, value);
  const oid = variant === 'unknown-oid' ? '1.2.3.4' : '2.16.840.1.101.3.4.2.1';
  const algChildren = [node(T.OID, false, a.oidToDer(oid).getBytes())];
  if (variant !== 'no-null') algChildren.push(node(T.NULL, false, ''));
  if (variant === 'extra-alg') algChildren.push(node(T.OCTETSTRING, false, 'garbage'));
  if (variant === 'extra-alg2') algChildren.push(node(T.INTEGER, false, String.fromCharCode(1)));
  const alg = node(T.SEQUENCE, true, algChildren);
  const digest = variant === 'wrong-digest' ? 'x'.repeat(32) : digestBytes;
  const outer = [alg, node(T.OCTETSTRING, false, digest)];
  if (variant === 'extra-outer') outer.push(node(T.NULL, false, ''));
  let result = a.toDer(node(T.SEQUENCE, true, outer)).getBytes();
  if (variant === 'trailing-der') result += String.fromCharCode(0);
  return result;
}
function signRawDer(der, privatePem, size) {
  const content = Buffer.from(der, 'binary');
  assert(content.length < size - 11, 'DER too large for RSA specimen');
  const pad = Buffer.alloc(size - 3 - content.length, 0xff);
  const em = Buffer.concat([Buffer.from([0x00, 0x01]), pad, Buffer.from([0x00]), content]);
  return crypto.privateEncrypt({ key: privatePem, padding: crypto.constants.RSA_NO_PADDING }, em).toString('binary');
}
function verifySignature(lib, publicPem, payload, signature, options) {
  const pub = lib.pki.publicKeyFromPem(publicPem);
  const md = lib.md.sha256.create();
  md.update(payload, 'utf8');
  return pub.verify(md.digest().getBytes(), signature, undefined, options);
}
function mustRejectVerification(lib, publicPem, payload, signature) {
  try { assert.notEqual(verifySignature(lib, publicPem, payload, signature), true); }
  catch (error) {
    if (error?.code === 'ERR_ASSERTION') throw error;
    return true;
  }
  return true;
}
module.exports = {
  sha256, root, requirePackages, getPinnedForgeryVector, verifyUpstreamForgery,
  makeDigestInfo, signRawDer, verifySignature, mustRejectVerification
};