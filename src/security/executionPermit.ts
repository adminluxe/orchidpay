import * as Crypto from 'expo-crypto';
import type { IntentAuthorizationEnvelope } from './intentAuthorizationEnvelope';
import type { RemoteAuthorizationDecision, RemoteAuthorizationVerification } from './remoteAuthorizationBoundary';

export const EXECUTION_PERMIT_VERSION = 1 as const;
export const EXECUTION_PERMIT_RELEASE = 'R13.5-DRY-RUN-EXECUTION-PERMIT' as const;
export const MAX_EXECUTION_PERMIT_TTL_MS = 10_000 as const;
export const MAX_EXECUTION_PERMIT_EVENTS = 3 as const;
export const EXECUTION_PERMIT_GENESIS = 'GENESIS' as const;

export const executionPermitPolicy = Object.freeze({
  scope: 'DRY_RUN_EXECUTION_GATE_ONLY' as const,
  maxPermitTtlMs: MAX_EXECUTION_PERMIT_TTL_MS,
  reserveBeforeConsumeRequired: true as const,
  remoteVerificationRequired: true as const,
  labInjectedVerificationAcceptedForDryRunOnly: true as const,
  networkExecutionEnabled: false as const,
  livePaymentExecutionEnabled: false as const,
  settlementEnabled: false as const,
  strongExecutionClaim: false as const,
});

export type ExecutionPermitStage = 'ISSUED' | 'RESERVED' | 'CONSUMED' | 'REVOKED' | 'EXPIRED';
export type DryRunExecutionPermit = {
  v: 1;
  release: typeof EXECUTION_PERMIT_RELEASE;
  scope: typeof executionPermitPolicy.scope;
  issuedAt: number;
  expiresAt: number;
  decisionDigest: string;
  authorizationEnvelopeDigest: string;
  parentAuthorizationProof: string;
  operation: string;
  amountMinor: number;
  currency: string;
  principalDigest: string;
  deviceDigest: string;
  digest: string;
};
export type ExecutionPermitEvent = { seq: number; stage: ExecutionPermitStage; at: number; permitDigest: string; prevDigest: string; digest: string };
export type ExecutionPermitTrace = { v: 1; release: typeof EXECUTION_PERMIT_RELEASE; permitDigest: string; events: ExecutionPermitEvent[]; headDigest: string };
export type ExecutionPermitInspection = { ok: true } | { ok: false; code: string };

async function sha(value: string) { return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value); }
function upper16(hex: string) { return hex.slice(0, 16).toUpperCase(); }
function validDigest(value: string, prefix: string) { return new RegExp(`^${prefix}-[A-F0-9]{16}$`).test(value); }
function validTraceHead(value: string) { return value === EXECUTION_PERMIT_GENESIS || validDigest(value, 'ET'); }
function canonicalPermit(value: Omit<DryRunExecutionPermit, 'digest'>) {
  return [value.v, value.release, value.scope, value.issuedAt, value.expiresAt, value.decisionDigest, value.authorizationEnvelopeDigest, value.parentAuthorizationProof, value.operation, value.amountMinor, value.currency, value.principalDigest, value.deviceDigest].join('|');
}

export async function buildDryRunExecutionPermit(
  verification: RemoteAuthorizationVerification,
  envelope: IntentAuthorizationEnvelope,
  parentAuthorizationProof: string,
  now: number,
): Promise<{ ok: true; permit: DryRunExecutionPermit } | { ok: false; code: string }> {
  if (!verification.ok || verification.verificationClass !== 'LAB_INJECTED_ONLY') return { ok: false, code: 'REMOTE_VERIFICATION_REQUIRED' };
  const decision: RemoteAuthorizationDecision = verification.decision;
  if (decision.decision !== 'ALLOW') return { ok: false, code: 'REMOTE_DECISION_NOT_ALLOW' };
  if (!/^IAP-[A-F0-9]{16}$/.test(parentAuthorizationProof) || decision.parentAuthorizationProof !== parentAuthorizationProof) return { ok: false, code: 'PARENT_AUTHORIZATION_MISMATCH' };
  if (decision.authorizationEnvelopeDigest !== envelope.digest) return { ok: false, code: 'ENVELOPE_MISMATCH' };
  if (!Number.isSafeInteger(now) || now <= 0 || now >= decision.expiresAt) return { ok: false, code: 'PERMIT_TIME_INVALID' };
  const expiresAt = Math.min(decision.expiresAt, now + MAX_EXECUTION_PERMIT_TTL_MS);
  const core: Omit<DryRunExecutionPermit, 'digest'> = {
    v: 1,
    release: EXECUTION_PERMIT_RELEASE,
    scope: executionPermitPolicy.scope,
    issuedAt: now,
    expiresAt,
    decisionDigest: decision.digest,
    authorizationEnvelopeDigest: envelope.digest,
    parentAuthorizationProof,
    operation: envelope.operation,
    amountMinor: envelope.amountMinor,
    currency: envelope.currency,
    principalDigest: envelope.principalDigest,
    deviceDigest: envelope.deviceDigest,
  };
  return { ok: true, permit: { ...core, digest: `EP-${upper16(await sha(canonicalPermit(core)))}` } };
}

export async function validateDryRunExecutionPermit(permit: DryRunExecutionPermit, now: number): Promise<ExecutionPermitInspection> {
  if (permit.v !== EXECUTION_PERMIT_VERSION || permit.release !== EXECUTION_PERMIT_RELEASE || permit.scope !== executionPermitPolicy.scope) return { ok: false, code: 'PERMIT_VERSION' };
  if (!Number.isSafeInteger(permit.issuedAt) || !Number.isSafeInteger(permit.expiresAt) || permit.issuedAt <= 0 || permit.expiresAt <= permit.issuedAt) return { ok: false, code: 'PERMIT_TIME_INVALID' };
  if (permit.expiresAt - permit.issuedAt > MAX_EXECUTION_PERMIT_TTL_MS) return { ok: false, code: 'PERMIT_TTL_TOO_LONG' };
  if (now > permit.expiresAt) return { ok: false, code: 'PERMIT_EXPIRED' };
  if (!validDigest(permit.decisionDigest, 'RD') || !validDigest(permit.authorizationEnvelopeDigest, 'AE')) return { ok: false, code: 'PERMIT_PARENT_DIGEST_INVALID' };
  if (!/^IAP-[A-F0-9]{16}$/.test(permit.parentAuthorizationProof)) return { ok: false, code: 'PERMIT_PARENT_AUTH_INVALID' };
  if (!Number.isSafeInteger(permit.amountMinor) || permit.amountMinor < 0 || !/^[A-Z]{3}$/.test(permit.currency)) return { ok: false, code: 'PERMIT_MONEY_INVALID' };
  if (!validDigest(permit.principalDigest, 'AP') || !validDigest(permit.deviceDigest, 'AD') || !validDigest(permit.digest, 'EP')) return { ok: false, code: 'PERMIT_DIGEST_INVALID' };
  const { digest, ...core } = permit;
  const expected = `EP-${upper16(await sha(canonicalPermit(core)))}`;
  if (digest !== expected) return { ok: false, code: 'PERMIT_DIGEST_MISMATCH' };
  return { ok: true };
}

function allowedTransition(from: ExecutionPermitStage | null, to: ExecutionPermitStage) {
  if (from === null) return to === 'ISSUED';
  if (from === 'ISSUED') return to === 'RESERVED' || to === 'REVOKED' || to === 'EXPIRED';
  if (from === 'RESERVED') return to === 'CONSUMED' || to === 'REVOKED' || to === 'EXPIRED';
  return false;
}
function canonicalEvent(value: Omit<ExecutionPermitEvent, 'digest'>) { return [EXECUTION_PERMIT_VERSION, EXECUTION_PERMIT_RELEASE, value.seq, value.stage, value.at, value.permitDigest, value.prevDigest].join('|'); }
async function eventDigest(value: Omit<ExecutionPermitEvent, 'digest'>) { return `ET-${upper16(await sha(canonicalEvent(value)))}`; }

export async function validateExecutionPermitTrace(trace: ExecutionPermitTrace): Promise<ExecutionPermitInspection> {
  if (trace.v !== EXECUTION_PERMIT_VERSION || trace.release !== EXECUTION_PERMIT_RELEASE || !validDigest(trace.permitDigest, 'EP')) return { ok: false, code: 'TRACE_VERSION' };
  if (!Array.isArray(trace.events) || trace.events.length < 1 || trace.events.length > MAX_EXECUTION_PERMIT_EVENTS) return { ok: false, code: 'TRACE_EVENT_COUNT' };
  let prev: ExecutionPermitEvent | null = null;
  let stage: ExecutionPermitStage | null = null;
  for (let i = 0; i < trace.events.length; i += 1) {
    const event = trace.events[i];
    if (event.seq !== i + 1 || !Number.isSafeInteger(event.at) || event.at <= 0 || event.permitDigest !== trace.permitDigest) return { ok: false, code: 'TRACE_EVENT_INVALID' };
    if (!allowedTransition(stage, event.stage)) return { ok: false, code: 'TRACE_TRANSITION_INVALID' };
    if (i === 0 ? event.prevDigest !== EXECUTION_PERMIT_GENESIS : !prev || event.prevDigest !== prev.digest) return { ok: false, code: 'TRACE_LINK_INVALID' };
    if (prev && event.at < prev.at) return { ok: false, code: 'TRACE_TIME_INVALID' };
    if (!validTraceHead(event.prevDigest) || !validDigest(event.digest, 'ET')) return { ok: false, code: 'TRACE_DIGEST_FORMAT' };
    const { digest, ...core } = event;
    if (digest !== await eventDigest(core)) return { ok: false, code: 'TRACE_DIGEST_MISMATCH' };
    prev = event; stage = event.stage;
  }
  if (trace.headDigest !== trace.events[trace.events.length - 1].digest) return { ok: false, code: 'TRACE_HEAD_MISMATCH' };
  return { ok: true };
}

export async function startExecutionPermitTrace(permit: DryRunExecutionPermit, at: number) {
  const p = await validateDryRunExecutionPermit(permit, at);
  if (!p.ok) return { ok: false as const, code: p.code };
  const core: Omit<ExecutionPermitEvent, 'digest'> = { seq: 1, stage: 'ISSUED', at, permitDigest: permit.digest, prevDigest: EXECUTION_PERMIT_GENESIS };
  const event = { ...core, digest: await eventDigest(core) };
  return { ok: true as const, trace: { v: 1 as const, release: EXECUTION_PERMIT_RELEASE, permitDigest: permit.digest, events: [event], headDigest: event.digest }, event };
}

export async function advanceExecutionPermitTrace(trace: ExecutionPermitTrace, permit: DryRunExecutionPermit, next: Exclude<ExecutionPermitStage, 'ISSUED'>, at: number) {
  const p = await validateDryRunExecutionPermit(permit, at);
  if (!p.ok && next !== 'EXPIRED') return { ok: false as const, code: p.code };
  const t = await validateExecutionPermitTrace(trace);
  if (!t.ok) return { ok: false as const, code: `CURRENT_${t.code}` };
  if (trace.permitDigest !== permit.digest) return { ok: false as const, code: 'PERMIT_CHANGED' };
  const previous = trace.events[trace.events.length - 1];
  if (!allowedTransition(previous.stage, next)) return { ok: false as const, code: 'TRANSITION_INVALID' };
  if (trace.events.length >= MAX_EXECUTION_PERMIT_EVENTS) return { ok: false as const, code: 'TRACE_FULL' };
  const core: Omit<ExecutionPermitEvent, 'digest'> = { seq: previous.seq + 1, stage: next, at, permitDigest: permit.digest, prevDigest: previous.digest };
  const event = { ...core, digest: await eventDigest(core) };
  const updated: ExecutionPermitTrace = { ...trace, events: [...trace.events, event], headDigest: event.digest };
  const v = await validateExecutionPermitTrace(updated);
  if (!v.ok) return { ok: false as const, code: `NEXT_${v.code}` };
  return { ok: true as const, trace: updated, event };
}

export async function deriveExecutionPermitPolicyDigest() {
  const raw = [EXECUTION_PERMIT_VERSION, EXECUTION_PERMIT_RELEASE, executionPermitPolicy.scope, MAX_EXECUTION_PERMIT_TTL_MS, MAX_EXECUTION_PERMIT_EVENTS, 1, 1, 1, 0, 0, 0, 0].join('|');
  return `EPPOL-${upper16(await sha(raw))}`;
}

export function buildExecutionPermitSnapshot(permit: DryRunExecutionPermit | null, trace: ExecutionPermitTrace | null) {
  return [
    `executionPermit=${EXECUTION_PERMIT_RELEASE}`,
    `scope=${executionPermitPolicy.scope}`,
    `permit=${permit?.digest || 'NONE'}`,
    `decision=${permit?.decisionDigest || 'NONE'}`,
    `authorizationEnvelope=${permit?.authorizationEnvelopeDigest || 'NONE'}`,
    `parentAuthorization=${permit?.parentAuthorizationProof || 'NONE'}`,
    `stage=${trace?.events[trace.events.length - 1]?.stage || 'NONE'}`,
    `trace=${trace?.events.length || 0}/${MAX_EXECUTION_PERMIT_EVENTS}`,
    'networkExecution=false',
    'livePaymentExecution=false',
    'settlement=false',
    'strongExecutionClaim=false',
    'secrets=NONE',
  ].join('\n');
}
