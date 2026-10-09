import { apiConfig, createTransferIntent, healthCheck } from '../services/orchidpayApi';
import { runAuditIntegritySelfTest, type AuditSummary } from './auditLedger';
import { inspectTransferIntent, type TransferIntentV1 } from './intentFirewall';
import { runDeviceGateIntegritySelfTest, type DeviceGateSnapshot } from './deviceGatePassport';
import { isExplicitUserCancelCode } from './nativeSecurity';
import { evaluateReleaseReadiness, releasePassportPolicy } from './releasePassport';
import { runCardControlIntegritySelfTest } from './cardControl';
import { runSurfacePolicySelfTest } from './surfacePolicy';
import { paymentSecurityPolicy, validatePaymentDraft } from './paymentPolicy';

export type AcceptanceCheck = {
  id: string;
  label: string;
  pass: boolean;
  detail: string;
};

export type AcceptanceSuiteResult = {
  checks: AcceptanceCheck[];
  passed: number;
  total: number;
  allPass: boolean;
  ranAt: number;
};

const TEST_FINGERPRINT = 'OP-123456789ABC';

export async function runSafeAcceptanceSuite(): Promise<AcceptanceSuiteResult> {
  const checks: AcceptanceCheck[] = [];
  const add = (id: string, label: string, pass: boolean, detail: string) => {
    checks.push({ id, label, pass, detail });
  };

  add('policy-mode', 'Canal mock obligatoire', apiConfig.mode === 'mock' && paymentSecurityPolicy.liveExecutionEnabled === false, `api=${apiConfig.mode} · live=${String(paymentSecurityPolicy.liveExecutionEnabled)}`);
  add('policy-strong-auth', 'Biométrie forte requise', paymentSecurityPolicy.requiresStrongCustomerAuthentication === true, 'strong-customer-auth=true');
  add('policy-server-intent', 'Intent serveur signé requis pour live', paymentSecurityPolicy.requiresServerSignedIntent === true, 'server-signed-intent=true');
  add('policy-idempotency', 'Idempotence requise', paymentSecurityPolicy.requiresIdempotencyKey === true, 'idempotency=true');

  const valid = validatePaymentDraft({ recipient: '@devicegate', amountText: '1234', currency: 'XAF' });
  add('draft-valid', 'Brouillon 1 234 XAF accepté', valid.ok && valid.amountMinor === 123400, valid.ok ? `${valid.amountMinor} minor units` : valid.message);

  const overLimit = validatePaymentDraft({ recipient: '@devicegate', amountText: '500001', currency: 'XAF' });
  add('draft-limit', '500 001 XAF bloqué avant authentification', !overLimit.ok && overLimit.code === 'limit', overLimit.ok ? 'unexpected-pass' : `${overLimit.code} · ${overLimit.message}`);

  const zero = validatePaymentDraft({ recipient: '@devicegate', amountText: '0', currency: 'XAF' });
  add('draft-zero', 'Montant nul bloqué', !zero.ok && zero.code === 'amount', zero.ok ? 'unexpected-pass' : zero.code);

  const recipient = validatePaymentDraft({ recipient: 'x', amountText: '1234', currency: 'XAF' });
  add('draft-recipient', 'Destinataire invalide bloqué', !recipient.ok && recipient.code === 'recipient', recipient.ok ? 'unexpected-pass' : recipient.code);

  const health = await healthCheck();
  add('health-mock', 'Canal de santé non monétaire', health.ok && health.mode === 'mock' && health.status === 200, `${health.mode} · HTTP ${health.status}`);

  const intent = await createTransferIntent({ recipient: '@devicegate', amountMinor: 123400, currency: 'XAF', deviceFingerprint: TEST_FINGERPRINT });
  add('intent-non-executable', 'Intent de simulation non exécutable', intent.ok === true && intent.mode === 'mock' && intent.executable === false && intent.serverSigned === false, `${intent.mode} · executable=${String(intent.executable)} · signed=${String(intent.serverSigned)}`);
  add('intent-reference', 'Référence de simulation distincte', /^SIM-[A-Z0-9-]+$/.test(intent.reference), intent.reference);
  add('intent-idempotency', 'Clé idempotence générée', typeof intent.idempotencyKey === 'string' && intent.idempotencyKey.length >= 16, `${intent.idempotencyKey.slice(0, 12)}…`);
  add('intent-schema', 'Contrat intent versionné', intent.schema === 'orchidpay.transfer-intent.v1', intent.schema);

  const firewall = inspectTransferIntent(intent, TEST_FINGERPRINT, intent.createdAt + 1);
  add('firewall-simulation', 'Firewall accepte seulement la simulation', firewall.ok && firewall.disposition === 'SIMULATION_ONLY', firewall.ok ? firewall.disposition : firewall.code);

  const expired = inspectTransferIntent({ ...intent, expiresAt: intent.createdAt + 1 }, TEST_FINGERPRINT, intent.createdAt + 2);
  add('firewall-expired', 'Intent expiré rejeté', !expired.ok && expired.code === 'EXPIRED', expired.ok ? 'unexpected-pass' : expired.code);

  const wrongDevice = inspectTransferIntent({ ...intent, deviceFingerprint: 'OP-ABCDEF123456' }, TEST_FINGERPRINT, intent.createdAt + 1);
  add('firewall-binding', 'Binding appareil différent rejeté', !wrongDevice.ok && wrongDevice.code === 'DEVICE_BINDING_MISMATCH', wrongDevice.ok ? 'unexpected-pass' : wrongDevice.code);

  const executableMock = inspectTransferIntent({ ...intent, executable: true }, TEST_FINGERPRINT, intent.createdAt + 1);
  add('firewall-executable', 'Mock exécutable rejeté', !executableMock.ok && executableMock.code === 'MOCK_MUST_NOT_EXECUTE', executableMock.ok ? 'unexpected-pass' : executableMock.code);

  const liveIntent: TransferIntentV1 = { ...intent, mode: 'live', executable: true, serverSigned: true, reference: 'SIM-LIVEBLOCKED1' };
  const liveDecision = inspectTransferIntent(liveIntent, TEST_FINGERPRINT, intent.createdAt + 1);
  add('firewall-live-off', 'Intent live rejeté par politique', !liveDecision.ok && liveDecision.code === 'LIVE_DISABLED', liveDecision.ok ? 'unexpected-pass' : liveDecision.code);

  const audit = await runAuditIntegritySelfTest();
  add('audit-chain', 'Chaîne d’audit locale vérifiable', audit.valid, audit.valid ? `head=${audit.head.slice(0, 12)}…` : 'invalid');
  add('audit-tamper', 'Altération du journal détectée', audit.tamperRejected, audit.tamperRejected ? 'tamper-rejected' : 'tamper-undetected');

  add('auth-user-cancel', 'Annulation utilisateur explicitement reconnue', isExplicitUserCancelCode('user_cancel'), 'user_cancel');
  add('auth-system-cancel', 'Annulation système non confondue avec utilisateur', !isExplicitUserCancelCode('system_cancel'), 'system_cancel != user_cancel');

  const releaseAudit: AuditSummary = {
    valid: true, error: '', entries: 12, head: 'AL-123456789ABC', authSuccess: 2, authRejected: 1, authUserCancels: 1,
    backgroundTimeouts: 1, preAuthBlocks: 1, simulations: 1, sessionStarts: 2, lastCode: 'USER_CANCEL', lastAt: 1_700_000_000_000,
  };
  const releaseAcceptance = { passed: 32, total: 32, allPass: true };
  const releaseGate: DeviceGateSnapshot = { valid: true, error: '', counters: { authSuccess: 2, userCancel: 1, backgroundTimeouts: 1, preAuthBlocks: 1, simulations: 1, sessionStarts: 2 }, signalsPassed: 6, proof: 'DG-1234567890ABCDEF', updatedAt: 1_700_000_000_000 };
  const ready = evaluateReleaseReadiness(releaseAudit, releaseGate, releaseAcceptance);
  add('release-ready', 'Passeport RC local exige tous les signaux', ready.ready && ready.deviceSignalsPassed === 6, ready.missing.join(',') || '6/6');
  const incomplete = evaluateReleaseReadiness(releaseAudit, { ...releaseGate, counters: { ...releaseGate.counters, userCancel: 0 }, signalsPassed: 5 }, releaseAcceptance);
  add('release-missing-cancel', 'Passeport RC refuse une annulation Face ID manquante', !incomplete.ready && incomplete.missing.includes('USER_CANCEL'), incomplete.missing.join(','));

  const gateSelfTest = await runDeviceGateIntegritySelfTest();
  add('device-gate-proof', 'Passeport Device Gate hashé vérifiable', gateSelfTest.valid && gateSelfTest.signalsPassed === 6, `signals=${gateSelfTest.signalsPassed}/6`);
  add('device-gate-tamper', 'Altération du Device Gate détectée', gateSelfTest.tamperRejected, gateSelfTest.tamperRejected ? 'tamper-rejected' : 'tamper-undetected');

  const cardSelfTest = await runCardControlIntegritySelfTest();
  add('card-control-default-lock', 'Contrôle carte local démarre verrouillé', cardSelfTest.valid && cardSelfTest.defaultLocked && cardSelfTest.modeLocalOnly, `valid=${String(cardSelfTest.valid)} · locked=${String(cardSelfTest.defaultLocked)}`);
  add('card-control-tamper', 'Altération état carte détectée', cardSelfTest.tamperRejected, cardSelfTest.tamperRejected ? 'tamper-rejected' : 'tamper-undetected');

  const surfaces = runSurfacePolicySelfTest();
  add('surface-deposit-off', 'Canaux de dépôt non exécutables', surfaces.depositsDisabled, '3/3 disabled');
  add('surface-receive-share', 'Partage réception sans ordre de paiement', surfaces.receiveShareSafe && surfaces.receiveQrFailClosed, 'alias-only · QR non executable');
  add('surface-local-notifications', 'Centre état local sans push ni lien externe', surfaces.notificationsLocalOnly, 'push=off · external-links=off');
  add('release-r12-8-policy', 'Passeport R12.8 reste local non signé', releasePassportPolicy.release === 'R12.8-RC-LOCAL' && releasePassportPolicy.policy === 'MOCK_ONLY_NO_LIVE' && releasePassportPolicy.serverSigned === false, `${releasePassportPolicy.release} · ${releasePassportPolicy.policy}`);

  const passed = checks.filter((check) => check.pass).length;
  return { checks, passed, total: checks.length, allPass: passed === checks.length, ranAt: Date.now() };
}
