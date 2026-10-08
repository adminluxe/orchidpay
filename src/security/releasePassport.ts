import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import type { AuditSummary } from './auditLedger';
import type { DeviceGateSnapshot } from './deviceGatePassport';

const RELEASE_PASSPORT_KEY = 'orchidpay.release.passport.v2';
const RELEASE_VERSION = 2 as const;
const RELEASE_NAME = 'R12.8-RC-LOCAL' as const;

export const releasePassportPolicy = Object.freeze({
  release: RELEASE_NAME,
  policy: 'MOCK_ONLY_NO_LIVE' as const,
  serverSigned: false,
});

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
};

export type AcceptanceLike = {
  passed: number;
  total: number;
  allPass: boolean;
};

export type ReleaseReadiness = {
  ready: boolean;
  deviceSignalsPassed: number;
  missing: string[];
};

export type LocalReleasePassport = {
  v: 2;
  release: typeof RELEASE_NAME;
  issuedAt: number;
  deviceFingerprint: string;
  auditHead: string;
  deviceGateProof: string;
  acceptancePassed: number;
  acceptanceTotal: number;
  deviceSignalsPassed: number;
  policy: 'MOCK_ONLY_NO_LIVE';
  serverSigned: false;
  proof: string;
};

export type ReleasePassportRead = {
  valid: boolean;
  passport: LocalReleasePassport | null;
  error: string;
};

export function evaluateReleaseReadiness(audit: AuditSummary, gate: DeviceGateSnapshot, acceptance: AcceptanceLike): ReleaseReadiness {
  const c = gate.counters;
  const signals = [
    ['AUTH_SUCCESS', c.authSuccess >= 2],
    ['USER_CANCEL', c.userCancel >= 1],
    ['BACKGROUND_TIMEOUT', c.backgroundTimeouts >= 1],
    ['PREAUTH_BLOCK', c.preAuthBlocks >= 1],
    ['SAFE_SIMULATION', c.simulations >= 1],
    ['SESSION_RESTART', c.sessionStarts >= 2],
  ] as const;
  const missing: string[] = signals.filter(([, pass]) => !pass).map(([name]) => name);
  if (!audit.valid) missing.push('AUDIT_INTEGRITY');
  if (!gate.valid) missing.push('DEVICE_GATE_INTEGRITY');
  if (!acceptance.allPass || acceptance.passed !== acceptance.total) missing.push('ACCEPTANCE_SUITE');
  return {
    ready: missing.length === 0,
    deviceSignalsPassed: signals.filter(([, pass]) => pass).length,
    missing,
  };
}

function canonical(passport: Omit<LocalReleasePassport, 'proof'>) {
  return [
    passport.v,
    passport.release,
    passport.issuedAt,
    passport.deviceFingerprint,
    passport.auditHead,
    passport.deviceGateProof,
    passport.acceptancePassed,
    passport.acceptanceTotal,
    passport.deviceSignalsPassed,
    passport.policy,
    passport.serverSigned ? 1 : 0,
  ].join('|');
}

async function proofFor(passport: Omit<LocalReleasePassport, 'proof'>) {
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, canonical(passport));
  return `RP-${digest.slice(0, 16).toUpperCase()}`;
}

export async function issueLocalReleasePassport(
  deviceFingerprint: string,
  audit: AuditSummary,
  gate: DeviceGateSnapshot,
  acceptance: AcceptanceLike,
): Promise<{ ok: true; passport: LocalReleasePassport } | { ok: false; reason: string; missing: string[] }> {
  const readiness = evaluateReleaseReadiness(audit, gate, acceptance);
  if (!deviceFingerprint) return { ok: false, reason: 'DEVICE_FINGERPRINT_MISSING', missing: ['DEVICE_FINGERPRINT'] };
  if (!readiness.ready) return { ok: false, reason: 'RELEASE_GATES_INCOMPLETE', missing: readiness.missing };
  if (!(await SecureStore.isAvailableAsync())) return { ok: false, reason: 'SECURESTORE_UNAVAILABLE', missing: ['SECURESTORE'] };

  const base: Omit<LocalReleasePassport, 'proof'> = {
    v: RELEASE_VERSION,
    release: RELEASE_NAME,
    issuedAt: Date.now(),
    deviceFingerprint,
    auditHead: audit.head,
    deviceGateProof: gate.proof,
    acceptancePassed: acceptance.passed,
    acceptanceTotal: acceptance.total,
    deviceSignalsPassed: readiness.deviceSignalsPassed,
    policy: 'MOCK_ONLY_NO_LIVE',
    serverSigned: false,
  };
  const passport: LocalReleasePassport = { ...base, proof: await proofFor(base) };
  await SecureStore.setItemAsync(RELEASE_PASSPORT_KEY, JSON.stringify(passport), secureStoreOptions);
  return { ok: true, passport };
}

export async function readLocalReleasePassport(): Promise<ReleasePassportRead> {
  try {
    if (!(await SecureStore.isAvailableAsync())) return { valid: false, passport: null, error: 'SECURESTORE_UNAVAILABLE' };
    const raw = await SecureStore.getItemAsync(RELEASE_PASSPORT_KEY, secureStoreOptions);
    if (!raw) return { valid: true, passport: null, error: '' };
    const passport = JSON.parse(raw) as LocalReleasePassport;
    if (passport.v !== RELEASE_VERSION || passport.release !== RELEASE_NAME || passport.policy !== 'MOCK_ONLY_NO_LIVE' || passport.serverSigned !== false) {
      return { valid: false, passport: null, error: 'PASSPORT_STRUCTURE' };
    }
    const { proof, ...base } = passport;
    const expected = await proofFor(base);
    if (proof !== expected) return { valid: false, passport: null, error: 'PASSPORT_PROOF' };
    return { valid: true, passport, error: '' };
  } catch {
    return { valid: false, passport: null, error: 'PASSPORT_INVALID' };
  }
}
