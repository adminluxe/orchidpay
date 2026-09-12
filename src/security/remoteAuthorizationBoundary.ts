import * as Crypto from 'expo-crypto';
import type { IntentAuthorizationEnvelope } from './intentAuthorizationEnvelope';

export const REMOTE_AUTHORIZATION_VERSION = 1 as const;
export const REMOTE_AUTHORIZATION_RELEASE = 'R13.5-REMOTE-AUTHORIZATION-BOUNDARY' as const;
export const REMOTE_AUTHORIZATION_ALGORITHM = 'Ed25519' as const;
export const MAX_REMOTE_DECISION_TTL_MS = 15_000 as const;
export const MAX_DEVICE_ATTESTATION_TTL_MS = 15_000 as const;
export const MAX_REMOTE_CLOCK_SKEW_MS = 5_000 as const;

export const remoteAuthorizationPolicy = Object.freeze({
  scope: 'REMOTE_AUTHORIZATION_CONTRACT_PREP_ONLY' as const,
  algorithm: REMOTE_AUTHORIZATION_ALGORITHM,
  maxDecisionTtlMs: MAX_REMOTE_DECISION_TTL_MS,
  maxDeviceAttestationTtlMs: MAX_DEVICE_ATTESTATION_TTL_MS,
  maxClockSkewMs: MAX_REMOTE_CLOCK_SKEW_MS,
  serverSignatureVerifierProvisioned: false as const,
  deviceAttestationVerifierProvisioned: false as const,
  serverReplayLedgerProvisioned: false as const,
  trustedServerClockProvisioned: false as const,
  networkExecutionEnabled: false as const,
  livePaymentExecutionEnabled: false as const,
  strongRemoteAuthorizationClaim: false as const,
});

export type DeviceAttestationProvider = 'APPLE_APP_ATTEST' | 'GOOGLE_PLAY_INTEGRITY';
export type DevicePlatform = 'ios' | 'android';
export type RemoteAuthorizationDecisionKind = 'ALLOW' | 'DENY';

export type DeviceAttestationBinding = {
  v: 1;
  release: typeof REMOTE_AUTHORIZATION_RELEASE;
  provider: DeviceAttestationProvider;
  platform: DevicePlatform;
  keyId: string;
  challengeDigest: string;
  deviceDigest: string;
  issuedAt: number;
  expiresAt: number;
  evidenceRef: string;
  digest: string;
};

export type RemoteAuthorizationDecision = {
  v: 1;
  release: typeof REMOTE_AUTHORIZATION_RELEASE;
  algorithm: typeof REMOTE_AUTHORIZATION_ALGORITHM;
  decision: RemoteAuthorizationDecisionKind;
  reasonCode: string;
  authorizationEnvelopeDigest: string;
  intentDigest: string;
  principalDigest: string;
  deviceDigest: string;
  authorizationNonceDigest: string;
  attestationDigest: string;
  parentAuthorizationProof: string;
  serverKeyId: string;
  serverSequence: number;
  replayLedgerRef: string;
  timeAnchorRef: string;
  issuedAt: number;
  expiresAt: number;
  digest: string;
  signature: string;
};

export type RemoteAuthorizationInspection = { ok: true } | { ok: false; code: string };
export type RemoteAuthorizationVerification =
  | { ok: true; verificationClass: 'LAB_INJECTED_ONLY'; decision: RemoteAuthorizationDecision }
  | { ok: false; code: string };

export type RemoteAuthorizationLabVerifiers = {
  mode: 'LAB_INJECTED_VERIFIERS';
  verifyServerSignature: (canonical: string, signature: string, keyId: string) => Promise<boolean> | boolean;
  verifyDeviceAttestation: (binding: DeviceAttestationBinding) => Promise<boolean> | boolean;
};

async function sha(value: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}
function upper16(hex: string) { return hex.slice(0, 16).toUpperCase(); }
function validDigest(value: string, prefix: string) { return new RegExp(`^${prefix}-[A-F0-9]{16}$`).test(value); }
function safeRef(value: string, min = 8, max = 96) { return typeof value === 'string' && new RegExp(`^[A-Za-z0-9._:@-]{${min},${max}}$`).test(value); }
function validSignature(value: string) { return typeof value === 'string' && /^[A-Za-z0-9._+\/-]{24,512}$/.test(value); }

function canonicalAttestation(value: Omit<DeviceAttestationBinding, 'digest'>) {
  return [value.v, value.release, value.provider, value.platform, value.keyId, value.challengeDigest, value.deviceDigest, value.issuedAt, value.expiresAt, value.evidenceRef].join('|');
}

export async function buildDeviceAttestationBinding(input: Omit<DeviceAttestationBinding, 'v' | 'release' | 'digest'>): Promise<DeviceAttestationBinding> {
  const core: Omit<DeviceAttestationBinding, 'digest'> = { v: 1, release: REMOTE_AUTHORIZATION_RELEASE, ...input };
  return { ...core, digest: `DA-${upper16(await sha(canonicalAttestation(core)))}` };
}

export async function inspectDeviceAttestationBinding(binding: DeviceAttestationBinding, now: number): Promise<RemoteAuthorizationInspection> {
  if (binding.v !== REMOTE_AUTHORIZATION_VERSION || binding.release !== REMOTE_AUTHORIZATION_RELEASE) return { ok: false, code: 'ATTESTATION_VERSION' };
  if ((binding.provider === 'APPLE_APP_ATTEST' && binding.platform !== 'ios') || (binding.provider === 'GOOGLE_PLAY_INTEGRITY' && binding.platform !== 'android')) return { ok: false, code: 'ATTESTATION_PLATFORM_PROVIDER_MISMATCH' };
  if (!safeRef(binding.keyId, 8, 128)) return { ok: false, code: 'ATTESTATION_KEY_ID_INVALID' };
  if (!validDigest(binding.challengeDigest, 'AN')) return { ok: false, code: 'ATTESTATION_CHALLENGE_INVALID' };
  if (!validDigest(binding.deviceDigest, 'AD')) return { ok: false, code: 'ATTESTATION_DEVICE_INVALID' };
  if (!safeRef(binding.evidenceRef, 8, 128)) return { ok: false, code: 'ATTESTATION_EVIDENCE_REF_INVALID' };
  if (!Number.isSafeInteger(binding.issuedAt) || !Number.isSafeInteger(binding.expiresAt) || binding.issuedAt <= 0 || binding.expiresAt <= binding.issuedAt) return { ok: false, code: 'ATTESTATION_TIME_INVALID' };
  if (binding.issuedAt > now + MAX_REMOTE_CLOCK_SKEW_MS) return { ok: false, code: 'ATTESTATION_CLOCK_SKEW_FUTURE' };
  if (binding.expiresAt <= now) return { ok: false, code: 'ATTESTATION_EXPIRED' };
  if (binding.expiresAt - binding.issuedAt > MAX_DEVICE_ATTESTATION_TTL_MS) return { ok: false, code: 'ATTESTATION_TTL_TOO_LONG' };
  if (!validDigest(binding.digest, 'DA')) return { ok: false, code: 'ATTESTATION_DIGEST_INVALID' };
  const { digest, ...core } = binding;
  const expected = `DA-${upper16(await sha(canonicalAttestation(core)))}`;
  if (digest !== expected) return { ok: false, code: 'ATTESTATION_DIGEST_MISMATCH' };
  return { ok: true };
}

function canonicalDecisionCore(value: Omit<RemoteAuthorizationDecision, 'digest' | 'signature'>) {
  return [
    value.v, value.release, value.algorithm, value.decision, value.reasonCode,
    value.authorizationEnvelopeDigest, value.intentDigest, value.principalDigest, value.deviceDigest,
    value.authorizationNonceDigest, value.attestationDigest, value.parentAuthorizationProof,
    value.serverKeyId, value.serverSequence, value.replayLedgerRef, value.timeAnchorRef,
    value.issuedAt, value.expiresAt,
  ].join('|');
}

export async function buildRemoteAuthorizationDecision(
  input: Omit<RemoteAuthorizationDecision, 'v' | 'release' | 'algorithm' | 'digest'>,
): Promise<RemoteAuthorizationDecision> {
  const core: Omit<RemoteAuthorizationDecision, 'digest' | 'signature'> = {
    v: 1,
    release: REMOTE_AUTHORIZATION_RELEASE,
    algorithm: REMOTE_AUTHORIZATION_ALGORITHM,
    decision: input.decision,
    reasonCode: input.reasonCode,
    authorizationEnvelopeDigest: input.authorizationEnvelopeDigest,
    intentDigest: input.intentDigest,
    principalDigest: input.principalDigest,
    deviceDigest: input.deviceDigest,
    authorizationNonceDigest: input.authorizationNonceDigest,
    attestationDigest: input.attestationDigest,
    parentAuthorizationProof: input.parentAuthorizationProof,
    serverKeyId: input.serverKeyId,
    serverSequence: input.serverSequence,
    replayLedgerRef: input.replayLedgerRef,
    timeAnchorRef: input.timeAnchorRef,
    issuedAt: input.issuedAt,
    expiresAt: input.expiresAt,
  };
  return { ...core, digest: `RD-${upper16(await sha(canonicalDecisionCore(core)))}`, signature: input.signature };
}

export async function inspectRemoteAuthorizationDecision(
  decision: RemoteAuthorizationDecision,
  envelope: IntentAuthorizationEnvelope,
  attestation: DeviceAttestationBinding,
  now: number,
): Promise<RemoteAuthorizationInspection> {
  if (decision.v !== REMOTE_AUTHORIZATION_VERSION || decision.release !== REMOTE_AUTHORIZATION_RELEASE || decision.algorithm !== REMOTE_AUTHORIZATION_ALGORITHM) return { ok: false, code: 'DECISION_VERSION' };
  if (decision.decision !== 'ALLOW' && decision.decision !== 'DENY') return { ok: false, code: 'DECISION_KIND_INVALID' };
  if (!/^[A-Z0-9_]{2,48}$/.test(decision.reasonCode)) return { ok: false, code: 'DECISION_REASON_INVALID' };
  if (!Number.isSafeInteger(decision.issuedAt) || !Number.isSafeInteger(decision.expiresAt) || decision.issuedAt <= 0 || decision.expiresAt <= decision.issuedAt) return { ok: false, code: 'DECISION_TIME_INVALID' };
  if (decision.issuedAt > now + MAX_REMOTE_CLOCK_SKEW_MS) return { ok: false, code: 'DECISION_CLOCK_SKEW_FUTURE' };
  if (decision.expiresAt <= now) return { ok: false, code: 'DECISION_EXPIRED' };
  if (decision.expiresAt - decision.issuedAt > MAX_REMOTE_DECISION_TTL_MS) return { ok: false, code: 'DECISION_TTL_TOO_LONG' };
  if (!validDigest(decision.authorizationEnvelopeDigest, 'AE') || decision.authorizationEnvelopeDigest !== envelope.digest) return { ok: false, code: 'DECISION_ENVELOPE_MISMATCH' };
  if (!validDigest(decision.intentDigest, 'RI') || decision.intentDigest !== envelope.intentDigest) return { ok: false, code: 'DECISION_INTENT_MISMATCH' };
  if (!validDigest(decision.principalDigest, 'AP') || decision.principalDigest !== envelope.principalDigest) return { ok: false, code: 'DECISION_PRINCIPAL_MISMATCH' };
  if (!validDigest(decision.deviceDigest, 'AD') || decision.deviceDigest !== envelope.deviceDigest || decision.deviceDigest !== attestation.deviceDigest) return { ok: false, code: 'DECISION_DEVICE_MISMATCH' };
  if (!validDigest(decision.authorizationNonceDigest, 'AN') || decision.authorizationNonceDigest !== envelope.authorizationNonceDigest || decision.authorizationNonceDigest !== attestation.challengeDigest) return { ok: false, code: 'DECISION_NONCE_MISMATCH' };
  if (!validDigest(decision.attestationDigest, 'DA') || decision.attestationDigest !== attestation.digest) return { ok: false, code: 'DECISION_ATTESTATION_MISMATCH' };
  if (!/^IAP-[A-F0-9]{16}$/.test(decision.parentAuthorizationProof)) return { ok: false, code: 'DECISION_PARENT_AUTH_INVALID' };
  if (!safeRef(decision.serverKeyId, 8, 128)) return { ok: false, code: 'DECISION_SERVER_KEY_INVALID' };
  if (!Number.isSafeInteger(decision.serverSequence) || decision.serverSequence <= 0) return { ok: false, code: 'DECISION_SEQUENCE_INVALID' };
  if (!/^SRL-[A-F0-9]{16}$/.test(decision.replayLedgerRef)) return { ok: false, code: 'DECISION_LEDGER_REF_INVALID' };
  if (!/^STA-[A-F0-9]{16}$/.test(decision.timeAnchorRef)) return { ok: false, code: 'DECISION_TIME_ANCHOR_INVALID' };
  if (!validSignature(decision.signature)) return { ok: false, code: 'DECISION_SIGNATURE_FORMAT_INVALID' };
  if (!validDigest(decision.digest, 'RD')) return { ok: false, code: 'DECISION_DIGEST_INVALID' };
  const { digest, signature: _signature, ...core } = decision;
  const expected = `RD-${upper16(await sha(canonicalDecisionCore(core)))}`;
  if (digest !== expected) return { ok: false, code: 'DECISION_DIGEST_MISMATCH' };
  const attestationStatus = await inspectDeviceAttestationBinding(attestation, now);
  if (!attestationStatus.ok) return { ok: false, code: `DECISION_${attestationStatus.code}` };
  return { ok: true };
}

export async function verifyRemoteAuthorizationDecision(
  decision: RemoteAuthorizationDecision,
  envelope: IntentAuthorizationEnvelope,
  attestation: DeviceAttestationBinding,
  now: number,
  verifiers?: RemoteAuthorizationLabVerifiers,
): Promise<RemoteAuthorizationVerification> {
  const inspected = await inspectRemoteAuthorizationDecision(decision, envelope, attestation, now);
  if (!inspected.ok) return inspected;
  if (!verifiers || verifiers.mode !== 'LAB_INJECTED_VERIFIERS') return { ok: false, code: 'SERVER_AUTHORIZATION_VERIFIER_NOT_PROVISIONED' };
  const attestationValid = await verifiers.verifyDeviceAttestation(attestation);
  if (!attestationValid) return { ok: false, code: 'DEVICE_ATTESTATION_INVALID' };
  const { digest: _digest, signature: _signature, ...core } = decision;
  const canonical = `${canonicalDecisionCore(core)}|${decision.digest}`;
  const signatureValid = await verifiers.verifyServerSignature(canonical, decision.signature, decision.serverKeyId);
  if (!signatureValid) return { ok: false, code: 'SERVER_SIGNATURE_INVALID' };
  return { ok: true, verificationClass: 'LAB_INJECTED_ONLY', decision };
}

export async function deriveRemoteAuthorizationPolicyDigest() {
  const raw = [
    REMOTE_AUTHORIZATION_VERSION, REMOTE_AUTHORIZATION_RELEASE, REMOTE_AUTHORIZATION_ALGORITHM,
    remoteAuthorizationPolicy.scope, MAX_REMOTE_DECISION_TTL_MS, MAX_DEVICE_ATTESTATION_TTL_MS,
    MAX_REMOTE_CLOCK_SKEW_MS, 0, 0, 0, 0, 0, 0, 0,
  ].join('|');
  return `RAPOL-${upper16(await sha(raw))}`;
}

export function buildRemoteAuthorizationSnapshot(decision: RemoteAuthorizationDecision | null, attestation: DeviceAttestationBinding | null) {
  return [
    `remoteAuthorization=${REMOTE_AUTHORIZATION_RELEASE}`,
    `scope=${remoteAuthorizationPolicy.scope}`,
    `algorithm=${REMOTE_AUTHORIZATION_ALGORITHM}`,
    `decision=${decision?.decision || 'NONE'}`,
    `decisionDigest=${decision?.digest || 'NONE'}`,
    `attestationDigest=${attestation?.digest || 'NONE'}`,
    `authorizationEnvelope=${decision?.authorizationEnvelopeDigest || 'NONE'}`,
    `serverSequence=${decision?.serverSequence || 0}`,
    `replayLedgerRef=${decision?.replayLedgerRef || 'NONE'}`,
    `timeAnchorRef=${decision?.timeAnchorRef || 'NONE'}`,
    'rawDeviceEvidence=NOT_STORED',
    'rawServerSignature=NOT_EXPORTED',
    'serverSignatureVerifierProvisioned=false',
    'deviceAttestationVerifierProvisioned=false',
    'serverReplayLedgerProvisioned=false',
    'trustedServerClockProvisioned=false',
    'networkExecution=false',
    'livePaymentExecution=false',
    'strongRemoteAuthorizationClaim=false',
    'secrets=NONE',
  ].join('\n');
}
