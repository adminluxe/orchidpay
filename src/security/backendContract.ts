import {
  backendBoundaryPolicy,
  inspectLiveTransportUrl,
  inspectServerTrustEnvelope,
  type SignedIntentEnvelope,
} from './backendBoundary';

export const BACKEND_CONTRACT_VERSION = 'orchidpay.backend-contract.v1' as const;
export const INTENT_SCHEMA_VERSION = 1 as const;
export const MAX_INTENT_TTL_MS = 90_000;
export const MAX_CLOCK_SKEW_MS = 15_000;
export const MAX_REPLAY_ENTRIES = 128;

export const backendContractPolicy = Object.freeze({
  networkExecutionEnabled: false,
  liveIntentSubmissionEnabled: false,
  serverResponseTrustEnabled: false,
  maxIntentTtlMs: MAX_INTENT_TTL_MS,
  maxClockSkewMs: MAX_CLOCK_SKEW_MS,
  maxCanonicalBytes: 8_192,
  maxReplayEntries: MAX_REPLAY_ENTRIES,
});

export const liveOperations = [
  'payment.create',
  'payment.status',
  'deposit.create',
  'kyc.status',
  'card.control',
] as const;

export type LiveOperation = (typeof liveOperations)[number];

export const endpointContract = Object.freeze({
  'payment.create': { method: 'POST', path: '/v1/payments/intents' },
  'payment.status': { method: 'GET', path: '/v1/payments/intents/:id' },
  'deposit.create': { method: 'POST', path: '/v1/deposits/intents' },
  'kyc.status': { method: 'GET', path: '/v1/kyc/status' },
  'card.control': { method: 'POST', path: '/v1/cards/control-intents' },
} as const);

export type IntentDraft = {
  v: 1;
  operation: LiveOperation;
  subjectRef: string;
  nonce: string;
  idempotencyKey: string;
  issuedAt: number;
  expiresAt: number;
  amountMinor?: number;
  currency?: string;
  payload?: Record<string, unknown>;
};

export type IntentValidationCode =
  | 'VERSION_INVALID'
  | 'OPERATION_UNKNOWN'
  | 'SUBJECT_REF_INVALID'
  | 'NONCE_INVALID'
  | 'IDEMPOTENCY_KEY_INVALID'
  | 'TIME_INVALID'
  | 'ISSUED_IN_FUTURE'
  | 'EXPIRED'
  | 'TTL_TOO_LONG'
  | 'AMOUNT_MINOR_INVALID'
  | 'CURRENCY_INVALID'
  | 'MONEY_PAIR_INVALID'
  | 'FORBIDDEN_SENSITIVE_FIELD'
  | 'OUTBOUND_URL_IN_PAYLOAD'
  | 'PAYLOAD_UNSERIALIZABLE'
  | 'CANONICAL_TOO_LARGE';

export type IntentValidation =
  | { ok: true; canonical: string }
  | { ok: false; code: IntentValidationCode };

const forbiddenKey = /(^|_)(pan|cardnumber|card_number|cvv|cvc|password|passcode|secret|token|authorization|privatekey|private_key|seed|mnemonic)($|_)/i;
const outboundUrl = /https?:\/\//i;

function stable(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('NON_FINITE');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stable(obj[key])}`).join(',')}}`;
  }
  throw new Error('UNSERIALIZABLE');
}

function inspectPayload(value: unknown, depth = 0): 'OK' | 'SENSITIVE' | 'URL' | 'INVALID' {
  if (depth > 8) return 'INVALID';
  if (value === null || typeof value === 'boolean' || typeof value === 'number') return 'OK';
  if (typeof value === 'string') {
    if (/^Bearer\s+/i.test(value)) return 'SENSITIVE';
    if (outboundUrl.test(value)) return 'URL';
    return 'OK';
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const result = inspectPayload(item, depth + 1);
      if (result !== 'OK') return result;
    }
    return 'OK';
  }
  if (typeof value === 'object') {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (forbiddenKey.test(key.replace(/([a-z])([A-Z])/g, '$1_$2'))) return 'SENSITIVE';
      const result = inspectPayload(nested, depth + 1);
      if (result !== 'OK') return result;
    }
    return 'OK';
  }
  return 'INVALID';
}

export function buildCanonicalIntent(draft: IntentDraft): string {
  const canonical = {
    v: draft.v,
    operation: draft.operation,
    subjectRef: draft.subjectRef,
    nonce: draft.nonce,
    idempotencyKey: draft.idempotencyKey,
    issuedAt: draft.issuedAt,
    expiresAt: draft.expiresAt,
    amountMinor: draft.amountMinor ?? null,
    currency: draft.currency ?? null,
    payload: draft.payload ?? {},
  };
  return stable(canonical);
}

export function validateIntentDraft(draft: IntentDraft, now = Date.now()): IntentValidation {
  if (draft.v !== INTENT_SCHEMA_VERSION) return { ok: false, code: 'VERSION_INVALID' };
  if (!(liveOperations as readonly string[]).includes(draft.operation)) return { ok: false, code: 'OPERATION_UNKNOWN' };
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{2,63}$/.test(draft.subjectRef)) return { ok: false, code: 'SUBJECT_REF_INVALID' };
  if (!/^[A-Za-z0-9_-]{16,96}$/.test(draft.nonce)) return { ok: false, code: 'NONCE_INVALID' };
  if (!/^idem_[A-Za-z0-9_-]{16,80}$/.test(draft.idempotencyKey)) return { ok: false, code: 'IDEMPOTENCY_KEY_INVALID' };
  if (!Number.isSafeInteger(draft.issuedAt) || !Number.isSafeInteger(draft.expiresAt) || draft.expiresAt <= draft.issuedAt) return { ok: false, code: 'TIME_INVALID' };
  if (draft.issuedAt > now + MAX_CLOCK_SKEW_MS) return { ok: false, code: 'ISSUED_IN_FUTURE' };
  if (now > draft.expiresAt) return { ok: false, code: 'EXPIRED' };
  if (draft.expiresAt - draft.issuedAt > MAX_INTENT_TTL_MS) return { ok: false, code: 'TTL_TOO_LONG' };
  const amountPresent = draft.amountMinor !== undefined;
  const currencyPresent = draft.currency !== undefined;
  if (amountPresent !== currencyPresent) return { ok: false, code: 'MONEY_PAIR_INVALID' };
  if (amountPresent && (!Number.isSafeInteger(draft.amountMinor) || (draft.amountMinor ?? 0) <= 0 || (draft.amountMinor ?? 0) > 999_999_999_999)) return { ok: false, code: 'AMOUNT_MINOR_INVALID' };
  if (currencyPresent && !/^[A-Z]{3}$/.test(draft.currency ?? '')) return { ok: false, code: 'CURRENCY_INVALID' };
  const payloadCheck = inspectPayload(draft.payload ?? {});
  if (payloadCheck === 'SENSITIVE') return { ok: false, code: 'FORBIDDEN_SENSITIVE_FIELD' };
  if (payloadCheck === 'URL') return { ok: false, code: 'OUTBOUND_URL_IN_PAYLOAD' };
  if (payloadCheck === 'INVALID') return { ok: false, code: 'PAYLOAD_UNSERIALIZABLE' };
  try {
    const canonical = buildCanonicalIntent(draft);
    if (canonical.length > backendContractPolicy.maxCanonicalBytes) return { ok: false, code: 'CANONICAL_TOO_LARGE' };
    return { ok: true, canonical };
  } catch {
    return { ok: false, code: 'PAYLOAD_UNSERIALIZABLE' };
  }
}

export class ReplayWindow {
  private readonly seen = new Map<string, number>();

  accept(nonce: string, expiresAt: number, now = Date.now()): boolean {
    for (const [key, expiry] of this.seen.entries()) if (expiry <= now) this.seen.delete(key);
    if (!/^[A-Za-z0-9_-]{16,96}$/.test(nonce) || expiresAt <= now || this.seen.has(nonce)) return false;
    this.seen.set(nonce, expiresAt);
    while (this.seen.size > MAX_REPLAY_ENTRIES) {
      const oldest = this.seen.keys().next().value as string | undefined;
      if (!oldest) break;
      this.seen.delete(oldest);
    }
    return true;
  }

  size() { return this.seen.size; }
}

export function inspectContractTransport(candidate: string) {
  if (!backendContractPolicy.networkExecutionEnabled) return { ok: false as const, code: 'NETWORK_EXECUTION_DISABLED' as const };
  return inspectLiveTransportUrl(candidate);
}

export function inspectContractServerResponse(envelope: SignedIntentEnvelope, now = Date.now()) {
  if (!backendContractPolicy.serverResponseTrustEnabled) {
    const decision = inspectServerTrustEnvelope(envelope, now);
    return decision.ok ? { ok: false as const, code: 'CONTRACT_TRUST_FUSE_OFF' as const } : decision;
  }
  return inspectServerTrustEnvelope(envelope, now);
}

export function buildBackendContractSnapshot(boundaryProof = 'IB-NOT-PROVIDED') {
  return [
    'OrchidPay · R13.0 Backend Contract Lab',
    `contract=${BACKEND_CONTRACT_VERSION}`,
    `intentSchema=${INTENT_SCHEMA_VERSION}`,
    `networkExecution=${String(backendContractPolicy.networkExecutionEnabled)}`,
    `liveIntentSubmission=${String(backendContractPolicy.liveIntentSubmissionEnabled)}`,
    `serverResponseTrust=${String(backendContractPolicy.serverResponseTrustEnabled)}`,
    `allowlistHosts=${backendBoundaryPolicy.allowedLiveHosts.length}`,
    `boundaryProof=${boundaryProof.replace(/[^A-Z0-9-]/gi, '').slice(0, 40)}`,
    `operations=${liveOperations.length}`,
    `ttlMs=${MAX_INTENT_TTL_MS}`,
    'serverSigned=false',
    'secrets=NONE',
  ].join('\n');
}

export function runBackendContractSelfTest() {
  const now = 1_700_000_000_000;
  const draft: IntentDraft = {
    v: 1,
    operation: 'payment.create',
    subjectRef: 'wallet.demo.001',
    nonce: 'nonce_demo_1234567890',
    idempotencyKey: 'idem_demo_12345678901',
    issuedAt: now,
    expiresAt: now + 60_000,
    amountMinor: 1250,
    currency: 'EUR',
    payload: { purpose: 'lab', merchantRef: 'merchant.demo.001' },
  };
  const first = validateIntentDraft(draft, now + 1);
  const replay = new ReplayWindow();
  const fakeServer = inspectContractServerResponse({
    serverSigned: true,
    algorithm: 'Ed25519',
    keyId: 'kid-demo',
    signature: 'DEMO-SIGNATURE-NOT-VALID',
    nonce: 'nonce-1234567890',
    issuedAt: now,
    expiresAt: now + 60_000,
  }, now + 1);
  const snapshot = buildBackendContractSnapshot('IB-1234567890ABCDEF');
  return {
    validCanonicalIntent: first.ok && first.canonical.length > 64,
    replayFirstAccepted: replay.accept(draft.nonce, draft.expiresAt, now + 1),
    replaySecondRejected: !replay.accept(draft.nonce, draft.expiresAt, now + 2),
    networkStillBlocked: inspectContractTransport('https://example.invalid').ok === false,
    serverTrustStillBlocked: !fakeServer.ok,
    redactionSafe: snapshot.includes('secrets=NONE') && !/Bearer\s|authorization=|token=|secret=/i.test(snapshot),
  };
}
