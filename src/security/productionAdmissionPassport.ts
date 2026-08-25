import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { readStagingTrustPolicyPassport } from './stagingTrustPolicyPassport';
import {
  PRODUCTION_ADMISSION_SHADOW_RELEASE,
  R13_8H_DEVICE_344_PANEL_SHA256,
  R13_8H_DEVICE_STP_PANEL_SHA256,
  R13_8H_PARENT_MANIFEST_SHA256,
  R13_8H_PARENT_R13_8G_EVIDENCE_SHA256,
  REQUIRED_PRODUCTION_BLOCKERS,
  buildProductionAdmissionAssessment,
  inspectProductionAdmissionAssessment,
} from './productionAdmissionShadowContract';

const KEY='orchidpay.production.admission.shadow.passport.v1';
const VERSION=1 as const;
export const PRODUCTION_ADMISSION_PASSPORT_RELEASE='R13.8H-PRODUCTION-ADMISSION-SHADOW-PASSPORT' as const;
const secureStoreOptions: SecureStore.SecureStoreOptions={ keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY };

export type ProductionAdmissionShadowPassport={
  v:1;
  release:typeof PRODUCTION_ADMISSION_PASSPORT_RELEASE;
  issuedAt:number;
  status:'PRODUCTION_BLOCKED_SHADOW_CERTIFIED';
  suitePassed:344;
  suiteTotal:344;
  parentStagingPolicyProof:string;
  assessmentDigest:string;
  parentManifestSha256:typeof R13_8H_PARENT_MANIFEST_SHA256;
  r13_8gEvidenceSha256:typeof R13_8H_PARENT_R13_8G_EVIDENCE_SHA256;
  deviceStpPanelSha256:typeof R13_8H_DEVICE_STP_PANEL_SHA256;
  device344PanelSha256:typeof R13_8H_DEVICE_344_PANEL_SHA256;
  blockers:string[];
  productionEligible:false;
  productionRelease:false;
  networkExecution:false;
  livePaymentExecution:false;
  settlement:false;
  proof:string;
};
type Core=Omit<ProductionAdmissionShadowPassport,'proof'>;
async function sha(value:string){return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,value);}
function upper16(hex:string){return hex.slice(0,16).toUpperCase();}
function canonical(value:Core){return [value.v,value.release,value.issuedAt,value.status,value.suitePassed,value.suiteTotal,value.parentStagingPolicyProof,value.assessmentDigest,value.parentManifestSha256,value.r13_8gEvidenceSha256,value.deviceStpPanelSha256,value.device344PanelSha256,value.blockers.join(','),value.productionEligible?1:0,value.productionRelease?1:0,value.networkExecution?1:0,value.livePaymentExecution?1:0,value.settlement?1:0].join('|');}

export async function issueProductionAdmissionShadowPassport(suitePassed:number,suiteTotal:number){
  try{
    if(suitePassed!==344||suiteTotal!==344)return{ok:false as const,reason:'PRODUCTION_ADMISSION_SUITE_NOT_344_344'};
    if(!(await SecureStore.isAvailableAsync()))return{ok:false as const,reason:'SECURESTORE_UNAVAILABLE'};
    const parent=await readStagingTrustPolicyPassport();
    if(!parent.valid||!parent.passport)return{ok:false as const,reason:'VALID_STAGING_POLICY_PASSPORT_REQUIRED'};
    if(parent.passport.productionRelease||parent.passport.networkExecution||parent.passport.livePaymentExecution||parent.passport.settlement||!parent.passport.productionProviderRootGateOpen)return{ok:false as const,reason:'STAGING_POLICY_PARENT_FUSE'};
    const assessment=await buildProductionAdmissionAssessment(); const inspected=await inspectProductionAdmissionAssessment(assessment);
    if(!inspected.ok||assessment.productionEligible||assessment.blockers.length!==REQUIRED_PRODUCTION_BLOCKERS.length)return{ok:false as const,reason:'PRODUCTION_ADMISSION_ASSESSMENT_INVALID'};
    const core:Core={v:VERSION,release:PRODUCTION_ADMISSION_PASSPORT_RELEASE,issuedAt:Date.now(),status:'PRODUCTION_BLOCKED_SHADOW_CERTIFIED',suitePassed:344,suiteTotal:344,parentStagingPolicyProof:parent.passport.proof,assessmentDigest:assessment.digest,parentManifestSha256:R13_8H_PARENT_MANIFEST_SHA256,r13_8gEvidenceSha256:R13_8H_PARENT_R13_8G_EVIDENCE_SHA256,deviceStpPanelSha256:R13_8H_DEVICE_STP_PANEL_SHA256,device344PanelSha256:R13_8H_DEVICE_344_PANEL_SHA256,blockers:[...assessment.blockers],productionEligible:false,productionRelease:false,networkExecution:false,livePaymentExecution:false,settlement:false};
    const out:ProductionAdmissionShadowPassport={...core,proof:`PAP-${upper16(await sha(canonical(core)))}`};
    await SecureStore.setItemAsync(KEY,JSON.stringify(out),secureStoreOptions); return{ok:true as const,passport:out};
  }catch{return{ok:false as const,reason:'PRODUCTION_ADMISSION_PASSPORT_WRITE_FAILED'};}
}

export async function readProductionAdmissionShadowPassport():Promise<{valid:boolean;passport:ProductionAdmissionShadowPassport|null;error:string}>{
  try{
    if(!(await SecureStore.isAvailableAsync()))return{valid:false,passport:null,error:'SECURESTORE_UNAVAILABLE'};
    const raw=await SecureStore.getItemAsync(KEY,secureStoreOptions); if(!raw)return{valid:true,passport:null,error:''};
    const p=JSON.parse(raw) as ProductionAdmissionShadowPassport;
    if(p.v!==VERSION||p.release!==PRODUCTION_ADMISSION_PASSPORT_RELEASE||p.status!=='PRODUCTION_BLOCKED_SHADOW_CERTIFIED'||p.suitePassed!==344||p.suiteTotal!==344||!Number.isSafeInteger(p.issuedAt)||p.issuedAt<=0||!/^STP-[A-F0-9]{16}$/.test(p.parentStagingPolicyProof)||!/^PAD-[A-F0-9]{16}$/.test(p.assessmentDigest)||!/^PAP-[A-F0-9]{16}$/.test(p.proof)||p.blockers.length!==REQUIRED_PRODUCTION_BLOCKERS.length||p.blockers.some((v,i)=>v!==REQUIRED_PRODUCTION_BLOCKERS[i])||p.productionEligible!==false||p.productionRelease!==false||p.networkExecution!==false||p.livePaymentExecution!==false||p.settlement!==false)return{valid:false,passport:null,error:'STRUCTURE'};
    if(p.parentManifestSha256!==R13_8H_PARENT_MANIFEST_SHA256||p.r13_8gEvidenceSha256!==R13_8H_PARENT_R13_8G_EVIDENCE_SHA256||p.deviceStpPanelSha256!==R13_8H_DEVICE_STP_PANEL_SHA256||p.device344PanelSha256!==R13_8H_DEVICE_344_PANEL_SHA256)return{valid:false,passport:null,error:'PINNED_EVIDENCE'};
    const assessment=await buildProductionAdmissionAssessment(); const inspected=await inspectProductionAdmissionAssessment(assessment); if(!inspected.ok||p.assessmentDigest!==assessment.digest)return{valid:false,passport:null,error:'ASSESSMENT'};
    const parent=await readStagingTrustPolicyPassport(); if(!parent.valid||!parent.passport||parent.passport.proof!==p.parentStagingPolicyProof)return{valid:false,passport:null,error:'PARENT_CHAIN'};
    const{proof,...core}=p;if(proof!==`PAP-${upper16(await sha(canonical(core)))}`)return{valid:false,passport:null,error:'PROOF'};
    return{valid:true,passport:p,error:''};
  }catch{return{valid:false,passport:null,error:'INVALID'};}
}

export function buildProductionAdmissionPassportSnapshot(p:ProductionAdmissionShadowPassport|null){
  if(!p)return'productionAdmissionPassport=NONE\nsecrets=NONE';
  return [`productionAdmissionPassport=${p.release}`,`proof=${p.proof}`,`parentStagingPolicy=${p.parentStagingPolicyProof}`,`assessment=${p.assessmentDigest}`,`parentManifestSha256=${p.parentManifestSha256}`,`r13_8gEvidenceSha256=${p.r13_8gEvidenceSha256}`,`deviceStpPanelSha256=${p.deviceStpPanelSha256}`,`device344PanelSha256=${p.device344PanelSha256}`,`blockers=${p.blockers.join(',')}`,'productionEligible=false','productionRelease=false','networkExecution=false','livePaymentExecution=false','settlement=false','secrets=NONE'].join('\n');
}
