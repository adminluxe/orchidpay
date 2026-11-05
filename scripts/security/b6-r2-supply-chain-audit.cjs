'use strict';
// Independent B6-R2 read-only supply-chain inspection. No network mutations, no npm install.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const zlib=require('node:zlib');
const https=require('node:https');
const root=path.resolve(__dirname,'../..');
const base='vendor/orchidpay-security/';
const sha256=buf=>crypto.createHash('sha256').update(buf).digest('hex');
const read=relative=>{
  const p=path.join(root,relative);assert.equal(fs.lstatSync(p).isSymbolicLink(),false,'NO_SYMLINK:'+relative);
  return fs.readFileSync(p);
};
const pinned=[
 {name:'braces',version:'3.0.4-orchidpay.1',old:'3.0.3',
   commit:'28d440b5dd449dbf1fe6f3506cf94ecca4d02660',
   tar:'braces-3.0.4-orchidpay.1.tgz',hash:'d19e3433e7b06239810c6cf160223d57fd2a1a19f069157bad3f87205455c3d4',
   repo:'micromatch/braces',files:{
    'lib/parse.js':'b1bf766fba6a62035f78ecbda8a5fd94e921aa1c1ec0cdf3f467e9c836abed55',
    'lib/compile.js':'b651f7715e6db8942ce61d3394357b4d81c8ece88240aa31a458ea1165edd195',
    'lib/expand.js':'7ea3e14c2b2b256ef244fd3d83b8fcaa20aa2232b4e6d768c3bb6ab567f66cf5',
    'lib/stringify.js':'49dc2d8bafa74f34715a18a845bcb82ce66caaf3bab4cf117998e06b1f9a50a9',
    'lib/constants.js':'f9fb688959232eee3e6ad7906a5b0e3234815db49ee857ef86983d65b917dc7c'}},
 {name:'node-forge',version:'1.4.1-orchidpay.1',old:'1.4.0',
   commit:'ceba34402e329f0365134f23fe19898756527d65',
   tar:'node-forge-1.4.1-orchidpay.1.tgz',hash:'1e7fb7aedaee21e02cad9993edc4202885d8be03a4d1acf6f53a47c52cef7ccb',
   repo:'digitalbazaar/forge',files:{
    'lib/rsa.js':'acc22e5d36e27832c34e02dd3933aad7977d45b047eead5016520735efedc9c5',
    'dist/forge.min.js':'a1d374dddbfd38635e74c08bddcd55553f9b3e29fa4346ff8ac8cbfa2f21414f',
    'dist/forge.all.min.js':'baaad7f257463658489c2860eb83da1ab6bf6485557a94a8a5a97f935784a1bb',
    'dist/prime.worker.min.js':'877bd31b0cc79ecb9163649034fbafaeec45e8e2861fc4fa9fb11335f28c4ef9'}}
];
function tarMembers(tar) {
  const data=zlib.gunzipSync(tar,{maxOutputLength:30000000});
  const entries=new Map();
  for(let pos=0;pos+512<=data.length;) {
    const header=data.subarray(pos,pos+512);if(header.every(x=>x===0))break;
    let filename=header.toString('utf8',0,100).split('\0')[0];
    const prefix=header.toString('utf8',345,500).split('\0')[0];
    if(prefix) filename=prefix+'/'+filename;
    const n=parseInt(header.toString('ascii',124,136).replace(/\0/g,' ').trim(),8);
    const kind=header.toString('ascii',156,157);
    assert(Number.isSafeInteger(n)&&n>=0&&n<=data.length,'TAR_SIZE_INVALID');
    assert(filename.startsWith('package/')&&!filename.includes('..')&&!path.isAbsolute(filename),'TAR_PATH_INVALID');
    const start=pos+512;assert(start+n<=data.length,'TAR_TRUNCATED');
    if(kind==='0'||kind==='\0') {assert(!entries.has(filename),'TAR_DUPLICATE');entries.set(filename,data.subarray(start,start+n));}
    else assert.equal(kind,'5','NON_REGULAR_ARCHIVE_MEMBER:'+filename);
    pos=start+Math.ceil(n/512)*512;
  }
  return entries;
}
function verifiedManifest(pack,spec) {
 const m=JSON.parse(pack.get('package/package.json').toString('utf8'));
 assert.equal(m.name,spec.name);assert.equal(m.version,spec.version);
 const p=m.orchidpayPatchProvenance;assert(p,'missing provenance');
 assert.equal(p.upstreamPatchCommitSha,spec.commit);
 assert.equal(p.upstreamPackageVersion,spec.old);
 assert.equal(p.candidateOnly,true);assert.equal(p.officialUpstreamRelease,false);assert.equal(p.releaseApproved,false);
 const license=pack.get('package/LICENSE')||pack.get('package/LICENSE.md');
 assert(license&&license.length>50,'NO_LICENSE:'+spec.name);
 return license;
}
function localChecks() {
  assert.equal(sha256(read('package-lock.json')),'dffe18e1ed925dd91e94717e8908e1108a0f016f952db1c013cf82e930b892f4');
  assert.equal(sha256(read(base+'node-forge-builder.package-lock.json')),'64a79e9fa88cfd83e9f989333becc05a2b6d5bb0819f5b82a2c152b9484760de');
  const pkg=JSON.parse(read('package.json'));
  const lock=JSON.parse(read('package-lock.json'));
  for(const spec of pinned) {
    const specPath='file:'+base+spec.tar;
    assert.equal(pkg.dependencies[spec.name],specPath);
    assert.equal(pkg.overrides[spec.name],'$'+spec.name);
    const matches=Object.keys(lock.packages).filter(p=>p==='node_modules/'+spec.name||p.endsWith('/node_modules/'+spec.name));
    assert.deepEqual(matches,['node_modules/'+spec.name],'nested/original runtime dependency detected');
    const meta=lock.packages[matches[0]];
    assert.equal(meta.version,spec.version);assert.equal(meta.resolved,specPath);
    const tar=read(base+spec.tar);assert.equal(sha256(tar),spec.hash,'tar hash');
    assert.equal(meta.integrity,'sha512-'+crypto.createHash('sha512').update(tar).digest('base64'));
    const members=tarMembers(tar);
    const license=verifiedManifest(members,spec);
    for(const [file,sha] of Object.entries(spec.files)) {
      assert.equal(sha256(members.get('package/'+file)),sha,'tar member '+file);
      assert.equal(sha256(read('node_modules/'+spec.name+'/'+file)),sha,'installed file '+file);
    }
    assert.deepEqual(read('node_modules/'+spec.name+'/LICENSE'),license,'modified license '+spec.name);
    const installed=JSON.parse(read('node_modules/'+spec.name+'/package.json'));
    assert.equal(installed.version,spec.version);
    console.log('SCA03_PINNED_PACKAGE_LICENSE_SOURCE=PASS '+spec.name+' checked_files='+Object.keys(spec.files).length);
  }
  console.log('SCA03_STATIC_SUPPLY_CHAIN=PASS');
}
function getUrl(url) {
  return new Promise((resolve,reject)=>{
    const req=https.get(url,{timeout:20000,headers:{'User-Agent':'OrchidPay-B6R2-Pinned-Verification'}},res=>{
      if(res.statusCode!==200){res.resume();return reject(new Error('UPSTREAM_HTTP_'+res.statusCode));}
      let n=0;const chunks=[];
      res.on('data',b=>{n+=b.length;if(n>2000000)req.destroy(new Error('UPSTREAM_SIZE_LIMIT'));else chunks.push(b);});
      res.once('end',()=>resolve(Buffer.concat(chunks)));res.once('error',reject);
    });
    req.once('timeout',()=>req.destroy(new Error('UPSTREAM_TIMEOUT')));
    req.once('error',reject);
  });
}
async function checkUpstream() {
  for(const spec of pinned) {
    for(const [file,sha] of Object.entries(spec.files)) {
      if(file.startsWith('dist/'))continue; // locally rebuilt dist: SHA checked separately
      const bytes=await getUrl('https://raw.githubusercontent.com/'+spec.repo+'/'+spec.commit+'/'+file);
      assert.equal(sha256(bytes),sha,'UPSTREAM_PATCH_DRIFT:'+file);
      console.log('SCA03_UPSTREAM_PATCH=PASS '+spec.name+'/'+file);
    }
  }
}
(async()=>{
 localChecks();
 if(process.argv.includes('--upstream'))await checkUpstream();
 console.log('B6_R2_SCA03=PASS;RELEASE=NO_GO');
})().catch(e=>{console.error('B6_R2_SCA03=NO_GO '+e.message);process.exitCode=1;});