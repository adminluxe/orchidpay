import * as Crypto from 'expo-crypto';
import { trustCeremonyPolicy } from './trustCeremonyContract';
import { serverVerificationProfilePolicy } from './serverVerificationProfile';
import { providerTrustRegistryPolicy } from './providerTrustRegistry';
import { serverLedgerAnchorPolicy } from './serverLedgerAnchor';
import { releaseReadinessPolicy } from './releaseReadinessGate';
import { providerRootReviewPolicy } from './providerRootReviewContract';
import { deriveStagingHsmP256BindingDigest, stagingHsmP256BindingPolicy } from './stagingHsmP256Binding';

export const PRODUCTION_ADMISSION_SHADOW_VERSION = 1 as const;
export const PRODUCTION_ADMISSION_SHADOW_RELEASE = 'R13.8H-PRODUCTION-ADMISSION-SHADOW-CONTRACT' as const;
export const R13_8H_PARENT_R13_8G_EVIDENCE_SHA256 = '0c5efea92397bfcc17969615cf78775372ddbc63fe396112582ad5a13cbe484c' as const;
export const R13_8H_DEVICE_STP_PANEL_SHA256 = '6c84bc5d8481b1f2bb460b93128972cf4717c82f695fb549102b70dbfeba9be5' as const;
export const R13_8H_DEVICE_344_PANEL_SHA256 = '759c1c5cae922a5a6799710d89656930c1bdf30b5fda79febf706373417600fb' as const;
export const R13_8H_PARENT_MANIFEST_SHA256 = 'b0399e0fb988dc01150ff0b0ff667b9f72c8b1d483c91bab523bda292312a8d2' as const;
export const REQUIRED_PRODUCTION_BLOCKERS = [
  'PRODUCTION_KMS_NOT_PROVISIONED',
  'PRODUCTION_SERVER_VERIFIER_NOT_PROVISIONED',
  'PROVIDER_TRUST_ROOTS_NOT_PROVISIONED',
  'SERVER_REPLAY_LEDGER_NOT_PROVISIONED',
  'TRUSTED_SERVER_CLOCK_NOT_PROVISIONED',
  'PRODUCTION_PROVIDER_ROOT_GATE_OPEN',
] as const;

export const productionAdmissionPolicy = Object.freeze({
  scope: 'STAGING_PRODUCTION_ADMISSION_SHADOW_ONLY' as const,
  stagingAssessmentEnabled: true as const,
  productionAdmissionEnabled: false as const,
  postR13_8GDeviceClosureVerified: true as const,
  productionReleaseClaim: false as const,
  networkExecutionEnabled: false as const,
  livePaymentExecutionEnabled: false as const,
  settlementEnabled: false as const,
  requiredBlockerCount: 6 as const,
});

export type ProductionAdmissionAssessment = {
  v: 1;
  release: typeof PRODUCTION_ADMISSION_SHADOW_RELEASE;
  scope: typeof productionAdmissionPolicy.scope;
  parentManifestSha256: typeof R13_8H_PARENT_MANIFEST_SHA256;
  r13_8gEvidenceSha256: typeof R13_8H_PARENT_R13_8G_EVIDENCE_SHA256;
  deviceStpPanelSha256: typeof R13_8H_DEVICE_STP_PANEL_SHA256;
  device344PanelSha256: typeof R13_8H_DEVICE_344_PANEL_SHA256;
  stagingHsmBindingDigest: string;
  blockers: string[];
  productionEligible: false;
  productionRelease: false;
  networkExecution: false;
  livePaymentExecution: false;
  settlement: false;
  digest: string;
};

export type ProductionAdmissionInspection = { ok: true; digest: string } | { ok: false; code: string };

async function sha(value: string) { return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value); }
function upper16(hex: string) { return hex.slice(0,16).toUpperCase(); }
function canonical(value: Omit<ProductionAdmissionAssessment,'digest'>) {
  return [
    value.v,value.release,value.scope,value.parentManifestSha256,value.r13_8gEvidenceSha256,
    value.deviceStpPanelSha256,value.device344PanelSha256,value.stagingHsmBindingDigest,
    value.blockers.join(','),value.productionEligible?1:0,value.productionRelease?1:0,
    value.networkExecution?1:0,value.livePaymentExecution?1:0,value.settlement?1:0,
  ].join('|');
}

function deriveBlockers(): string[] {
  const blockers: string[] = [];
  if (!trustCeremonyPolicy.productionKmsProvisioned) blockers.push('PRODUCTION_KMS_NOT_PROVISIONED');
  if (!serverVerificationProfilePolicy.productionVerifierProvisioned || !serverVerificationProfilePolicy.productionKeySetProvisioned) blockers.push('PRODUCTION_SERVER_VERIFIER_NOT_PROVISIONED');
  if (!providerTrustRegistryPolicy.appleProviderRootsProvisioned || !providerTrustRegistryPolicy.androidProviderRootsProvisioned || !providerTrustRegistryPolicy.providerVerifiersProvisioned) blockers.push('PROVIDER_TRUST_ROOTS_NOT_PROVISIONED');
  if (!serverLedgerAnchorPolicy.serverReplayLedgerProvisioned) blockers.push('SERVER_REPLAY_LEDGER_NOT_PROVISIONED');
  if (!serverLedgerAnchorPolicy.trustedServerClockProvisioned) blockers.push('TRUSTED_SERVER_CLOCK_NOT_PROVISIONED');
  if (providerRootReviewPolicy.productionProviderRootGateOpen) blockers.push('PRODUCTION_PROVIDER_ROOT_GATE_OPEN');
  return blockers;
}

export async function buildProductionAdmissionAssessment(): Promise<ProductionAdmissionAssessment> {
  const core: Omit<ProductionAdmissionAssessment,'digest'> = {
    v: PRODUCTION_ADMISSION_SHADOW_VERSION,
    release: PRODUCTION_ADMISSION_SHADOW_RELEASE,
    scope: productionAdmissionPolicy.scope,
    parentManifestSha256: R13_8H_PARENT_MANIFEST_SHA256,
    r13_8gEvidenceSha256: R13_8H_PARENT_R13_8G_EVIDENCE_SHA256,
    deviceStpPanelSha256: R13_8H_DEVICE_STP_PANEL_SHA256,
    device344PanelSha256: R13_8H_DEVICE_344_PANEL_SHA256,
    stagingHsmBindingDigest: await deriveStagingHsmP256BindingDigest(),
    blockers: deriveBlockers(),
    productionEligible: false,
    productionRelease: false,
    networkExecution: false,
    livePaymentExecution: false,
    settlement: false,
  };
  return { ...core, digest:`PAD-${upper16(await sha(canonical(core)))}` };
}

export async function inspectProductionAdmissionAssessment(value: ProductionAdmissionAssessment): Promise<ProductionAdmissionInspection> {
  if (value.v!==PRODUCTION_ADMISSION_SHADOW_VERSION || value.release!==PRODUCTION_ADMISSION_SHADOW_RELEASE || value.scope!==productionAdmissionPolicy.scope) return {ok:false,code:'PRODUCTION_ADMISSION_VERSION'};
  if (value.parentManifestSha256!==R13_8H_PARENT_MANIFEST_SHA256 || value.r13_8gEvidenceSha256!==R13_8H_PARENT_R13_8G_EVIDENCE_SHA256 || value.deviceStpPanelSha256!==R13_8H_DEVICE_STP_PANEL_SHA256 || value.device344PanelSha256!==R13_8H_DEVICE_344_PANEL_SHA256) return {ok:false,code:'PRODUCTION_ADMISSION_EVIDENCE_PIN'};
  if (!/^HSMB-[A-F0-9]{16}$/.test(value.stagingHsmBindingDigest) || value.stagingHsmBindingDigest!==await deriveStagingHsmP256BindingDigest()) return {ok:false,code:'PRODUCTION_ADMISSION_HSM_BINDING'};
  if (value.blockers.length!==REQUIRED_PRODUCTION_BLOCKERS.length || value.blockers.some((v,i)=>v!==REQUIRED_PRODUCTION_BLOCKERS[i])) return {ok:false,code:'PRODUCTION_ADMISSION_BLOCKER_MATRIX'};
  if (value.productionEligible!==false || value.productionRelease!==false || value.networkExecution!==false || value.livePaymentExecution!==false || value.settlement!==false) return {ok:false,code:'PRODUCTION_ADMISSION_FUSE'};
  if (!stagingHsmP256BindingPolicy.hsmKeyProvisioned || !stagingHsmP256BindingPolicy.attestationVerified || stagingHsmP256BindingPolicy.productionEligible) return {ok:false,code:'PRODUCTION_ADMISSION_STAGING_HSM'};
  if (!providerRootReviewPolicy.stagingExceptionAccepted || !providerRootReviewPolicy.productionProviderRootGateOpen || providerRootReviewPolicy.productionEligible) return {ok:false,code:'PRODUCTION_ADMISSION_PROVIDER_REVIEW'};
  if (releaseReadinessPolicy.productionReleaseClaim || releaseReadinessPolicy.networkExecutionEnabled || releaseReadinessPolicy.livePaymentExecutionEnabled || releaseReadinessPolicy.settlementEnabled) return {ok:false,code:'PRODUCTION_ADMISSION_RELEASE_POLICY'};
  const {digest,...core}=value; const expected=`PAD-${upper16(await sha(canonical(core)))}`; if (digest!==expected) return {ok:false,code:'PRODUCTION_ADMISSION_DIGEST'};
  return {ok:true,digest};
}

export async function deriveProductionAdmissionPolicyDigest() {
  const raw=[PRODUCTION_ADMISSION_SHADOW_VERSION,PRODUCTION_ADMISSION_SHADOW_RELEASE,productionAdmissionPolicy.scope,R13_8H_PARENT_MANIFEST_SHA256,R13_8H_PARENT_R13_8G_EVIDENCE_SHA256,R13_8H_DEVICE_STP_PANEL_SHA256,R13_8H_DEVICE_344_PANEL_SHA256,...REQUIRED_PRODUCTION_BLOCKERS,1,0,0,0,0,0].join('|');
  return `PADPOL-${upper16(await sha(raw))}`;
}

export async function buildProductionAdmissionSnapshot() {
  const value=await buildProductionAdmissionAssessment();
  return [
    `productionAdmission=${value.release}`,
    `assessment=${value.digest}`,
    `scope=${value.scope}`,
    `parentManifestSha256=${value.parentManifestSha256}`,
    `r13_8gEvidenceSha256=${value.r13_8gEvidenceSha256}`,
    `deviceStpPanelSha256=${value.deviceStpPanelSha256}`,
    `device344PanelSha256=${value.device344PanelSha256}`,
    `stagingHsmBinding=${value.stagingHsmBindingDigest}`,
    `blockers=${value.blockers.join(',')}`,
    'productionEligible=false','productionRelease=false','networkExecution=false','livePaymentExecution=false','settlement=false',
    'rawProviderRoots=NOT_STORED','rawServerKeys=NOT_STORED','rawLedger=NOT_STORED','secrets=NONE',
  ].join('\n');
}
