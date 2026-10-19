'use strict';
const assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path'), cp=require('node:child_process');
const root=path.resolve(process.env.B7_FIXTURE_ROOT);
assert(process.env.B7_FIXTURE_ROOT, 'B7_FIXTURE_ROOT missing');
const locations={original:path.join(root,'variants/original-braces'),b6:path.join(root,'variants/b6-braces')};
if(process.env.B7_BRACES_CANDIDATE) locations.candidate=process.env.B7_BRACES_CANDIDATE;
function specimen(name,b) {
  if(name==='brace100') return {input:'{'.repeat(100)+'x'+'}'.repeat(100),opts:{}};
  if(name==='brace101') return {input:'{'.repeat(101)+'x'+'}'.repeat(101),opts:{}};
  if(name==='paren100') return {input:'('.repeat(100)+'x'+')'.repeat(100),opts:{}};
  if(name==='paren101') return {input:'('.repeat(101)+'x'+')'.repeat(101),opts:{}};
  if(name==='cap100') return {input:'{'.repeat(101)+'x'+'}'.repeat(101),opts:{maxDepth:1000}};
  if(name==='strict0') return {input:'{a,{b,c}}',opts:{maxDepth:0}};
  if(name==='strict1') return {input:'{a,{b,c}}',opts:{maxDepth:1}};
  if(name==='strict1.5') return {input:'{a,{b,c}}',opts:{maxDepth:1.5}};
  if(name==='strict2') return {input:'{a,{b,c}}',opts:{maxDepth:2}};
  if(name==='ast-depth') {let x={type:'text',value:'x'};for(let i=0;i<400;i++)x={type:'root',nodes:[x]};return {input:x,opts:{}};}
  if(name==='nodes-cycle') {const x={type:'root',nodes:[]};x.nodes.push(x);return {input:x,opts:{}};}
  if(name==='parent-cycle') {const x=b.parse('{a,b}');x.parent=x;return {input:x,opts:{}};}
  if(name==='value-array-depth') {let a='x';for(let i=0;i<400;i++)a=[a];return {input:{type:'text',value:a},opts:{}};}
  if(name==='value-array-cycle') {const a=[];a.push(a);return {input:{type:'text',value:a},opts:{}};}
  if(name==='nodes-wrong-type') return {input:{type:'root',nodes:{oops:true}},opts:{}};
  if(name==='direct-strict') return {input:b.parse('{a,{b,c}}'),opts:{maxDepth:1.5}};
  throw new Error('unknown specimen');
}
if(process.argv[2]==='--case') {
  const [lib,kind,method]=process.argv.slice(3); const b=require(locations[lib]);
  try { const s=specimen(kind,b); b[method](s.input,s.opts); console.log(JSON.stringify({result:'accepted'})); }
  catch(e) { console.log(JSON.stringify({result:'rejected',controlled:/exceeds max depth|maximum nesting depth|Expected node.nodes|cyclic|cycle/i.test(e.message),error:e.name+': '+e.message})); }
  process.exit(0);
}
const libs=Object.fromEntries(Object.entries(locations).map(([n,p])=>[n,require(p)]));
const patterns=['','x','a{b,c}z','a/{b,c}/d','{1..5}','{05..01}','{a..e}','{a,b,}','{}','{a,{b,c}}','**/*.{ts,tsx,js,jsx}','**/node_modules/**','src/**/{screens,components}/*.{ts,tsx}','foo\\{bar,baz}','[a-z]/{a,b}','$(abc){a,b}','@(a|b)/{x,y}','{x,x,y}','a(b(c))','{abc','abc}','a{b,{c,d},e}f','x{a..c}y','a\\,b'];
let seed=0xB7C2026; function rand(n){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;}
const terms=['a','b','{a,b}','{1..3}','{x,{y,z}}','*.{ts,js}','(alpha)','[a-z]','**'];
for(let i=0;i<300;i++){let p='';for(let j=0,n=1+rand(3);j<n;j++)p+=(j?'/':'')+terms[rand(terms.length)];patterns.push(p);}
const options=[{}, {escapeInvalid:true}, {keepEscaping:true}, {noempty:true}, {nodupes:true}];
const mismatches=[];let functionalComparisons=0;
function result(fn){try{return {ok:true,value:fn()};}catch(e){return {ok:false,error:e.name};}}
for(const p of patterns)for(const opts of options)for(const method of ['compile','expand','stringify']){
 const original=result(()=>libs.original[method](p,opts));
 for(const [name,b] of Object.entries(libs)){
  if(name==='original')continue;
  const observed=result(()=>b[method](p,opts));functionalComparisons++;
  try{assert.deepEqual(observed,original);}catch(e){mismatches.push({name,pattern:p,opts,method,original,observed});}
 }
}
const security=[];const boundedErrors=[];
const stringCases=['brace100','brace101','paren100','paren101','cap100','strict0','strict1','strict1.5','strict2'];
const astCases=['ast-depth','nodes-cycle','parent-cycle','value-array-depth','value-array-cycle','nodes-wrong-type','direct-strict'];
for(const kind of [...stringCases,...astCases])for(const method of (stringCases.includes(kind)?['parse','compile','expand','stringify']:['compile','expand','stringify'])){
 for(const name of Object.keys(libs)){
  const t=Date.now();const child=cp.spawnSync(process.execPath,['--max-old-space-size=128',__filename,'--case',name,kind,method],{encoding:'utf8',timeout:2500,maxBuffer:65536});
  let observed;
  if(child.error||child.status!==0)observed={result:'process-error',code:child.error?.code||child.status,signal:child.signal,stderr:(child.stderr||'').slice(0,200)};
  else {try{observed=JSON.parse(child.stdout.trim());}catch(e){observed={result:'harness-error',stdout:child.stdout.slice(0,200)};}}
  const entry={name,kind,method,elapsedMs:Date.now()-t,...observed};security.push(entry);
  if(name==='pev'||name==='candidate'){
   const shouldAccept=['brace100','paren100','strict2'].includes(kind);
   if(shouldAccept?observed.result!=='accepted':observed.result!=='rejected'||!observed.controlled) boundedErrors.push(entry);
  }
 }
}
const report={suite:'B7_BRACES_DIFFERENTIAL_R1',patterns:patterns.length,functionalComparisons,functionalMismatches:mismatches,securityChecks:security.length,boundedErrors,
 security,scope:'Time-bounded inputs; original package baseline; no universal resource-safety assertion',status:mismatches.length||boundedErrors.length?'FAIL':'PASS_TARGETED_NOT_EXTERNAL_CERTIFICATION'};
fs.writeFileSync(process.env.B7_BRACES_REPORT||path.join(root,'evidence/BRACES_DIFFERENTIAL.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({suite:report.suite,patterns:report.patterns,functionalComparisons,functionalMismatches:mismatches.length,securityChecks:report.securityChecks,boundedErrors,status:report.status},null,2));
process.exitCode=mismatches.length||boundedErrors.length?1:0;
