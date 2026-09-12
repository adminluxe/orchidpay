import * as Crypto from 'expo-crypto';

export const PROVIDER_TRUST_REGISTRY_VERSION = 1 as const;
export const PROVIDER_TRUST_REGISTRY_RELEASE = 'R13.7-PROVIDER-TRUST-REGISTRY-CONTRACT' as const;
export const MAX_PROVIDER_REGISTRY_TTL_MS = 86_400_000;
export const MAX_PROVIDER_REGISTRY_CLOCK_SKEW_MS = 5_000;
export const REQUIRED_ATTESTATION_PROVIDERS = 2;

export const providerTrustRegistryPolicy = Object.freeze({
  scope: 'PROVIDER_TRUST_REGISTRY_CONTRACT_ONLY' as const,
  appleProviderRootsProvisioned: false as const,
  androidProviderRootsProvisioned: false as const,
  providerVerifiersProvisioned: false as const,
  networkExecutionEnabled: false as const,
  strongProviderTrustClaim: false as const,
});

export type AttestationProviderId = 'APPLE_APP_ATTEST' | 'GOOGLE_PLAY_INTEGRITY';
export type ProviderTrustDescriptor = {
  provider: AttestationProviderId;
  appBindingDigest: string;
  rootSetDigest: string;
  verifierProfileDigest: string;
  state: 'UNPROVISIONED';
};
export type ProviderTrustRegistry = {
  v: 1;
  release: typeof PROVIDER_TRUST_REGISTRY_RELEASE;
  environmentDigest: string;
  issuedAt: number;
  expiresAt: number;
  providers: ProviderTrustDescriptor[];
  digest: string;
};
export type ProviderRegistryInspection = {ok:true}|{ok:false;code:string};

async function sha(value:string){return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,value);}
function upper16(hex:string){return hex.slice(0,16).toUpperCase();}
function valid(value:string,prefix:string){return new RegExp(`^${prefix}-[A-F0-9]{16}$`).test(value);}
function canonicalDescriptor(value:ProviderTrustDescriptor){return [value.provider,value.appBindingDigest,value.rootSetDigest,value.verifierProfileDigest,value.state].join(':');}
function canonical(value:Omit<ProviderTrustRegistry,'digest'>){const providers=[...value.providers].sort((a,b)=>a.provider.localeCompare(b.provider)).map(canonicalDescriptor).join(',');return [value.v,value.release,value.environmentDigest,value.issuedAt,value.expiresAt,providers].join('|');}

export async function buildProviderTrustRegistry(input:Omit<ProviderTrustRegistry,'v'|'release'|'digest'>):Promise<ProviderTrustRegistry>{
  const core:Omit<ProviderTrustRegistry,'digest'>={v:PROVIDER_TRUST_REGISTRY_VERSION,release:PROVIDER_TRUST_REGISTRY_RELEASE,environmentDigest:input.environmentDigest,issuedAt:input.issuedAt,expiresAt:input.expiresAt,providers:input.providers.map(x=>({...x}))};
  return {...core,digest:`PTR-${upper16(await sha(canonical(core)))}`};
}

export async function inspectProviderTrustRegistry(value:ProviderTrustRegistry,now:number):Promise<ProviderRegistryInspection>{
  if(value.v!==PROVIDER_TRUST_REGISTRY_VERSION||value.release!==PROVIDER_TRUST_REGISTRY_RELEASE)return{ok:false,code:'REGISTRY_VERSION'};
  if(!valid(value.environmentDigest,'ENV'))return{ok:false,code:'REGISTRY_ENVIRONMENT'};
  if(!Number.isSafeInteger(value.issuedAt)||!Number.isSafeInteger(value.expiresAt)||value.issuedAt<=0||value.expiresAt<=value.issuedAt)return{ok:false,code:'REGISTRY_TIME_INVALID'};
  if(value.expiresAt-value.issuedAt>MAX_PROVIDER_REGISTRY_TTL_MS)return{ok:false,code:'REGISTRY_TTL_TOO_LONG'};
  if(value.issuedAt-now>MAX_PROVIDER_REGISTRY_CLOCK_SKEW_MS)return{ok:false,code:'REGISTRY_CLOCK_SKEW_FUTURE'};
  if(now>value.expiresAt)return{ok:false,code:'REGISTRY_EXPIRED'};
  if(!Array.isArray(value.providers)||value.providers.length!==REQUIRED_ATTESTATION_PROVIDERS)return{ok:false,code:'REGISTRY_PROVIDER_COUNT'};
  const seen=new Set<string>(), roots=new Set<string>();
  for(const entry of value.providers){
    if(!['APPLE_APP_ATTEST','GOOGLE_PLAY_INTEGRITY'].includes(entry.provider))return{ok:false,code:'REGISTRY_PROVIDER'};
    if(seen.has(entry.provider))return{ok:false,code:'REGISTRY_DUPLICATE_PROVIDER'}; seen.add(entry.provider);
    if(entry.state!=='UNPROVISIONED')return{ok:false,code:'REGISTRY_STATE'};
    if(!valid(entry.appBindingDigest,'APP')||!valid(entry.rootSetDigest,'ROOT')||!valid(entry.verifierProfileDigest,'VPF'))return{ok:false,code:'REGISTRY_BINDING_FORMAT'};
    if(roots.has(entry.rootSetDigest))return{ok:false,code:'REGISTRY_DUPLICATE_ROOTSET'}; roots.add(entry.rootSetDigest);
  }
  if(!seen.has('APPLE_APP_ATTEST')||!seen.has('GOOGLE_PLAY_INTEGRITY'))return{ok:false,code:'REGISTRY_REQUIRED_PROVIDER'};
  const {digest,...core}=value; const expected=`PTR-${upper16(await sha(canonical(core)))}`;
  if(digest!==expected)return{ok:false,code:'REGISTRY_DIGEST_MISMATCH'};
  return{ok:true};
}

export async function deriveProviderTrustRegistryPolicyDigest(){const raw=[PROVIDER_TRUST_REGISTRY_VERSION,PROVIDER_TRUST_REGISTRY_RELEASE,MAX_PROVIDER_REGISTRY_TTL_MS,MAX_PROVIDER_REGISTRY_CLOCK_SKEW_MS,REQUIRED_ATTESTATION_PROVIDERS,providerTrustRegistryPolicy.scope,0,0,0,0,0].join('|');return`PTRPOL-${upper16(await sha(raw))}`;}

export function buildProviderTrustRegistrySnapshot(value:ProviderTrustRegistry|null){return[
  `providerTrustRegistry=${PROVIDER_TRUST_REGISTRY_RELEASE}`,
  `scope=${providerTrustRegistryPolicy.scope}`,
  `registry=${value?.digest||'NONE'}`,
  `providers=${value?.providers.length||0}/${REQUIRED_ATTESTATION_PROVIDERS}`,
  'appleRoots=false','androidRoots=false','providerVerifiers=false','networkExecution=false','strongProviderTrust=false',
  'rawTrustRoots=NOT_STORED','rawAttestationStatements=NOT_STORED','secrets=NONE',
].join('\n');}
