import * as Crypto from 'expo-crypto';
import { deriveStagingHsmP256BindingDigest } from './stagingHsmP256Binding';

export const TRUST_CEREMONY_VERSION = 2 as const;
export const TRUST_CEREMONY_RELEASE = 'R13.8E-STAGING-HSM-P256-TRUST-CEREMONY-CONTRACT' as const;
export const TRUST_CEREMONY_ALGORITHM = 'EC_SIGN_P256_SHA256' as const;
export const REQUIRED_TRUST_CEREMONY_APPROVALS = 2;
export const MAX_TRUST_CEREMONY_TTL_MS = 30 * 60_000;
export const MAX_TRUST_CEREMONY_CLOCK_SKEW_MS = 5_000;

export const trustCeremonyPolicy = Object.freeze({
  scope: 'STAGING_HSM_P256_TRUST_CEREMONY_CONTRACT_ONLY' as const,
  environment: 'STAGING' as const,
  algorithm: TRUST_CEREMONY_ALGORITHM,
  stagingHsmP256Provisioned: true as const,
  stagingHsmAttestationVerified: true as const,
  productionKmsProvisioned: false as const,
  productionKeyMaterialImported: false as const,
  remoteCeremonyServiceProvisioned: false as const,
  networkExecutionEnabled: false as const,
  productionCeremonyClaim: false as const,
});

export type TrustCeremonyRole = 'SECURITY' | 'OPERATIONS';
export type TrustCeremonyApproval = { role: TrustCeremonyRole; approverDigest: string; approvedAt: number };
export type TrustCeremonyManifest = {
  v: 2;
  release: typeof TRUST_CEREMONY_RELEASE;
  environment: typeof trustCeremonyPolicy.environment;
  algorithm: typeof TRUST_CEREMONY_ALGORITHM;
  trustAnchorDigest: string;
  environmentDigest: string;
  stagingHsmBindingDigest: string;
  keysetVersion: string;
  kmsKeyRefDigest: string;
  issuedAt: number;
  expiresAt: number;
  approvals: TrustCeremonyApproval[];
  digest: string;
};
export type TrustCeremonyInspection = { ok: true } | { ok: false; code: string };

async function sha(value: string) { return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value); }
function upper16(hex: string) { return hex.slice(0, 16).toUpperCase(); }
function valid(value: string, prefix: string) { return new RegExp(`^${prefix}-[A-F0-9]{16}$`).test(value); }
function validKeysetVersion(value: string) { return /^ks-[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{2}$/.test(value); }
function canonicalApproval(value: TrustCeremonyApproval) { return [value.role, value.approverDigest, value.approvedAt].join(':'); }
function canonical(value: Omit<TrustCeremonyManifest, 'digest'>) {
  const approvals = [...value.approvals].sort((a,b)=>a.role.localeCompare(b.role) || a.approverDigest.localeCompare(b.approverDigest)).map(canonicalApproval).join(',');
  return [value.v,value.release,value.environment,value.algorithm,value.trustAnchorDigest,value.environmentDigest,value.stagingHsmBindingDigest,value.keysetVersion,value.kmsKeyRefDigest,value.issuedAt,value.expiresAt,approvals].join('|');
}

export async function buildTrustCeremonyManifest(input: Omit<TrustCeremonyManifest,'v'|'release'|'environment'|'algorithm'|'digest'>): Promise<TrustCeremonyManifest> {
  const core: Omit<TrustCeremonyManifest,'digest'> = {
    v: TRUST_CEREMONY_VERSION,
    release: TRUST_CEREMONY_RELEASE,
    environment: trustCeremonyPolicy.environment,
    algorithm: TRUST_CEREMONY_ALGORITHM,
    trustAnchorDigest: input.trustAnchorDigest,
    environmentDigest: input.environmentDigest,
    stagingHsmBindingDigest: input.stagingHsmBindingDigest,
    keysetVersion: input.keysetVersion,
    kmsKeyRefDigest: input.kmsKeyRefDigest,
    issuedAt: input.issuedAt,
    expiresAt: input.expiresAt,
    approvals: input.approvals.map(x=>({...x})),
  };
  return {...core,digest:`TC-${upper16(await sha(canonical(core)))}`};
}

export async function inspectTrustCeremonyManifest(value: TrustCeremonyManifest, now: number): Promise<TrustCeremonyInspection> {
  if (value.v !== TRUST_CEREMONY_VERSION || value.release !== TRUST_CEREMONY_RELEASE || value.environment !== trustCeremonyPolicy.environment || value.algorithm !== TRUST_CEREMONY_ALGORITHM) return {ok:false,code:'CEREMONY_VERSION'};
  if (!valid(value.trustAnchorDigest,'TA') || !valid(value.environmentDigest,'ENV') || !valid(value.stagingHsmBindingDigest,'HSMB') || !valid(value.kmsKeyRefDigest,'KMS') || !validKeysetVersion(value.keysetVersion)) return {ok:false,code:'CEREMONY_BINDING_FORMAT'};
  if (value.stagingHsmBindingDigest !== await deriveStagingHsmP256BindingDigest()) return {ok:false,code:'CEREMONY_HSM_BINDING'};
  if (!Number.isSafeInteger(value.issuedAt) || !Number.isSafeInteger(value.expiresAt) || value.issuedAt <= 0 || value.expiresAt <= value.issuedAt) return {ok:false,code:'CEREMONY_TIME_INVALID'};
  if (value.expiresAt - value.issuedAt > MAX_TRUST_CEREMONY_TTL_MS) return {ok:false,code:'CEREMONY_TTL_TOO_LONG'};
  if (value.issuedAt - now > MAX_TRUST_CEREMONY_CLOCK_SKEW_MS) return {ok:false,code:'CEREMONY_CLOCK_SKEW_FUTURE'};
  if (now > value.expiresAt) return {ok:false,code:'CEREMONY_EXPIRED'};
  if (!Array.isArray(value.approvals) || value.approvals.length !== REQUIRED_TRUST_CEREMONY_APPROVALS) return {ok:false,code:'CEREMONY_QUORUM'};
  const roles=new Set<string>(), approvers=new Set<string>();
  for (const approval of value.approvals) {
    if (!['SECURITY','OPERATIONS'].includes(approval.role)) return {ok:false,code:'CEREMONY_ROLE'};
    if (!valid(approval.approverDigest,'APR') || !Number.isSafeInteger(approval.approvedAt) || approval.approvedAt < value.issuedAt || approval.approvedAt > value.expiresAt) return {ok:false,code:'CEREMONY_APPROVAL'};
    if (roles.has(approval.role)) return {ok:false,code:'CEREMONY_DUPLICATE_ROLE'};
    if (approvers.has(approval.approverDigest)) return {ok:false,code:'CEREMONY_DUPLICATE_APPROVER'};
    roles.add(approval.role); approvers.add(approval.approverDigest);
  }
  if (!roles.has('SECURITY') || !roles.has('OPERATIONS')) return {ok:false,code:'CEREMONY_ROLE_QUORUM'};
  const {digest,...core}=value; const expected=`TC-${upper16(await sha(canonical(core)))}`;
  if (digest !== expected) return {ok:false,code:'CEREMONY_DIGEST_MISMATCH'};
  return {ok:true};
}

export async function deriveTrustCeremonyPolicyDigest() {
  const raw=[TRUST_CEREMONY_VERSION,TRUST_CEREMONY_RELEASE,TRUST_CEREMONY_ALGORITHM,REQUIRED_TRUST_CEREMONY_APPROVALS,MAX_TRUST_CEREMONY_TTL_MS,MAX_TRUST_CEREMONY_CLOCK_SKEW_MS,trustCeremonyPolicy.scope,trustCeremonyPolicy.environment,1,1,0,0,0,0,0].join('|');
  return `TCPOL-${upper16(await sha(raw))}`;
}

export function buildTrustCeremonySnapshot(value: TrustCeremonyManifest | null) {
  return [
    `trustCeremony=${TRUST_CEREMONY_RELEASE}`,
    `scope=${trustCeremonyPolicy.scope}`,
    `manifest=${value?.digest || 'NONE'}`,
    `trustAnchor=${value?.trustAnchorDigest || 'NONE'}`,
    `stagingHsmBinding=${value?.stagingHsmBindingDigest || 'NONE'}`,
    `keysetVersion=${value?.keysetVersion || 'NONE'}`,
    `algorithm=${TRUST_CEREMONY_ALGORITHM}`,
    `approvals=${value?.approvals.length || 0}/${REQUIRED_TRUST_CEREMONY_APPROVALS}`,
    'stagingHsmP256=true','stagingHsmAttestation=true','productionKms=false','productionKeyMaterial=false','remoteCeremony=false','networkExecution=false','productionCeremonyClaim=false',
    'rawKeyMaterial=NOT_STORED','rawApproverIdentity=NOT_STORED','secrets=NONE',
  ].join('\n');
}
