import * as Crypto from 'expo-crypto';

export const SERVER_LEDGER_ANCHOR_VERSION = 1 as const;
export const SERVER_LEDGER_ANCHOR_RELEASE = 'R13.6-SERVER-LEDGER-TIME-ANCHOR' as const;
export const MAX_LEDGER_ANCHOR_EVENTS = 16;
export const MAX_SERVER_TIME_TTL_MS = 15_000;
export const MAX_SERVER_TIME_SKEW_MS = 5_000;
export const LEDGER_GENESIS = 'LAE-GENESIS-000000' as const;

export const serverLedgerAnchorPolicy = Object.freeze({
  scope: 'SERVER_LEDGER_TIME_CONTRACT_ONLY' as const,
  serverReplayLedgerProvisioned: false as const,
  trustedServerClockProvisioned: false as const,
  serverSignatureVerifierProvisioned: false as const,
  networkExecutionEnabled: false as const,
  antiRollbackClaim: false as const,
});

export type SignedServerTimeAnchor = {
  v: 1;
  release: typeof SERVER_LEDGER_ANCHOR_RELEASE;
  serverTime: number;
  sequence: number;
  keyId: string;
  signatureRef: string;
  issuedAt: number;
  expiresAt: number;
  digest: string;
};
export type LedgerAnchorEvent = {
  seq: number;
  at: number;
  parentRemoteProof: string;
  intentDigest: string;
  decisionDigest: string;
  timeAnchorDigest: string;
  prevDigest: string;
  digest: string;
};
export type LedgerAnchorJournal = {
  v: 1;
  release: typeof SERVER_LEDGER_ANCHOR_RELEASE;
  parentRemoteProof: string;
  events: LedgerAnchorEvent[];
  headDigest: string;
};
export type LedgerInspection = { ok: true } | { ok: false; code: string };

async function sha(value: string) { return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value); }
function upper16(hex: string) { return hex.slice(0, 16).toUpperCase(); }
function valid(value: string, prefix: string) { return new RegExp(`^${prefix}-[A-F0-9]{16}$`).test(value); }
function canonicalTime(value: Omit<SignedServerTimeAnchor, 'digest'>) {
  return [value.v, value.release, value.serverTime, value.sequence, value.keyId, value.signatureRef, value.issuedAt, value.expiresAt].join('|');
}
function canonicalEvent(value: Omit<LedgerAnchorEvent, 'digest'>) {
  return [SERVER_LEDGER_ANCHOR_VERSION, SERVER_LEDGER_ANCHOR_RELEASE, value.seq, value.at, value.parentRemoteProof, value.intentDigest, value.decisionDigest, value.timeAnchorDigest, value.prevDigest].join('|');
}

export async function buildSignedServerTimeAnchor(input: Omit<SignedServerTimeAnchor, 'v' | 'release' | 'digest'>): Promise<SignedServerTimeAnchor> {
  const core: Omit<SignedServerTimeAnchor, 'digest'> = { v: 1, release: SERVER_LEDGER_ANCHOR_RELEASE, ...input };
  return { ...core, digest: `STA-${upper16(await sha(canonicalTime(core)))}` };
}
export async function inspectSignedServerTimeAnchor(value: SignedServerTimeAnchor, now: number): Promise<LedgerInspection> {
  if (value.v !== SERVER_LEDGER_ANCHOR_VERSION || value.release !== SERVER_LEDGER_ANCHOR_RELEASE) return { ok: false, code: 'TIME_VERSION' };
  if (!Number.isSafeInteger(value.serverTime) || !Number.isSafeInteger(value.sequence) || value.serverTime <= 0 || value.sequence <= 0) return { ok: false, code: 'TIME_SEQUENCE' };
  if (!/^srvkey\.[a-z0-9][a-z0-9._-]{7,79}$/.test(value.keyId) || !/^SIGREF-[A-F0-9]{16}$/.test(value.signatureRef)) return { ok: false, code: 'TIME_SIGNATURE_REF' };
  if (!Number.isSafeInteger(value.issuedAt) || !Number.isSafeInteger(value.expiresAt) || value.issuedAt <= 0 || value.expiresAt <= value.issuedAt) return { ok: false, code: 'TIME_WINDOW' };
  if (value.expiresAt - value.issuedAt > MAX_SERVER_TIME_TTL_MS) return { ok: false, code: 'TIME_TTL_TOO_LONG' };
  if (Math.abs(value.serverTime - now) > MAX_SERVER_TIME_SKEW_MS) return { ok: false, code: 'TIME_SKEW' };
  if (now > value.expiresAt) return { ok: false, code: 'TIME_EXPIRED' };
  if (!valid(value.digest, 'STA')) return { ok: false, code: 'TIME_DIGEST_FORMAT' };
  const { digest, ...core } = value;
  if (digest !== `STA-${upper16(await sha(canonicalTime(core)))}`) return { ok: false, code: 'TIME_DIGEST_MISMATCH' };
  return { ok: true };
}

async function eventDigest(value: Omit<LedgerAnchorEvent, 'digest'>) {
  return `LAE-${upper16(await sha(canonicalEvent(value)))}`;
}
export async function startLedgerAnchorJournal(parentRemoteProof: string, input: Omit<LedgerAnchorEvent, 'seq' | 'prevDigest' | 'digest' | 'parentRemoteProof'>) {
  if (!/^RAP-[A-F0-9]{16}$/.test(parentRemoteProof)) return { ok: false as const, code: 'LEDGER_PARENT_INVALID' };
  const core: Omit<LedgerAnchorEvent, 'digest'> = { seq: 1, parentRemoteProof, prevDigest: LEDGER_GENESIS, ...input };
  const event = { ...core, digest: await eventDigest(core) };
  const journal: LedgerAnchorJournal = { v: 1, release: SERVER_LEDGER_ANCHOR_RELEASE, parentRemoteProof, events: [event], headDigest: event.digest };
  return { ok: true as const, journal, event };
}
export async function appendLedgerAnchorEvent(journal: LedgerAnchorJournal, input: Omit<LedgerAnchorEvent, 'seq' | 'prevDigest' | 'digest' | 'parentRemoteProof'>) {
  const current = await validateLedgerAnchorJournal(journal);
  if (!current.ok) return { ok: false as const, code: `CURRENT_${current.code}` };
  if (journal.events.length >= MAX_LEDGER_ANCHOR_EVENTS) return { ok: false as const, code: 'LEDGER_FULL' };
  if (journal.events.some((event) => event.intentDigest === input.intentDigest && event.decisionDigest === input.decisionDigest)) return { ok: false as const, code: 'LEDGER_DUPLICATE_DECISION' };
  const prev = journal.events[journal.events.length - 1];
  if (input.at < prev.at) return { ok: false as const, code: 'LEDGER_TIME_ROLLBACK' };
  const core: Omit<LedgerAnchorEvent, 'digest'> = {
    seq: prev.seq + 1,
    at: input.at,
    parentRemoteProof: journal.parentRemoteProof,
    intentDigest: input.intentDigest,
    decisionDigest: input.decisionDigest,
    timeAnchorDigest: input.timeAnchorDigest,
    prevDigest: prev.digest,
  };
  const event = { ...core, digest: await eventDigest(core) };
  const next: LedgerAnchorJournal = { ...journal, events: [...journal.events, event], headDigest: event.digest };
  const checked = await validateLedgerAnchorJournal(next);
  if (!checked.ok) return { ok: false as const, code: `NEXT_${checked.code}` };
  return { ok: true as const, journal: next, event };
}
export async function validateLedgerAnchorJournal(journal: LedgerAnchorJournal): Promise<LedgerInspection> {
  if (journal.v !== SERVER_LEDGER_ANCHOR_VERSION || journal.release !== SERVER_LEDGER_ANCHOR_RELEASE || !/^RAP-[A-F0-9]{16}$/.test(journal.parentRemoteProof)) return { ok: false, code: 'LEDGER_VERSION' };
  if (!Array.isArray(journal.events) || journal.events.length < 1 || journal.events.length > MAX_LEDGER_ANCHOR_EVENTS) return { ok: false, code: 'LEDGER_COUNT' };
  const pairs = new Set<string>();
  let prev: LedgerAnchorEvent | null = null;
  for (let i = 0; i < journal.events.length; i += 1) {
    const event = journal.events[i];
    if (event.seq !== i + 1 || !Number.isSafeInteger(event.at) || event.at <= 0 || event.parentRemoteProof !== journal.parentRemoteProof) return { ok: false, code: 'LEDGER_EVENT' };
    if (!valid(event.intentDigest, 'RI') || !valid(event.decisionDigest, 'RD') || !valid(event.timeAnchorDigest, 'STA')) return { ok: false, code: 'LEDGER_DIGEST_REF' };
    if (i === 0 ? event.prevDigest !== LEDGER_GENESIS : !prev || event.prevDigest !== prev.digest) return { ok: false, code: 'LEDGER_LINK' };
    if (prev && event.at < prev.at) return { ok: false, code: 'LEDGER_TIME_ROLLBACK' };
    const pair = `${event.intentDigest}|${event.decisionDigest}`;
    if (pairs.has(pair)) return { ok: false, code: 'LEDGER_DUPLICATE_DECISION' };
    pairs.add(pair);
    if (!valid(event.digest, 'LAE')) return { ok: false, code: 'LEDGER_DIGEST_FORMAT' };
    const { digest, ...core } = event;
    if (digest !== await eventDigest(core)) return { ok: false, code: 'LEDGER_DIGEST_MISMATCH' };
    prev = event;
  }
  if (journal.headDigest !== journal.events[journal.events.length - 1].digest) return { ok: false, code: 'LEDGER_HEAD' };
  return { ok: true };
}

export async function deriveServerLedgerAnchorPolicyDigest() {
  const raw = [SERVER_LEDGER_ANCHOR_VERSION, SERVER_LEDGER_ANCHOR_RELEASE, MAX_LEDGER_ANCHOR_EVENTS, MAX_SERVER_TIME_TTL_MS, MAX_SERVER_TIME_SKEW_MS, serverLedgerAnchorPolicy.scope, 0, 0, 0, 0, 0].join('|');
  return `LAPOL-${upper16(await sha(raw))}`;
}

export function buildServerLedgerAnchorSnapshot(time: SignedServerTimeAnchor | null, journal: LedgerAnchorJournal | null) {
  return [
    `serverLedgerAnchor=${SERVER_LEDGER_ANCHOR_RELEASE}`,
    `time=${time?.digest || 'NONE'}`,
    `ledgerHead=${journal?.headDigest || 'NONE'}`,
    `ledgerEvents=${journal?.events.length || 0}/${MAX_LEDGER_ANCHOR_EVENTS}`,
    `parentRemote=${journal?.parentRemoteProof || 'NONE'}`,
    'serverReplayLedger=false',
    'trustedServerClock=false',
    'serverSignatureVerifier=false',
    'antiRollbackClaim=false',
    'networkExecution=false',
    'rawSignature=NOT_STORED',
    'secrets=NONE',
  ].join('\n');
}
