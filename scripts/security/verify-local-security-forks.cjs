'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const expected={
 'vendor/orchidpay-security/braces-3.0.4-orchidpay.1.tgz':'d19e3433e7b06239810c6cf160223d57fd2a1a19f069157bad3f87205455c3d4',
 'vendor/orchidpay-security/node-forge-1.4.1-orchidpay.1.tgz':'1e7fb7aedaee21e02cad9993edc4202885d8be03a4d1acf6f53a47c52cef7ccb',
 'node_modules/braces/lib/parse.js':'b1bf766fba6a62035f78ecbda8a5fd94e921aa1c1ec0cdf3f467e9c836abed55',
 'node_modules/braces/lib/compile.js':'b651f7715e6db8942ce61d3394357b4d81c8ece88240aa31a458ea1165edd195',
 'node_modules/braces/lib/expand.js':'7ea3e14c2b2b256ef244fd3d83b8fcaa20aa2232b4e6d768c3bb6ab567f66cf5',
 'node_modules/braces/lib/stringify.js':'49dc2d8bafa74f34715a18a845bcb82ce66caaf3bab4cf117998e06b1f9a50a9',
 'node_modules/braces/lib/constants.js':'f9fb688959232eee3e6ad7906a5b0e3234815db49ee857ef86983d65b917dc7c',
 'node_modules/node-forge/lib/rsa.js':'acc22e5d36e27832c34e02dd3933aad7977d45b047eead5016520735efedc9c5',
 'node_modules/node-forge/dist/forge.min.js':'a1d374dddbfd38635e74c08bddcd55553f9b3e29fa4346ff8ac8cbfa2f21414f',
 'node_modules/node-forge/dist/forge.all.min.js':'baaad7f257463658489c2860eb83da1ab6bf6485557a94a8a5a97f935784a1bb',
 'node_modules/node-forge/dist/prime.worker.min.js':'877bd31b0cc79ecb9163649034fbafaeec45e8e2861fc4fa9fb11335f28c4ef9'
};
function read(file){
 const p=path.join(root,file);
 assert.equal(fs.lstatSync(p).isSymbolicLink(),false,'SYMLINK: '+file);
 return fs.readFileSync(p);
}
function digest(data,alg='sha256'){return crypto.createHash(alg).update(data).digest('hex');}
for(const [file,sha] of Object.entries(expected)){
 assert.equal(digest(read(file)),sha,'UNAUTHORIZED_SOURCE_DRIFT: '+file);
}
const manifest=JSON.parse(read('package.json'));
const lock=JSON.parse(read('package-lock.json'));
for(const [name,version,tar,commit,original] of [
 ['braces','3.0.4-orchidpay.1','braces-3.0.4-orchidpay.1.tgz','28d440b5dd449dbf1fe6f3506cf94ecca4d02660','3.0.3'],
 ['node-forge','1.4.1-orchidpay.1','node-forge-1.4.1-orchidpay.1.tgz','ceba34402e329f0365134f23fe19898756527d65','1.4.0']
]){
 const spec='file:vendor/orchidpay-security/'+tar;
 assert.equal(manifest.dependencies[name],spec);
 assert.equal(manifest.overrides[name],'$'+name);
 const matches=Object.entries(lock.packages).filter(([p])=>p==='node_modules/'+name||p.endsWith('/node_modules/'+name));
 assert.equal(matches.length,1,'DUPLICATE_OR_MISSING_FORK: '+name);
 const [location,entry]=matches[0];
 assert.equal(location,'node_modules/'+name);
 assert.equal(entry.version,version);
 assert.equal(entry.resolved,spec);
 const data=read('vendor/orchidpay-security/'+tar);
 assert.equal(entry.integrity,'sha512-'+crypto.createHash('sha512').update(data).digest('base64'));
 const installed=JSON.parse(read('node_modules/'+name+'/package.json'));
 assert.equal(installed.name,name);
 assert.equal(installed.version,version);
 assert.equal(installed.orchidpayPatchProvenance.upstreamPatchCommitSha,commit);
 assert.equal(installed.orchidpayPatchProvenance.upstreamPackageVersion,original);
 assert.equal(installed.orchidpayPatchProvenance.officialUpstreamRelease,false);
 assert.equal(installed.orchidpayPatchProvenance.candidateOnly,true);
 assert.equal(installed.orchidpayPatchProvenance.releaseApproved,false);
 assert(fs.statSync(path.join(root,'node_modules',name,'LICENSE')).size>50);
 console.log('PINNED_TARBALL_AND_SOURCE=PASS:'+name);
}
assert.equal(digest(read('package-lock.json')),'dffe18e1ed925dd91e94717e8908e1108a0f016f952db1c013cf82e930b892f4','LOCK_DRIFT');
const braces=require(path.join(root,'node_modules/braces'));
assert.deepEqual(braces.expand('a{b,c}z'),['abz','acz']);
assert.throws(()=>braces.parse('{'.repeat(101)+'a,b'+'}'.repeat(101)),/exceeds max depth/);
console.log('BRACES_PATCHED_DEPTH_AND_NORMAL_USE=PASS');
const forge=require(path.join(root,'node_modules/node-forge'));
global.window={crypto:crypto.webcrypto};
const bundle=require(path.join(root,'node_modules/node-forge/dist/forge.min.js'));
const key=crypto.generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'pkcs1',format:'pem'},privateKeyEncoding:{type:'pkcs1',format:'pem'}});
const payload='OrchidPay QA independently maintained patch';
let md=forge.md.sha256.create();md.update(payload,'utf8');
const signature=forge.pki.privateKeyFromPem(key.privateKey).sign(md);
for(const [name,lib] of [['lib',forge],['dist',bundle]]){
 const pub=lib.pki.publicKeyFromPem(key.publicKey);
 md=lib.md.sha256.create();md.update(payload,'utf8');
 assert.equal(pub.verify(md.digest().getBytes(),signature),true);
 md=lib.md.sha256.create();md.update(payload+' altered','utf8');
 assert.equal(pub.verify(md.digest().getBytes(),signature),false);
 console.log('SIGNED_RSA2048_AND_TAMPER_TEST=PASS:'+name);
}
console.log('FORK_CONTENT_ATTESTED=PASS;RELEASE=NO_GO');

