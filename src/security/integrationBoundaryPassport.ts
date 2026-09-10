import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import type { BackendReadiness } from './backendBoundary';

const KEY = 'orchidpay.integration.boundary.passport.v1';
const VERSION = 1 as const;
const RELEASE = 'R12.9-INTEGRATION-BOUNDARY' as const;
const secureStoreOptions: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY };

export type IntegrationBoundaryPassport = {
  v: 1;
  release: typeof RELEASE;
  issuedAt: number;
  status: 'BLOCKED_EXTERNAL_DEPENDENCIES';
  liveReady: false;
  coreSuitePassed: 40;
  coreSuiteTotal: 40;
  blockerCount: number;
  blockerDigest: string;
  releaseProof: string;
  serverSigned: false;
  proof: string;
};

function canonical(value: Omit<IntegrationBoundaryPassport, 'proof'>) {
  return [value.v, value.release, value.issuedAt, value.status, value.liveReady ? 1 : 0, value.coreSuitePassed, value.coreSuiteTotal, value.blockerCount, value.blockerDigest, value.releaseProof, value.serverSigned ? 1 : 0].join('|');
}

async function sha(value: string) { return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value); }

export async function issueIntegrationBoundaryPassport(readiness: BackendReadiness, releaseProof: string, suitePassed: number, suiteTotal: number) {
  if (readiness.readyForLive !== false || readiness.status !== 'BLOCKED_EXTERNAL_DEPENDENCIES') return { ok: false as const, reason: 'BOUNDARY_STATE_INVALID' };
  if (!/^RP-[A-F0-9]{16}$/.test(releaseProof)) return { ok: false as const, reason: 'LOCAL_RC_PROOF_REQUIRED' };
  if (suitePassed !== 40 || suiteTotal !== 40) return { ok: false as const, reason: 'BOUNDARY_SUITE_NOT_40_40' };
  if (!(await SecureStore.isAvailableAsync())) return { ok: false as const, reason: 'SECURESTORE_UNAVAILABLE' };
  const blockerDigest = (await sha(readiness.blockers.join('|'))).slice(0, 16).toUpperCase();
  const base: Omit<IntegrationBoundaryPassport, 'proof'> = {
    v: VERSION,
    release: RELEASE,
    issuedAt: Date.now(),
    status: 'BLOCKED_EXTERNAL_DEPENDENCIES',
    liveReady: false,
    coreSuitePassed: 40,
    coreSuiteTotal: 40,
    blockerCount: readiness.blockers.length,
    blockerDigest,
    releaseProof,
    serverSigned: false,
  };
  const proof = `IB-${(await sha(canonical(base))).slice(0, 16).toUpperCase()}`;
  const passport: IntegrationBoundaryPassport = { ...base, proof };
  await SecureStore.setItemAsync(KEY, JSON.stringify(passport), secureStoreOptions);
  return { ok: true as const, passport };
}

export async function readIntegrationBoundaryPassport(): Promise<{ valid: boolean; passport: IntegrationBoundaryPassport | null; error: string }> {
  try {
    if (!(await SecureStore.isAvailableAsync())) return { valid: false, passport: null, error: 'SECURESTORE_UNAVAILABLE' };
    const raw = await SecureStore.getItemAsync(KEY, secureStoreOptions);
    if (!raw) return { valid: true, passport: null, error: '' };
    const passport = JSON.parse(raw) as IntegrationBoundaryPassport;
    if (passport.v !== VERSION || passport.release !== RELEASE || passport.status !== 'BLOCKED_EXTERNAL_DEPENDENCIES' || passport.liveReady !== false || passport.serverSigned !== false || passport.coreSuitePassed !== 40 || passport.coreSuiteTotal !== 40) return { valid: false, passport: null, error: 'STRUCTURE' };
    const { proof, ...base } = passport;
    const expected = `IB-${(await sha(canonical(base))).slice(0, 16).toUpperCase()}`;
    if (proof !== expected) return { valid: false, passport: null, error: 'PROOF' };
    return { valid: true, passport, error: '' };
  } catch { return { valid: false, passport: null, error: 'INVALID' }; }
}
