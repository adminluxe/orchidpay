import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { readRemoteAuthorizationReadinessPassport } from './remoteAuthorizationPassport';
import { deriveServerTrustAnchorPolicyDigest, serverTrustAnchorPolicy, SERVER_TRUST_ANCHOR_RELEASE } from './serverTrustAnchor';
import { deriveDeviceAttestationPolicyDigest, deviceAttestationPolicy, DEVICE_ATTESTATION_CONTRACT_RELEASE } from './deviceAttestationContract';
import { deriveServerLedgerAnchorPolicyDigest, serverLedgerAnchorPolicy, SERVER_LEDGER_ANCHOR_RELEASE } from './serverLedgerAnchor';
import { deriveReleaseReadinessPolicyDigest, releaseReadinessPolicy, RELEASE_READINESS_RELEASE } from './releaseReadinessGate';

const KEY = 'orchidpay.trust.anchor.readiness.passport.v1';
const VERSION = 1 as const;
const secureStoreOptions: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY };

export type TrustAnchorReadinessPassport = {
  v: 1;
  issuedAt: number;
  status: 'TRUST_ANCHOR_DEVICE_LEDGER_RELEASE_CONTRACT_PROVEN_PRODUCTION_NOT_PROVISIONED';
  parentRemoteProof: string;
  parentAuthorizationProof: string;
  parentReplayProof: string;
  parentBackendProof: string;
  boundaryLineage: string;
  contractLineage: string;
  suitePassed: 264;
  suiteTotal: 264;
  scope: 'TRUST_ANCHOR_AND_RELEASE_READINESS_ONLY';
  trustAnchorRelease: typeof SERVER_TRUST_ANCHOR_RELEASE;
  deviceAttestationRelease: typeof DEVICE_ATTESTATION_CONTRACT_RELEASE;
  ledgerAnchorRelease: typeof SERVER_LEDGER_ANCHOR_RELEASE;
  releaseGateRelease: typeof RELEASE_READINESS_RELEASE;
  productionKeySet: false;
  serverSignatureVerifier: false;
  deviceAttestationVerifier: false;
  serverReplayLedger: false;
  trustedServerClock: false;
  productionRelease: false;
  networkExecution: false;
  livePaymentExecution: false;
  settlement: false;
  trustPolicyDigest: string;
  devicePolicyDigest: string;
  ledgerPolicyDigest: string;
  releasePolicyDigest: string;
  proof: string;
};

type Core = Omit<TrustAnchorReadinessPassport, 'proof'>;
async function sha(value: string) { return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value); }
function upper16(hex: string) { return hex.slice(0, 16).toUpperCase(); }
function canonical(value: Core) {
  return [
    value.v, value.issuedAt, value.status,
    value.parentRemoteProof, value.parentAuthorizationProof, value.parentReplayProof, value.parentBackendProof,
    value.boundaryLineage, value.contractLineage,
    value.suitePassed, value.suiteTotal, value.scope,
    value.trustAnchorRelease, value.deviceAttestationRelease, value.ledgerAnchorRelease, value.releaseGateRelease,
    value.productionKeySet ? 1 : 0, value.serverSignatureVerifier ? 1 : 0, value.deviceAttestationVerifier ? 1 : 0,
    value.serverReplayLedger ? 1 : 0, value.trustedServerClock ? 1 : 0, value.productionRelease ? 1 : 0,
    value.networkExecution ? 1 : 0, value.livePaymentExecution ? 1 : 0, value.settlement ? 1 : 0,
    value.trustPolicyDigest, value.devicePolicyDigest, value.ledgerPolicyDigest, value.releasePolicyDigest,
  ].join('|');
}

export async function issueTrustAnchorReadinessPassport(suitePassed: number, suiteTotal: number) {
  try {
    if (suitePassed !== 264 || suiteTotal !== 264) return { ok: false as const, reason: 'TRUST_READINESS_SUITE_NOT_264_264' };
    if (!(await SecureStore.isAvailableAsync())) return { ok: false as const, reason: 'SECURESTORE_UNAVAILABLE' };
    const parent = await readRemoteAuthorizationReadinessPassport();
    if (!parent.valid || !parent.passport) return { ok: false as const, reason: 'VALID_REMOTE_AUTHORIZATION_PASSPORT_REQUIRED' };
    if (parent.passport.serverSignatureVerifier || parent.passport.deviceAttestationVerifier || parent.passport.serverReplayLedger || parent.passport.trustedServerClock || parent.passport.networkExecution || parent.passport.livePaymentExecution || parent.passport.strongRemoteAuthorization) return { ok: false as const, reason: 'PARENT_REMOTE_FUSE_OPEN' };
    if (serverTrustAnchorPolicy.productionKeySetProvisioned || serverTrustAnchorPolicy.serverSignatureVerifierProvisioned || serverTrustAnchorPolicy.remoteKmsProvisioned || serverTrustAnchorPolicy.networkExecutionEnabled || serverTrustAnchorPolicy.livePaymentExecutionEnabled || serverTrustAnchorPolicy.strongTrustAnchorClaim) return { ok: false as const, reason: 'TRUST_ANCHOR_FUSE_OPEN' };
    if (deviceAttestationPolicy.productionVerifierProvisioned || deviceAttestationPolicy.providerTrustRootsProvisioned || deviceAttestationPolicy.challengeServiceProvisioned || deviceAttestationPolicy.networkExecutionEnabled || deviceAttestationPolicy.strongDeviceAttestationClaim) return { ok: false as const, reason: 'DEVICE_ATTESTATION_FUSE_OPEN' };
    if (serverLedgerAnchorPolicy.serverReplayLedgerProvisioned || serverLedgerAnchorPolicy.trustedServerClockProvisioned || serverLedgerAnchorPolicy.serverSignatureVerifierProvisioned || serverLedgerAnchorPolicy.networkExecutionEnabled || serverLedgerAnchorPolicy.antiRollbackClaim) return { ok: false as const, reason: 'LEDGER_TIME_FUSE_OPEN' };
    if (releaseReadinessPolicy.serverVerifierProvisioned || releaseReadinessPolicy.deviceVerifierProvisioned || releaseReadinessPolicy.serverLedgerProvisioned || releaseReadinessPolicy.trustedServerClockProvisioned || releaseReadinessPolicy.productionTrustAnchorProvisioned || releaseReadinessPolicy.networkExecutionEnabled || releaseReadinessPolicy.livePaymentExecutionEnabled || releaseReadinessPolicy.settlementEnabled || releaseReadinessPolicy.productionReleaseClaim) return { ok: false as const, reason: 'RELEASE_GATE_FUSE_OPEN' };
    const [trustPolicyDigest, devicePolicyDigest, ledgerPolicyDigest, releasePolicyDigest] = await Promise.all([
      deriveServerTrustAnchorPolicyDigest(),
      deriveDeviceAttestationPolicyDigest(),
      deriveServerLedgerAnchorPolicyDigest(),
      deriveReleaseReadinessPolicyDigest(),
    ]);
    const core: Core = {
      v: VERSION,
      issuedAt: Date.now(),
      status: 'TRUST_ANCHOR_DEVICE_LEDGER_RELEASE_CONTRACT_PROVEN_PRODUCTION_NOT_PROVISIONED',
      parentRemoteProof: parent.passport.proof,
      parentAuthorizationProof: parent.passport.parentAuthorizationProof,
      parentReplayProof: parent.passport.parentReplayProof,
      parentBackendProof: parent.passport.parentBackendProof,
      boundaryLineage: parent.passport.boundaryLineage,
      contractLineage: parent.passport.contractLineage,
      suitePassed: 264,
      suiteTotal: 264,
      scope: 'TRUST_ANCHOR_AND_RELEASE_READINESS_ONLY',
      trustAnchorRelease: SERVER_TRUST_ANCHOR_RELEASE,
      deviceAttestationRelease: DEVICE_ATTESTATION_CONTRACT_RELEASE,
      ledgerAnchorRelease: SERVER_LEDGER_ANCHOR_RELEASE,
      releaseGateRelease: RELEASE_READINESS_RELEASE,
      productionKeySet: false,
      serverSignatureVerifier: false,
      deviceAttestationVerifier: false,
      serverReplayLedger: false,
      trustedServerClock: false,
      productionRelease: false,
      networkExecution: false,
      livePaymentExecution: false,
      settlement: false,
      trustPolicyDigest,
      devicePolicyDigest,
      ledgerPolicyDigest,
      releasePolicyDigest,
    };
    const passport: TrustAnchorReadinessPassport = { ...core, proof: `TAP-${upper16(await sha(canonical(core)))}` };
    await SecureStore.setItemAsync(KEY, JSON.stringify(passport), secureStoreOptions);
    return { ok: true as const, passport };
  } catch {
    return { ok: false as const, reason: 'TRUST_READINESS_PASSPORT_WRITE_FAILED' };
  }
}

export async function readTrustAnchorReadinessPassport(): Promise<{ valid: boolean; passport: TrustAnchorReadinessPassport | null; error: string }> {
  try {
    if (!(await SecureStore.isAvailableAsync())) return { valid: false, passport: null, error: 'SECURESTORE_UNAVAILABLE' };
    const raw = await SecureStore.getItemAsync(KEY, secureStoreOptions);
    if (!raw) return { valid: true, passport: null, error: '' };
    const passport = JSON.parse(raw) as TrustAnchorReadinessPassport;
    if (
      passport.v !== VERSION ||
      passport.status !== 'TRUST_ANCHOR_DEVICE_LEDGER_RELEASE_CONTRACT_PROVEN_PRODUCTION_NOT_PROVISIONED' ||
      passport.suitePassed !== 264 || passport.suiteTotal !== 264 ||
      passport.scope !== 'TRUST_ANCHOR_AND_RELEASE_READINESS_ONLY' ||
      passport.trustAnchorRelease !== SERVER_TRUST_ANCHOR_RELEASE ||
      passport.deviceAttestationRelease !== DEVICE_ATTESTATION_CONTRACT_RELEASE ||
      passport.ledgerAnchorRelease !== SERVER_LEDGER_ANCHOR_RELEASE ||
      passport.releaseGateRelease !== RELEASE_READINESS_RELEASE ||
      passport.productionKeySet !== false || passport.serverSignatureVerifier !== false || passport.deviceAttestationVerifier !== false ||
      passport.serverReplayLedger !== false || passport.trustedServerClock !== false || passport.productionRelease !== false ||
      passport.networkExecution !== false || passport.livePaymentExecution !== false || passport.settlement !== false ||
      !Number.isSafeInteger(passport.issuedAt) || passport.issuedAt <= 0 ||
      !/^RAP-[A-F0-9]{16}$/.test(passport.parentRemoteProof) ||
      !/^IAP-[A-F0-9]{16}$/.test(passport.parentAuthorizationProof) ||
      !/^IRP-[A-F0-9]{16}$/.test(passport.parentReplayProof) ||
      !/^BC-[A-F0-9]{16}$/.test(passport.parentBackendProof) ||
      !/^IBL-[A-F0-9]{16}$/.test(passport.boundaryLineage) ||
      !/^BCL-[A-F0-9]{16}$/.test(passport.contractLineage) ||
      !/^TAPOL-[A-F0-9]{16}$/.test(passport.trustPolicyDigest) ||
      !/^DAPOL-[A-F0-9]{16}$/.test(passport.devicePolicyDigest) ||
      !/^LAPOL-[A-F0-9]{16}$/.test(passport.ledgerPolicyDigest) ||
      !/^RGPOL-[A-F0-9]{16}$/.test(passport.releasePolicyDigest) ||
      !/^TAP-[A-F0-9]{16}$/.test(passport.proof)
    ) return { valid: false, passport: null, error: 'STRUCTURE' };
    const [trustPolicyDigest, devicePolicyDigest, ledgerPolicyDigest, releasePolicyDigest] = await Promise.all([
      deriveServerTrustAnchorPolicyDigest(),
      deriveDeviceAttestationPolicyDigest(),
      deriveServerLedgerAnchorPolicyDigest(),
      deriveReleaseReadinessPolicyDigest(),
    ]);
    if (passport.trustPolicyDigest !== trustPolicyDigest || passport.devicePolicyDigest !== devicePolicyDigest || passport.ledgerPolicyDigest !== ledgerPolicyDigest || passport.releasePolicyDigest !== releasePolicyDigest) return { valid: false, passport: null, error: 'POLICY_DIGEST' };
    const { proof, ...core } = passport;
    if (proof !== `TAP-${upper16(await sha(canonical(core)))}`) return { valid: false, passport: null, error: 'PROOF' };
    const parent = await readRemoteAuthorizationReadinessPassport();
    if (!parent.valid || !parent.passport) return { valid: false, passport: null, error: 'PARENT_MISSING' };
    if (
      parent.passport.proof !== passport.parentRemoteProof ||
      parent.passport.parentAuthorizationProof !== passport.parentAuthorizationProof ||
      parent.passport.parentReplayProof !== passport.parentReplayProof ||
      parent.passport.parentBackendProof !== passport.parentBackendProof ||
      parent.passport.boundaryLineage !== passport.boundaryLineage ||
      parent.passport.contractLineage !== passport.contractLineage
    ) return { valid: false, passport: null, error: 'PARENT_CHAIN' };
    return { valid: true, passport, error: '' };
  } catch {
    return { valid: false, passport: null, error: 'INVALID' };
  }
}

export function buildTrustAnchorReadinessSnapshot(passport: TrustAnchorReadinessPassport | null) {
  if (!passport) return 'trustAnchorReadinessPassport=NONE\nsecrets=NONE';
  return [
    `trustAnchorReadinessPassport=R13.6`,
    `proof=${passport.proof}`,
    `parentRemote=${passport.parentRemoteProof}`,
    `parentAuthorization=${passport.parentAuthorizationProof}`,
    `parentReplay=${passport.parentReplayProof}`,
    `parentBackend=${passport.parentBackendProof}`,
    `boundaryLineage=${passport.boundaryLineage}`,
    `contractLineage=${passport.contractLineage}`,
    `suite=${passport.suitePassed}/${passport.suiteTotal}`,
    `scope=${passport.scope}`,
    `trustPolicyDigest=${passport.trustPolicyDigest}`,
    `devicePolicyDigest=${passport.devicePolicyDigest}`,
    `ledgerPolicyDigest=${passport.ledgerPolicyDigest}`,
    `releasePolicyDigest=${passport.releasePolicyDigest}`,
    'productionKeySet=false',
    'serverSignatureVerifier=false',
    'deviceAttestationVerifier=false',
    'serverReplayLedger=false',
    'trustedServerClock=false',
    'productionRelease=false',
    'networkExecution=false',
    'livePaymentExecution=false',
    'settlement=false',
    'secrets=NONE',
  ].join('\n');
}
