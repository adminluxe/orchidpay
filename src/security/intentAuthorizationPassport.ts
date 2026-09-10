import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { readIntentReplayPassport } from './intentReplayPassport';
import {
  INTENT_AUTHORIZATION_RELEASE,
  MAX_AUTHORIZATION_TRACE_EVENTS,
  MAX_AUTHORIZATION_TTL_MS,
  deriveIntentAuthorizationPolicyDigest,
  intentAuthorizationPolicy,
} from './intentAuthorizationEnvelope';

const KEY = 'orchidpay.intent.authorization.passport.v1';
const VERSION = 1 as const;
const secureStoreOptions: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY };

export type IntentAuthorizationPassport = {
  v: 1;
  release: typeof INTENT_AUTHORIZATION_RELEASE;
  issuedAt: number;
  status: 'LOCAL_AUTHORIZATION_ENVELOPE_PROVEN_LIVE_BLOCKED';
  parentReplayProof: string;
  parentBackendProof: string;
  boundaryLineage: string;
  contractLineage: string;
  suitePassed: 152;
  suiteTotal: 152;
  authorizationTtlMs: 30000;
  traceEventsMax: 4;
  scope: 'LOCAL_PREAUTHORIZATION_ONLY';
  reviewedBeforeAuthorize: true;
  serverAuthorizationVerifier: false;
  deviceAttestation: false;
  externalClockAnchor: false;
  liveReady: false;
  networkExecution: false;
  serverSigned: false;
  policyDigest: string;
  proof: string;
};

type IntentAuthorizationPassportCore = Omit<IntentAuthorizationPassport, 'proof'>;

async function sha(value: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}

function upper16(hex: string) {
  return hex.slice(0, 16).toUpperCase();
}

function canonical(value: IntentAuthorizationPassportCore) {
  return [
    value.v,
    value.release,
    value.issuedAt,
    value.status,
    value.parentReplayProof,
    value.parentBackendProof,
    value.boundaryLineage,
    value.contractLineage,
    value.suitePassed,
    value.suiteTotal,
    value.authorizationTtlMs,
    value.traceEventsMax,
    value.scope,
    value.reviewedBeforeAuthorize ? 1 : 0,
    value.serverAuthorizationVerifier ? 1 : 0,
    value.deviceAttestation ? 1 : 0,
    value.externalClockAnchor ? 1 : 0,
    value.liveReady ? 1 : 0,
    value.networkExecution ? 1 : 0,
    value.serverSigned ? 1 : 0,
    value.policyDigest,
  ].join('|');
}

export async function issueIntentAuthorizationPassport(suitePassed: number, suiteTotal: number) {
  try {
    if (suitePassed !== 152 || suiteTotal !== 152) return { ok: false as const, reason: 'AUTHORIZATION_SUITE_NOT_152_152' };
    if (!(await SecureStore.isAvailableAsync())) return { ok: false as const, reason: 'SECURESTORE_UNAVAILABLE' };
    const parent = await readIntentReplayPassport();
    if (!parent.valid || !parent.passport) return { ok: false as const, reason: 'VALID_REPLAY_PASSPORT_REQUIRED' };
    if (parent.passport.liveReady !== false || parent.passport.networkExecution !== false || parent.passport.serverSigned !== false) return { ok: false as const, reason: 'PARENT_LIVE_FUSE_OPEN' };
    const policyDigest = await deriveIntentAuthorizationPolicyDigest();
    const core: IntentAuthorizationPassportCore = {
      v: VERSION,
      release: INTENT_AUTHORIZATION_RELEASE,
      issuedAt: Date.now(),
      status: 'LOCAL_AUTHORIZATION_ENVELOPE_PROVEN_LIVE_BLOCKED',
      parentReplayProof: parent.passport.proof,
      parentBackendProof: parent.passport.parentBackendProof,
      boundaryLineage: parent.passport.boundaryLineage,
      contractLineage: parent.passport.contractLineage,
      suitePassed: 152,
      suiteTotal: 152,
      authorizationTtlMs: MAX_AUTHORIZATION_TTL_MS,
      traceEventsMax: MAX_AUTHORIZATION_TRACE_EVENTS,
      scope: intentAuthorizationPolicy.scope,
      reviewedBeforeAuthorize: true,
      serverAuthorizationVerifier: false,
      deviceAttestation: false,
      externalClockAnchor: false,
      liveReady: false,
      networkExecution: false,
      serverSigned: false,
      policyDigest,
    };
    const proof = `IAP-${upper16(await sha(canonical(core)))}`;
    const passport: IntentAuthorizationPassport = { ...core, proof };
    await SecureStore.setItemAsync(KEY, JSON.stringify(passport), secureStoreOptions);
    return { ok: true as const, passport };
  } catch {
    return { ok: false as const, reason: 'AUTHORIZATION_PASSPORT_WRITE_FAILED' };
  }
}

export async function readIntentAuthorizationPassport(): Promise<{ valid: boolean; passport: IntentAuthorizationPassport | null; error: string }> {
  try {
    if (!(await SecureStore.isAvailableAsync())) return { valid: false, passport: null, error: 'SECURESTORE_UNAVAILABLE' };
    const raw = await SecureStore.getItemAsync(KEY, secureStoreOptions);
    if (!raw) return { valid: true, passport: null, error: '' };
    const passport = JSON.parse(raw) as IntentAuthorizationPassport;
    if (
      passport.v !== VERSION ||
      passport.release !== INTENT_AUTHORIZATION_RELEASE ||
      passport.status !== 'LOCAL_AUTHORIZATION_ENVELOPE_PROVEN_LIVE_BLOCKED' ||
      passport.suitePassed !== 152 ||
      passport.suiteTotal !== 152 ||
      passport.authorizationTtlMs !== MAX_AUTHORIZATION_TTL_MS ||
      passport.traceEventsMax !== MAX_AUTHORIZATION_TRACE_EVENTS ||
      passport.scope !== intentAuthorizationPolicy.scope ||
      passport.reviewedBeforeAuthorize !== true ||
      passport.serverAuthorizationVerifier !== false ||
      passport.deviceAttestation !== false ||
      passport.externalClockAnchor !== false ||
      passport.liveReady !== false ||
      passport.networkExecution !== false ||
      passport.serverSigned !== false ||
      !Number.isSafeInteger(passport.issuedAt) || passport.issuedAt <= 0 ||
      !/^IRP-[A-F0-9]{16}$/.test(passport.parentReplayProof) ||
      !/^BC-[A-F0-9]{16}$/.test(passport.parentBackendProof) ||
      !/^IBL-[A-F0-9]{16}$/.test(passport.boundaryLineage) ||
      !/^BCL-[A-F0-9]{16}$/.test(passport.contractLineage) ||
      !/^AGP-[A-F0-9]{16}$/.test(passport.policyDigest) ||
      !/^IAP-[A-F0-9]{16}$/.test(passport.proof)
    ) return { valid: false, passport: null, error: 'STRUCTURE' };
    const { proof, ...core } = passport;
    const expectedPolicy = await deriveIntentAuthorizationPolicyDigest();
    if (passport.policyDigest !== expectedPolicy) return { valid: false, passport: null, error: 'POLICY_DIGEST' };
    const expected = `IAP-${upper16(await sha(canonical(core)))}`;
    if (proof !== expected) return { valid: false, passport: null, error: 'PROOF' };
    const parent = await readIntentReplayPassport();
    if (!parent.valid || !parent.passport) return { valid: false, passport: null, error: 'PARENT_MISSING' };
    if (
      parent.passport.proof !== passport.parentReplayProof ||
      parent.passport.parentBackendProof !== passport.parentBackendProof ||
      parent.passport.boundaryLineage !== passport.boundaryLineage ||
      parent.passport.contractLineage !== passport.contractLineage
    ) return { valid: false, passport: null, error: 'PARENT_CHAIN' };
    return { valid: true, passport, error: '' };
  } catch {
    return { valid: false, passport: null, error: 'INVALID' };
  }
}

export function buildIntentAuthorizationPassportSnapshot(passport: IntentAuthorizationPassport | null) {
  if (!passport) return 'authorizationPassport=NONE\nsecrets=NONE';
  return [
    `authorizationPassport=${passport.release}`,
    `proof=${passport.proof}`,
    `parentReplay=${passport.parentReplayProof}`,
    `parentBackend=${passport.parentBackendProof}`,
    `boundaryLineage=${passport.boundaryLineage}`,
    `contractLineage=${passport.contractLineage}`,
    `suite=${passport.suitePassed}/${passport.suiteTotal}`,
    `scope=${passport.scope}`,
    `authorizationTtlMs=${passport.authorizationTtlMs}`,
    `traceEventsMax=${passport.traceEventsMax}`,
    `policyDigest=${passport.policyDigest}`,
    'reviewedBeforeAuthorize=true',
    'serverAuthorizationVerifier=false',
    'deviceAttestation=false',
    'externalClockAnchor=false',
    'liveReady=false',
    'networkExecution=false',
    'serverSigned=false',
    'secrets=NONE',
  ].join('\n');
}
