export type PaymentDraft = {
  recipient: string;
  amountText: string;
  currency: 'XAF';
};

export type PaymentValidation =
  | { ok: true; recipient: string; amountMinor: number; amountDisplay: string }
  | { ok: false; code: 'recipient' | 'amount' | 'limit'; message: string };

const MAX_DEMO_XAF = 500_000;

export function validatePaymentDraft(draft: PaymentDraft): PaymentValidation {
  const recipient = draft.recipient.trim();
  if (recipient.length < 3 || recipient.length > 80) {
    return { ok: false, code: 'recipient', message: 'Vérifiez le destinataire.' };
  }

  const normalized = draft.amountText.replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    return { ok: false, code: 'amount', message: 'Saisissez un montant XAF valide.' };
  }

  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, code: 'amount', message: 'Le montant doit être supérieur à zéro.' };
  }

  if (amount > MAX_DEMO_XAF) {
    return { ok: false, code: 'limit', message: 'La limite de démonstration est fixée à 500 000 XAF.' };
  }

  return {
    ok: true,
    recipient,
    amountMinor: Math.round(amount * 100),
    amountDisplay: `${amount.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} XAF`,
  };
}

export const paymentSecurityPolicy = {
  liveExecutionEnabled: false,
  requiresStrongCustomerAuthentication: true,
  requiresServerSignedIntent: true,
  requiresIdempotencyKey: true,
  maxDemoXaf: MAX_DEMO_XAF,
} as const;
