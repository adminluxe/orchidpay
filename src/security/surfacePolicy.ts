export type DepositChannel = Readonly<{
  id: 'bank' | 'mobile-money' | 'card';
  title: string;
  meta: string;
  enabled: false;
}>;

export const surfacePolicy = Object.freeze({
  remotePushEnabled: false,
  liveCardControlEnabled: false,
  depositExecutionEnabled: false,
  receiveQrExecutable: false,
  externalLinksEnabled: false,
  receiveShareMode: 'ALIAS_ONLY' as const,
});

export const depositChannels: readonly DepositChannel[] = Object.freeze([
  { id: 'bank', title: 'Virement bancaire', meta: 'Compte de cantonnement · connecteur non activé', enabled: false },
  { id: 'mobile-money', title: 'Mobile Money', meta: 'Connecteurs opérateurs · non activés', enabled: false },
  { id: 'card', title: 'Carte bancaire', meta: 'PSP tokenisé · non activé', enabled: false },
]);

function cleanShareField(value: string, max: number) {
  return value.replace(/[\r\n\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function buildReceiveSharePayload(alias: string, maskedAccount: string) {
  const safeAlias = cleanShareField(alias, 80);
  const safeAccount = cleanShareField(maskedAccount, 80);
  return [
    'OrchidPay · Recevoir',
    `Alias: ${safeAlias}`,
    `Compte: ${safeAccount}`,
    'Aucun montant ni ordre de paiement n’est inclus dans ce partage.',
  ].join('\n');
}

export function runSurfacePolicySelfTest() {
  const share = buildReceiveSharePayload('TEST_ALIAS_SENTINEL', 'TEST_MASKED_ACCOUNT_SENTINEL');
  const shareSafe = share.includes('TEST_ALIAS_SENTINEL') &&
    share.includes('TEST_MASKED_ACCOUNT_SENTINEL') &&
    !/https?:\/\//i.test(share) &&
    !/\b(?:amount|montant)\s*[:=]\s*\d+/i.test(share);

  return {
    depositsDisabled: depositChannels.length === 3 && depositChannels.every((channel) => channel.enabled === false),
    receiveShareSafe: shareSafe,
    notificationsLocalOnly: surfacePolicy.remotePushEnabled === false && surfacePolicy.externalLinksEnabled === false,
    receiveQrFailClosed: surfacePolicy.receiveQrExecutable === false,
    liveCardControlOff: surfacePolicy.liveCardControlEnabled === false,
  };
}
