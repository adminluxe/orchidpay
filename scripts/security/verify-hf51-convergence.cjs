// HF51 source-only invariants. No network, credentials, package install or build.
const assert=require('node:assert/strict'),cp=require('node:child_process'),fs=require('node:fs');
const git=(...a)=>cp.execFileSync('git',a,{encoding:'utf8'}).trim();
const base='28eb8d240ffc1f5e2eef13511dbbd747e0b508bc',main='35973e0ce244ea81c89406e7365ccf12c0bf6158',branch='qa/hf51-pr28-publication-lock-20261105';
for(const ancestor of [base,main])cp.execFileSync('git',['merge-base','--is-ancestor',ancestor,'HEAD']);
const allowed=new Set(['vercel.json','docs/HF51_SOURCE_CONVERGENCE.md','scripts/security/verify-hf51-convergence.cjs']);
const changed=git('diff','--name-only',base,'HEAD').split('\n').filter(Boolean);assert(changed.every(p=>allowed.has(p)));
const lock='.github/workflows/npm-publish-github-packages.yml';assert.equal(git('rev-parse','HEAD:'+lock),git('rev-parse',main+':'+lock));
const text=fs.readFileSync(lock,'utf8');for(const marker of ['contents: read','ORCHIDPAY_PACKAGE_PUBLICATION=NO_GO','LIVE_PAYMENTS_SETTLEMENT_PAYOUT=OFF','exit 1'])assert(text.includes(marker));assert(!/packages: write|npm publish|npm\s+run\s+publish/.test(text));
assert.equal(JSON.parse(fs.readFileSync('package.json')).private,true);
const config=JSON.parse(fs.readFileSync('vercel.json'));assert.equal(config.git.deploymentEnabled[branch],false);assert(config.ignoreCommand.includes(branch+') exit 0'));
console.log(JSON.stringify({result:'PASS',source:git('rev-parse','HEAD'),originalPr28:base,mainPublicationLock:main,applicationTreeUnchanged:true,changed,liveRailsActivated:false,nativeBuild:false,storeSubmission:false}));
