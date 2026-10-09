import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { recordDeviceGateAuditEvent } from './deviceGatePassport';

const AUDIT_LEDGER_KEY = 'orchidpay.audit.ledger.v1';
const LEDGER_VERSION = 1 as const;
const MAX_ENTRIES = 20;
const ROOT_HASH = '0'.repeat(64);

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
};

export type AuditKind = 'session-start' | 'auth' | 'lock' | 'transfer-draft' | 'transfer-intent' | 'channel';
export type AuditOutcome = 'observed' | 'success' | 'rejected' | 'blocked' | 'simulated' | 'timeout';

export type AuditEntry = {
  v: 1;
  seq: number;
  at: number;
  kind: AuditKind;
  outcome: AuditOutcome;
  code: string;
  ref: string;
  prev: string;
  hash: string;
};

export type AuditLedgerState = {
  v: 1;
  anchorSeq: number;
  anchorHash: string;
  nextSeq: number;
  entries: AuditEntry[];
};

export type AuditSummary = {
  valid: boolean;
  error: string;
  entries: number;
  head: string;
  authSuccess: number;
  authRejected: number;
  authUserCancels: number;
  backgroundTimeouts: number;
  preAuthBlocks: number;
  simulations: number;
  sessionStarts: number;
  lastCode: string;
  lastAt: number;
};

let appendQueue: Promise<AuditEntry | null> = Promise.resolve(null);

function emptyState(): AuditLedgerState {
  return { v: LEDGER_VERSION, anchorSeq: 0, anchorHash: ROOT_HASH, nextSeq: 1, entries: [] };
}

function cleanToken(value: string, max = 64) {
  return value.replace(/[^A-Za-z0-9_.:@-]/g, '_').slice(0, max);
}

function canonical(entry: Omit<AuditEntry, 'hash'>) {
  return [entry.v, entry.seq, entry.at, entry.kind, entry.outcome, entry.code, entry.ref, entry.prev].join('|');
}

async function sha256(value: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}

function structurallyValid(state: AuditLedgerState) {
  return state?.v === 1 &&
    Number.isSafeInteger(state.anchorSeq) && state.anchorSeq >= 0 &&
    /^[a-f0-9]{64}$/i.test(state.anchorHash) &&
    Number.isSafeInteger(state.nextSeq) && state.nextSeq >= 1 &&
    Array.isArray(state.entries);
}

export async function verifyAuditLedger(state: AuditLedgerState): Promise<{ ok: boolean; error: string }> {
  if (!structurallyValid(state)) return { ok: false, error: 'LEDGER_STRUCTURE' };

  let previous = state.anchorHash;
  let expectedSeq = state.anchorSeq + 1;
  for (const entry of state.entries) {
    if (entry.v !== 1 || entry.seq !== expectedSeq) return { ok: false, error: 'LEDGER_SEQUENCE' };
    if (entry.prev !== previous) return { ok: false, error: 'LEDGER_PREV_HASH' };
    if (!Number.isSafeInteger(entry.at) || entry.at <= 0) return { ok: false, error: 'LEDGER_TIMESTAMP' };
    const expected = await sha256(canonical({
      v: 1,
      seq: entry.seq,
      at: entry.at,
      kind: entry.kind,
      outcome: entry.outcome,
      code: entry.code,
      ref: entry.ref,
      prev: entry.prev,
    }));
    if (expected !== entry.hash) return { ok: false, error: 'LEDGER_HASH' };
    previous = entry.hash;
    expectedSeq += 1;
  }

  if (state.nextSeq !== expectedSeq) return { ok: false, error: 'LEDGER_NEXT_SEQUENCE' };
  return { ok: true, error: '' };
}

async function loadRawState(): Promise<AuditLedgerState> {
  if (!(await SecureStore.isAvailableAsync())) throw new Error('AUDIT_SECURESTORE_UNAVAILABLE');
  const raw = await SecureStore.getItemAsync(AUDIT_LEDGER_KEY, secureStoreOptions);
  if (!raw) return emptyState();
  let parsed: AuditLedgerState;
  try {
    parsed = JSON.parse(raw) as AuditLedgerState;
  } catch {
    throw new Error('AUDIT_LEDGER_JSON_INVALID');
  }
  const verified = await verifyAuditLedger(parsed);
  if (!verified.ok) throw new Error(verified.error);
  return parsed;
}

async function appendToState(
  state: AuditLedgerState,
  kind: AuditKind,
  outcome: AuditOutcome,
  code: string,
  ref: string,
  at: number,
) {
  const verified = await verifyAuditLedger(state);
  if (!verified.ok) throw new Error(verified.error);

  const seq = state.nextSeq;
  const prev = state.entries.length ? state.entries[state.entries.length - 1].hash : state.anchorHash;
  const base: Omit<AuditEntry, 'hash'> = {
    v: 1,
    seq,
    at,
    kind,
    outcome,
    code: cleanToken(code),
    ref: cleanToken(ref),
    prev,
  };
  const entry: AuditEntry = { ...base, hash: await sha256(canonical(base)) };
  const entries = [...state.entries, entry];
  let anchorSeq = state.anchorSeq;
  let anchorHash = state.anchorHash;
  if (entries.length > MAX_ENTRIES) {
    const removed = entries.splice(0, entries.length - MAX_ENTRIES);
    const anchor = removed[removed.length - 1];
    anchorSeq = anchor.seq;
    anchorHash = anchor.hash;
  }
  return { v: 1, anchorSeq, anchorHash, nextSeq: seq + 1, entries } satisfies AuditLedgerState;
}

export function appendAuditEvent(kind: AuditKind, outcome: AuditOutcome, code: string, ref = '') {
  const run = appendQueue.then(async () => {
    const state = await loadRawState();
    const next = await appendToState(state, kind, outcome, code, ref, Date.now());
    await SecureStore.setItemAsync(AUDIT_LEDGER_KEY, JSON.stringify(next), secureStoreOptions);
    await recordDeviceGateAuditEvent(kind, outcome, cleanToken(code)).catch(() => null);
    return next.entries[next.entries.length - 1] ?? null;
  });

  appendQueue = run.catch(() => null);
  return run;
}

export async function readAuditSummary(): Promise<AuditSummary> {
  try {
    await appendQueue.catch(() => null);
    const state = await loadRawState();
    const verified = await verifyAuditLedger(state);
    const last = state.entries[state.entries.length - 1];
    return {
      valid: verified.ok,
      error: verified.error,
      entries: state.entries.length,
      head: last?.hash ? `AL-${last.hash.slice(0, 12).toUpperCase()}` : 'AL-EMPTY',
      authSuccess: state.entries.filter((entry) => entry.kind === 'auth' && entry.outcome === 'success').length,
      authRejected: state.entries.filter((entry) => entry.kind === 'auth' && entry.outcome === 'rejected').length,
      authUserCancels: state.entries.filter((entry) => entry.kind === 'auth' && entry.outcome === 'rejected' && entry.code === 'USER_CANCEL').length,
      backgroundTimeouts: state.entries.filter((entry) => entry.kind === 'lock' && entry.outcome === 'timeout').length,
      preAuthBlocks: state.entries.filter((entry) => entry.kind === 'transfer-draft' && entry.outcome === 'blocked').length,
      simulations: state.entries.filter((entry) => entry.kind === 'transfer-intent' && entry.outcome === 'simulated').length,
      sessionStarts: state.entries.filter((entry) => entry.kind === 'session-start').length,
      lastCode: last?.code || 'NONE',
      lastAt: last?.at || 0,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'AUDIT_UNKNOWN',
      entries: 0,
      head: 'AL-INVALID',
      authSuccess: 0,
      authRejected: 0,
      authUserCancels: 0,
      backgroundTimeouts: 0,
      preAuthBlocks: 0,
      simulations: 0,
      sessionStarts: 0,
      lastCode: 'INVALID',
      lastAt: 0,
    };
  }
}

export type AuditTrailItem = Pick<AuditEntry, 'seq' | 'at' | 'kind' | 'outcome' | 'code' | 'ref'>;

export async function readAuditTrail(limit = 8): Promise<AuditTrailItem[]> {
  try {
    await appendQueue.catch(() => null);
    const state = await loadRawState();
    const verified = await verifyAuditLedger(state);
    if (!verified.ok) return [];
    const safeLimit = Math.min(20, Math.max(1, limit | 0));
    return state.entries
      .slice(-safeLimit)
      .reverse()
      .map(({ seq, at, kind, outcome, code, ref }) => ({ seq, at, kind, outcome, code, ref }));
  } catch {
    return [];
  }
}

export async function runAuditIntegritySelfTest() {
  let state = emptyState();
  state = await appendToState(state, 'session-start', 'observed', 'SELFTEST_START', 'OP-123456789ABC', 1_700_000_000_000);
  state = await appendToState(state, 'auth', 'success', 'SELFTEST_AUTH', 'OP-123456789ABC', 1_700_000_001_000);
  const valid = await verifyAuditLedger(state);
  const tampered: AuditLedgerState = JSON.parse(JSON.stringify(state)) as AuditLedgerState;
  tampered.entries[0].code = 'TAMPERED';
  const tamper = await verifyAuditLedger(tampered);
  return { valid: valid.ok, tamperRejected: !tamper.ok, head: state.entries[state.entries.length - 1].hash };
}
