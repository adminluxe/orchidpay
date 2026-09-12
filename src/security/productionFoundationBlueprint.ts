import * as Crypto from 'expo-crypto';
import {
  PRODUCTION_ADMISSION_SHADOW_RELEASE,
  REQUIRED_PRODUCTION_BLOCKERS,
  buildProductionAdmissionAssessment,
  inspectProductionAdmissionAssessment,
} from './productionAdmissionShadowContract';

export const PRODUCTION_FOUNDATION_BLUEPRINT_VERSION = 1 as const;
export const PRODUCTION_FOUNDATION_BLUEPRINT_RELEASE = 'R13.8I-PRODUCTION-FOUNDATION-BLUEPRINT' as const;
export const R13_8I_PARENT_MANIFEST_SHA256 = '05f67be8dc4510a769906207c68356c15e484d7f6c1f82de9b965baf00364780' as const;
export const R13_8I_PARENT_R13_8H_R3_EVIDENCE_SHA256 = 'c877b58a7c158c8c66d5a963c100b736d10ab33136687389e6614df34916f7d5' as const;
export const R13_8I_DEVICE_PAP_PANEL_SHA256 = '3f97d3d62b190a0625a7b6fdc1e4a419ad6beea7bbcb10e468f9d9b9e9ec75b1' as const;
export const R13_8I_PARENT_ADMISSION_DIGEST = 'PAD-15D7FAFC6A1DE287' as const;

export const productionFoundationPolicy = Object.freeze({
  scope: 'PRODUCTION_FOUNDATION_BLUEPRINT_ONLY' as const,
  blueprintSealingEnabled: true as const,
  provisioningExecutionEnabled: false as const,
  cloudMutationEnabled: false as const,
  credentialMaterialAllowed: false as const,
  productionEligible: false as const,
  productionReleaseClaim: false as const,
  networkExecutionEnabled: false as const,
  livePaymentExecutionEnabled: false as const,
  settlementEnabled: false as const,
  requiredFoundationCount: 6 as const,
  provisionedFoundationCount: 0 as const,
});

export type ProductionFoundationRequirement = {
  blocker: typeof REQUIRED_PRODUCTION_BLOCKERS[number];
  component: 'PRODUCTION_KMS' | 'PRODUCTION_SERVER_VERIFIER' | 'PROVIDER_TRUST_ROOTS' | 'SERVER_REPLAY_LEDGER' | 'TRUSTED_SERVER_CLOCK' | 'PRODUCTION_PROVIDER_ROOT_GATE';
  desiredControl: string;
  requiredEvidence: string;
  state: 'NOT_PROVISIONED' | 'GATE_OPEN';
  provisioned: false;
  closureAuthorized: false;
};

export type ProductionFoundationBlueprint = {
  v: 1;
  release: typeof PRODUCTION_FOUNDATION_BLUEPRINT_RELEASE;
  scope: typeof productionFoundationPolicy.scope;
  parentRelease: typeof PRODUCTION_ADMISSION_SHADOW_RELEASE;
  parentManifestSha256: typeof R13_8I_PARENT_MANIFEST_SHA256;
  parentR13_8hR3EvidenceSha256: typeof R13_8I_PARENT_R13_8H_R3_EVIDENCE_SHA256;
  devicePapPanelSha256: typeof R13_8I_DEVICE_PAP_PANEL_SHA256;
  parentAdmissionDigest: typeof R13_8I_PARENT_ADMISSION_DIGEST;
  requirements: ProductionFoundationRequirement[];
  requiredCount: 6;
  provisionedCount: 0;
  provisioningAuthorized: false;
  productionEligible: false;
  productionRelease: false;
  networkExecution: false;
  livePaymentExecution: false;
  settlement: false;
  digest: string;
};

export type ProductionFoundationInspection = { ok: true; digest: string } | { ok: false; code: string };

async function sha(value: string) { return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value); }
function upper16(hex: string) { return hex.slice(0, 16).toUpperCase(); }
function canonicalRequirement(value: ProductionFoundationRequirement) {
  return [value.blocker, value.component, value.desiredControl, value.requiredEvidence, value.state, value.provisioned ? 1 : 0, value.closureAuthorized ? 1 : 0].join('~');
}
function canonical(value: Omit<ProductionFoundationBlueprint, 'digest'>) {
  return [
    value.v, value.release, value.scope, value.parentRelease, value.parentManifestSha256,
    value.parentR13_8hR3EvidenceSha256, value.devicePapPanelSha256, value.parentAdmissionDigest,
    value.requirements.map(canonicalRequirement).join('||'), value.requiredCount, value.provisionedCount,
    value.provisioningAuthorized ? 1 : 0, value.productionEligible ? 1 : 0, value.productionRelease ? 1 : 0,
    value.networkExecution ? 1 : 0, value.livePaymentExecution ? 1 : 0, value.settlement ? 1 : 0,
  ].join('|');
}

function buildRequirements(): ProductionFoundationRequirement[] {
  return [
    { blocker: 'PRODUCTION_KMS_NOT_PROVISIONED', component: 'PRODUCTION_KMS', desiredControl: 'Dedicated production P-256 HSM signing key with isolated project/keyring, rotation policy and least-privilege signer identity', requiredEvidence: 'KMS resource identity + HSM protection/algorithm attestation + IAM allowlist + challenge signature continuity', state: 'NOT_PROVISIONED', provisioned: false, closureAuthorized: false },
    { blocker: 'PRODUCTION_SERVER_VERIFIER_NOT_PROVISIONED', component: 'PRODUCTION_SERVER_VERIFIER', desiredControl: 'Server-side signature and intent verifier bound to production keyset and strict replay/TTL policy', requiredEvidence: 'Verifier build digest + production keyset binding + negative/positive signature vectors + fail-closed service policy', state: 'NOT_PROVISIONED', provisioned: false, closureAuthorized: false },
    { blocker: 'PROVIDER_TRUST_ROOTS_NOT_PROVISIONED', component: 'PROVIDER_TRUST_ROOTS', desiredControl: 'Current-time valid Apple App Attest and Android Play Integrity trust material with pinned provider verification policy', requiredEvidence: 'Provider root/intermediate inventory + validity windows + verifier policy digest + documentary provenance review', state: 'NOT_PROVISIONED', provisioned: false, closureAuthorized: false },
    { blocker: 'SERVER_REPLAY_LEDGER_NOT_PROVISIONED', component: 'SERVER_REPLAY_LEDGER', desiredControl: 'Authoritative server replay ledger with atomic nonce/idempotency uniqueness and bounded retention', requiredEvidence: 'Storage schema + atomic uniqueness proof + concurrency/replay tests + retention/backup policy', state: 'NOT_PROVISIONED', provisioned: false, closureAuthorized: false },
    { blocker: 'TRUSTED_SERVER_CLOCK_NOT_PROVISIONED', component: 'TRUSTED_SERVER_CLOCK', desiredControl: 'Trusted monotonic server-time source with bounded skew, health monitoring and fail-closed time validation', requiredEvidence: 'Clock source policy + skew alarms + degraded-mode refusal vectors + signed time-anchor evidence', state: 'NOT_PROVISIONED', provisioned: false, closureAuthorized: false },
    { blocker: 'PRODUCTION_PROVIDER_ROOT_GATE_OPEN', component: 'PRODUCTION_PROVIDER_ROOT_GATE', desiredControl: 'Formal provider-root gate closure with current-time-valid roots and independent documentary approval', requiredEvidence: 'Dual-review closure record + root fingerprints + validity proof + approved exception state NONE', state: 'GATE_OPEN', provisioned: false, closureAuthorized: false },
  ];
}

export async function buildProductionFoundationBlueprint(): Promise<ProductionFoundationBlueprint> {
  const parent = await buildProductionAdmissionAssessment();
  const inspected = await inspectProductionAdmissionAssessment(parent);
  if (!inspected.ok || parent.digest !== R13_8I_PARENT_ADMISSION_DIGEST || parent.blockers.length !== 6 || parent.productionEligible || parent.productionRelease) throw new Error('R13_8H_PARENT_ADMISSION_INVALID');
  const requirements = buildRequirements();
  const core: Omit<ProductionFoundationBlueprint, 'digest'> = {
    v: PRODUCTION_FOUNDATION_BLUEPRINT_VERSION,
    release: PRODUCTION_FOUNDATION_BLUEPRINT_RELEASE,
    scope: productionFoundationPolicy.scope,
    parentRelease: PRODUCTION_ADMISSION_SHADOW_RELEASE,
    parentManifestSha256: R13_8I_PARENT_MANIFEST_SHA256,
    parentR13_8hR3EvidenceSha256: R13_8I_PARENT_R13_8H_R3_EVIDENCE_SHA256,
    devicePapPanelSha256: R13_8I_DEVICE_PAP_PANEL_SHA256,
    parentAdmissionDigest: R13_8I_PARENT_ADMISSION_DIGEST,
    requirements,
    requiredCount: 6,
    provisionedCount: 0,
    provisioningAuthorized: false,
    productionEligible: false,
    productionRelease: false,
    networkExecution: false,
    livePaymentExecution: false,
    settlement: false,
  };
  return { ...core, digest: `PFB-${upper16(await sha(canonical(core)))}` };
}

export async function inspectProductionFoundationBlueprint(value: ProductionFoundationBlueprint): Promise<ProductionFoundationInspection> {
  if (value.v !== PRODUCTION_FOUNDATION_BLUEPRINT_VERSION || value.release !== PRODUCTION_FOUNDATION_BLUEPRINT_RELEASE || value.scope !== productionFoundationPolicy.scope || value.parentRelease !== PRODUCTION_ADMISSION_SHADOW_RELEASE) return { ok: false, code: 'FOUNDATION_VERSION' };
  if (value.parentManifestSha256 !== R13_8I_PARENT_MANIFEST_SHA256 || value.parentR13_8hR3EvidenceSha256 !== R13_8I_PARENT_R13_8H_R3_EVIDENCE_SHA256 || value.devicePapPanelSha256 !== R13_8I_DEVICE_PAP_PANEL_SHA256 || value.parentAdmissionDigest !== R13_8I_PARENT_ADMISSION_DIGEST) return { ok: false, code: 'FOUNDATION_EVIDENCE_PIN' };
  if (value.requiredCount !== 6 || value.provisionedCount !== 0 || value.requirements.length !== REQUIRED_PRODUCTION_BLOCKERS.length) return { ok: false, code: 'FOUNDATION_COUNT' };
  if (value.requirements.some((r, i) => r.blocker !== REQUIRED_PRODUCTION_BLOCKERS[i] || r.provisioned !== false || r.closureAuthorized !== false || (i < 5 ? r.state !== 'NOT_PROVISIONED' : r.state !== 'GATE_OPEN'))) return { ok: false, code: 'FOUNDATION_MATRIX' };
  if (value.requirements.some((r) => !r.desiredControl || !r.requiredEvidence)) return { ok: false, code: 'FOUNDATION_EVIDENCE_REQUIREMENTS' };
  if (value.provisioningAuthorized !== false || value.productionEligible !== false || value.productionRelease !== false || value.networkExecution !== false || value.livePaymentExecution !== false || value.settlement !== false) return { ok: false, code: 'FOUNDATION_FUSE' };
  if (productionFoundationPolicy.provisioningExecutionEnabled || productionFoundationPolicy.cloudMutationEnabled || productionFoundationPolicy.credentialMaterialAllowed || productionFoundationPolicy.productionEligible || productionFoundationPolicy.productionReleaseClaim || productionFoundationPolicy.networkExecutionEnabled || productionFoundationPolicy.livePaymentExecutionEnabled || productionFoundationPolicy.settlementEnabled) return { ok: false, code: 'FOUNDATION_POLICY_FUSE' };
  const parent = await buildProductionAdmissionAssessment(); const parentStatus = await inspectProductionAdmissionAssessment(parent);
  if (!parentStatus.ok || parent.digest !== value.parentAdmissionDigest || parent.blockers.some((b, i) => b !== value.requirements[i]?.blocker)) return { ok: false, code: 'FOUNDATION_PARENT' };
  const { digest, ...core } = value; const expected = `PFB-${upper16(await sha(canonical(core)))}`;
  if (digest !== expected) return { ok: false, code: 'FOUNDATION_DIGEST' };
  return { ok: true, digest };
}

export async function deriveProductionFoundationPolicyDigest() {
  const raw = [PRODUCTION_FOUNDATION_BLUEPRINT_VERSION, PRODUCTION_FOUNDATION_BLUEPRINT_RELEASE, productionFoundationPolicy.scope, R13_8I_PARENT_MANIFEST_SHA256, R13_8I_PARENT_R13_8H_R3_EVIDENCE_SHA256, R13_8I_DEVICE_PAP_PANEL_SHA256, R13_8I_PARENT_ADMISSION_DIGEST, ...REQUIRED_PRODUCTION_BLOCKERS, 6, 0, 0, 0, 0, 0, 0, 0].join('|');
  return `PFBPOL-${upper16(await sha(raw))}`;
}

export async function buildProductionFoundationSnapshot() {
  const value = await buildProductionFoundationBlueprint();
  return [
    `productionFoundation=${value.release}`,
    `blueprint=${value.digest}`,
    `scope=${value.scope}`,
    `parentRelease=${value.parentRelease}`,
    `parentManifestSha256=${value.parentManifestSha256}`,
    `r13_8hR3EvidenceSha256=${value.parentR13_8hR3EvidenceSha256}`,
    `devicePapPanelSha256=${value.devicePapPanelSha256}`,
    `parentAdmission=${value.parentAdmissionDigest}`,
    `requirements=${value.requirements.map((r) => `${r.component}:${r.state}`).join(',')}`,
    'required=6',
    'provisioned=0',
    'provisioningAuthorized=false',
    'productionEligible=false',
    'productionRelease=false',
    'networkExecution=false',
    'livePaymentExecution=false',
    'settlement=false',
    'rawKeys=NOT_STORED',
    'credentials=NOT_STORED',
    'providerDocuments=NOT_STORED',
    'secrets=NONE',
  ].join('\n');
}
