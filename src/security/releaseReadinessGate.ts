import * as Crypto from 'expo-crypto';
import type { DeviceAttestationVerdict } from './deviceAttestationContract';
import type { LedgerAnchorJournal, SignedServerTimeAnchor } from './serverLedgerAnchor';
import type { ServerTrustAnchorSet } from './serverTrustAnchor';

export const RELEASE_READINESS_VERSION = 1 as const;
export const RELEASE_READINESS_RELEASE = 'R13.6-RELEASE-READINESS-GATE' as const;
export const MAX_RELEASE_RECEIPT_TTL_MS = 5_000;

export const releaseReadinessPolicy = Object.freeze({
  scope: 'DRY_RUN_RELEASE_READINESS_ONLY' as const,
  serverVerifierProvisioned: false as const,
  deviceVerifierProvisioned: false as const,
  serverLedgerProvisioned: false as const,
  trustedServerClockProvisioned: false as const,
  productionTrustAnchorProvisioned: false as const,
  networkExecutionEnabled: false as const,
  livePaymentExecutionEnabled: false as const,
  settlementEnabled: false as const,
  productionReleaseClaim: false as const,
});

export type ReleaseReadinessInput = {
  parentRemoteProof: string;
  trustAnchorDigest: string;
  attestationVerdictDigest: string;
  ledgerHeadDigest: string;
  timeAnchorDigest: string;
  environmentDigest: string;
  killSwitchEngaged: boolean;
  serverVerifierProvisioned: boolean;
  deviceVerifierProvisioned: boolean;
  serverLedgerProvisioned: boolean;
  trustedServerClockProvisioned: boolean;
  productionTrustAnchorProvisioned: boolean;
  networkExecutionEnabled: boolean;
  livePaymentExecutionEnabled: boolean;
  settlementEnabled: boolean;
};
export type ReleaseReadinessReceipt = {
  v: 1;
  release: typeof RELEASE_READINESS_RELEASE;
  scope: typeof releaseReadinessPolicy.scope;
  issuedAt: number;
  expiresAt: number;
  parentRemoteProof: string;
  trustAnchorDigest: string;
  attestationVerdictDigest: string;
  ledgerHeadDigest: string;
  timeAnchorDigest: string;
  environmentDigest: string;
  readinessClass: 'LAB_READY_DRY_RUN_ONLY';
  digest: string;
};
export type ReleaseInspection = { ok: true } | { ok: false; code: string };

async function sha(value: string) { return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value); }
function upper16(hex: string) { return hex.slice(0, 16).toUpperCase(); }
function valid(value: string, prefix: string) { return new RegExp(`^${prefix}-[A-F0-9]{16}$`).test(value); }
function inspectRefs(input: ReleaseReadinessInput): ReleaseInspection {
  if (!/^RAP-[A-F0-9]{16}$/.test(input.parentRemoteProof)) return { ok: false, code: 'RELEASE_PARENT_REMOTE' };
  if (!valid(input.trustAnchorDigest, 'TA') || !valid(input.attestationVerdictDigest, 'DAV') || !valid(input.ledgerHeadDigest, 'LAE') || !valid(input.timeAnchorDigest, 'STA') || !valid(input.environmentDigest, 'ENV')) return { ok: false, code: 'RELEASE_BINDING' };
  if (input.killSwitchEngaged) return { ok: false, code: 'RELEASE_KILL_SWITCH' };
  if (input.networkExecutionEnabled) return { ok: false, code: 'RELEASE_NETWORK_FUSE' };
  if (input.livePaymentExecutionEnabled) return { ok: false, code: 'RELEASE_PAYMENT_FUSE' };
  if (input.settlementEnabled) return { ok: false, code: 'RELEASE_SETTLEMENT_FUSE' };
  return { ok: true };
}

export function inspectProductionReleaseReadiness(input: ReleaseReadinessInput): ReleaseInspection {
  const refs = inspectRefs(input); if (!refs.ok) return refs;
  if (!input.serverVerifierProvisioned) return { ok: false, code: 'RELEASE_SERVER_VERIFIER_NOT_PROVISIONED' };
  if (!input.deviceVerifierProvisioned) return { ok: false, code: 'RELEASE_DEVICE_VERIFIER_NOT_PROVISIONED' };
  if (!input.serverLedgerProvisioned) return { ok: false, code: 'RELEASE_LEDGER_NOT_PROVISIONED' };
  if (!input.trustedServerClockProvisioned) return { ok: false, code: 'RELEASE_CLOCK_NOT_PROVISIONED' };
  if (!input.productionTrustAnchorProvisioned) return { ok: false, code: 'RELEASE_TRUST_ANCHOR_NOT_PROVISIONED' };
  return { ok: false, code: 'RELEASE_PRODUCTION_PATH_INTENTIONALLY_BLOCKED' };
}

export function inspectLabReleaseReadiness(
  input: ReleaseReadinessInput,
  anchor: ServerTrustAnchorSet,
  verdict: DeviceAttestationVerdict,
  journal: LedgerAnchorJournal,
  time: SignedServerTimeAnchor,
) {
  const refs = inspectRefs(input); if (!refs.ok) return { ok: false as const, code: refs.code };
  if (anchor.digest !== input.trustAnchorDigest || verdict.digest !== input.attestationVerdictDigest || journal.headDigest !== input.ledgerHeadDigest || time.digest !== input.timeAnchorDigest || journal.parentRemoteProof !== input.parentRemoteProof) return { ok: false as const, code: 'RELEASE_PARENT_MATERIAL_MISMATCH' };
  return { ok: true as const, readinessClass: 'LAB_READY_DRY_RUN_ONLY' as const };
}
function canonicalReceipt(value: Omit<ReleaseReadinessReceipt, 'digest'>) {
  return [value.v, value.release, value.scope, value.issuedAt, value.expiresAt, value.parentRemoteProof, value.trustAnchorDigest, value.attestationVerdictDigest, value.ledgerHeadDigest, value.timeAnchorDigest, value.environmentDigest, value.readinessClass].join('|');
}
export async function buildReleaseReadinessReceipt(input: ReleaseReadinessInput, now: number, anchor: ServerTrustAnchorSet, verdict: DeviceAttestationVerdict, journal: LedgerAnchorJournal, time: SignedServerTimeAnchor) {
  const lab = inspectLabReleaseReadiness(input, anchor, verdict, journal, time);
  if (!lab.ok) return { ok: false as const, code: lab.code };
  const core: Omit<ReleaseReadinessReceipt, 'digest'> = {
    v: 1,
    release: RELEASE_READINESS_RELEASE,
    scope: releaseReadinessPolicy.scope,
    issuedAt: now,
    expiresAt: now + MAX_RELEASE_RECEIPT_TTL_MS,
    parentRemoteProof: input.parentRemoteProof,
    trustAnchorDigest: input.trustAnchorDigest,
    attestationVerdictDigest: input.attestationVerdictDigest,
    ledgerHeadDigest: input.ledgerHeadDigest,
    timeAnchorDigest: input.timeAnchorDigest,
    environmentDigest: input.environmentDigest,
    readinessClass: 'LAB_READY_DRY_RUN_ONLY',
  };
  return { ok: true as const, receipt: { ...core, digest: `RG-${upper16(await sha(canonicalReceipt(core)))}` } };
}
export async function inspectReleaseReadinessReceipt(value: ReleaseReadinessReceipt, now: number): Promise<ReleaseInspection> {
  if (value.v !== RELEASE_READINESS_VERSION || value.release !== RELEASE_READINESS_RELEASE || value.scope !== releaseReadinessPolicy.scope || value.readinessClass !== 'LAB_READY_DRY_RUN_ONLY') return { ok: false, code: 'RECEIPT_VERSION' };
  if (!Number.isSafeInteger(value.issuedAt) || !Number.isSafeInteger(value.expiresAt) || value.issuedAt <= 0 || value.expiresAt <= value.issuedAt || value.expiresAt - value.issuedAt > MAX_RELEASE_RECEIPT_TTL_MS) return { ok: false, code: 'RECEIPT_TIME' };
  if (now > value.expiresAt) return { ok: false, code: 'RECEIPT_EXPIRED' };
  if (!/^RAP-[A-F0-9]{16}$/.test(value.parentRemoteProof) || !valid(value.trustAnchorDigest, 'TA') || !valid(value.attestationVerdictDigest, 'DAV') || !valid(value.ledgerHeadDigest, 'LAE') || !valid(value.timeAnchorDigest, 'STA') || !valid(value.environmentDigest, 'ENV') || !valid(value.digest, 'RG')) return { ok: false, code: 'RECEIPT_BINDING' };
  const { digest, ...core } = value;
  if (digest !== `RG-${upper16(await sha(canonicalReceipt(core)))}`) return { ok: false, code: 'RECEIPT_DIGEST_MISMATCH' };
  return { ok: true };
}

export async function deriveReleaseReadinessPolicyDigest() {
  const raw = [RELEASE_READINESS_VERSION, RELEASE_READINESS_RELEASE, MAX_RELEASE_RECEIPT_TTL_MS, releaseReadinessPolicy.scope, 0,0,0,0,0,0,0,0,0].join('|');
  return `RGPOL-${upper16(await sha(raw))}`;
}
export function buildReleaseReadinessSnapshot(receipt: ReleaseReadinessReceipt | null) {
  return [
    `releaseReadinessGate=${RELEASE_READINESS_RELEASE}`,
    `receipt=${receipt?.digest || 'NONE'}`,
    `parentRemote=${receipt?.parentRemoteProof || 'NONE'}`,
    `scope=${releaseReadinessPolicy.scope}`,
    'serverVerifier=false',
    'deviceVerifier=false',
    'serverLedger=false',
    'trustedServerClock=false',
    'productionTrustAnchor=false',
    'networkExecution=false',
    'livePaymentExecution=false',
    'settlement=false',
    'productionReleaseClaim=false',
    'secrets=NONE',
  ].join('\n');
}
