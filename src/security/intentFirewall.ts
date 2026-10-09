import { paymentSecurityPolicy } from './paymentPolicy';

export const TRANSFER_INTENT_SCHEMA = 'orchidpay.transfer-intent.v1' as const;
export const MOCK_INTENT_TTL_MS = 5 * 60_000;

export type TransferIntentV1 = {
  ok: true;
  schema: typeof TRANSFER_INTENT_SCHEMA;
  mode: 'mock' | 'live';
  executable: boolean;
  serverSigned: boolean;
  reference: string;
  idempotencyKey: string;
  recipient: string;
  amountMinor: number;
  currency: 'XAF';
  deviceFingerprint: string;
  createdAt: number;
  expiresAt: number;
};

export type IntentDecision =
  | { ok: true; disposition: 'SIMULATION_ONLY'; code: 'MOCK_NON_EXECUTABLE' }
  | {
      ok: false;
      code:
        | 'INVALID_SCHEMA'
        | 'INVALID_REFERENCE'
        | 'INVALID_IDEMPOTENCY'
        | 'INVALID_RECIPIENT'
        | 'INVALID_AMOUNT'
        | 'INVALID_CURRENCY'
        | 'DEVICE_BINDING_REQUIRED'
        | 'DEVICE_BINDING_MISMATCH'
        | 'INVALID_TIME_WINDOW'
        | 'EXPIRED'
        | 'MOCK_MUST_NOT_EXECUTE'
        | 'MOCK_MUST_NOT_BE_SERVER_SIGNED'
        | 'LIVE_DISABLED';
      message: string;
    };

const referencePattern = /^SIM-[A-Z0-9-]{8,64}$/;
const idempotencyPattern = /^[A-Za-z0-9-]{16,128}$/;
const fingerprintPattern = /^OP-[A-F0-9]{12}$/;

function reject(code: Exclude<IntentDecision, { ok: true }>['code'], message: string): IntentDecision {
  return { ok: false, code, message };
}

export function inspectTransferIntent(
  intent: TransferIntentV1,
  expectedDeviceFingerprint: string,
  now = Date.now(),
): IntentDecision {
  if (intent.schema !== TRANSFER_INTENT_SCHEMA) return reject('INVALID_SCHEMA', 'Schéma d’intent refusé.');
  if (!referencePattern.test(intent.reference)) return reject('INVALID_REFERENCE', 'Référence invalide.');
  if (!idempotencyPattern.test(intent.idempotencyKey)) return reject('INVALID_IDEMPOTENCY', 'Clé idempotence invalide.');
  if (intent.recipient.trim().length < 3 || intent.recipient.trim().length > 80) return reject('INVALID_RECIPIENT', 'Destinataire invalide.');
  if (!Number.isSafeInteger(intent.amountMinor) || intent.amountMinor <= 0 || intent.amountMinor > paymentSecurityPolicy.maxDemoXaf * 100) {
    return reject('INVALID_AMOUNT', 'Montant intent invalide.');
  }
  if (intent.currency !== 'XAF') return reject('INVALID_CURRENCY', 'Devise refusée.');
  if (!fingerprintPattern.test(expectedDeviceFingerprint)) return reject('DEVICE_BINDING_REQUIRED', 'Binding appareil requis.');
  if (intent.deviceFingerprint !== expectedDeviceFingerprint) return reject('DEVICE_BINDING_MISMATCH', 'Intent lié à un autre appareil.');
  if (!Number.isSafeInteger(intent.createdAt) || !Number.isSafeInteger(intent.expiresAt) || intent.expiresAt <= intent.createdAt || intent.expiresAt - intent.createdAt > 10 * 60_000) {
    return reject('INVALID_TIME_WINDOW', 'Fenêtre temporelle invalide.');
  }
  if (now > intent.expiresAt) return reject('EXPIRED', 'Intent expiré.');
  if (intent.mode === 'live') return reject('LIVE_DISABLED', 'Exécution live désactivée dans cette version.');
  if (intent.executable !== false) return reject('MOCK_MUST_NOT_EXECUTE', 'Un intent mock doit être non exécutable.');
  if (intent.serverSigned !== false) return reject('MOCK_MUST_NOT_BE_SERVER_SIGNED', 'Un intent mock ne doit pas usurper une signature serveur.');
  return { ok: true, disposition: 'SIMULATION_ONLY', code: 'MOCK_NON_EXECUTABLE' };
}
