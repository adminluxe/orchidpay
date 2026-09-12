import * as Crypto from 'expo-crypto';
import {
  MAX_INTENT_TTL_MS,
  buildCanonicalIntent,
  validateIntentDraft,
  type IntentDraft,
} from './backendContract';

export const INTENT_REPLAY_GUARD_VERSION = 1 as const;
export const INTENT_REPLAY_RELEASE = 'R13.3-INTENT-REPLAY-GUARD' as const;
export const MAX_REPLAY_EVENTS = 16 as const;
export const MAX_CLOCK_SKEW_MS = 5_000 as const;
export const REPLAY_GENESIS = 'GENESIS' as const;

export const intentReplayPolicy = Object.freeze({
  scope: 'LOCAL_RECENT_WINDOW_ONLY' as const,
  maxEvents: MAX_REPLAY_EVENTS,
  maxClockSkewMs: MAX_CLOCK_SKEW_MS,
  maxIntentTtlMs: MAX_INTENT_TTL_MS,
  serverReplayLedgerProvisioned: false as const,
  externalClockAnchorProvisioned: false as const,
  networkExecutionEnabled: false as const,
  strongAntiReplayClaim: false as const,
});

export type ReplayInspection = { ok: true } | { ok: false; code: string };

export type IntentReplayReceipt = {
  seq: number;
  seenAt: number;
  operation: string;
  issuedAt: number;
  expiresAt: number;
  intentDigest: string;
  nonceDigest: string;
  idempotencyDigest: string;
  prevDigest: string;
  digest: string;
};

export type IntentReplayJournal = {
  v: 1;
  release: typeof INTENT_REPLAY_RELEASE;
  anchorDigest: string;
  events: IntentReplayReceipt[];
  headDigest: string;
};

async function sha(value: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}

function upper16(hex: string) {
  return hex.slice(0, 16).toUpperCase();
}

function validHead(value: string) {
  return value === REPLAY_GENESIS || /^RG-[A-F0-9]{16}$/.test(value);
}

function validMaterial(value: string, prefix: 'RI' | 'RN' | 'RK') {
  return new RegExp(`^${prefix}-[A-F0-9]{16}$`).test(value);
}

export function inspectReplayDraft(draft: IntentDraft, now: number): ReplayInspection {
  if (!Number.isSafeInteger(now) || now <= 0) return { ok: false, code: 'NOW_INVALID' };
  if (!Number.isSafeInteger(draft.issuedAt) || !Number.isSafeInteger(draft.expiresAt)) return { ok: false, code: 'TIME_INVALID' };
  if (draft.issuedAt > now + MAX_CLOCK_SKEW_MS) return { ok: false, code: 'CLOCK_SKEW_FUTURE' };
  if (draft.expiresAt <= now) return { ok: false, code: 'EXPIRED' };
  if (draft.expiresAt <= draft.issuedAt) return { ok: false, code: 'TTL_INVALID' };
  if (draft.expiresAt - draft.issuedAt > MAX_INTENT_TTL_MS) return { ok: false, code: 'TTL_TOO_LONG' };
  const contract = validateIntentDraft(draft, now);
  if (!contract.ok) return { ok: false, code: `CONTRACT_${contract.code}` };
  return { ok: true };
}

export async function deriveReplayMaterials(draft: IntentDraft) {
  const [intent, nonce, idempotency] = await Promise.all([
    sha(buildCanonicalIntent(draft)),
    sha(`nonce|${draft.nonce}`),
    sha(`idempotency|${draft.idempotencyKey}`),
  ]);
  return {
    intentDigest: `RI-${upper16(intent)}`,
    nonceDigest: `RN-${upper16(nonce)}`,
    idempotencyDigest: `RK-${upper16(idempotency)}`,
  } as const;
}

export function canonicalReplayReceipt(value: Omit<IntentReplayReceipt, 'digest'>) {
  return [
    INTENT_REPLAY_GUARD_VERSION,
    INTENT_REPLAY_RELEASE,
    value.seq,
    value.prevDigest,
    value.seenAt,
    value.operation,
    value.issuedAt,
    value.expiresAt,
    value.intentDigest,
    value.nonceDigest,
    value.idempotencyDigest,
  ].join('|');
}

export async function deriveReplayDigest(value: Omit<IntentReplayReceipt, 'digest'>) {
  if (!Number.isSafeInteger(value.seq) || value.seq <= 0) throw new Error('SEQUENCE_INVALID');
  if (!validHead(value.prevDigest)) throw new Error('PREV_DIGEST_INVALID');
  if (!validMaterial(value.intentDigest, 'RI')) throw new Error('INTENT_DIGEST_INVALID');
  if (!validMaterial(value.nonceDigest, 'RN')) throw new Error('NONCE_DIGEST_INVALID');
  if (!validMaterial(value.idempotencyDigest, 'RK')) throw new Error('IDEMPOTENCY_DIGEST_INVALID');
  return `RG-${upper16(await sha(canonicalReplayReceipt(value)))}`;
}

export async function validateIntentReplayJournal(journal: IntentReplayJournal): Promise<ReplayInspection> {
  if (journal.v !== INTENT_REPLAY_GUARD_VERSION || journal.release !== INTENT_REPLAY_RELEASE) return { ok: false, code: 'JOURNAL_VERSION' };
  if (!validHead(journal.anchorDigest)) return { ok: false, code: 'ANCHOR_INVALID' };
  if (!Array.isArray(journal.events) || journal.events.length < 1 || journal.events.length > MAX_REPLAY_EVENTS) return { ok: false, code: 'EVENT_COUNT_INVALID' };
  const intents = new Set<string>();
  const nonces = new Set<string>();
  const idempotency = new Set<string>();
  let previous: IntentReplayReceipt | null = null;
  for (let index = 0; index < journal.events.length; index += 1) {
    const event = journal.events[index];
    if (!Number.isSafeInteger(event.seq) || event.seq <= 0) return { ok: false, code: 'SEQUENCE_INVALID' };
    if (!Number.isSafeInteger(event.seenAt) || event.seenAt <= 0) return { ok: false, code: 'SEEN_AT_INVALID' };
    if (!Number.isSafeInteger(event.issuedAt) || !Number.isSafeInteger(event.expiresAt) || event.expiresAt <= event.issuedAt) return { ok: false, code: 'TIME_INVALID' };
    if (!validMaterial(event.intentDigest, 'RI')) return { ok: false, code: 'INTENT_DIGEST_INVALID' };
    if (!validMaterial(event.nonceDigest, 'RN')) return { ok: false, code: 'NONCE_DIGEST_INVALID' };
    if (!validMaterial(event.idempotencyDigest, 'RK')) return { ok: false, code: 'IDEMPOTENCY_DIGEST_INVALID' };
    if (intents.has(event.intentDigest)) return { ok: false, code: 'INTENT_DUPLICATE_IN_JOURNAL' };
    if (nonces.has(event.nonceDigest)) return { ok: false, code: 'NONCE_DUPLICATE_IN_JOURNAL' };
    if (idempotency.has(event.idempotencyDigest)) return { ok: false, code: 'IDEMPOTENCY_DUPLICATE_IN_JOURNAL' };
    intents.add(event.intentDigest);
    nonces.add(event.nonceDigest);
    idempotency.add(event.idempotencyDigest);
    if (index === 0) {
      if (event.prevDigest !== journal.anchorDigest) return { ok: false, code: 'ANCHOR_LINK_MISMATCH' };
    } else {
      if (!previous || event.seq !== previous.seq + 1) return { ok: false, code: 'SEQUENCE_NOT_MONOTONIC' };
      if (event.prevDigest !== previous.digest) return { ok: false, code: 'CHAIN_LINK_MISMATCH' };
    }
    const { digest, ...withoutDigest } = event;
    const expected = await deriveReplayDigest(withoutDigest);
    if (digest !== expected) return { ok: false, code: 'EVENT_DIGEST_MISMATCH' };
    previous = event;
  }
  const head = journal.events[journal.events.length - 1];
  if (journal.headDigest !== head.digest) return { ok: false, code: 'HEAD_DIGEST_MISMATCH' };
  return { ok: true };
}

export function compactIntentReplayJournal(journal: IntentReplayJournal): IntentReplayJournal {
  if (journal.events.length <= MAX_REPLAY_EVENTS) return journal;
  const events = journal.events.slice(-MAX_REPLAY_EVENTS);
  const removedIndex = journal.events.length - MAX_REPLAY_EVENTS - 1;
  const anchorDigest = removedIndex >= 0 ? journal.events[removedIndex].digest : journal.anchorDigest;
  return { ...journal, anchorDigest, events, headDigest: events[events.length - 1].digest };
}

export async function appendIntentReplayReceipt(
  journal: IntentReplayJournal | null,
  draft: IntentDraft,
  seenAt: number,
): Promise<{ ok: true; journal: IntentReplayJournal; receipt: IntentReplayReceipt } | { ok: false; code: string }> {
  const inspected = inspectReplayDraft(draft, seenAt);
  if (!inspected.ok) return inspected;
  if (journal) {
    const current = await validateIntentReplayJournal(journal);
    if (!current.ok) return { ok: false, code: `CURRENT_${current.code}` };
  }
  const material = await deriveReplayMaterials(draft);
  if (journal?.events.some((event) => event.intentDigest === material.intentDigest)) return { ok: false, code: 'INTENT_REPLAY' };
  if (journal?.events.some((event) => event.nonceDigest === material.nonceDigest)) return { ok: false, code: 'NONCE_REPLAY' };
  if (journal?.events.some((event) => event.idempotencyDigest === material.idempotencyDigest)) return { ok: false, code: 'IDEMPOTENCY_REPLAY' };
  const previous = journal?.events[journal.events.length - 1] || null;
  const base: Omit<IntentReplayReceipt, 'digest'> = {
    seq: previous ? previous.seq + 1 : 1,
    seenAt,
    operation: draft.operation,
    issuedAt: draft.issuedAt,
    expiresAt: draft.expiresAt,
    ...material,
    prevDigest: previous ? previous.digest : REPLAY_GENESIS,
  };
  const receipt: IntentReplayReceipt = { ...base, digest: await deriveReplayDigest(base) };
  const next = compactIntentReplayJournal({
    v: INTENT_REPLAY_GUARD_VERSION,
    release: INTENT_REPLAY_RELEASE,
    anchorDigest: journal?.anchorDigest || REPLAY_GENESIS,
    events: [...(journal?.events || []), receipt],
    headDigest: receipt.digest,
  });
  const validated = await validateIntentReplayJournal(next);
  if (!validated.ok) return { ok: false, code: `NEXT_${validated.code}` };
  return { ok: true, journal: next, receipt };
}

export function buildIntentReplaySnapshot(journal: IntentReplayJournal | null) {
  const head = journal?.events[journal.events.length - 1];
  return [
    `replayGuard=${INTENT_REPLAY_RELEASE}`,
    `scope=${intentReplayPolicy.scope}`,
    `entries=${journal?.events.length || 0}/${MAX_REPLAY_EVENTS}`,
    `sequence=${head?.seq || 0}`,
    `head=${journal?.headDigest || 'NONE'}`,
    `clockSkewMs=${MAX_CLOCK_SKEW_MS}`,
    `maxIntentTtlMs=${MAX_INTENT_TTL_MS}`,
    'identifiers=HASHED_ONLY',
    'serverReplayLedger=false',
    'externalClockAnchor=false',
    'networkExecution=false',
    'strongAntiReplayClaim=false',
    'secrets=NONE',
  ].join('\n');
}

export async function deriveIntentReplayPolicyDigest() {
  const snapshot = [
    INTENT_REPLAY_GUARD_VERSION,
    INTENT_REPLAY_RELEASE,
    intentReplayPolicy.scope,
    MAX_REPLAY_EVENTS,
    MAX_CLOCK_SKEW_MS,
    MAX_INTENT_TTL_MS,
    intentReplayPolicy.serverReplayLedgerProvisioned ? 1 : 0,
    intentReplayPolicy.externalClockAnchorProvisioned ? 1 : 0,
    intentReplayPolicy.networkExecutionEnabled ? 1 : 0,
    intentReplayPolicy.strongAntiReplayClaim ? 1 : 0,
  ].join('|');
  return `RGP-${upper16(await sha(snapshot))}`;
}
