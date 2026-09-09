export const mockTransactions = [
  { id: 'tx_001', title: 'Paiement marchand', meta: "Aujourd’hui · 14:32", amount: '-2 500 XAF', tone: 'danger' as const },
  { id: 'tx_002', title: 'Transfert reçu', meta: "Aujourd’hui · 10:07", amount: '+5 000 XAF', tone: 'success' as const },
  { id: 'tx_003', title: 'Facture électricité', meta: 'Hier · 18:45', amount: '-15 000 XAF', tone: 'danger' as const },
  { id: 'tx_004', title: 'Achat en ligne', meta: 'Hier · 10:12', amount: '-7 200 XAF', tone: 'danger' as const },
];

export const walletSnapshot = {
  balance: '12 450,75 XAF',
  fiat: '≈ 18,98 USD',
  accountName: 'Afripay',
  publicAlias: '@afripay',
  maskedAccount: 'OP •••• 2874',
};
