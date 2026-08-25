import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { readProductionAdmissionShadowPassport } from './productionAdmissionPassport';
import {
  PRODUCTION_FOUNDATION_BLUEPRINT_RELEASE,
  R13_8I_DEVICE_PAP_PANEL_SHA256,
  R13_8I_PARENT_ADMISSION_DIGEST,
  R13_8I_PARENT_MANIFEST_SHA256,
  R13_8I_PARENT_R13_8H_R3_EVIDENCE_SHA256,
  buildProductionFoundationBlueprint,
  inspectProductionFoundationBlueprint,
} from './productionFoundationBlueprint';

const KEY = 'orchidpay.production.foundation.blueprint.passport.v1';
const VERSION = 1 as const;
export const PRODUCTION_FOUNDATION_PASSPORT_RELEASE = 'R13.8I-PRODUCTION-FOUNDATION-BLUEPRINT-PASSPORT' as const;
const secureStoreOptions: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY };

export type ProductionFoundationPassport = {
  v: 1;
  release: typeof PRODUCTION_FOUNDATION_PASSPORT_RELEASE;
  issuedAt: number;
  status: 'BLUEPRINT_SEALED_PROVISIONING_BLOCKED';
  suitePassed: 344;
  suiteTotal: 344;
  parentProductionAdmissionProof: string;
  parentAdmissionDigest: typeof R13_8I_PARENT_ADMISSION_DIGEST;
  blueprintDigest: string;
  parentManifestSha256: typeof R13_8I_PARENT_MANIFEST_SHA256;
  r13_8hR3EvidenceSha256: typeof R13_8I_PARENT_R13_8H_R3_EVIDENCE_SHA256;
  devicePapPanelSha256: typeof R13_8I_DEVICE_PAP_PANEL_SHA256;
  requiredCount: 6;
  provisionedCount: 0;
  provisioningAuthorized: false;
  productionEligible: false;
  productionRelease: false;
  networkExecution: false;
  livePaymentExecution: false;
  settlement: false;
  proof: string;
};

type Core = Omit<ProductionFoundationPassport, 'proof'>;
async function sha(value: string) { return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value); }
function upper16(hex: string) { return hex.slice(0, 16).toUpperCase(); }
function canonical(value: Core) {
  return [value.v, value.release, value.issuedAt, value.status, value.suitePassed, value.suiteTotal, value.parentProductionAdmissionProof, value.parentAdmissionDigest, value.blueprintDigest, value.parentManifestSha256, value.r13_8hR3EvidenceSha256, value.devicePapPanelSha256, value.requiredCount, value.provisionedCount, value.provisioningAuthorized ? 1 : 0, value.productionEligible ? 1 : 0, value.productionRelease ? 1 : 0, value.networkExecution ? 1 : 0, value.livePaymentExecution ? 1 : 0, value.settlement ? 1 : 0].join('|');
}

export async function issueProductionFoundationPassport(suitePassed: number, suiteTotal: number) {
  try {
    if (suitePassed !== 344 || suiteTotal !== 344) return { ok: false as const, reason: 'FOUNDATION_SUITE_NOT_344_344' };
    if (!(await SecureStore.isAvailableAsync())) return { ok: false as const, reason: 'SECURESTORE_UNAVAILABLE' };
    const parent = await readProductionAdmissionShadowPassport();
    if (!parent.valid || !parent.passport) return { ok: false as const, reason: 'VALID_PRODUCTION_ADMISSION_PASSPORT_REQUIRED' };
    if (parent.passport.assessmentDigest !== R13_8I_PARENT_ADMISSION_DIGEST || parent.passport.productionEligible || parent.passport.productionRelease || parent.passport.networkExecution || parent.passport.livePaymentExecution || parent.passport.settlement || parent.passport.blockers.length !== 6) return { ok: false as const, reason: 'PRODUCTION_ADMISSION_PARENT_FUSE' };
    const blueprint = await buildProductionFoundationBlueprint(); const inspected = await inspectProductionFoundationBlueprint(blueprint);
    if (!inspected.ok || blueprint.requiredCount !== 6 || blueprint.provisionedCount !== 0 || blueprint.provisioningAuthorized || blueprint.productionEligible || blueprint.productionRelease) return { ok: false as const, reason: 'FOUNDATION_BLUEPRINT_INVALID' };
    const core: Core = { v: VERSION, release: PRODUCTION_FOUNDATION_PASSPORT_RELEASE, issuedAt: Date.now(), status: 'BLUEPRINT_SEALED_PROVISIONING_BLOCKED', suitePassed: 344, suiteTotal: 344, parentProductionAdmissionProof: parent.passport.proof, parentAdmissionDigest: R13_8I_PARENT_ADMISSION_DIGEST, blueprintDigest: blueprint.digest, parentManifestSha256: R13_8I_PARENT_MANIFEST_SHA256, r13_8hR3EvidenceSha256: R13_8I_PARENT_R13_8H_R3_EVIDENCE_SHA256, devicePapPanelSha256: R13_8I_DEVICE_PAP_PANEL_SHA256, requiredCount: 6, provisionedCount: 0, provisioningAuthorized: false, productionEligible: false, productionRelease: false, networkExecution: false, livePaymentExecution: false, settlement: false };
    const out: ProductionFoundationPassport = { ...core, proof: `PFP-${upper16(await sha(canonical(core)))}` };
    await SecureStore.setItemAsync(KEY, JSON.stringify(out), secureStoreOptions);
    return { ok: true as const, passport: out };
  } catch { return { ok: false as const, reason: 'FOUNDATION_PASSPORT_WRITE_FAILED' }; }
}

export async function readProductionFoundationPassport(): Promise<{ valid: boolean; passport: ProductionFoundationPassport | null; error: string }> {
  try {
    if (!(await SecureStore.isAvailableAsync())) return { valid: false, passport: null, error: 'SECURESTORE_UNAVAILABLE' };
    const raw = await SecureStore.getItemAsync(KEY, secureStoreOptions); if (!raw) return { valid: true, passport: null, error: '' };
    const p = JSON.parse(raw) as ProductionFoundationPassport;
    if (p.v !== VERSION || p.release !== PRODUCTION_FOUNDATION_PASSPORT_RELEASE || p.status !== 'BLUEPRINT_SEALED_PROVISIONING_BLOCKED' || p.suitePassed !== 344 || p.suiteTotal !== 344 || !Number.isSafeInteger(p.issuedAt) || p.issuedAt <= 0 || !/^PAP-[A-F0-9]{16}$/.test(p.parentProductionAdmissionProof) || p.parentAdmissionDigest !== R13_8I_PARENT_ADMISSION_DIGEST || !/^PFB-[A-F0-9]{16}$/.test(p.blueprintDigest) || !/^PFP-[A-F0-9]{16}$/.test(p.proof) || p.requiredCount !== 6 || p.provisionedCount !== 0 || p.provisioningAuthorized !== false || p.productionEligible !== false || p.productionRelease !== false || p.networkExecution !== false || p.livePaymentExecution !== false || p.settlement !== false) return { valid: false, passport: null, error: 'STRUCTURE' };
    if (p.parentManifestSha256 !== R13_8I_PARENT_MANIFEST_SHA256 || p.r13_8hR3EvidenceSha256 !== R13_8I_PARENT_R13_8H_R3_EVIDENCE_SHA256 || p.devicePapPanelSha256 !== R13_8I_DEVICE_PAP_PANEL_SHA256) return { valid: false, passport: null, error: 'PINNED_EVIDENCE' };
    const blueprint = await buildProductionFoundationBlueprint(); const inspected = await inspectProductionFoundationBlueprint(blueprint); if (!inspected.ok || p.blueprintDigest !== blueprint.digest) return { valid: false, passport: null, error: 'BLUEPRINT' };
    const parent = await readProductionAdmissionShadowPassport(); if (!parent.valid || !parent.passport || parent.passport.proof !== p.parentProductionAdmissionProof || parent.passport.assessmentDigest !== p.parentAdmissionDigest) return { valid: false, passport: null, error: 'PARENT_CHAIN' };
    const { proof, ...core } = p; if (proof !== `PFP-${upper16(await sha(canonical(core)))}`) return { valid: false, passport: null, error: 'PROOF' };
    return { valid: true, passport: p, error: '' };
  } catch { return { valid: false, passport: null, error: 'INVALID' }; }
}

export function buildProductionFoundationPassportSnapshot(p: ProductionFoundationPassport | null) {
  if (!p) return 'productionFoundationPassport=NONE\nsecrets=NONE';
  return [`productionFoundationPassport=${p.release}`, `proof=${p.proof}`, `parentProductionAdmission=${p.parentProductionAdmissionProof}`, `parentAdmission=${p.parentAdmissionDigest}`, `blueprint=${p.blueprintDigest}`, `parentManifestSha256=${p.parentManifestSha256}`, `r13_8hR3EvidenceSha256=${p.r13_8hR3EvidenceSha256}`, `devicePapPanelSha256=${p.devicePapPanelSha256}`, 'required=6', 'provisioned=0', 'provisioningAuthorized=false', 'productionEligible=false', 'productionRelease=false', 'networkExecution=false', 'livePaymentExecution=false', 'settlement=false', 'secrets=NONE'].join('\n');
}
