import * as Crypto from 'expo-crypto';
import {
  MAX_INTENT_TTL_MS,
  liveOperations,
  validateIntentDraft,
  type IntentDraft,
  type LiveOperation,
} from './backendContract';
import {
  MAX_CLOCK_SKEW_MS,
  deriveReplayMaterials,
  intentReplayPolicy,
} from './intentReplayGuard';

export const INTENT_AUTHORIZATION_VERSION = 1 as const;
export const INTENT_AUTHORIZATION_RELEASE = 'R13.4-INTENT-AUTHORIZATION-ENVELOPE' as const;
export const MAX_AUTHORIZATION_TTL_MS = 30_000 as const;
export const MAX_AUTHORIZATION_TRACE_EVENTS = 4 as const;
export const AUTHORIZATION_GENESIS = 'GENESIS' as const;

export const intentAuthorizationPolicy = Object.freeze({
  scope: 'LOCAL_PREAUTHORIZATION_ONLY' as const,
  maxAuthorizationTtlMs: MAX_AUTHORIZATION_TTL_MS,
  maxClockSkewMs: MAX_CLOCK_SKEW_MS,
  maxTraceEvents: MAX_AUTHORIZATION_TRACE_EVENTS,
  reviewedBeforeAuthorizeRequired: true as const,
  serverAuthorizationVerifierProvisioned: false as const,
  deviceAttestationProvisioned: false as const,
  externalClockAnchorProvisioned: false as const,
  networkExecutionEnabled: false as const,
  strongAuthorizationClaim: false as const,
});

export type AuthorizationStage = 'DRAFT' | 'REVIEWED' | 'AUTHORIZED' | 'CONSUMED' | 'REJECTED' | 'EXPIRED';

export type AuthorizationContext = {
  principalRef: string;
  deviceRef: string;
  authorizationNonce: string;
  parentReplayProof: string;
  parentBackendProof: string;
  boundaryLineage: string;
  contractLineage: string;
  issuedAt: number;
  expiresAt: number;
};

export type IntentAuthorizationEnvelope = {
  v: 1;
  release: typeof INTENT_AUTHORIZATION_RELEASE;
  issuedAt: number;
  expiresAt: number;
  operation: LiveOperation;
  amountMinor: number;
  currency: string;
  intentDigest: string;
  nonceDigest: string;
  idempotencyDigest: string;
  subjectDigest: string;
  principalDigest: string;
  deviceDigest: string;
  authorizationNonceDigest: string;
  parentReplayProof: string;
  parentBackendProof: string;
  boundaryLineage: string;
  contractLineage: string;
  digest: string;
};

export type AuthorizationTraceEvent = {
  seq: number;
  stage: AuthorizationStage;
  at: number;
  envelopeDigest: string;
  prevDigest: string;
  digest: string;
};

export type IntentAuthorizationTrace = {
  v: 1;
  release: typeof INTENT_AUTHORIZATION_RELEASE;
  envelopeDigest: string;
  anchorDigest: string;
  events: AuthorizationTraceEvent[];
  headDigest: string;
};

export type AuthorizationInspection = { ok: true } | { ok: false; code: string };

async function sha(value: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}

function upper16(hex: string) {
  return hex.slice(0, 16).toUpperCase();
}

function validDigest(value: string, prefix: string) {
  return new RegExp(`^${prefix}-[A-F0-9]{16}$`).test(value);
}

function validTraceHead(value: string) {
  return value === AUTHORIZATION_GENESIS || validDigest(value, 'AT');
}

function referenceIsSafe(value: string) {
  return typeof value === 'string' && /^[A-Za-z0-9._:@-]{8,96}$/.test(value);
}

function authorizationNonceIsSafe(value: string) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{16,96}$/.test(value);
}

export function inspectAuthorizationContext(draft: IntentDraft, context: AuthorizationContext, now: number): AuthorizationInspection {
  if (!Number.isSafeInteger(now) || now <= 0) return { ok: false, code: 'NOW_INVALID' };
  const contract = validateIntentDraft(draft, now);
  if (!contract.ok) return { ok: false, code: `CONTRACT_${contract.code}` };
  if (typeof draft.amountMinor !== 'number' || !Number.isSafeInteger(draft.amountMinor)) return { ok: false, code: 'AUTH_AMOUNT_REQUIRED' };
  if (typeof draft.currency !== 'string' || !/^[A-Z]{3}$/.test(draft.currency)) return { ok: false, code: 'AUTH_CURRENCY_REQUIRED' };
  if (!referenceIsSafe(context.principalRef)) return { ok: false, code: 'PRINCIPAL_REF_INVALID' };
  if (!referenceIsSafe(context.deviceRef)) return { ok: false, code: 'DEVICE_REF_INVALID' };
  if (!authorizationNonceIsSafe(context.authorizationNonce)) return { ok: false, code: 'AUTH_NONCE_INVALID' };
  if (!/^IRP-[A-F0-9]{16}$/.test(context.parentReplayProof)) return { ok: false, code: 'PARENT_REPLAY_PROOF_INVALID' };
  if (!/^BC-[A-F0-9]{16}$/.test(context.parentBackendProof)) return { ok: false, code: 'PARENT_BACKEND_PROOF_INVALID' };
  if (!/^IBL-[A-F0-9]{16}$/.test(context.boundaryLineage)) return { ok: false, code: 'BOUNDARY_LINEAGE_INVALID' };
  if (!/^BCL-[A-F0-9]{16}$/.test(context.contractLineage)) return { ok: false, code: 'CONTRACT_LINEAGE_INVALID' };
  if (!Number.isSafeInteger(context.issuedAt) || !Number.isSafeInteger(context.expiresAt)) return { ok: false, code: 'AUTH_TIME_INVALID' };
  if (context.issuedAt > now + MAX_CLOCK_SKEW_MS) return { ok: false, code: 'AUTH_CLOCK_SKEW_FUTURE' };
  if (context.expiresAt <= now) return { ok: false, code: 'AUTH_EXPIRED' };
  if (context.expiresAt <= context.issuedAt) return { ok: false, code: 'AUTH_TTL_INVALID' };
  if (context.expiresAt > draft.expiresAt) return { ok: false, code: 'AUTH_OUTLIVES_INTENT' };
  if (context.expiresAt - context.issuedAt > MAX_AUTHORIZATION_TTL_MS) return { ok: false, code: 'AUTH_TTL_TOO_LONG' };
  if (draft.expiresAt - draft.issuedAt > MAX_INTENT_TTL_MS) return { ok: false, code: 'INTENT_TTL_TOO_LONG' };
  if (
    intentReplayPolicy.serverReplayLedgerProvisioned !== false ||
    intentReplayPolicy.externalClockAnchorProvisioned !== false ||
    intentReplayPolicy.networkExecutionEnabled !== false ||
    intentReplayPolicy.strongAntiReplayClaim !== false
  ) return { ok: false, code: 'PARENT_REPLAY_FUSE_OPEN' };
  return { ok: true };
}

export async function deriveAuthorizationMaterials(draft: IntentDraft, context: AuthorizationContext) {
  const replay = await deriveReplayMaterials(draft);
  const [subject, principal, device, authNonce] = await Promise.all([
    sha(`subject|${draft.subjectRef}`),
    sha(`principal|${context.principalRef}`),
    sha(`device|${context.deviceRef}`),
    sha(`authorization-nonce|${context.authorizationNonce}`),
  ]);
  return {
    ...replay,
    subjectDigest: `AS-${upper16(subject)}`,
    principalDigest: `AP-${upper16(principal)}`,
    deviceDigest: `AD-${upper16(device)}`,
    authorizationNonceDigest: `AN-${upper16(authNonce)}`,
  } as const;
}

function canonicalEnvelope(value: Omit<IntentAuthorizationEnvelope, 'digest'>) {
  return [
    value.v,
    value.release,
    value.issuedAt,
    value.expiresAt,
    value.operation,
    value.amountMinor,
    value.currency,
    value.intentDigest,
    value.nonceDigest,
    value.idempotencyDigest,
    value.subjectDigest,
    value.principalDigest,
    value.deviceDigest,
    value.authorizationNonceDigest,
    value.parentReplayProof,
    value.parentBackendProof,
    value.boundaryLineage,
    value.contractLineage,
  ].join('|');
}

export async function validateIntentAuthorizationEnvelope(envelope: IntentAuthorizationEnvelope): Promise<AuthorizationInspection> {
  if (envelope.v !== INTENT_AUTHORIZATION_VERSION || envelope.release !== INTENT_AUTHORIZATION_RELEASE) return { ok: false, code: 'ENVELOPE_VERSION' };
  if (!Number.isSafeInteger(envelope.issuedAt) || !Number.isSafeInteger(envelope.expiresAt) || envelope.issuedAt <= 0 || envelope.expiresAt <= envelope.issuedAt) return { ok: false, code: 'ENVELOPE_TIME_INVALID' };
  if (envelope.expiresAt - envelope.issuedAt > MAX_AUTHORIZATION_TTL_MS) return { ok: false, code: 'ENVELOPE_TTL_TOO_LONG' };
  if (!liveOperations.includes(envelope.operation)) return { ok: false, code: 'ENVELOPE_OPERATION_INVALID' };
  if (!Number.isSafeInteger(envelope.amountMinor) || envelope.amountMinor < 0) return { ok: false, code: 'ENVELOPE_AMOUNT_INVALID' };
  if (!/^[A-Z]{3}$/.test(envelope.currency)) return { ok: false, code: 'ENVELOPE_CURRENCY_INVALID' };
  if (!validDigest(envelope.intentDigest, 'RI')) return { ok: false, code: 'ENVELOPE_INTENT_DIGEST_INVALID' };
  if (!validDigest(envelope.nonceDigest, 'RN')) return { ok: false, code: 'ENVELOPE_NONCE_DIGEST_INVALID' };
  if (!validDigest(envelope.idempotencyDigest, 'RK')) return { ok: false, code: 'ENVELOPE_IDEMPOTENCY_DIGEST_INVALID' };
  if (!validDigest(envelope.subjectDigest, 'AS')) return { ok: false, code: 'ENVELOPE_SUBJECT_DIGEST_INVALID' };
  if (!validDigest(envelope.principalDigest, 'AP')) return { ok: false, code: 'ENVELOPE_PRINCIPAL_DIGEST_INVALID' };
  if (!validDigest(envelope.deviceDigest, 'AD')) return { ok: false, code: 'ENVELOPE_DEVICE_DIGEST_INVALID' };
  if (!validDigest(envelope.authorizationNonceDigest, 'AN')) return { ok: false, code: 'ENVELOPE_AUTH_NONCE_DIGEST_INVALID' };
  if (!/^IRP-[A-F0-9]{16}$/.test(envelope.parentReplayProof)) return { ok: false, code: 'ENVELOPE_PARENT_REPLAY_INVALID' };
  if (!/^BC-[A-F0-9]{16}$/.test(envelope.parentBackendProof)) return { ok: false, code: 'ENVELOPE_PARENT_BACKEND_INVALID' };
  if (!/^IBL-[A-F0-9]{16}$/.test(envelope.boundaryLineage)) return { ok: false, code: 'ENVELOPE_BOUNDARY_LINEAGE_INVALID' };
  if (!/^BCL-[A-F0-9]{16}$/.test(envelope.contractLineage)) return { ok: false, code: 'ENVELOPE_CONTRACT_LINEAGE_INVALID' };
  if (!validDigest(envelope.digest, 'AE')) return { ok: false, code: 'ENVELOPE_DIGEST_INVALID' };
  const { digest, ...core } = envelope;
  const expected = `AE-${upper16(await sha(canonicalEnvelope(core)))}`;
  if (digest !== expected) return { ok: false, code: 'ENVELOPE_DIGEST_MISMATCH' };
  return { ok: true };
}

export async function buildIntentAuthorizationEnvelope(
  draft: IntentDraft,
  context: AuthorizationContext,
  now: number,
): Promise<{ ok: true; envelope: IntentAuthorizationEnvelope } | { ok: false; code: string }> {
  const inspected = inspectAuthorizationContext(draft, context, now);
  if (!inspected.ok) return inspected;
  const amountMinor = draft.amountMinor;
  const currency = draft.currency;
  if (typeof amountMinor !== 'number' || !Number.isSafeInteger(amountMinor)) return { ok: false, code: 'AUTH_AMOUNT_REQUIRED' };
  if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) return { ok: false, code: 'AUTH_CURRENCY_REQUIRED' };
  const materials = await deriveAuthorizationMaterials(draft, context);
  const core: Omit<IntentAuthorizationEnvelope, 'digest'> = {
    v: INTENT_AUTHORIZATION_VERSION,
    release: INTENT_AUTHORIZATION_RELEASE,
    issuedAt: context.issuedAt,
    expiresAt: context.expiresAt,
    operation: draft.operation,
    amountMinor,
    currency,
    ...materials,
    parentReplayProof: context.parentReplayProof,
    parentBackendProof: context.parentBackendProof,
    boundaryLineage: context.boundaryLineage,
    contractLineage: context.contractLineage,
  };
  return { ok: true, envelope: { ...core, digest: `AE-${upper16(await sha(canonicalEnvelope(core)))}` } };
}

function allowedTransition(from: AuthorizationStage | null, to: AuthorizationStage) {
  if (from === null) return to === 'DRAFT';
  if (from === 'DRAFT') return to === 'REVIEWED' || to === 'REJECTED' || to === 'EXPIRED';
  if (from === 'REVIEWED') return to === 'AUTHORIZED' || to === 'REJECTED' || to === 'EXPIRED';
  if (from === 'AUTHORIZED') return to === 'CONSUMED' || to === 'EXPIRED';
  return false;
}

function canonicalTraceEvent(value: Omit<AuthorizationTraceEvent, 'digest'>) {
  return [
    INTENT_AUTHORIZATION_VERSION,
    INTENT_AUTHORIZATION_RELEASE,
    value.seq,
    value.stage,
    value.at,
    value.envelopeDigest,
    value.prevDigest,
  ].join('|');
}

async function deriveTraceDigest(value: Omit<AuthorizationTraceEvent, 'digest'>) {
  if (!Number.isSafeInteger(value.seq) || value.seq <= 0) throw new Error('SEQUENCE_INVALID');
  if (!validDigest(value.envelopeDigest, 'AE')) throw new Error('ENVELOPE_DIGEST_INVALID');
  if (!validTraceHead(value.prevDigest)) throw new Error('PREV_DIGEST_INVALID');
  return `AT-${upper16(await sha(canonicalTraceEvent(value)))}`;
}

export async function validateAuthorizationTrace(trace: IntentAuthorizationTrace): Promise<AuthorizationInspection> {
  if (trace.v !== INTENT_AUTHORIZATION_VERSION || trace.release !== INTENT_AUTHORIZATION_RELEASE) return { ok: false, code: 'TRACE_VERSION' };
  if (!validDigest(trace.envelopeDigest, 'AE')) return { ok: false, code: 'ENVELOPE_DIGEST_INVALID' };
  if (!validTraceHead(trace.anchorDigest)) return { ok: false, code: 'ANCHOR_INVALID' };
  if (!Array.isArray(trace.events) || trace.events.length < 1 || trace.events.length > MAX_AUTHORIZATION_TRACE_EVENTS) return { ok: false, code: 'EVENT_COUNT_INVALID' };
  let previous: AuthorizationTraceEvent | null = null;
  let previousStage: AuthorizationStage | null = null;
  for (let index = 0; index < trace.events.length; index += 1) {
    const event = trace.events[index];
    if (!Number.isSafeInteger(event.seq) || event.seq !== index + 1) return { ok: false, code: 'SEQUENCE_NOT_MONOTONIC' };
    if (!Number.isSafeInteger(event.at) || event.at <= 0) return { ok: false, code: 'EVENT_TIME_INVALID' };
    if (event.envelopeDigest !== trace.envelopeDigest) return { ok: false, code: 'ENVELOPE_CHANGED' };
    if (!allowedTransition(previousStage, event.stage)) return { ok: false, code: 'TRANSITION_INVALID' };
    if (index === 0) {
      if (event.prevDigest !== trace.anchorDigest) return { ok: false, code: 'ANCHOR_LINK_MISMATCH' };
    } else {
      if (!previous || event.prevDigest !== previous.digest) return { ok: false, code: 'CHAIN_LINK_MISMATCH' };
      if (event.at < previous.at) return { ok: false, code: 'TIME_NOT_MONOTONIC' };
    }
    const { digest, ...withoutDigest } = event;
    const expected = await deriveTraceDigest(withoutDigest);
    if (digest !== expected) return { ok: false, code: 'EVENT_DIGEST_MISMATCH' };
    previous = event;
    previousStage = event.stage;
  }
  if (trace.headDigest !== trace.events[trace.events.length - 1].digest) return { ok: false, code: 'HEAD_DIGEST_MISMATCH' };
  return { ok: true };
}

export async function startAuthorizationTrace(envelope: IntentAuthorizationEnvelope, at: number) {
  const inspectedEnvelope = await validateIntentAuthorizationEnvelope(envelope);
  if (!inspectedEnvelope.ok) return { ok: false as const, code: inspectedEnvelope.code };
  if (!Number.isSafeInteger(at) || at <= 0) return { ok: false as const, code: 'EVENT_TIME_INVALID' };
  if (at > envelope.expiresAt) return { ok: false as const, code: 'AUTHORIZATION_EXPIRED' };
  const base: Omit<AuthorizationTraceEvent, 'digest'> = {
    seq: 1,
    stage: 'DRAFT',
    at,
    envelopeDigest: envelope.digest,
    prevDigest: AUTHORIZATION_GENESIS,
  };
  const event: AuthorizationTraceEvent = { ...base, digest: await deriveTraceDigest(base) };
  const trace: IntentAuthorizationTrace = {
    v: INTENT_AUTHORIZATION_VERSION,
    release: INTENT_AUTHORIZATION_RELEASE,
    envelopeDigest: envelope.digest,
    anchorDigest: AUTHORIZATION_GENESIS,
    events: [event],
    headDigest: event.digest,
  };
  return { ok: true as const, trace, event };
}

export async function advanceAuthorizationTrace(
  trace: IntentAuthorizationTrace,
  envelope: IntentAuthorizationEnvelope,
  next: Exclude<AuthorizationStage, 'DRAFT'>,
  at: number,
): Promise<{ ok: true; trace: IntentAuthorizationTrace; event: AuthorizationTraceEvent } | { ok: false; code: string }> {
  const inspectedEnvelope = await validateIntentAuthorizationEnvelope(envelope);
  if (!inspectedEnvelope.ok) return { ok: false, code: inspectedEnvelope.code };
  const current = await validateAuthorizationTrace(trace);
  if (!current.ok) return { ok: false, code: `CURRENT_${current.code}` };
  if (trace.envelopeDigest !== envelope.digest) return { ok: false, code: 'ENVELOPE_CHANGED' };
  const previous = trace.events[trace.events.length - 1];
  if (!Number.isSafeInteger(at) || at < previous.at) return { ok: false, code: 'EVENT_TIME_INVALID' };
  if (at > envelope.expiresAt && next !== 'EXPIRED') return { ok: false, code: 'AUTHORIZATION_EXPIRED' };
  if (!allowedTransition(previous.stage, next)) return { ok: false, code: 'TRANSITION_INVALID' };
  if (trace.events.length >= MAX_AUTHORIZATION_TRACE_EVENTS) return { ok: false, code: 'TRACE_FULL' };
  const base: Omit<AuthorizationTraceEvent, 'digest'> = {
    seq: previous.seq + 1,
    stage: next,
    at,
    envelopeDigest: envelope.digest,
    prevDigest: previous.digest,
  };
  const event: AuthorizationTraceEvent = { ...base, digest: await deriveTraceDigest(base) };
  const updated: IntentAuthorizationTrace = { ...trace, events: [...trace.events, event], headDigest: event.digest };
  const validated = await validateAuthorizationTrace(updated);
  if (!validated.ok) return { ok: false, code: `NEXT_${validated.code}` };
  return { ok: true, trace: updated, event };
}

export function buildIntentAuthorizationSnapshot(
  envelope: IntentAuthorizationEnvelope | null,
  trace: IntentAuthorizationTrace | null,
) {
  const head = trace?.events[trace.events.length - 1];
  return [
    `authorization=${INTENT_AUTHORIZATION_RELEASE}`,
    `scope=${intentAuthorizationPolicy.scope}`,
    `envelope=${envelope?.digest || 'NONE'}`,
    `intent=${envelope?.intentDigest || 'NONE'}`,
    `subject=${envelope?.subjectDigest || 'NONE'}`,
    `principal=${envelope?.principalDigest || 'NONE'}`,
    `device=${envelope?.deviceDigest || 'NONE'}`,
    `authNonce=${envelope?.authorizationNonceDigest || 'NONE'}`,
    `stage=${head?.stage || 'NONE'}`,
    `trace=${trace?.events.length || 0}/${MAX_AUTHORIZATION_TRACE_EVENTS}`,
    `head=${trace?.headDigest || 'NONE'}`,
    `maxAuthorizationTtlMs=${MAX_AUTHORIZATION_TTL_MS}`,
    'identifiers=HASHED_ONLY',
    'serverAuthorizationVerifier=false',
    'deviceAttestation=false',
    'externalClockAnchor=false',
    'networkExecution=false',
    'strongAuthorizationClaim=false',
    'secrets=NONE',
  ].join('\n');
}

export async function deriveIntentAuthorizationPolicyDigest() {
  const snapshot = [
    INTENT_AUTHORIZATION_VERSION,
    INTENT_AUTHORIZATION_RELEASE,
    intentAuthorizationPolicy.scope,
    MAX_AUTHORIZATION_TTL_MS,
    MAX_CLOCK_SKEW_MS,
    MAX_AUTHORIZATION_TRACE_EVENTS,
    intentAuthorizationPolicy.reviewedBeforeAuthorizeRequired ? 1 : 0,
    intentAuthorizationPolicy.serverAuthorizationVerifierProvisioned ? 1 : 0,
    intentAuthorizationPolicy.deviceAttestationProvisioned ? 1 : 0,
    intentAuthorizationPolicy.externalClockAnchorProvisioned ? 1 : 0,
    intentAuthorizationPolicy.networkExecutionEnabled ? 1 : 0,
    intentAuthorizationPolicy.strongAuthorizationClaim ? 1 : 0,
  ].join('|');
  return `AGP-${upper16(await sha(snapshot))}`;
}
