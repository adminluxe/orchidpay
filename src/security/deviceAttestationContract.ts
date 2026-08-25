import * as Crypto from 'expo-crypto';

export const DEVICE_ATTESTATION_CONTRACT_VERSION = 1 as const;
export const DEVICE_ATTESTATION_CONTRACT_RELEASE = 'R13.6-DEVICE-ATTESTATION-CONTRACT' as const;
export const MAX_ATTESTATION_CHALLENGE_TTL_MS = 15_000;
export const MAX_ATTESTATION_VERDICT_TTL_MS = 15_000;
export const MAX_ATTESTATION_CLOCK_SKEW_MS = 5_000;

export const deviceAttestationPolicy = Object.freeze({
  scope: 'DEVICE_ATTESTATION_CONTRACT_ONLY' as const,
  productionVerifierProvisioned: false as const,
  providerTrustRootsProvisioned: false as const,
  challengeServiceProvisioned: false as const,
  networkExecutionEnabled: false as const,
  strongDeviceAttestationClaim: false as const,
});

export type DeviceAttestationProvider = 'APPLE_PROVIDER' | 'ANDROID_PROVIDER' | 'LAB_PROVIDER';
export type DeviceAttestationChallenge = {
  v: 1;
  release: typeof DEVICE_ATTESTATION_CONTRACT_RELEASE;
  provider: DeviceAttestationProvider;
  parentRemoteProof: string;
  challengeNonceDigest: string;
  deviceDigest: string;
  appInstanceDigest: string;
  issuedAt: number;
  expiresAt: number;
  digest: string;
};
export type DeviceAttestationVerdict = {
  v: 1;
  release: typeof DEVICE_ATTESTATION_CONTRACT_RELEASE;
  challengeDigest: string;
  statementDigest: string;
  verifierKeyId: string;
  verdict: 'MEETS_CONTRACT' | 'REJECTED';
  issuedAt: number;
  expiresAt: number;
  digest: string;
};
export type DeviceAttestationInspection = { ok: true } | { ok: false; code: string };
export type DeviceAttestationLabVerifier = {
  mode: 'LAB_INJECTED_VERIFIER';
  verifyStatement: (verdict: DeviceAttestationVerdict) => Promise<boolean>;
};

async function sha(value: string) { return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value); }
function upper16(hex: string) { return hex.slice(0, 16).toUpperCase(); }
function valid(value: string, prefix: string) { return new RegExp(`^${prefix}-[A-F0-9]{16}$`).test(value); }
function canonicalChallenge(value: Omit<DeviceAttestationChallenge, 'digest'>) {
  return [value.v, value.release, value.provider, value.parentRemoteProof, value.challengeNonceDigest, value.deviceDigest, value.appInstanceDigest, value.issuedAt, value.expiresAt].join('|');
}
function canonicalVerdict(value: Omit<DeviceAttestationVerdict, 'digest'>) {
  return [value.v, value.release, value.challengeDigest, value.statementDigest, value.verifierKeyId, value.verdict, value.issuedAt, value.expiresAt].join('|');
}

export async function buildDeviceAttestationChallenge(input: Omit<DeviceAttestationChallenge, 'v' | 'release' | 'digest'>): Promise<DeviceAttestationChallenge> {
  const core: Omit<DeviceAttestationChallenge, 'digest'> = { v: 1, release: DEVICE_ATTESTATION_CONTRACT_RELEASE, ...input };
  return { ...core, digest: `DAC-${upper16(await sha(canonicalChallenge(core)))}` };
}
export async function inspectDeviceAttestationChallenge(value: DeviceAttestationChallenge, now: number): Promise<DeviceAttestationInspection> {
  if (value.v !== DEVICE_ATTESTATION_CONTRACT_VERSION || value.release !== DEVICE_ATTESTATION_CONTRACT_RELEASE) return { ok: false, code: 'CHALLENGE_VERSION' };
  if (!['APPLE_PROVIDER', 'ANDROID_PROVIDER', 'LAB_PROVIDER'].includes(value.provider)) return { ok: false, code: 'CHALLENGE_PROVIDER' };
  if (!/^RAP-[A-F0-9]{16}$/.test(value.parentRemoteProof) || !valid(value.challengeNonceDigest, 'AN') || !valid(value.deviceDigest, 'AD') || !valid(value.appInstanceDigest, 'AI')) return { ok: false, code: 'CHALLENGE_BINDING' };
  if (!Number.isSafeInteger(value.issuedAt) || !Number.isSafeInteger(value.expiresAt) || value.issuedAt <= 0 || value.expiresAt <= value.issuedAt) return { ok: false, code: 'CHALLENGE_TIME' };
  if (value.expiresAt - value.issuedAt > MAX_ATTESTATION_CHALLENGE_TTL_MS) return { ok: false, code: 'CHALLENGE_TTL_TOO_LONG' };
  if (value.issuedAt - now > MAX_ATTESTATION_CLOCK_SKEW_MS) return { ok: false, code: 'CHALLENGE_FUTURE' };
  if (now > value.expiresAt) return { ok: false, code: 'CHALLENGE_EXPIRED' };
  if (!valid(value.digest, 'DAC')) return { ok: false, code: 'CHALLENGE_DIGEST_FORMAT' };
  const { digest, ...core } = value;
  if (digest !== `DAC-${upper16(await sha(canonicalChallenge(core)))}`) return { ok: false, code: 'CHALLENGE_DIGEST_MISMATCH' };
  return { ok: true };
}

export async function buildDeviceAttestationVerdict(input: Omit<DeviceAttestationVerdict, 'v' | 'release' | 'digest'>): Promise<DeviceAttestationVerdict> {
  const core: Omit<DeviceAttestationVerdict, 'digest'> = { v: 1, release: DEVICE_ATTESTATION_CONTRACT_RELEASE, ...input };
  return { ...core, digest: `DAV-${upper16(await sha(canonicalVerdict(core)))}` };
}
export async function inspectDeviceAttestationVerdict(value: DeviceAttestationVerdict, challenge: DeviceAttestationChallenge, now: number): Promise<DeviceAttestationInspection> {
  const c = await inspectDeviceAttestationChallenge(challenge, now);
  if (!c.ok) return { ok: false, code: `CHALLENGE_${c.code}` };
  if (value.v !== DEVICE_ATTESTATION_CONTRACT_VERSION || value.release !== DEVICE_ATTESTATION_CONTRACT_RELEASE) return { ok: false, code: 'VERDICT_VERSION' };
  if (value.challengeDigest !== challenge.digest || !valid(value.challengeDigest, 'DAC') || !valid(value.statementDigest, 'DS')) return { ok: false, code: 'VERDICT_BINDING' };
  if (!/^attkey\.[a-z0-9][a-z0-9._-]{7,79}$/.test(value.verifierKeyId)) return { ok: false, code: 'VERDICT_KEY' };
  if (!['MEETS_CONTRACT', 'REJECTED'].includes(value.verdict)) return { ok: false, code: 'VERDICT_VALUE' };
  if (!Number.isSafeInteger(value.issuedAt) || !Number.isSafeInteger(value.expiresAt) || value.issuedAt <= 0 || value.expiresAt <= value.issuedAt) return { ok: false, code: 'VERDICT_TIME' };
  if (value.expiresAt - value.issuedAt > MAX_ATTESTATION_VERDICT_TTL_MS) return { ok: false, code: 'VERDICT_TTL_TOO_LONG' };
  if (value.issuedAt - now > MAX_ATTESTATION_CLOCK_SKEW_MS) return { ok: false, code: 'VERDICT_FUTURE' };
  if (now > value.expiresAt) return { ok: false, code: 'VERDICT_EXPIRED' };
  if (!valid(value.digest, 'DAV')) return { ok: false, code: 'VERDICT_DIGEST_FORMAT' };
  const { digest, ...core } = value;
  if (digest !== `DAV-${upper16(await sha(canonicalVerdict(core)))}`) return { ok: false, code: 'VERDICT_DIGEST_MISMATCH' };
  return { ok: true };
}

export async function verifyDeviceAttestationVerdict(value: DeviceAttestationVerdict, challenge: DeviceAttestationChallenge, now: number, verifier?: DeviceAttestationLabVerifier) {
  const inspected = await inspectDeviceAttestationVerdict(value, challenge, now);
  if (!inspected.ok) return { ok: false as const, code: inspected.code };
  if (!verifier) return { ok: false as const, code: 'DEVICE_ATTESTATION_VERIFIER_NOT_PROVISIONED' };
  if (verifier.mode !== 'LAB_INJECTED_VERIFIER') return { ok: false as const, code: 'DEVICE_ATTESTATION_VERIFIER_MODE' };
  if (!(await verifier.verifyStatement(value))) return { ok: false as const, code: 'DEVICE_ATTESTATION_STATEMENT_INVALID' };
  if (value.verdict !== 'MEETS_CONTRACT') return { ok: false as const, code: 'DEVICE_ATTESTATION_REJECTED' };
  return { ok: true as const, verificationClass: 'LAB_INJECTED_ONLY' as const, verdict: value };
}

export async function deriveDeviceAttestationPolicyDigest() {
  const raw = [DEVICE_ATTESTATION_CONTRACT_VERSION, DEVICE_ATTESTATION_CONTRACT_RELEASE, MAX_ATTESTATION_CHALLENGE_TTL_MS, MAX_ATTESTATION_VERDICT_TTL_MS, MAX_ATTESTATION_CLOCK_SKEW_MS, deviceAttestationPolicy.scope, 0, 0, 0, 0, 0].join('|');
  return `DAPOL-${upper16(await sha(raw))}`;
}

export function buildDeviceAttestationContractSnapshot(challenge: DeviceAttestationChallenge | null, verdict: DeviceAttestationVerdict | null) {
  return [
    `deviceAttestationContract=${DEVICE_ATTESTATION_CONTRACT_RELEASE}`,
    `challenge=${challenge?.digest || 'NONE'}`,
    `verdict=${verdict?.digest || 'NONE'}`,
    `parentRemote=${challenge?.parentRemoteProof || 'NONE'}`,
    `provider=${challenge?.provider || 'NONE'}`,
    'productionVerifier=false',
    'providerTrustRoots=false',
    'challengeService=false',
    'networkExecution=false',
    'strongDeviceAttestation=false',
    'rawAttestationStatement=NOT_STORED',
    'secrets=NONE',
  ].join('\n');
}
