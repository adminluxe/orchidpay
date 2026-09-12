import * as Crypto from 'expo-crypto';
import { deriveStagingHsmP256BindingDigest } from './stagingHsmP256Binding';

export const SERVER_VERIFICATION_PROFILE_VERSION = 2 as const;
export const SERVER_VERIFICATION_PROFILE_RELEASE = 'R13.8E-STAGING-P256-SERVER-VERIFICATION-PROFILE-CONTRACT' as const;
export const SERVER_VERIFICATION_ALGORITHM = 'EC_SIGN_P256_SHA256' as const;
export const MAX_SERVER_VERIFICATION_TTL_MS = 30_000;
export const MAX_SERVER_VERIFICATION_CLOCK_SKEW_MS = 5_000;

export const serverVerificationProfilePolicy = Object.freeze({
  scope: 'STAGING_P256_SERVER_VERIFICATION_PROFILE_CONTRACT_ONLY' as const,
  stagingHsmP256Provisioned: true as const,
  stagingHsmAttestationVerified: true as const,
  productionVerifierProvisioned: false as const,
  productionKeySetProvisioned: false as const,
  serverReplayLedgerProvisioned: false as const,
  trustedServerClockProvisioned: false as const,
  networkExecutionEnabled: false as const,
  livePaymentExecutionEnabled: false as const,
  strongServerVerificationClaim: false as const,
});

export type ServerVerificationProfile = {
  v:2;
  release:typeof SERVER_VERIFICATION_PROFILE_RELEASE;
  algorithm:typeof SERVER_VERIFICATION_ALGORITHM;
  parentTrustPassport:string;
  trustAnchorDigest:string;
  providerRegistryDigest:string;
  stagingHsmBindingDigest:string;
  ledgerHeadDigest:string;
  trustedTimeDigest:string;
  environmentDigest:string;
  verifierKeyId:string;
  decisionDigest:string;
  signatureDigest:string;
  issuedAt:number;
  expiresAt:number;
  digest:string;
};
export type ServerVerificationInspection={ok:true}|{ok:false;code:string};
export type ServerVerificationLabVerifier={mode:'LAB_INJECTED_VERIFIER';verifyDigest:(value:ServerVerificationProfile)=>Promise<boolean>};

async function sha(value:string){return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,value);}
function upper16(hex:string){return hex.slice(0,16).toUpperCase();}
function valid(value:string,prefix:string){return new RegExp(`^${prefix}-[A-F0-9]{16}$`).test(value);}
function validKeyId(value:string){return/^srvkey\.[a-z0-9][a-z0-9._-]{7,79}$/.test(value);}
function canonical(value:Omit<ServerVerificationProfile,'digest'>){return[value.v,value.release,value.algorithm,value.parentTrustPassport,value.trustAnchorDigest,value.providerRegistryDigest,value.stagingHsmBindingDigest,value.ledgerHeadDigest,value.trustedTimeDigest,value.environmentDigest,value.verifierKeyId,value.decisionDigest,value.signatureDigest,value.issuedAt,value.expiresAt].join('|');}

export async function buildServerVerificationProfile(input:Omit<ServerVerificationProfile,'v'|'release'|'algorithm'|'digest'>):Promise<ServerVerificationProfile>{const core:Omit<ServerVerificationProfile,'digest'>={v:SERVER_VERIFICATION_PROFILE_VERSION,release:SERVER_VERIFICATION_PROFILE_RELEASE,algorithm:SERVER_VERIFICATION_ALGORITHM,...input};return{...core,digest:`SVP-${upper16(await sha(canonical(core)))}`};}

export async function inspectServerVerificationProfile(value:ServerVerificationProfile,now:number):Promise<ServerVerificationInspection>{
  if(value.v!==SERVER_VERIFICATION_PROFILE_VERSION||value.release!==SERVER_VERIFICATION_PROFILE_RELEASE||value.algorithm!==SERVER_VERIFICATION_ALGORITHM)return{ok:false,code:'SERVER_PROFILE_VERSION'};
  if(!/^TAP-[A-F0-9]{16}$/.test(value.parentTrustPassport)||!valid(value.trustAnchorDigest,'TA')||!valid(value.providerRegistryDigest,'PTR')||!valid(value.stagingHsmBindingDigest,'HSMB')||!valid(value.ledgerHeadDigest,'LAE')||!valid(value.trustedTimeDigest,'STA')||!valid(value.environmentDigest,'ENV')||!valid(value.decisionDigest,'RDEC')||!valid(value.signatureDigest,'SIG')||!validKeyId(value.verifierKeyId))return{ok:false,code:'SERVER_PROFILE_BINDING_FORMAT'};
  if(value.stagingHsmBindingDigest!==await deriveStagingHsmP256BindingDigest())return{ok:false,code:'SERVER_PROFILE_HSM_BINDING'};
  if(!Number.isSafeInteger(value.issuedAt)||!Number.isSafeInteger(value.expiresAt)||value.issuedAt<=0||value.expiresAt<=value.issuedAt)return{ok:false,code:'SERVER_PROFILE_TIME_INVALID'};
  if(value.expiresAt-value.issuedAt>MAX_SERVER_VERIFICATION_TTL_MS)return{ok:false,code:'SERVER_PROFILE_TTL_TOO_LONG'};
  if(value.issuedAt-now>MAX_SERVER_VERIFICATION_CLOCK_SKEW_MS)return{ok:false,code:'SERVER_PROFILE_CLOCK_SKEW_FUTURE'};
  if(now>value.expiresAt)return{ok:false,code:'SERVER_PROFILE_EXPIRED'};
  const{digest,...core}=value;const expected=`SVP-${upper16(await sha(canonical(core)))}`;if(digest!==expected)return{ok:false,code:'SERVER_PROFILE_DIGEST_MISMATCH'};
  return{ok:true};
}

export async function verifyProductionServerDecision(_value:ServerVerificationProfile,_now:number):Promise<ServerVerificationInspection>{return{ok:false,code:'SERVER_VERIFIER_NOT_PROVISIONED'};}
export async function verifyLabServerDecision(value:ServerVerificationProfile,now:number,verifier:ServerVerificationLabVerifier):Promise<ServerVerificationInspection>{const status=await inspectServerVerificationProfile(value,now);if(!status.ok)return status;if(verifier.mode!=='LAB_INJECTED_VERIFIER')return{ok:false,code:'LAB_VERIFIER_MODE'};return(await verifier.verifyDigest(value))?{ok:true}:{ok:false,code:'LAB_SIGNATURE_REJECTED'};}

export async function deriveServerVerificationProfilePolicyDigest(){const raw=[SERVER_VERIFICATION_PROFILE_VERSION,SERVER_VERIFICATION_PROFILE_RELEASE,SERVER_VERIFICATION_ALGORITHM,MAX_SERVER_VERIFICATION_TTL_MS,MAX_SERVER_VERIFICATION_CLOCK_SKEW_MS,serverVerificationProfilePolicy.scope,1,1,0,0,0,0,0,0,0].join('|');return`SVPPOL-${upper16(await sha(raw))}`;}
export function buildServerVerificationProfileSnapshot(value:ServerVerificationProfile|null){return[
  `serverVerificationProfile=${SERVER_VERIFICATION_PROFILE_RELEASE}`,
  `scope=${serverVerificationProfilePolicy.scope}`,
  `profile=${value?.digest||'NONE'}`,
  `parentTrust=${value?.parentTrustPassport||'NONE'}`,
  `stagingHsmBinding=${value?.stagingHsmBindingDigest||'NONE'}`,
  `algorithm=${SERVER_VERIFICATION_ALGORITHM}`,
  'stagingHsmP256=true','stagingHsmAttestation=true','productionVerifier=false','productionKeySet=false','serverReplayLedger=false','trustedServerClock=false','networkExecution=false','livePaymentExecution=false','strongServerVerification=false',
  'rawSignature=NOT_STORED','rawPublicKey=NOT_STORED','secrets=NONE',
].join('\n');}
