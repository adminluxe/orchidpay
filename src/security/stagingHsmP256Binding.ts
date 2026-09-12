import * as Crypto from 'expo-crypto';

export const STAGING_HSM_BINDING_VERSION = 1 as const;
export const STAGING_HSM_BINDING_RELEASE = 'R13.8E-GCP-HSM-P256-STAGING-BINDING' as const;
export const STAGING_HSM_PROVIDER = 'GCP_CLOUD_KMS' as const;
export const STAGING_HSM_PROJECT_ID = 'orchidpay-staging' as const;
export const STAGING_HSM_LOCATION = 'europe-west9' as const;
export const STAGING_HSM_KEYRING = 'orchidpay-staging' as const;
export const STAGING_HSM_KEY_NAME = 'server-signing-r13-8' as const;
export const STAGING_HSM_KEY_VERSION = '1' as const;
export const STAGING_HSM_KEY_VERSION_RESOURCE = 'projects/orchidpay-staging/locations/europe-west9/keyRings/orchidpay-staging/cryptoKeys/server-signing-r13-8/cryptoKeyVersions/1' as const;
export const STAGING_HSM_ALGORITHM = 'EC_SIGN_P256_SHA256' as const;
export const STAGING_HSM_PROTECTION_LEVEL = 'HSM' as const;
export const STAGING_HSM_KEY_STATE = 'ENABLED' as const;
export const STAGING_HSM_PUBLIC_KEY_SHA256 = 'b15dc1d9a7ba7c74e2479aa29808305436abde2830416628b831a59531eb979e' as const;
export const STAGING_HSM_ATTESTATION_SHA256 = '70e59e14e6690ca5e5df6083ad5dea9335f8e43b8ac332332b68830f80d724f6' as const;
export const STAGING_HSM_CERT_CHAIN_SHA256 = '651c2407c90ec7e38bd9e5fa7783b650b347d47ecf8d5ebfe92f262e6c163de2' as const;
export const STAGING_HSM_R13_8C_R4_BUNDLE_SHA256 = '99e2249adc089a8290868389b46c1a8cbb4ed331470bcdb40b8d753c0ef7eeb2' as const;
export const STAGING_HSM_R13_8D_R2_BUNDLE_SHA256 = '11317cd9e3840eb4279ad9c7c43c4d5392d9cb1470e4466b94ccc43fcd223cf1' as const;
export const STAGING_HSM_MARVELL_ROOT_SHA256 = '975757f0d76640e03d14760f8fc9e3a55826fa7807b2c392f7801a95bd69cc28' as const;
export const STAGING_HSM_MARVELL_ROOT_NOT_AFTER = '2025-11-16T13:55:25Z' as const;
export const STAGING_HSM_RESOURCE_NAME_SHA256 = 'c789f2cb0685911754398e1c98e21574478a48bbbd002fbaa9b12ea54dd1fe9f' as const;
export const STAGING_HSM_PUBLIC_KEY_KCV = '825786' as const;
export const STAGING_HSM_PUBLIC_KEY_EKCV = 'beb87c7f790f1abb855105ac65888d4c81d1a192da3f60ddc2dda9017f77ee49' as const;
export const STAGING_HSM_PROVIDER_REVIEW_CLASSIFICATION = 'STAGING_DOCUMENTARY_EXCEPTION_PRODUCTION_GATE_OPEN' as const;

export const stagingHsmP256BindingPolicy = Object.freeze({
  scope: 'STAGING_HSM_P256_ATTESTED_BINDING_ONLY' as const,
  hsmKeyProvisioned: true as const,
  attestationVerified: true as const,
  resourceBindingVerified: true as const,
  publicKeyBindingVerified: true as const,
  privateKeyNonExtractableVerified: true as const,
  privateKeyLocalGenerationVerified: true as const,
  manufacturerRootCurrentTimeValid: false as const,
  productionEligible: false as const,
  networkExecutionEnabled: false as const,
  livePaymentExecutionEnabled: false as const,
});

export type StagingHsmP256Binding = {
  v: typeof STAGING_HSM_BINDING_VERSION;
  release: typeof STAGING_HSM_BINDING_RELEASE;
  provider: typeof STAGING_HSM_PROVIDER;
  projectId: typeof STAGING_HSM_PROJECT_ID;
  location: typeof STAGING_HSM_LOCATION;
  keyVersionResource: typeof STAGING_HSM_KEY_VERSION_RESOURCE;
  algorithm: typeof STAGING_HSM_ALGORITHM;
  protectionLevel: typeof STAGING_HSM_PROTECTION_LEVEL;
  keyState: typeof STAGING_HSM_KEY_STATE;
  publicKeySha256: typeof STAGING_HSM_PUBLIC_KEY_SHA256;
  attestationSha256: typeof STAGING_HSM_ATTESTATION_SHA256;
  certificateChainSha256: typeof STAGING_HSM_CERT_CHAIN_SHA256;
  r13_8cR4BundleSha256: typeof STAGING_HSM_R13_8C_R4_BUNDLE_SHA256;
  r13_8dR2BundleSha256: typeof STAGING_HSM_R13_8D_R2_BUNDLE_SHA256;
  manufacturerRootSha256: typeof STAGING_HSM_MARVELL_ROOT_SHA256;
  manufacturerRootNotAfter: typeof STAGING_HSM_MARVELL_ROOT_NOT_AFTER;
  resourceNameSha256: typeof STAGING_HSM_RESOURCE_NAME_SHA256;
  publicKeyKcv: typeof STAGING_HSM_PUBLIC_KEY_KCV;
  publicKeyEkcv: typeof STAGING_HSM_PUBLIC_KEY_EKCV;
  manufacturerRootCurrentTimeValid: false;
  productionEligible: false;
};

export const stagingHsmP256Binding: StagingHsmP256Binding = Object.freeze({
  v: STAGING_HSM_BINDING_VERSION,
  release: STAGING_HSM_BINDING_RELEASE,
  provider: STAGING_HSM_PROVIDER,
  projectId: STAGING_HSM_PROJECT_ID,
  location: STAGING_HSM_LOCATION,
  keyVersionResource: STAGING_HSM_KEY_VERSION_RESOURCE,
  algorithm: STAGING_HSM_ALGORITHM,
  protectionLevel: STAGING_HSM_PROTECTION_LEVEL,
  keyState: STAGING_HSM_KEY_STATE,
  publicKeySha256: STAGING_HSM_PUBLIC_KEY_SHA256,
  attestationSha256: STAGING_HSM_ATTESTATION_SHA256,
  certificateChainSha256: STAGING_HSM_CERT_CHAIN_SHA256,
  r13_8cR4BundleSha256: STAGING_HSM_R13_8C_R4_BUNDLE_SHA256,
  r13_8dR2BundleSha256: STAGING_HSM_R13_8D_R2_BUNDLE_SHA256,
  manufacturerRootSha256: STAGING_HSM_MARVELL_ROOT_SHA256,
  manufacturerRootNotAfter: STAGING_HSM_MARVELL_ROOT_NOT_AFTER,
  resourceNameSha256: STAGING_HSM_RESOURCE_NAME_SHA256,
  publicKeyKcv: STAGING_HSM_PUBLIC_KEY_KCV,
  publicKeyEkcv: STAGING_HSM_PUBLIC_KEY_EKCV,
  manufacturerRootCurrentTimeValid: false,
  productionEligible: false,
});

export type StagingHsmBindingInspection = { ok: true; digest: string } | { ok: false; code: string };

async function sha(value: string) { return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value); }
function upper16(hex: string) { return hex.slice(0, 16).toUpperCase(); }
function isSha256(value: string) { return /^[a-f0-9]{64}$/.test(value); }

function canonical(value: StagingHsmP256Binding) {
  return [
    value.v, value.release, value.provider, value.projectId, value.location, value.keyVersionResource,
    value.algorithm, value.protectionLevel, value.keyState, value.publicKeySha256, value.attestationSha256,
    value.certificateChainSha256, value.r13_8cR4BundleSha256, value.r13_8dR2BundleSha256,
    value.manufacturerRootSha256, value.manufacturerRootNotAfter, value.resourceNameSha256,
    value.publicKeyKcv, value.publicKeyEkcv, value.manufacturerRootCurrentTimeValid ? 1 : 0,
    value.productionEligible ? 1 : 0,
  ].join('|');
}

export async function deriveStagingHsmP256BindingDigest(value: StagingHsmP256Binding = stagingHsmP256Binding) {
  return `HSMB-${upper16(await sha(canonical(value)))}`;
}

export async function inspectStagingHsmP256Binding(value: StagingHsmP256Binding = stagingHsmP256Binding): Promise<StagingHsmBindingInspection> {
  if (value.v !== STAGING_HSM_BINDING_VERSION || value.release !== STAGING_HSM_BINDING_RELEASE) return { ok: false, code: 'HSM_BINDING_VERSION' };
  if (value.provider !== STAGING_HSM_PROVIDER || value.projectId !== STAGING_HSM_PROJECT_ID || value.location !== STAGING_HSM_LOCATION) return { ok: false, code: 'HSM_BINDING_PROVIDER' };
  if (value.keyVersionResource !== STAGING_HSM_KEY_VERSION_RESOURCE || value.algorithm !== STAGING_HSM_ALGORITHM || value.protectionLevel !== STAGING_HSM_PROTECTION_LEVEL || value.keyState !== STAGING_HSM_KEY_STATE) return { ok: false, code: 'HSM_BINDING_KEY' };
  if (![value.publicKeySha256,value.attestationSha256,value.certificateChainSha256,value.r13_8cR4BundleSha256,value.r13_8dR2BundleSha256,value.manufacturerRootSha256,value.resourceNameSha256,value.publicKeyEkcv].every(isSha256)) return { ok: false, code: 'HSM_BINDING_DIGEST_FORMAT' };
  if (!/^\d{6}$/.test(value.publicKeyKcv)) return { ok: false, code: 'HSM_BINDING_KCV_FORMAT' };
  if (value.manufacturerRootNotAfter !== STAGING_HSM_MARVELL_ROOT_NOT_AFTER || value.manufacturerRootCurrentTimeValid !== false || value.productionEligible !== false) return { ok: false, code: 'HSM_BINDING_PRODUCTION_POLICY' };
  return { ok: true, digest: await deriveStagingHsmP256BindingDigest(value) };
}

export function buildStagingHsmP256BindingSnapshot(value: StagingHsmP256Binding = stagingHsmP256Binding) {
  return [
    `stagingHsmBinding=${value.release}`,
    `provider=${value.provider}`,
    `project=${value.projectId}`,
    `location=${value.location}`,
    `keyVersionResource=${value.keyVersionResource}`,
    `algorithm=${value.algorithm}`,
    `protection=${value.protectionLevel}`,
    `state=${value.keyState}`,
    `publicKeySha256=${value.publicKeySha256}`,
    `r13_8dR2EvidenceSha256=${value.r13_8dR2BundleSha256}`,
    'attestationVerified=true',
    'privateKeyNonExtractable=true',
    'privateKeyLocalGeneration=true',
    'manufacturerRootCurrentTimeValid=false',
    `providerReviewClassification=${STAGING_HSM_PROVIDER_REVIEW_CLASSIFICATION}`,
    'productionProviderRootGate=OPEN',
    'productionEligible=false',
    'networkExecution=false',
    'livePaymentExecution=false',
    'rawPrivateKey=NEVER_EXPORTED',
    'rawAccessToken=NOT_STORED',
    'secrets=NONE',
  ].join('\n');
}
