import * as Crypto from 'expo-crypto';

export const ATTESTATION_CONTINUITY_VERSION = 1 as const;
export const ATTESTATION_CONTINUITY_RELEASE = 'R13.2-CONTINUITY-JOURNAL' as const;
export const MAX_CONTINUITY_EVENTS = 8 as const;
export const CONTINUITY_GENESIS = 'GENESIS' as const;

export type AttestationContinuityInput = {
  issuedAt: number;
  boundaryProof: string;
  boundaryLineage: string;
  contractRef: string;
  contractLineage: string;
  suitePassed: number;
  suiteTotal: number;
  liveReady: boolean;
  networkExecution: boolean;
  serverSigned: boolean;
};

export type AttestationContinuityEvent = AttestationContinuityInput & {
  seq: number;
  prevDigest: string;
  digest: string;
};

export type AttestationContinuityJournal = {
  v: 1;
  release: typeof ATTESTATION_CONTINUITY_RELEASE;
  anchorDigest: string;
  originBoundaryLineage: string;
  originContractLineage: string;
  events: AttestationContinuityEvent[];
  headDigest: string;
};

export type ContinuityInspection = { ok: true } | { ok: false; code: string };

async function sha(value: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}

function upper16(hex: string) {
  return hex.slice(0, 16).toUpperCase();
}

function validDigest(value: string) {
  return value === CONTINUITY_GENESIS || /^AC-[A-F0-9]{16}$/.test(value);
}

export function inspectContinuityInput(input: AttestationContinuityInput): ContinuityInspection {
  if (!Number.isSafeInteger(input.issuedAt) || input.issuedAt <= 0) return { ok: false, code: 'ISSUED_AT_INVALID' };
  if (!/^IB-[A-F0-9]{16}$/.test(input.boundaryProof)) return { ok: false, code: 'BOUNDARY_PROOF_INVALID' };
  if (!/^IBL-[A-F0-9]{16}$/.test(input.boundaryLineage)) return { ok: false, code: 'BOUNDARY_LINEAGE_INVALID' };
  if (!/^BCR-[A-F0-9]{16}$/.test(input.contractRef)) return { ok: false, code: 'CONTRACT_REF_INVALID' };
  if (!/^BCL-[A-F0-9]{16}$/.test(input.contractLineage)) return { ok: false, code: 'CONTRACT_LINEAGE_INVALID' };
  if (input.suitePassed !== 88 || input.suiteTotal !== 88) return { ok: false, code: 'SUITE_NOT_88_88' };
  if (input.liveReady !== false) return { ok: false, code: 'LIVE_READY_FORBIDDEN' };
  if (input.networkExecution !== false) return { ok: false, code: 'NETWORK_EXECUTION_FORBIDDEN' };
  if (input.serverSigned !== false) return { ok: false, code: 'SERVER_SIGNED_FORBIDDEN' };
  return { ok: true };
}

export function canonicalContinuityEvent(input: AttestationContinuityInput, seq: number, prevDigest: string) {
  return [
    ATTESTATION_CONTINUITY_VERSION,
    ATTESTATION_CONTINUITY_RELEASE,
    seq,
    prevDigest,
    input.issuedAt,
    input.boundaryProof,
    input.boundaryLineage,
    input.contractRef,
    input.contractLineage,
    input.suitePassed,
    input.suiteTotal,
    input.liveReady ? 1 : 0,
    input.networkExecution ? 1 : 0,
    input.serverSigned ? 1 : 0,
  ].join('|');
}

export async function deriveContinuityDigest(input: AttestationContinuityInput, seq: number, prevDigest: string) {
  if (!Number.isSafeInteger(seq) || seq <= 0) throw new Error('SEQUENCE_INVALID');
  if (!validDigest(prevDigest)) throw new Error('PREV_DIGEST_INVALID');
  const inspected = inspectContinuityInput(input);
  if (!inspected.ok) throw new Error(inspected.code);
  return `AC-${upper16(await sha(canonicalContinuityEvent(input, seq, prevDigest)))}`;
}

export async function makeContinuityEvent(input: AttestationContinuityInput, seq: number, prevDigest: string): Promise<AttestationContinuityEvent> {
  const digest = await deriveContinuityDigest(input, seq, prevDigest);
  return { ...input, seq, prevDigest, digest };
}

export function inspectContinuityTransition(previous: AttestationContinuityEvent | null, next: Omit<AttestationContinuityEvent, 'digest'>): ContinuityInspection {
  const inspected = inspectContinuityInput(next);
  if (!inspected.ok) return inspected;
  if (!Number.isSafeInteger(next.seq) || next.seq <= 0) return { ok: false, code: 'SEQUENCE_INVALID' };
  if (!validDigest(next.prevDigest)) return { ok: false, code: 'PREV_DIGEST_INVALID' };
  if (!previous) {
    if (next.prevDigest !== CONTINUITY_GENESIS) return { ok: false, code: 'GENESIS_LINK_INVALID' };
    return { ok: true };
  }
  if (next.seq !== previous.seq + 1) return { ok: false, code: 'SEQUENCE_NOT_MONOTONIC' };
  if (next.prevDigest !== previous.digest) return { ok: false, code: 'CHAIN_LINK_MISMATCH' };
  if (next.boundaryLineage !== previous.boundaryLineage) return { ok: false, code: 'BOUNDARY_LINEAGE_DRIFT' };
  if (next.contractLineage !== previous.contractLineage) return { ok: false, code: 'CONTRACT_LINEAGE_DRIFT' };
  return { ok: true };
}

export async function validateContinuityJournal(journal: AttestationContinuityJournal): Promise<ContinuityInspection> {
  if (journal.v !== ATTESTATION_CONTINUITY_VERSION || journal.release !== ATTESTATION_CONTINUITY_RELEASE) return { ok: false, code: 'JOURNAL_VERSION' };
  if (!validDigest(journal.anchorDigest)) return { ok: false, code: 'ANCHOR_INVALID' };
  if (!/^IBL-[A-F0-9]{16}$/.test(journal.originBoundaryLineage)) return { ok: false, code: 'ORIGIN_BOUNDARY_LINEAGE_INVALID' };
  if (!/^BCL-[A-F0-9]{16}$/.test(journal.originContractLineage)) return { ok: false, code: 'ORIGIN_CONTRACT_LINEAGE_INVALID' };
  if (!Array.isArray(journal.events) || journal.events.length < 1 || journal.events.length > MAX_CONTINUITY_EVENTS) return { ok: false, code: 'EVENT_COUNT_INVALID' };
  let previous: AttestationContinuityEvent | null = null;
  for (let index = 0; index < journal.events.length; index += 1) {
    const event = journal.events[index];
    const { digest, ...withoutDigest } = event;
    const inspected = inspectContinuityInput(event);
    if (!inspected.ok) return inspected;
    if (!Number.isSafeInteger(event.seq) || event.seq <= 0) return { ok: false, code: 'SEQUENCE_INVALID' };
    if (index === 0) {
      if (event.prevDigest !== journal.anchorDigest) return { ok: false, code: 'ANCHOR_LINK_MISMATCH' };
      if (event.boundaryLineage !== journal.originBoundaryLineage) return { ok: false, code: 'ORIGIN_BOUNDARY_LINEAGE_DRIFT' };
      if (event.contractLineage !== journal.originContractLineage) return { ok: false, code: 'ORIGIN_CONTRACT_LINEAGE_DRIFT' };
    } else {
      const transition = inspectContinuityTransition(previous, withoutDigest);
      if (!transition.ok) return transition;
    }
    const expected = await deriveContinuityDigest(event, event.seq, event.prevDigest);
    if (digest !== expected) return { ok: false, code: 'EVENT_DIGEST_MISMATCH' };
    previous = event;
  }
  const head = journal.events[journal.events.length - 1];
  if (journal.headDigest !== head.digest) return { ok: false, code: 'HEAD_DIGEST_MISMATCH' };
  return { ok: true };
}

export function compactContinuityJournal(journal: AttestationContinuityJournal): AttestationContinuityJournal {
  if (journal.events.length <= MAX_CONTINUITY_EVENTS) return journal;
  const events = journal.events.slice(-MAX_CONTINUITY_EVENTS);
  const removedIndex = journal.events.length - MAX_CONTINUITY_EVENTS - 1;
  const anchorDigest = removedIndex >= 0 ? journal.events[removedIndex].digest : journal.anchorDigest;
  return { ...journal, anchorDigest, events, headDigest: events[events.length - 1].digest };
}

export async function appendContinuityEvent(journal: AttestationContinuityJournal | null, input: AttestationContinuityInput): Promise<{ ok: true; journal: AttestationContinuityJournal; event: AttestationContinuityEvent } | { ok: false; code: string }> {
  if (journal) {
    const current = await validateContinuityJournal(journal);
    if (!current.ok) return { ok: false, code: `CURRENT_${current.code}` };
  }
  const previous = journal ? journal.events[journal.events.length - 1] : null;
  const seq = previous ? previous.seq + 1 : 1;
  const prevDigest = previous ? previous.digest : CONTINUITY_GENESIS;
  const transition = inspectContinuityTransition(previous, { ...input, seq, prevDigest });
  if (!transition.ok) return transition;
  const event = await makeContinuityEvent(input, seq, prevDigest);
  const next: AttestationContinuityJournal = compactContinuityJournal({
    v: ATTESTATION_CONTINUITY_VERSION,
    release: ATTESTATION_CONTINUITY_RELEASE,
    anchorDigest: journal?.anchorDigest || CONTINUITY_GENESIS,
    originBoundaryLineage: journal?.originBoundaryLineage || input.boundaryLineage,
    originContractLineage: journal?.originContractLineage || input.contractLineage,
    events: [...(journal?.events || []), event],
    headDigest: event.digest,
  });
  const validated = await validateContinuityJournal(next);
  if (!validated.ok) return { ok: false, code: `NEXT_${validated.code}` };
  return { ok: true, journal: next, event };
}

export function buildContinuitySnapshot(journal: AttestationContinuityJournal | null) {
  if (!journal || journal.events.length === 0) return 'continuity=NONE\nsecrets=NONE';
  const head = journal.events[journal.events.length - 1];
  return [
    `continuity=${journal.release}`,
    `entries=${journal.events.length}/${MAX_CONTINUITY_EVENTS}`,
    `sequence=${head.seq}`,
    `head=${journal.headDigest}`,
    `boundaryLineage=${head.boundaryLineage}`,
    `contractLineage=${head.contractLineage}`,
    'seals=REDACTED',
    'liveReady=false',
    'networkExecution=false',
    'serverSigned=false',
    'secrets=NONE',
  ].join('\n');
}
