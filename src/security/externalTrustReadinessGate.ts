import * as Crypto from 'expo-crypto';
import { inspectTrustCeremonyManifest, type TrustCeremonyManifest } from './trustCeremonyContract';
import { inspectProviderTrustRegistry, type ProviderTrustRegistry } from './providerTrustRegistry';
import { inspectServerVerificationProfile, type ServerVerificationProfile } from './serverVerificationProfile';
import { deriveStagingHsmP256BindingDigest, stagingHsmP256BindingPolicy } from './stagingHsmP256Binding';
import { inspectProviderRootReviewContract, providerRootReviewPolicy } from './providerRootReviewContract';

export const EXTERNAL_TRUST_READINESS_VERSION = 2 as const;
export const EXTERNAL_TRUST_READINESS_RELEASE = 'R13.8G-STAGING-HSM-P256-PROVIDER-REVIEW-GATE' as const;
export const MAX_EXTERNAL_TRUST_RECEIPT_TTL_MS = 15_000;

export const externalTrustReadinessPolicy = Object.freeze({
  scope:'STAGING_HSM_P256_SHADOW_READINESS_ONLY' as const,
  stagingHsmP256Provisioned:true as const,
  stagingHsmAttestationVerified:true as const,
  manufacturerRootCurrentTimeValid:false as const,
  providerReviewStagingExceptionAccepted:true as const,
  productionProviderRootGateOpen:true as const,
  ceremonyEvidenceProvisioned:false as const,
  productionKmsProvisioned:false as const,
  serverVerifierProvisioned:false as const,
  providerTrustRootsProvisioned:false as const,
  serverReplayLedgerProvisioned:false as const,
  trustedServerClockProvisioned:false as const,
  networkExecutionEnabled:false as const,
  livePaymentExecutionEnabled:false as const,
  settlementEnabled:false as const,
  productionReleaseClaim:false as const,
});

export type ExternalTrustReadinessInput={
  parentTrustProof:string;
  ceremonyDigest:string;
  providerRegistryDigest:string;
  serverVerificationProfileDigest:string;
  stagingHsmBindingDigest:string;
  environmentDigest:string;
  killSwitchEngaged:boolean;
  stagingHsmP256Verified:boolean;
  stagingHsmAttestationVerified:boolean;
  ceremonyEvidenceProvisioned:boolean;
  productionKmsProvisioned:boolean;
  serverVerifierProvisioned:boolean;
  providerTrustRootsProvisioned:boolean;
  serverReplayLedgerProvisioned:boolean;
  trustedServerClockProvisioned:boolean;
  networkExecutionEnabled:boolean;
  livePaymentExecutionEnabled:boolean;
  settlementEnabled:boolean;
};
export type ExternalTrustReadinessReceipt={v:2;release:typeof EXTERNAL_TRUST_READINESS_RELEASE;parentTrustProof:string;ceremonyDigest:string;providerRegistryDigest:string;serverVerificationProfileDigest:string;stagingHsmBindingDigest:string;environmentDigest:string;issuedAt:number;expiresAt:number;readinessClass:'STAGING_HSM_P256_SHADOW_READY_ONLY';digest:string};
export type ExternalTrustInspection={ok:true;readinessClass?:'STAGING_HSM_P256_SHADOW_READY_ONLY'}|{ok:false;code:string};

async function sha(value:string){return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,value);}
function upper16(hex:string){return hex.slice(0,16).toUpperCase();}
function valid(value:string,prefix:string){return new RegExp(`^${prefix}-[A-F0-9]{16}$`).test(value);}
function canonicalReceipt(value:Omit<ExternalTrustReadinessReceipt,'digest'>){return[value.v,value.release,value.parentTrustProof,value.ceremonyDigest,value.providerRegistryDigest,value.serverVerificationProfileDigest,value.stagingHsmBindingDigest,value.environmentDigest,value.issuedAt,value.expiresAt,value.readinessClass].join('|');}

export function inspectProductionExternalTrustReadiness(input:ExternalTrustReadinessInput):ExternalTrustInspection{
  if(input.killSwitchEngaged)return{ok:false,code:'EXTERNAL_TRUST_KILL_SWITCH'};
  if(input.networkExecutionEnabled)return{ok:false,code:'EXTERNAL_TRUST_NETWORK_FUSE'};
  if(input.livePaymentExecutionEnabled)return{ok:false,code:'EXTERNAL_TRUST_PAYMENT_FUSE'};
  if(input.settlementEnabled)return{ok:false,code:'EXTERNAL_TRUST_SETTLEMENT_FUSE'};
  if(!input.ceremonyEvidenceProvisioned)return{ok:false,code:'EXTERNAL_TRUST_CEREMONY_NOT_PROVISIONED'};
  if(!input.productionKmsProvisioned)return{ok:false,code:'EXTERNAL_TRUST_KMS_NOT_PROVISIONED'};
  if(!input.serverVerifierProvisioned)return{ok:false,code:'EXTERNAL_TRUST_SERVER_VERIFIER_NOT_PROVISIONED'};
  if(!input.providerTrustRootsProvisioned)return{ok:false,code:'EXTERNAL_TRUST_PROVIDER_ROOTS_NOT_PROVISIONED'};
  if(!input.serverReplayLedgerProvisioned)return{ok:false,code:'EXTERNAL_TRUST_LEDGER_NOT_PROVISIONED'};
  if(!input.trustedServerClockProvisioned)return{ok:false,code:'EXTERNAL_TRUST_CLOCK_NOT_PROVISIONED'};
  return{ok:false,code:'EXTERNAL_TRUST_PRODUCTION_PATH_INTENTIONALLY_BLOCKED'};
}

export async function inspectLabExternalTrustReadiness(input:ExternalTrustReadinessInput,ceremony:TrustCeremonyManifest,registry:ProviderTrustRegistry,profile:ServerVerificationProfile,now:number):Promise<ExternalTrustInspection>{
  if(input.killSwitchEngaged||input.networkExecutionEnabled||input.livePaymentExecutionEnabled||input.settlementEnabled)return{ok:false,code:'LAB_EXTERNAL_TRUST_FUSE_OPEN'};
  if(input.ceremonyEvidenceProvisioned||input.productionKmsProvisioned||input.serverVerifierProvisioned||input.providerTrustRootsProvisioned||input.serverReplayLedgerProvisioned||input.trustedServerClockProvisioned)return{ok:false,code:'LAB_EXTERNAL_TRUST_PRODUCTION_FLAG'};
  if(!input.stagingHsmP256Verified||!input.stagingHsmAttestationVerified)return{ok:false,code:'LAB_STAGING_HSM_NOT_VERIFIED'};
  if(!stagingHsmP256BindingPolicy.hsmKeyProvisioned||!stagingHsmP256BindingPolicy.attestationVerified||stagingHsmP256BindingPolicy.productionEligible)return{ok:false,code:'LAB_STAGING_HSM_POLICY'};
  if(!providerRootReviewPolicy.stagingExceptionAccepted||!providerRootReviewPolicy.productionProviderRootGateOpen||providerRootReviewPolicy.productionEligible)return{ok:false,code:'LAB_PROVIDER_REVIEW_POLICY'};
  const providerReview=await inspectProviderRootReviewContract(); if(!providerReview.ok)return{ok:false,code:`LAB_PROVIDER_REVIEW_${providerReview.code}`};
  if(!/^TAP-[A-F0-9]{16}$/.test(input.parentTrustProof)||!valid(input.environmentDigest,'ENV')||!valid(input.stagingHsmBindingDigest,'HSMB'))return{ok:false,code:'LAB_EXTERNAL_TRUST_BINDING'};
  if(input.stagingHsmBindingDigest!==await deriveStagingHsmP256BindingDigest())return{ok:false,code:'LAB_STAGING_HSM_BINDING'};
  const[c,r,p]=await Promise.all([inspectTrustCeremonyManifest(ceremony,now),inspectProviderTrustRegistry(registry,now),inspectServerVerificationProfile(profile,now)]);if(!c.ok)return{ok:false,code:`CEREMONY_${c.code}`};if(!r.ok)return{ok:false,code:`REGISTRY_${r.code}`};if(!p.ok)return{ok:false,code:`PROFILE_${p.code}`};
  if(input.ceremonyDigest!==ceremony.digest)return{ok:false,code:'LAB_CEREMONY_BINDING'};
  if(input.providerRegistryDigest!==registry.digest)return{ok:false,code:'LAB_REGISTRY_BINDING'};
  if(input.serverVerificationProfileDigest!==profile.digest)return{ok:false,code:'LAB_PROFILE_BINDING'};
  if(ceremony.stagingHsmBindingDigest!==input.stagingHsmBindingDigest||profile.stagingHsmBindingDigest!==input.stagingHsmBindingDigest)return{ok:false,code:'LAB_STAGING_HSM_CHAIN'};
  if(profile.parentTrustPassport!==input.parentTrustProof||ceremony.environmentDigest!==input.environmentDigest||registry.environmentDigest!==input.environmentDigest||profile.environmentDigest!==input.environmentDigest)return{ok:false,code:'LAB_ENVIRONMENT_CHAIN'};
  return{ok:true,readinessClass:'STAGING_HSM_P256_SHADOW_READY_ONLY'};
}

export async function buildExternalTrustReadinessReceipt(input:ExternalTrustReadinessInput,issuedAt:number,ceremony:TrustCeremonyManifest,registry:ProviderTrustRegistry,profile:ServerVerificationProfile):Promise<{ok:true;receipt:ExternalTrustReadinessReceipt}|{ok:false;code:string}>{const status=await inspectLabExternalTrustReadiness(input,ceremony,registry,profile,issuedAt);if(!status.ok)return status;const core:Omit<ExternalTrustReadinessReceipt,'digest'>={v:EXTERNAL_TRUST_READINESS_VERSION,release:EXTERNAL_TRUST_READINESS_RELEASE,parentTrustProof:input.parentTrustProof,ceremonyDigest:input.ceremonyDigest,providerRegistryDigest:input.providerRegistryDigest,serverVerificationProfileDigest:input.serverVerificationProfileDigest,stagingHsmBindingDigest:input.stagingHsmBindingDigest,environmentDigest:input.environmentDigest,issuedAt,expiresAt:issuedAt+MAX_EXTERNAL_TRUST_RECEIPT_TTL_MS,readinessClass:'STAGING_HSM_P256_SHADOW_READY_ONLY'};return{ok:true,receipt:{...core,digest:`ETR-${upper16(await sha(canonicalReceipt(core)))}`}};}
export async function inspectExternalTrustReadinessReceipt(value:ExternalTrustReadinessReceipt,now:number):Promise<ExternalTrustInspection>{if(value.v!==EXTERNAL_TRUST_READINESS_VERSION||value.release!==EXTERNAL_TRUST_READINESS_RELEASE||value.readinessClass!=='STAGING_HSM_P256_SHADOW_READY_ONLY')return{ok:false,code:'EXTERNAL_RECEIPT_VERSION'};if(!/^TAP-[A-F0-9]{16}$/.test(value.parentTrustProof)||!valid(value.ceremonyDigest,'TC')||!valid(value.providerRegistryDigest,'PTR')||!valid(value.serverVerificationProfileDigest,'SVP')||!valid(value.stagingHsmBindingDigest,'HSMB')||!valid(value.environmentDigest,'ENV'))return{ok:false,code:'EXTERNAL_RECEIPT_BINDING'};if(value.stagingHsmBindingDigest!==await deriveStagingHsmP256BindingDigest())return{ok:false,code:'EXTERNAL_RECEIPT_HSM_BINDING'};if(!Number.isSafeInteger(value.issuedAt)||!Number.isSafeInteger(value.expiresAt)||value.expiresAt-value.issuedAt!==MAX_EXTERNAL_TRUST_RECEIPT_TTL_MS)return{ok:false,code:'EXTERNAL_RECEIPT_TIME'};if(now>value.expiresAt)return{ok:false,code:'EXTERNAL_RECEIPT_EXPIRED'};const{digest,...core}=value;const expected=`ETR-${upper16(await sha(canonicalReceipt(core)))}`;if(digest!==expected)return{ok:false,code:'EXTERNAL_RECEIPT_DIGEST_MISMATCH'};return{ok:true,readinessClass:'STAGING_HSM_P256_SHADOW_READY_ONLY'};}
export async function deriveExternalTrustReadinessPolicyDigest(){const raw=[EXTERNAL_TRUST_READINESS_VERSION,EXTERNAL_TRUST_READINESS_RELEASE,MAX_EXTERNAL_TRUST_RECEIPT_TTL_MS,externalTrustReadinessPolicy.scope,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0].join('|');return`ETPOL-${upper16(await sha(raw))}`;}
export function buildExternalTrustReadinessSnapshot(value:ExternalTrustReadinessReceipt|null){return[`externalTrustReadiness=${EXTERNAL_TRUST_READINESS_RELEASE}`,`scope=${externalTrustReadinessPolicy.scope}`,`receipt=${value?.digest||'NONE'}`,`parentTrust=${value?.parentTrustProof||'NONE'}`,`stagingHsmBinding=${value?.stagingHsmBindingDigest||'NONE'}`,'stagingHsmP256=true','stagingHsmAttestation=true','manufacturerRootCurrentTimeValid=false','providerReviewStagingExceptionAccepted=true','productionProviderRootGate=OPEN','ceremonyEvidence=false','productionKms=false','serverVerifier=false','providerTrustRoots=false','serverReplayLedger=false','trustedServerClock=false','networkExecution=false','livePaymentExecution=false','settlement=false','productionRelease=false','rawKeys=NOT_STORED','rawProviderRoots=NOT_STORED','secrets=NONE'].join('\n');}
