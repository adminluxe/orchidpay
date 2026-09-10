import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { readIntentAuthorizationPassport } from './intentAuthorizationPassport';
import { deriveRemoteAuthorizationPolicyDigest, remoteAuthorizationPolicy, REMOTE_AUTHORIZATION_RELEASE } from './remoteAuthorizationBoundary';
import { deriveExecutionPermitPolicyDigest, executionPermitPolicy, MAX_EXECUTION_PERMIT_TTL_MS } from './executionPermit';

const KEY = 'orchidpay.remote.authorization.readiness.passport.v1';
const VERSION = 1 as const;
const secureStoreOptions: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY };

export type RemoteAuthorizationReadinessPassport = {
  v: 1;
  release: typeof REMOTE_AUTHORIZATION_RELEASE;
  issuedAt: number;
  status: 'REMOTE_AUTHORIZATION_CONTRACT_PROVEN_PROVIDERS_NOT_PROVISIONED';
  parentAuthorizationProof: string;
  parentReplayProof: string;
  parentBackendProof: string;
  boundaryLineage: string;
  contractLineage: string;
  suitePassed: 200;
  suiteTotal: 200;
  scope: 'REMOTE_AUTHORIZATION_CONTRACT_PREP_ONLY';
  executionScope: 'DRY_RUN_EXECUTION_GATE_ONLY';
  executionPermitTtlMs: 10000;
  serverSignatureVerifier: false;
  deviceAttestationVerifier: false;
  serverReplayLedger: false;
  trustedServerClock: false;
  networkExecution: false;
  livePaymentExecution: false;
  strongRemoteAuthorization: false;
  remotePolicyDigest: string;
  executionPolicyDigest: string;
  proof: string;
};

type Core = Omit<RemoteAuthorizationReadinessPassport, 'proof'>;
async function sha(value: string) { return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value); }
function upper16(hex: string) { return hex.slice(0, 16).toUpperCase(); }
function canonical(value: Core) {
  return [value.v, value.release, value.issuedAt, value.status, value.parentAuthorizationProof, value.parentReplayProof, value.parentBackendProof, value.boundaryLineage, value.contractLineage, value.suitePassed, value.suiteTotal, value.scope, value.executionScope, value.executionPermitTtlMs, value.serverSignatureVerifier ? 1 : 0, value.deviceAttestationVerifier ? 1 : 0, value.serverReplayLedger ? 1 : 0, value.trustedServerClock ? 1 : 0, value.networkExecution ? 1 : 0, value.livePaymentExecution ? 1 : 0, value.strongRemoteAuthorization ? 1 : 0, value.remotePolicyDigest, value.executionPolicyDigest].join('|');
}

export async function issueRemoteAuthorizationReadinessPassport(suitePassed: number, suiteTotal: number) {
  try {
    if (suitePassed !== 200 || suiteTotal !== 200) return { ok: false as const, reason: 'REMOTE_AUTH_SUITE_NOT_200_200' };
    if (!(await SecureStore.isAvailableAsync())) return { ok: false as const, reason: 'SECURESTORE_UNAVAILABLE' };
    const parent = await readIntentAuthorizationPassport();
    if (!parent.valid || !parent.passport) return { ok: false as const, reason: 'VALID_AUTHORIZATION_PASSPORT_REQUIRED' };
    if (parent.passport.liveReady !== false || parent.passport.networkExecution !== false || parent.passport.serverSigned !== false) return { ok: false as const, reason: 'PARENT_LIVE_FUSE_OPEN' };
    if (remoteAuthorizationPolicy.serverSignatureVerifierProvisioned || remoteAuthorizationPolicy.deviceAttestationVerifierProvisioned || remoteAuthorizationPolicy.serverReplayLedgerProvisioned || remoteAuthorizationPolicy.trustedServerClockProvisioned || remoteAuthorizationPolicy.networkExecutionEnabled || remoteAuthorizationPolicy.livePaymentExecutionEnabled || remoteAuthorizationPolicy.strongRemoteAuthorizationClaim) return { ok: false as const, reason: 'REMOTE_PROVIDER_FUSE_OPEN' };
    if (executionPermitPolicy.networkExecutionEnabled || executionPermitPolicy.livePaymentExecutionEnabled || executionPermitPolicy.settlementEnabled || executionPermitPolicy.strongExecutionClaim) return { ok: false as const, reason: 'EXECUTION_FUSE_OPEN' };
    const [remotePolicyDigest, executionPolicyDigest] = await Promise.all([deriveRemoteAuthorizationPolicyDigest(), deriveExecutionPermitPolicyDigest()]);
    const core: Core = {
      v: VERSION,
      release: REMOTE_AUTHORIZATION_RELEASE,
      issuedAt: Date.now(),
      status: 'REMOTE_AUTHORIZATION_CONTRACT_PROVEN_PROVIDERS_NOT_PROVISIONED',
      parentAuthorizationProof: parent.passport.proof,
      parentReplayProof: parent.passport.parentReplayProof,
      parentBackendProof: parent.passport.parentBackendProof,
      boundaryLineage: parent.passport.boundaryLineage,
      contractLineage: parent.passport.contractLineage,
      suitePassed: 200,
      suiteTotal: 200,
      scope: remoteAuthorizationPolicy.scope,
      executionScope: executionPermitPolicy.scope,
      executionPermitTtlMs: MAX_EXECUTION_PERMIT_TTL_MS,
      serverSignatureVerifier: false,
      deviceAttestationVerifier: false,
      serverReplayLedger: false,
      trustedServerClock: false,
      networkExecution: false,
      livePaymentExecution: false,
      strongRemoteAuthorization: false,
      remotePolicyDigest,
      executionPolicyDigest,
    };
    const passport: RemoteAuthorizationReadinessPassport = { ...core, proof: `RAP-${upper16(await sha(canonical(core)))}` };
    await SecureStore.setItemAsync(KEY, JSON.stringify(passport), secureStoreOptions);
    return { ok: true as const, passport };
  } catch {
    return { ok: false as const, reason: 'REMOTE_AUTH_PASSPORT_WRITE_FAILED' };
  }
}

export async function readRemoteAuthorizationReadinessPassport(): Promise<{ valid: boolean; passport: RemoteAuthorizationReadinessPassport | null; error: string }> {
  try {
    if (!(await SecureStore.isAvailableAsync())) return { valid: false, passport: null, error: 'SECURESTORE_UNAVAILABLE' };
    const raw = await SecureStore.getItemAsync(KEY, secureStoreOptions);
    if (!raw) return { valid: true, passport: null, error: '' };
    const passport = JSON.parse(raw) as RemoteAuthorizationReadinessPassport;
    if (passport.v !== VERSION || passport.release !== REMOTE_AUTHORIZATION_RELEASE || passport.status !== 'REMOTE_AUTHORIZATION_CONTRACT_PROVEN_PROVIDERS_NOT_PROVISIONED' || passport.suitePassed !== 200 || passport.suiteTotal !== 200 || passport.scope !== remoteAuthorizationPolicy.scope || passport.executionScope !== executionPermitPolicy.scope || passport.executionPermitTtlMs !== MAX_EXECUTION_PERMIT_TTL_MS || passport.serverSignatureVerifier !== false || passport.deviceAttestationVerifier !== false || passport.serverReplayLedger !== false || passport.trustedServerClock !== false || passport.networkExecution !== false || passport.livePaymentExecution !== false || passport.strongRemoteAuthorization !== false || !Number.isSafeInteger(passport.issuedAt) || passport.issuedAt <= 0 || !/^IAP-[A-F0-9]{16}$/.test(passport.parentAuthorizationProof) || !/^IRP-[A-F0-9]{16}$/.test(passport.parentReplayProof) || !/^BC-[A-F0-9]{16}$/.test(passport.parentBackendProof) || !/^IBL-[A-F0-9]{16}$/.test(passport.boundaryLineage) || !/^BCL-[A-F0-9]{16}$/.test(passport.contractLineage) || !/^RAPOL-[A-F0-9]{16}$/.test(passport.remotePolicyDigest) || !/^EPPOL-[A-F0-9]{16}$/.test(passport.executionPolicyDigest) || !/^RAP-[A-F0-9]{16}$/.test(passport.proof)) return { valid: false, passport: null, error: 'STRUCTURE' };
    const [remotePolicyDigest, executionPolicyDigest] = await Promise.all([deriveRemoteAuthorizationPolicyDigest(), deriveExecutionPermitPolicyDigest()]);
    if (passport.remotePolicyDigest !== remotePolicyDigest || passport.executionPolicyDigest !== executionPolicyDigest) return { valid: false, passport: null, error: 'POLICY_DIGEST' };
    const { proof, ...core } = passport;
    if (proof !== `RAP-${upper16(await sha(canonical(core)))}`) return { valid: false, passport: null, error: 'PROOF' };
    const parent = await readIntentAuthorizationPassport();
    if (!parent.valid || !parent.passport) return { valid: false, passport: null, error: 'PARENT_MISSING' };
    if (parent.passport.proof !== passport.parentAuthorizationProof || parent.passport.parentReplayProof !== passport.parentReplayProof || parent.passport.parentBackendProof !== passport.parentBackendProof || parent.passport.boundaryLineage !== passport.boundaryLineage || parent.passport.contractLineage !== passport.contractLineage) return { valid: false, passport: null, error: 'PARENT_CHAIN' };
    return { valid: true, passport, error: '' };
  } catch {
    return { valid: false, passport: null, error: 'INVALID' };
  }
}

export function buildRemoteAuthorizationReadinessSnapshot(passport: RemoteAuthorizationReadinessPassport | null) {
  if (!passport) return 'remoteAuthorizationPassport=NONE\nsecrets=NONE';
  return [
    `remoteAuthorizationPassport=${passport.release}`,
    `proof=${passport.proof}`,
    `parentAuthorization=${passport.parentAuthorizationProof}`,
    `parentReplay=${passport.parentReplayProof}`,
    `parentBackend=${passport.parentBackendProof}`,
    `boundaryLineage=${passport.boundaryLineage}`,
    `contractLineage=${passport.contractLineage}`,
    `suite=${passport.suitePassed}/${passport.suiteTotal}`,
    `scope=${passport.scope}`,
    `executionScope=${passport.executionScope}`,
    `remotePolicyDigest=${passport.remotePolicyDigest}`,
    `executionPolicyDigest=${passport.executionPolicyDigest}`,
    'serverSignatureVerifier=false',
    'deviceAttestationVerifier=false',
    'serverReplayLedger=false',
    'trustedServerClock=false',
    'networkExecution=false',
    'livePaymentExecution=false',
    'strongRemoteAuthorization=false',
    'secrets=NONE',
  ].join('\n');
}
