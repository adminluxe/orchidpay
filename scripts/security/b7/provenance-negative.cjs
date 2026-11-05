'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const lab=path.resolve(process.argv[2]),source=path.resolve(process.argv[3]);
const {verify}=require(path.join(source,'scripts/security/verify-local-security-forks.cjs'));
const root=path.join(lab,'negative-provenance-fixture');assert(!fs.existsSync(root));fs.mkdirSync(root);
for(const name of ['package.json','package-lock.json','security','vendor'])fs.cpSync(path.join(source,name),path.join(root,name),{recursive:true});
fs.mkdirSync(path.join(root,'node_modules'));
for(const name of ['braces','node-forge'])fs.cpSync(path.join(source,'node_modules',name),path.join(root,'node_modules',name),{recursive:true});
assert.equal(verify(root).status,'PASS_CONTENT_PROVENANCE_ONLY');
const tests=[];const manifest=JSON.parse(fs.readFileSync(path.join(root,'security/B7_PACKAGE_MANIFEST.json')));
function change(name,rel,mutate){const p=path.join(root,rel);const before=fs.readFileSync(p);try{mutate(p,before);assert.throws(()=>verify(root),undefined,'Mutation escaped: '+name);tests.push({name,rejected:true});}finally{if(fs.existsSync(p)||fs.lstatSync(path.dirname(p)).isDirectory()){try{fs.unlinkSync(p);}catch(e){if(e.code!=='ENOENT')throw e;}fs.writeFileSync(p,before);}}assert.equal(verify(root).status,'PASS_CONTENT_PROVENANCE_ONLY');}
change('Manifest altered','security/B7_PACKAGE_MANIFEST.json',(p,b)=>fs.writeFileSync(p,Buffer.concat([b,Buffer.from(' ')])));
change('Application lock altered','package-lock.json',(p,b)=>fs.writeFileSync(p,Buffer.concat([b,Buffer.from(' ')])));
change('Builder lock altered','vendor/orchidpay-security/node-forge-builder.package-lock.json',(p,b)=>fs.writeFileSync(p,Buffer.concat([b,Buffer.from(' ')])));
change('Archive altered',manifest.packages['node-forge'].archive,(p,b)=>{const c=Buffer.from(b);c[Math.floor(c.length/2)]^=1;fs.writeFileSync(p,c);});
change('Installed RSA source altered','node_modules/node-forge/lib/rsa.js',(p,b)=>fs.writeFileSync(p,Buffer.concat([b,Buffer.from('\n// unauthorized\n')])));
change('Installed minified bundle altered','node_modules/node-forge/dist/forge.min.js',(p,b)=>fs.writeFileSync(p,Buffer.concat([b,Buffer.from('\n// unauthorized\n')])));
change('Source replaced by symlink','node_modules/braces/lib/parse.js',(p,b)=>{fs.unlinkSync(p);fs.symlinkSync(path.join(source,'node_modules/braces/lib/parse.js'),p);});
const extra=path.join(root,'node_modules/braces/injected.js');fs.writeFileSync(extra,'throw new Error("injected");');try{assert.throws(()=>verify(root));tests.push({name:'Unexpected executable file',rejected:true});}finally{fs.unlinkSync(extra);}
assert.equal(verify(root).status,'PASS_CONTENT_PROVENANCE_ONLY');assert.equal(verify(source).status,'PASS_CONTENT_PROVENANCE_ONLY');
const out={status:'PASS_FAIL_CLOSED_NEGATIVE_CONTROLS',tests:tests.length,details:tests,sourceCandidateUnmodified:true};fs.writeFileSync(path.join(lab,'evidence/PROVENANCE_NEGATIVE_CONTROLS.json'),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out,null,2));
