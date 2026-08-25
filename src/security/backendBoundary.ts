import { apiConfig } from '../services/orchidpayApi';
import { paymentSecurityPolicy } from './paymentPolicy';

export const BACKEND_BOUNDARY_VERSION = 'orchidpay.backend-boundary.v1' as const;

export const backendBoundaryPolicy = Object.freeze({
  liveActivationFuse: false,
  liveApiProvisioned: false,
  serverVerifyKeyProvisioned: false,
  serverIntentVerifierProvisioned: false,
  kycAmlProviderProvisioned: false,
  pspTokenizationProvisioned: false,
  depositConnectorsProvisioned: false,
  allowedLiveHosts: [] as readonly string[],
  httpsOnly: true,
  expectedSignatureAlgorithm: 'Ed25519' as const,
});

export type BackendBlocker =
  | 'LIVE_ACTIVATION_FUSE_OFF'
  | 'LIVE_API_NOT_PROVISIONED'
  | 'SERVER_VERIFY_KEY_NOT_PROVISIONED'
  | 'SERVER_INTENT_VERIFIER_NOT_PROVISIONED'
  | 'KYC_AML_NOT_PROVISIONED'
  | 'PSP_TOKENIZATION_NOT_PROVISIONED'
  | 'DEPOSIT_CONNECTORS_NOT_PROVISIONED'
  | 'LIVE_HOST_ALLOWLIST_EMPTY';

export type BackendReadiness = {
  version: typeof BACKEND_BOUNDARY_VERSION;
  status: 'BLOCKED_EXTERNAL_DEPENDENCIES';
  readyForLive: false;
  blockers: BackendBlocker[];
};

export function evaluateBackendReadiness(): BackendReadiness {
  const blockers: BackendBlocker[] = [];
  if (!backendBoundaryPolicy.liveActivationFuse) blockers.push('LIVE_ACTIVATION_FUSE_OFF');
  if (!backendBoundaryPolicy.liveApiProvisioned) blockers.push('LIVE_API_NOT_PROVISIONED');
  if (!backendBoundaryPolicy.serverVerifyKeyProvisioned) blockers.push('SERVER_VERIFY_KEY_NOT_PROVISIONED');
  if (!backendBoundaryPolicy.serverIntentVerifierProvisioned) blockers.push('SERVER_INTENT_VERIFIER_NOT_PROVISIONED');
  if (!backendBoundaryPolicy.kycAmlProviderProvisioned) blockers.push('KYC_AML_NOT_PROVISIONED');
  if (!backendBoundaryPolicy.pspTokenizationProvisioned) blockers.push('PSP_TOKENIZATION_NOT_PROVISIONED');
  if (!backendBoundaryPolicy.depositConnectorsProvisioned) blockers.push('DEPOSIT_CONNECTORS_NOT_PROVISIONED');
  if (backendBoundaryPolicy.allowedLiveHosts.length === 0) blockers.push('LIVE_HOST_ALLOWLIST_EMPTY');
  return { version: BACKEND_BOUNDARY_VERSION, status: 'BLOCKED_EXTERNAL_DEPENDENCIES', readyForLive: false, blockers };
}

export type TransportDecision =
  | { ok: true; host: string }
  | { ok: false; code: 'INVALID_URL' | 'HTTPS_REQUIRED' | 'HOST_NOT_ALLOWLISTED' };

export function inspectLiveTransportUrl(candidate: string): TransportDecision {
  let parsed: URL;
  try { parsed = new URL(candidate); } catch { return { ok: false, code: 'INVALID_URL' }; }
  if (backendBoundaryPolicy.httpsOnly && parsed.protocol !== 'https:') return { ok: false, code: 'HTTPS_REQUIRED' };
  const host = parsed.hostname.toLowerCase();
  if (!backendBoundaryPolicy.allowedLiveHosts.includes(host)) return { ok: false, code: 'HOST_NOT_ALLOWLISTED' };
  return { ok: true, host };
}

export type SignedIntentEnvelope = {
  serverSigned: boolean;
  algorithm: string;
  keyId: string;
  signature: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
};

export type ServerTrustDecision =
  | { ok: true; code: 'SERVER_TRUST_VERIFIED' }
  | { ok: false; code: 'INVALID_ENVELOPE' | 'EXPIRED' | 'UNSUPPORTED_ALGORITHM' | 'SERVER_VERIFY_KEY_UNPROVISIONED' | 'CRYPTO_VERIFIER_UNPROVISIONED' };

export function inspectServerTrustEnvelope(envelope: SignedIntentEnvelope, now = Date.now()): ServerTrustDecision {
  if (!envelope.serverSigned || envelope.keyId.trim().length < 3 || envelope.signature.trim().length < 16 || envelope.nonce.trim().length < 12 || !Number.isSafeInteger(envelope.issuedAt) || !Number.isSafeInteger(envelope.expiresAt) || envelope.expiresAt <= envelope.issuedAt) {
    return { ok: false, code: 'INVALID_ENVELOPE' };
  }
  if (now > envelope.expiresAt) return { ok: false, code: 'EXPIRED' };
  if (envelope.algorithm !== backendBoundaryPolicy.expectedSignatureAlgorithm) return { ok: false, code: 'UNSUPPORTED_ALGORITHM' };
  if (!backendBoundaryPolicy.serverVerifyKeyProvisioned) return { ok: false, code: 'SERVER_VERIFY_KEY_UNPROVISIONED' };
  if (!backendBoundaryPolicy.serverIntentVerifierProvisioned) return { ok: false, code: 'CRYPTO_VERIFIER_UNPROVISIONED' };
  return { ok: true, code: 'SERVER_TRUST_VERIFIED' };
}

export function buildRedactedIntegrationSnapshot(releaseProof = 'RP-NOT-PROVIDED') {
  const readiness = evaluateBackendReadiness();
  return [
    'OrchidPay · R12.9 Integration Boundary',
    `boundary=${readiness.version}`,
    `status=${readiness.status}`,
    `liveReady=${String(readiness.readyForLive)}`,
    `apiMode=${apiConfig.mode}`,
    `paymentLive=${String(paymentSecurityPolicy.liveExecutionEnabled)}`,
    `releaseProof=${releaseProof.replace(/[^A-Z0-9-]/gi, '').slice(0, 40)}`,
    `blockers=${readiness.blockers.join(',')}`,
    'serverSigned=false',
    'secrets=NONE',
  ].join('\n');
}

export function runBackendBoundarySelfTest() {
  const readiness = evaluateBackendReadiness();
  const httpRejected = inspectLiveTransportUrl('http://example.invalid').ok === false;
  const httpsUnlisted = inspectLiveTransportUrl('https://example.invalid');
  const now = 1_700_000_000_000;
  const fake = inspectServerTrustEnvelope({
    serverSigned: true,
    algorithm: 'Ed25519',
    keyId: 'kid-demo',
    signature: 'DEMO-SIGNATURE-NOT-VALID',
    nonce: 'nonce-1234567890',
    issuedAt: now,
    expiresAt: now + 60_000,
  }, now + 1);
  const snapshot = buildRedactedIntegrationSnapshot('RP-1234567890ABCDEF');
  return {
    boundaryBlocked: readiness.readyForLive === false && readiness.status === 'BLOCKED_EXTERNAL_DEPENDENCIES' && readiness.blockers.length === 8,
    liveFuseOff: backendBoundaryPolicy.liveActivationFuse === false && paymentSecurityPolicy.liveExecutionEnabled === false && apiConfig.mode === 'mock',
    transportFailClosed: httpRejected && !httpsUnlisted.ok && httpsUnlisted.code === 'HOST_NOT_ALLOWLISTED',
    fakeServerSignatureRejected: !fake.ok && fake.code === 'SERVER_VERIFY_KEY_UNPROVISIONED',
    redactedSnapshot: snapshot.includes('secrets=NONE') && !/token=|secret=|authorization=/i.test(snapshot),
  };
}
