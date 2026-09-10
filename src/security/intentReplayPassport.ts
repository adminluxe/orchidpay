import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { readBackendContractPassport } from './backendContractPassport';
import {
  INTENT_REPLAY_RELEASE,
  MAX_CLOCK_SKEW_MS,
  MAX_REPLAY_EVENTS,
  deriveIntentReplayPolicyDigest,
  intentReplayPolicy,
} from './intentReplayGuard';

const KEY = 'orchidpay.intent.replay.passport.v1';
const VERSION = 1 as const;
const secureStoreOptions: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY };

export type IntentReplayPassport = {
  v: 1;
  release: typeof INTENT_REPLAY_RELEASE;
  issuedAt: number;
  status: 'LOCAL_RECENT_REPLAY_GUARD_PROVEN_LIVE_BLOCKED';
  parentBackendProof: string;
  parentContractRef: string;
  boundaryLineage: string;
  contractLineage: string;
  suitePassed: 112;
  suiteTotal: 112;
  replayWindowMax: 16;
  clockSkewMs: 5000;
  scope: 'LOCAL_RECENT_WINDOW_ONLY';
  serverReplayLedger: false;
  externalClockAnchor: false;
  liveReady: false;
  networkExecution: false;
  serverSigned: false;
  policyDigest: string;
  proof: string;
};

type IntentReplayPassportCore = Omit<IntentReplayPassport, 'proof'>;

async function sha(value: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}

function upper16(hex: string) {
  return hex.slice(0, 16).toUpperCase();
}

function canonical(value: IntentReplayPassportCore) {
  return [
    value.v,
    value.release,
    value.issuedAt,
    value.status,
    value.parentBackendProof,
    value.parentContractRef,
    value.boundaryLineage,
    value.contractLineage,
    value.suitePassed,
    value.suiteTotal,
    value.replayWindowMax,
    value.clockSkewMs,
    value.scope,
    value.serverReplayLedger ? 1 : 0,
    value.externalClockAnchor ? 1 : 0,
    value.liveReady ? 1 : 0,
    value.networkExecution ? 1 : 0,
    value.serverSigned ? 1 : 0,
    value.policyDigest,
  ].join('|');
}

export async function issueIntentReplayPassport(suitePassed: number, suiteTotal: number) {
  try {
    if (suitePassed !== 112 || suiteTotal !== 112) return { ok: false as const, reason: 'REPLAY_SUITE_NOT_112_112' };
    if (!(await SecureStore.isAvailableAsync())) return { ok: false as const, reason: 'SECURESTORE_UNAVAILABLE' };
    const parent = await readBackendContractPassport();
    if (!parent.valid || !parent.passport) return { ok: false as const, reason: 'VALID_BACKEND_CONTRACT_PASSPORT_REQUIRED' };
    if (parent.passport.liveReady !== false || parent.passport.networkExecution !== false || parent.passport.serverSigned !== false) return { ok: false as const, reason: 'PARENT_LIVE_FUSE_OPEN' };
    const policyDigest = await deriveIntentReplayPolicyDigest();
    const core: IntentReplayPassportCore = {
      v: VERSION,
      release: INTENT_REPLAY_RELEASE,
      issuedAt: Date.now(),
      status: 'LOCAL_RECENT_REPLAY_GUARD_PROVEN_LIVE_BLOCKED',
      parentBackendProof: parent.passport.proof,
      parentContractRef: parent.passport.contractRef,
      boundaryLineage: parent.passport.boundaryLineage,
      contractLineage: parent.passport.contractLineage,
      suitePassed: 112,
      suiteTotal: 112,
      replayWindowMax: MAX_REPLAY_EVENTS,
      clockSkewMs: MAX_CLOCK_SKEW_MS,
      scope: intentReplayPolicy.scope,
      serverReplayLedger: false,
      externalClockAnchor: false,
      liveReady: false,
      networkExecution: false,
      serverSigned: false,
      policyDigest,
    };
    const proof = `IRP-${upper16(await sha(canonical(core)))}`;
    const passport: IntentReplayPassport = { ...core, proof };
    await SecureStore.setItemAsync(KEY, JSON.stringify(passport), secureStoreOptions);
    return { ok: true as const, passport };
  } catch {
    return { ok: false as const, reason: 'REPLAY_PASSPORT_WRITE_FAILED' };
  }
}

export async function readIntentReplayPassport(): Promise<{ valid: boolean; passport: IntentReplayPassport | null; error: string }> {
  try {
    if (!(await SecureStore.isAvailableAsync())) return { valid: false, passport: null, error: 'SECURESTORE_UNAVAILABLE' };
    const raw = await SecureStore.getItemAsync(KEY, secureStoreOptions);
    if (!raw) return { valid: true, passport: null, error: '' };
    const passport = JSON.parse(raw) as IntentReplayPassport;
    if (
      passport.v !== VERSION ||
      passport.release !== INTENT_REPLAY_RELEASE ||
      passport.status !== 'LOCAL_RECENT_REPLAY_GUARD_PROVEN_LIVE_BLOCKED' ||
      passport.suitePassed !== 112 ||
      passport.suiteTotal !== 112 ||
      passport.replayWindowMax !== MAX_REPLAY_EVENTS ||
      passport.clockSkewMs !== MAX_CLOCK_SKEW_MS ||
      passport.scope !== intentReplayPolicy.scope ||
      passport.serverReplayLedger !== false ||
      passport.externalClockAnchor !== false ||
      passport.liveReady !== false ||
      passport.networkExecution !== false ||
      passport.serverSigned !== false ||
      !Number.isSafeInteger(passport.issuedAt) || passport.issuedAt <= 0 ||
      !/^BC-[A-F0-9]{16}$/.test(passport.parentBackendProof) ||
      !/^BCR-[A-F0-9]{16}$/.test(passport.parentContractRef) ||
      !/^IBL-[A-F0-9]{16}$/.test(passport.boundaryLineage) ||
      !/^BCL-[A-F0-9]{16}$/.test(passport.contractLineage) ||
      !/^RGP-[A-F0-9]{16}$/.test(passport.policyDigest) ||
      !/^IRP-[A-F0-9]{16}$/.test(passport.proof)
    ) return { valid: false, passport: null, error: 'STRUCTURE' };
    const { proof, ...core } = passport;
    const expectedPolicy = await deriveIntentReplayPolicyDigest();
    if (passport.policyDigest !== expectedPolicy) return { valid: false, passport: null, error: 'POLICY_DIGEST' };
    const expected = `IRP-${upper16(await sha(canonical(core)))}`;
    if (proof !== expected) return { valid: false, passport: null, error: 'PROOF' };
    const parent = await readBackendContractPassport();
    if (!parent.valid || !parent.passport) return { valid: false, passport: null, error: 'PARENT_MISSING' };
    if (
      parent.passport.proof !== passport.parentBackendProof ||
      parent.passport.contractRef !== passport.parentContractRef ||
      parent.passport.boundaryLineage !== passport.boundaryLineage ||
      parent.passport.contractLineage !== passport.contractLineage
    ) return { valid: false, passport: null, error: 'PARENT_CHAIN' };
    return { valid: true, passport, error: '' };
  } catch {
    return { valid: false, passport: null, error: 'INVALID' };
  }
}

export function buildIntentReplayPassportSnapshot(passport: IntentReplayPassport | null) {
  if (!passport) return 'replayPassport=NONE\nsecrets=NONE';
  return [
    `replayPassport=${passport.release}`,
    `proof=${passport.proof}`,
    `parentBackend=${passport.parentBackendProof}`,
    `boundaryLineage=${passport.boundaryLineage}`,
    `contractLineage=${passport.contractLineage}`,
    `suite=${passport.suitePassed}/${passport.suiteTotal}`,
    `scope=${passport.scope}`,
    `window=${passport.replayWindowMax}`,
    `clockSkewMs=${passport.clockSkewMs}`,
    `policyDigest=${passport.policyDigest}`,
    'serverReplayLedger=false',
    'externalClockAnchor=false',
    'liveReady=false',
    'networkExecution=false',
    'serverSigned=false',
    'secrets=NONE',
  ].join('\n');
}
