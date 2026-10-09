import * as Crypto from 'expo-crypto';
import { MOCK_INTENT_TTL_MS, TRANSFER_INTENT_SCHEMA, type TransferIntentV1 } from '../security/intentFirewall';

export type ApiMode = 'mock' | 'live';

type ApiConfig = Readonly<{
  mode: ApiMode;
  baseUrl: string;
}>;

export const apiConfig: ApiConfig = Object.freeze({
  mode: 'mock',
  baseUrl: 'https://orchidpay.online',
});

export async function healthCheck() {
  if (apiConfig.mode === 'mock') {
    return { ok: true, mode: 'mock', status: 200 };
  }

  const response = await fetch(`${apiConfig.baseUrl}/healthz`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  return {
    ok: response.ok,
    mode: 'live' as const,
    status: response.status,
  };
}

type TransferIntentInput = {
  recipient: string;
  amountMinor: number;
  currency: 'XAF';
  deviceFingerprint: string;
};

export async function createTransferIntent(input: TransferIntentInput): Promise<TransferIntentV1> {
  const idempotencyKey = Crypto.randomUUID();
  const now = Date.now();

  if (apiConfig.mode === 'mock') {
    return {
      ok: true,
      schema: TRANSFER_INTENT_SCHEMA,
      mode: 'mock',
      executable: false,
      serverSigned: false,
      reference: `SIM-${Crypto.randomUUID().slice(0, 12).toUpperCase()}`,
      idempotencyKey,
      recipient: input.recipient,
      amountMinor: input.amountMinor,
      currency: input.currency,
      deviceFingerprint: input.deviceFingerprint,
      createdAt: now,
      expiresAt: now + MOCK_INTENT_TTL_MS,
    };
  }

  throw new Error('Live transfer execution is intentionally disabled until authenticated signed API contracts are wired.');
}
