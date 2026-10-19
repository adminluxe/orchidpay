'use strict';
// SDK55 consumers with disposable local keys; no live certificates or endpoints.
const assert=require('node:assert/strict');const crypto=require('node:crypto');const fs=require('node:fs');const path=require('node:path');const {createRequire}=require('node:module');
const root=path.resolve(process.argv[2]);const reportPath=path.resolve(process.argv[3]);const req=createRequire(path.join(root,'package.json'));
const expected={expo:'55.0.31','react-native':'0.83.10',micromatch:'4.0.8',braces:'3.0.3','node-forge':'1.4.0','@expo/code-signing-certificates':'0.0.6'};
const paths={},checks=[];
function check(name,fn){fn();checks.push(name);}
for(const [name,version] of Object.entries(expected)){const p=req.resolve(name+'/package.json');assert(p.startsWith(root+'/node_modules/'));assert.equal(require(p).version,version);paths[name]=p;}
const expoReq=createRequire(paths.expo);const cliPath=expoReq.resolve('@expo/cli/package.json');const cliReq=createRequire(cliPath);
paths['@expo/cli']=cliPath;assert.equal(require(cliPath).version,'55.0.36');
const certPath=cliReq.resolve('@expo/code-signing-certificates/package.json');assert.equal(certPath,paths['@expo/code-signing-certificates']);
const certReq=createRequire(certPath);assert.equal(certReq.resolve('node-forge/package.json'),paths['node-forge']);
const mmReq=createRequire(paths.micromatch);assert.equal(mmReq.resolve('braces/package.json'),paths.braces);
const metroPath=expoReq.resolve('metro/package.json');paths.metro=metroPath;assert.equal(require(metroPath).version,'0.83.8');
check('Consumer resolution selects exact installed patched packages',()=>assert.equal(fs.realpathSync(root),root));
const mm=req('micromatch'),braces=req('braces'),forge=certReq('node-forge'),cert=certReq('@expo/code-signing-certificates');
const files=['src/screens/Home.tsx','src/screens/Pay.ts','src/components/Button.tsx','src/components/Icon.js','src/config/a.json','node_modules/z/x.js','test/a.spec.ts','assets/logo.png'];
check('Metro-style micromatch positive file glob',()=>assert.deepEqual(mm(files,'src/**/*.{ts,tsx}'),files.slice(0,3)));
check('Micromatch exclusion pattern',()=>assert.deepEqual(mm(files,['**/*.{js,ts,tsx}','!**/node_modules/**','!test/**']),files.slice(0,4)));
check('B6 quote parsing retained',()=>assert.deepEqual(braces.expand("a'bc{x,y}"),["a'bcx","a'bcy"]));
check('B6 dot comma parsing retained',()=>assert.deepEqual(braces.expand('{..a,b}'),['..a','b']));
check('Micromatch braces expansion',()=>assert.deepEqual(mm.braceExpand('src/{screens,components}/*.tsx'),['src/screens/*.tsx','src/components/*.tsx']));
check('Consumer over-depth rejection',()=>assert.throws(()=>mm.braces('{'.repeat(101)+'x'+'}'.repeat(101)),/exceeds max depth/));
function keyPair(){const p=crypto.generateKeyPairSync('rsa',{modulusLength:2048,publicExponent:65537,publicKeyEncoding:{type:'pkcs1',format:'pem'},privateKeyEncoding:{type:'pkcs1',format:'pem'}});return {pem:p,forge:cert.convertKeyPairPEMToKeyPair({privateKeyPEM:p.privateKey,publicKeyPEM:p.publicKey})};}
const pair=keyPair(),other=keyPair(),now=Date.now();
const crt=cert.generateSelfSignedCodeSigningCertificate({keyPair:pair.forge,validityNotBefore:new Date(now-60000),validityNotAfter:new Date(now+86400000),commonName:'OrchidPay B7 isolated TEST ONLY'});
const pem=cert.convertCertificateToCertificatePEM(crt);const parsed=cert.convertCertificatePEMToCertificate(pem);
check('Expo self-signed certificate validates',()=>cert.validateSelfSignedCertificate(parsed,pair.forge));
check('OpenSSL X509 signature validates',()=>{const x=new crypto.X509Certificate(pem);assert.equal(x.verify(crypto.createPublicKey(pair.pem.publicKey)),true);});
const payload=Buffer.from('ORCHIDPAY B7 SDK55 local certificate interoperability');const sig=cert.signBufferRSASHA256AndVerify(pair.forge.privateKey,parsed,payload);
check('Expo buffer signature OpenSSL interoperability',()=>assert.equal(crypto.verify('sha256',payload,pair.pem.publicKey,Buffer.from(sig,'base64')),true));
check('Altered buffer rejected',()=>assert.equal(crypto.verify('sha256',Buffer.concat([payload,Buffer.from('tamper')]),pair.pem.publicKey,Buffer.from(sig,'base64')),false));
check('Wrong signing key rejected',()=>assert.throws(()=>cert.signBufferRSASHA256AndVerify(other.forge.privateKey,parsed,payload)));
check('Wrong certificate keypair rejected',()=>assert.throws(()=>cert.validateSelfSignedCertificate(parsed,other.forge)));
check('Expired certificate rejected',()=>{const c=cert.convertCertificatePEMToCertificate(pem);c.validity.notAfter=new Date(now-30000);assert.throws(()=>cert.validateSelfSignedCertificate(c,pair.forge),/expired/);});
check('Not-yet-valid certificate rejected',()=>{const c=cert.convertCertificatePEMToCertificate(pem);c.validity.notBefore=new Date(now+30000);assert.throws(()=>cert.validateSelfSignedCertificate(c,pair.forge),/expired/);});
check('Altered X509 signature rejected',()=>{const c=cert.convertCertificatePEMToCertificate(pem);c.signature=String.fromCharCode(c.signature.charCodeAt(0)^1)+c.signature.slice(1);assert.throws(()=>cert.validateSelfSignedCertificate(c,pair.forge));});
const csr=cert.generateCSR(other.forge,'OrchidPay B7 CSR TEST ONLY');const csrPEM=cert.convertCSRToCSRPEM(csr);const parsedCSR=cert.convertCSRPEMToCSR(csrPEM);
check('CSR signature and PEM roundtrip',()=>assert.equal(parsedCSR.verify(),true));
const appId='00000000-0000-4000-8000-000000000007',scope='@orchidpay/b7-isolated-test';
const child=cert.generateDevelopmentCertificateFromCSR(pair.forge.privateKey,parsed,parsedCSR,appId,scope);
check('Development certificate issuer signature',()=>assert.equal(parsed.verify(child),true));
check('Expo project scope extension',()=>assert.equal(child.getExtension({id:cert.expoProjectInformationOID}).value,appId+','+scope));
check('Tampered CSR rejected',()=>{const c=cert.convertCSRPEMToCSR(csrPEM);c.signature=String.fromCharCode(c.signature.charCodeAt(0)^1)+c.signature.slice(1);assert.throws(()=>cert.generateDevelopmentCertificateFromCSR(pair.forge.privateKey,parsed,c,appId,scope));});
const result={status:'PASS_LOCAL_CONSUMERS_NOT_NATIVE_SIGNING',checks:checks.length,details:checks,consumerPaths:paths,ephemeralTestKeysOnly:true,noPrivateKeysPersisted:true,noNetwork:true,notStoreSigning:true};
fs.writeFileSync(reportPath,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
