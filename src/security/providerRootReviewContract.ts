import * as Crypto from 'expo-crypto';
import { deriveStagingHsmP256BindingDigest, stagingHsmP256BindingPolicy } from './stagingHsmP256Binding';

export const PROVIDER_ROOT_REVIEW_VERSION = 1 as const;
export const PROVIDER_ROOT_REVIEW_RELEASE = 'R13.8G-PROVIDER-ROOT-STAGING-EXCEPTION' as const;
export const PROVIDER_ROOT_REVIEW_COMBINED_SHA256 = '11ffe754f1e3fd174bd813b52006b0a84ca47eba9c2ff40b92a1f0309cc3dc39' as const;
export const PROVIDER_ROOT_REVIEW_DEVICE_HSM_PANEL_SHA256 = 'c3ea517beb8c6228bba5cef71732d871a1832a26cbab4eba6579b37f816beebf' as const;
export const PROVIDER_ROOT_REVIEW_DEVICE_344_PANEL_SHA256 = '310bfc8b792264813573ed4a84a9c89fc5cd2efd989ba59ce242ee03fc072206' as const;
export const PROVIDER_ROOT_REVIEW_MARVELL_NOT_AFTER = '2025-11-16T13:55:25Z' as const;

export const providerRootReviewPolicy = Object.freeze({
  scope: 'STAGING_ONLY_DOCUMENTARY_EXCEPTION' as const,
  manufacturer: 'MARVELL_LIQUID_SECURITY' as const,
  manufacturerRootCurrentTimeValid: false as const,
  manufacturerChainSignatureVerified: true as const,
  googleOwnerChainCurrentTimeValid: true as const,
  dualAttestationSignaturesVerified: true as const,
  deviceVisualClosureVerified: true as const,
  stagingExceptionAccepted: true as const,
  productionProviderRootGateOpen: true as const,
  productionEligible: false as const,
  networkExecutionEnabled: false as const,
  livePaymentExecutionEnabled: false as const,
  settlementEnabled: false as const,
});

export type ProviderRootReviewContract = {
  v: typeof PROVIDER_ROOT_REVIEW_VERSION;
  release: typeof PROVIDER_ROOT_REVIEW_RELEASE;
  scope: typeof providerRootReviewPolicy.scope;
  combinedEvidenceSha256: typeof PROVIDER_ROOT_REVIEW_COMBINED_SHA256;
  deviceHsmPanelSha256: typeof PROVIDER_ROOT_REVIEW_DEVICE_HSM_PANEL_SHA256;
  device344PanelSha256: typeof PROVIDER_ROOT_REVIEW_DEVICE_344_PANEL_SHA256;
  manufacturerRootNotAfter: typeof PROVIDER_ROOT_REVIEW_MARVELL_NOT_AFTER;
  stagingHsmBindingDigest: string;
  reviewState: 'STAGING_EXCEPTION_ACCEPTED_PRODUCTION_GATE_OPEN';
  manufacturerRootCurrentTimeValid: false;
  manufacturerChainSignatureVerified: true;
  googleOwnerChainCurrentTimeValid: true;
  dualAttestationSignaturesVerified: true;
  deviceVisualClosureVerified: true;
  stagingExceptionAccepted: true;
  productionEligible: false;
  productionProviderRootGateOpen: true;
  digest: string;
};

export type ProviderRootReviewInspection = { ok: true; digest: string } | { ok: false; code: string };

async function sha(value: string) { return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value); }
function upper16(hex: string) { return hex.slice(0, 16).toUpperCase(); }
function isSha256(value: string) { return /^[a-f0-9]{64}$/.test(value); }

function canonical(value: Omit<ProviderRootReviewContract, 'digest'>) {
  return [
    value.v, value.release, value.scope, value.combinedEvidenceSha256, value.deviceHsmPanelSha256,
    value.device344PanelSha256, value.manufacturerRootNotAfter, value.stagingHsmBindingDigest,
    value.reviewState, value.manufacturerRootCurrentTimeValid ? 1 : 0,
    value.manufacturerChainSignatureVerified ? 1 : 0, value.googleOwnerChainCurrentTimeValid ? 1 : 0,
    value.dualAttestationSignaturesVerified ? 1 : 0, value.deviceVisualClosureVerified ? 1 : 0,
    value.stagingExceptionAccepted ? 1 : 0, value.productionEligible ? 1 : 0,
    value.productionProviderRootGateOpen ? 1 : 0,
  ].join('|');
}

export async function buildProviderRootReviewContract(): Promise<ProviderRootReviewContract> {
  const core: Omit<ProviderRootReviewContract, 'digest'> = {
    v: PROVIDER_ROOT_REVIEW_VERSION,
    release: PROVIDER_ROOT_REVIEW_RELEASE,
    scope: providerRootReviewPolicy.scope,
    combinedEvidenceSha256: PROVIDER_ROOT_REVIEW_COMBINED_SHA256,
    deviceHsmPanelSha256: PROVIDER_ROOT_REVIEW_DEVICE_HSM_PANEL_SHA256,
    device344PanelSha256: PROVIDER_ROOT_REVIEW_DEVICE_344_PANEL_SHA256,
    manufacturerRootNotAfter: PROVIDER_ROOT_REVIEW_MARVELL_NOT_AFTER,
    stagingHsmBindingDigest: await deriveStagingHsmP256BindingDigest(),
    reviewState: 'STAGING_EXCEPTION_ACCEPTED_PRODUCTION_GATE_OPEN',
    manufacturerRootCurrentTimeValid: false,
    manufacturerChainSignatureVerified: true,
    googleOwnerChainCurrentTimeValid: true,
    dualAttestationSignaturesVerified: true,
    deviceVisualClosureVerified: true,
    stagingExceptionAccepted: true,
    productionEligible: false,
    productionProviderRootGateOpen: true,
  };
  return { ...core, digest: `PRR-${upper16(await sha(canonical(core)))}` };
}

export async function inspectProviderRootReviewContract(value?: ProviderRootReviewContract): Promise<ProviderRootReviewInspection> {
  const current = value || await buildProviderRootReviewContract();
  if (current.v !== PROVIDER_ROOT_REVIEW_VERSION || current.release !== PROVIDER_ROOT_REVIEW_RELEASE || current.scope !== providerRootReviewPolicy.scope) return { ok: false, code: 'PROVIDER_REVIEW_VERSION' };
  if (![current.combinedEvidenceSha256,current.deviceHsmPanelSha256,current.device344PanelSha256].every(isSha256)) return { ok: false, code: 'PROVIDER_REVIEW_EVIDENCE_SHA' };
  if (!/^HSMB-[A-F0-9]{16}$/.test(current.stagingHsmBindingDigest) || current.stagingHsmBindingDigest !== await deriveStagingHsmP256BindingDigest()) return { ok: false, code: 'PROVIDER_REVIEW_HSM_BINDING' };
  if (current.manufacturerRootNotAfter !== PROVIDER_ROOT_REVIEW_MARVELL_NOT_AFTER || current.manufacturerRootCurrentTimeValid !== false) return { ok: false, code: 'PROVIDER_REVIEW_MANUFACTURER_TIME' };
  if (!current.manufacturerChainSignatureVerified || !current.googleOwnerChainCurrentTimeValid || !current.dualAttestationSignaturesVerified || !current.deviceVisualClosureVerified || !current.stagingExceptionAccepted) return { ok: false, code: 'PROVIDER_REVIEW_EVIDENCE' };
  if (current.productionEligible !== false || current.productionProviderRootGateOpen !== true || !stagingHsmP256BindingPolicy.hsmKeyProvisioned || !stagingHsmP256BindingPolicy.attestationVerified || stagingHsmP256BindingPolicy.productionEligible) return { ok: false, code: 'PROVIDER_REVIEW_PRODUCTION_POLICY' };
  const { digest, ...core } = current;
  const expected = `PRR-${upper16(await sha(canonical(core)))}`;
  if (digest !== expected) return { ok: false, code: 'PROVIDER_REVIEW_DIGEST' };
  return { ok: true, digest };
}

export async function deriveProviderRootReviewPolicyDigest() {
  const raw = [
    PROVIDER_ROOT_REVIEW_VERSION, PROVIDER_ROOT_REVIEW_RELEASE, providerRootReviewPolicy.scope,
    PROVIDER_ROOT_REVIEW_COMBINED_SHA256, PROVIDER_ROOT_REVIEW_DEVICE_HSM_PANEL_SHA256,
    PROVIDER_ROOT_REVIEW_DEVICE_344_PANEL_SHA256, PROVIDER_ROOT_REVIEW_MARVELL_NOT_AFTER,
    0,1,1,1,1,1,1,0,0,0,0,
  ].join('|');
  return `PRRPOL-${upper16(await sha(raw))}`;
}

export async function buildProviderRootReviewSnapshot() {
  const value = await buildProviderRootReviewContract();
  return [
    `providerRootReview=${value.release}`,
    `review=${value.digest}`,
    `scope=${value.scope}`,
    `combinedEvidenceSha256=${value.combinedEvidenceSha256}`,
    `deviceHsmPanelSha256=${value.deviceHsmPanelSha256}`,
    `device344PanelSha256=${value.device344PanelSha256}`,
    `stagingHsmBinding=${value.stagingHsmBindingDigest}`,
    'manufacturerRootCurrentTimeValid=false',
    'manufacturerChainSignatureVerified=true',
    'googleOwnerChainCurrentTimeValid=true',
    'dualAttestationSignaturesVerified=true',
    'deviceVisualClosureVerified=true',
    'stagingExceptionAccepted=true',
    'productionProviderRootGate=OPEN',
    'productionEligible=false',
    'networkExecution=false',
    'livePaymentExecution=false',
    'settlement=false',
    'rawProviderRoots=NOT_STORED',
    'secrets=NONE',
  ].join('\n');
}
