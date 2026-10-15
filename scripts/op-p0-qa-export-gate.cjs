'use strict';
// Isolated source/export QA. Never claim native or financial release approval.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const MAGIC=Buffer.from('c61fbc03c103191f','hex');
const B11=['@raoulf','Raoul F.','12 450','OrchidPay Black','FAIL-CLOSED','SIMULATION_ONLY','DEV_TOKEN','R13.','Backend contract lab'];
const FUSES={
  'src/security/paymentPolicy.ts':[/liveExecutionEnabled:\s*false\b/,/requiresStrongCustomerAuthentication:\s*true\b/,/requiresServerSignedIntent:\s*true\b/,/requiresIdempotencyKey:\s*true\b/],
  'src/security/executionPermit.ts':[/networkExecutionEnabled:\s*false\s+as\s+const\b/,/livePaymentExecutionEnabled:\s*false\s+as\s+const\b/,/settlementEnabled:\s*false\s+as\s+const\b/],
  'src/security/releaseReadinessGate.ts':[/networkExecutionEnabled:\s*false\s+as\s+const\b/,/livePaymentExecutionEnabled:\s*false\s+as\s+const\b/,/settlementEnabled:\s*false\s+as\s+const\b/],
};
function checkFuses(root){
  for(const [file,tests] of Object.entries(FUSES)){
    const src=fs.readFileSync(path.join(root,file),'utf8');
    for(const t of tests)if(!t.test(src))throw Error('OFF_FUSE_MISSING:'+file);
  }
  return true;
}
function list(dir,prefix=''){
  const output=[];
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const rel=prefix ? prefix+'/'+ent.name : ent.name;
    const full=path.join(dir,ent.name);
    if(fs.lstatSync(full).isSymbolicLink())throw Error('SYMLINK:'+rel);
    if(ent.isDirectory())output.push(...list(full,rel));
    else if(ent.isFile())output.push({rel,full});
    else throw Error('UNEXPECTED_FILE_TYPE:'+rel);
  }
  return output.sort((a,b)=>a.rel.localeCompare(b.rel));
}
function inspect(platform,dir){
  if(!['ios','android'].includes(platform))throw Error('BAD_PLATFORM');
  const files=list(dir);
  if(!files.some(f=>f.rel==='metadata.json'))throw Error('MISSING_METADATA');
  JSON.parse(fs.readFileSync(path.join(dir,'metadata.json'),'utf8'));
  const hbc=files.filter(f=>f.rel.endsWith('.hbc'));
  if(!hbc.length)throw Error('MISSING_HERMES');
  const h=crypto.createHash('sha256');
  let bytes=0;
  for(const f of files){
    if(fs.statSync(f.full).size>32*1024*1024)throw Error('OVERSIZE:'+f.rel);
    const data=fs.readFileSync(f.full);bytes+=data.length;
    if(f.rel.endsWith('.hbc')&&!data.subarray(0,8).equals(MAGIC))throw Error('BAD_HERMES_MAGIC');
    for(const needle of B11)if(data.includes(Buffer.from(needle)))throw Error('B11_SIGNATURE:'+needle);
    const rel=Buffer.from(f.rel,'utf8'),length=Buffer.alloc(4);length.writeUInt32BE(rel.length);
    h.update(length);h.update(rel);h.update(crypto.createHash('sha256').update(data).digest());
  }
  return {platform,files:files.length,hermes:hbc.length,bytes,treeSha256:h.digest('hex'),forbidden:0};
}
function run(ios,android,root=path.resolve(__dirname,'..')){
  checkFuses(root);
  return [inspect('ios',ios),inspect('android',android)];
}
if(require.main===module){
  try{
    if(process.argv.length!==4)throw Error('IOS_AND_ANDROID_ARGS_REQUIRED');
    for(const x of run(process.argv[2],process.argv[3]))console.log('JS_BUNDLE_QA='+JSON.stringify(x));
    console.log('ORCHIDPAY_JS_BUNDLE_QA=PASS;PROD_RELEASE=NO_GO_PENDING_SCA_NATIVE_PROVIDER');
  }catch(e){console.error('ORCHIDPAY_JS_BUNDLE_QA=FAIL:'+e.message);process.exitCode=1;}
}
module.exports={inspect,checkFuses,run};

