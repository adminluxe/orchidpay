'use strict';
// Fail closed content attestation. A PASS here never authorizes release or audit exemption.
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const MANIFEST_SHA256='a6c716d55584cde216c9ed5cf448d23c8ee81286b1202b25f9760afbbd23f170';
const LOCK_SHA256='ea47ef8f73fc2f53acc3615f5a8ee01e0afe020e22ad6d56b633177d08f5b88c';
const BUILDER_LOCK_SHA256='45f26db2fb3169e40f5ca197d9bc5eaa26f211e17b6f927b8b055042418e5b3f';
function hash(b,a='sha256'){return crypto.createHash(a).update(b).digest('hex');}
function verify(root){
 root=path.resolve(root);assert.equal(fs.lstatSync(root).isSymbolicLink(),false,'ROOT_SYMLINK');
 function checked(rel){
  assert(!path.isAbsolute(rel) && !rel.split('/').some(x=>x==='..'||x==='.'||!x),'UNSAFE_PATH');
  let p=root;for(const part of rel.split('/')){p=path.join(p,part);assert.equal(fs.lstatSync(p).isSymbolicLink(),false,'SYMLINK:'+rel);}
  assert(fs.statSync(p).isFile(),'NOT_FILE:'+rel);return fs.readFileSync(p);
 }
 function files(rel){let result=[];for(const item of fs.readdirSync(path.join(root,rel),{withFileTypes:true})){
  assert(!item.isSymbolicLink(),'PACKAGE_SYMLINK:'+item.name);
  if(item.isDirectory())result.push(...files(rel+'/'+item.name));
  else {assert(item.isFile(),'SPECIAL_FILE');result.push(rel+'/'+item.name);}
 }return result.sort();}
 const manifestBytes=checked('security/B7_PACKAGE_MANIFEST.json');assert.equal(hash(manifestBytes),MANIFEST_SHA256,'MANIFEST_DRIFT');
 const m=JSON.parse(manifestBytes);assert.equal(m.revision,'OP-P0-B7-C-R2');assert.equal(m.releaseApproved,false);assert.equal(m.officialUpstreamRelease,false);assert.equal(m.upstreamVersionsRetained,true);
 assert.equal(hash(checked('package-lock.json')),LOCK_SHA256,'LOCK_DRIFT');
 assert.equal(hash(checked('vendor/orchidpay-security/node-forge-builder.package-lock.json')),BUILDER_LOCK_SHA256,'BUILDER_LOCK_DRIFT');
 const app=JSON.parse(checked('package.json')),lock=JSON.parse(checked('package-lock.json'));
 assert.equal(app.private,true);assert.equal(app.dependencies.expo,'~55.0.31');assert.equal(app.dependencies['react-native'],'0.83.10');
 const result=[];
 for(const [name,entry] of Object.entries(m.packages)){
  assert(['braces','node-forge'].includes(name),'UNEXPECTED_PACKAGE');
  const tar=checked(entry.archive);assert.equal(hash(tar),entry.sha256,'TARBALL_SHA256:'+name);assert.equal(hash(tar,'sha512'),entry.sha512,'TARBALL_SHA512:'+name);
  assert.equal(entry.integrity,'sha512-'+crypto.createHash('sha512').update(tar).digest('base64'),'SRI:'+name);
  const spec='file:'+entry.archive;assert.equal(app.dependencies[name],spec);assert.equal(app.overrides[name],'$'+name);
  const entries=Object.entries(lock.packages).filter(([p])=>p==='node_modules/'+name||p.endsWith('/node_modules/'+name));assert.equal(entries.length,1,'DUPLICATE_PACKAGE');
  const [location,l]=entries[0];assert.equal(location,'node_modules/'+name);assert.equal(l.version,entry.version);assert.equal(l.integrity,entry.integrity);assert.equal(l.resolved,spec);
  const installed=JSON.parse(checked(location+'/package.json'));assert.equal(installed.name,name);assert.equal(installed.version,entry.version);assert.equal(installed.private,true);
  assert.equal(installed.orchidpayPatchProvenance.securityRevision,'OP-P0-B7-C-R2');assert.equal(installed.orchidpayPatchProvenance.releaseApproved,false);assert.equal(installed.orchidpayPatchProvenance.auditAdvisoriesIntentionallyRetained,true);
  const list=files(location).map(p=>p.slice(location.length+1));assert.deepEqual(list,Object.keys(entry.files).sort(),'PACKAGE_FILE_SET:'+name);
  for(const [file,d] of Object.entries(entry.files)){const b=checked(location+'/'+file);assert.equal(hash(b),d.sha256,'SOURCE_SHA256:'+name+'/'+file);assert.equal(hash(b,'sha512'),d.sha512,'SOURCE_SHA512:'+name+'/'+file);}
  assert.equal(entry.licensePreserved,true);result.push({name,version:entry.version,files:list.length,sha256:entry.sha256});
 }
 const builder=JSON.parse(checked('vendor/orchidpay-security/node-forge-builder.package-lock.json'));
 for(const [loc,e] of Object.entries(builder.packages))if(loc&&!e.link){assert(e.resolved.startsWith('https://registry.npmjs.org/'),'BUILDER_SOURCE');assert(e.integrity.startsWith('sha512-'),'BUILDER_SRI');}
 return {status:'PASS_CONTENT_PROVENANCE_ONLY',packages:result,manifestSha256:MANIFEST_SHA256,lockSha256:LOCK_SHA256,releaseApproved:false,financialActivation:false,rawAuditRequired:true};
}
module.exports={verify};
if(require.main===module){try{const args=process.argv.slice(2);assert(args.length===0||(args.length===2&&args[0]==='--root'),'ARGUMENTS');const root=args.length?args[1]:path.resolve(__dirname,'../..');console.log(JSON.stringify(verify(root),null,2));}catch(e){console.error('B7_PROVENANCE_NO_GO '+e.message);process.exitCode=1;}}
