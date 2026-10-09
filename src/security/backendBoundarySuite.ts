import { runSafeAcceptanceSuite, type AcceptanceCheck } from './acceptanceSuite';
import {
  backendBoundaryPolicy,
  buildRedactedIntegrationSnapshot,
  evaluateBackendReadiness,
  inspectLiveTransportUrl,
  inspectServerTrustEnvelope,
  runBackendBoundarySelfTest,
} from './backendBoundary';
import { apiConfig } from '../services/orchidpayApi';
import { paymentSecurityPolicy } from './paymentPolicy';

export type BackendBoundarySuiteResult = {
  checks: AcceptanceCheck[];
  passed: number;
  total: number;
  allPass: boolean;
  ranAt: number;
};

export async function runBackendBoundarySuite(): Promise<BackendBoundarySuiteResult> {
  const core = await runSafeAcceptanceSuite();
  const checks: AcceptanceCheck[] = [...core.checks];
  const add = (id: string, label: string, pass: boolean, detail: string) => checks.push({ id, label, pass, detail });
  const readiness = evaluateBackendReadiness();
  const self = runBackendBoundarySelfTest();
  const now = 1_700_000_000_000;

  add('boundary-live-fuse', 'Fusible live explicitement OFF', backendBoundaryPolicy.liveActivationFuse === false && paymentSecurityPolicy.liveExecutionEnabled === false && apiConfig.mode === 'mock', 'fuse=off · payment=off · api=mock');
  add('boundary-external-blockers', 'Dépendances externes restent bloquantes', readiness.readyForLive === false && readiness.blockers.length === 8, `${readiness.blockers.length} blockers`);
  add('boundary-host-allowlist', 'Allowlist live vide = réseau live refusé', backendBoundaryPolicy.allowedLiveHosts.length === 0 && inspectLiveTransportUrl('https://example.invalid').ok === false, 'allowlist=[]');
  add('boundary-https-only', 'Transport non HTTPS rejeté', inspectLiveTransportUrl('http://example.invalid').ok === false, 'http rejected');
  const fakeSigned = inspectServerTrustEnvelope({ serverSigned: true, algorithm: 'Ed25519', keyId: 'kid-demo', signature: 'DEMO-SIGNATURE-NOT-VALID', nonce: 'nonce-1234567890', issuedAt: now, expiresAt: now + 60_000 }, now + 1);
  add('boundary-signature-flag-insufficient', 'Flag serverSigned seul insuffisant', !fakeSigned.ok && fakeSigned.code === 'SERVER_VERIFY_KEY_UNPROVISIONED', fakeSigned.ok ? 'unexpected-pass' : fakeSigned.code);
  const expired = inspectServerTrustEnvelope({ serverSigned: true, algorithm: 'Ed25519', keyId: 'kid-demo', signature: 'DEMO-SIGNATURE-NOT-VALID', nonce: 'nonce-1234567890', issuedAt: now, expiresAt: now + 1 }, now + 2);
  add('boundary-expired-envelope', 'Enveloppe serveur expirée rejetée', !expired.ok && expired.code === 'EXPIRED', expired.ok ? 'unexpected-pass' : expired.code);
  const snapshot = buildRedactedIntegrationSnapshot('RP-1234567890ABCDEF');
  add('boundary-redaction', 'Snapshot intégration expurgé', self.redactedSnapshot && snapshot.includes('serverSigned=false') && snapshot.includes('secrets=NONE'), 'no secret/token material');
  add('boundary-selftest', 'Frontière backend fail-closed cohérente', self.boundaryBlocked && self.liveFuseOff && self.transportFailClosed && self.fakeServerSignatureRejected, 'boundary self-test pass');

  const passed = checks.filter((check) => check.pass).length;
  return { checks, passed, total: checks.length, allPass: passed === checks.length, ranAt: Date.now() };
}
