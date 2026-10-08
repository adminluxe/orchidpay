import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const DEVICE_GATE_KEY = 'orchidpay.device.gate.v1';
const VERSION = 1 as const;

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
};

export type DeviceGateCounters = {
  authSuccess: number;
  userCancel: number;
  backgroundTimeouts: number;
  preAuthBlocks: number;
  simulations: number;
  sessionStarts: number;
};

export type DeviceGateState = {
  v: 1;
  counters: DeviceGateCounters;
  updatedAt: number;
  proof: string;
};

export type DeviceGateSnapshot = {
  valid: boolean;
  error: string;
  counters: DeviceGateCounters;
  signalsPassed: number;
  proof: string;
  updatedAt: number;
};

export type AuditEvidenceSeed = {
  authSuccess: number;
  authUserCancels: number;
  backgroundTimeouts: number;
  preAuthBlocks: number;
  simulations: number;
  sessionStarts: number;
};

const zeroCounters = (): DeviceGateCounters => ({
  authSuccess: 0,
  userCancel: 0,
  backgroundTimeouts: 0,
  preAuthBlocks: 0,
  simulations: 0,
  sessionStarts: 0,
});

function cap(c: DeviceGateCounters): DeviceGateCounters {
  return {
    authSuccess: Math.min(2, Math.max(0, c.authSuccess | 0)),
    userCancel: Math.min(1, Math.max(0, c.userCancel | 0)),
    backgroundTimeouts: Math.min(1, Math.max(0, c.backgroundTimeouts | 0)),
    preAuthBlocks: Math.min(1, Math.max(0, c.preAuthBlocks | 0)),
    simulations: Math.min(1, Math.max(0, c.simulations | 0)),
    sessionStarts: Math.min(2, Math.max(0, c.sessionStarts | 0)),
  };
}

function canonical(base: Omit<DeviceGateState, 'proof'>) {
  const c = base.counters;
  return [base.v, c.authSuccess, c.userCancel, c.backgroundTimeouts, c.preAuthBlocks, c.simulations, c.sessionStarts, base.updatedAt].join('|');
}

async function makeProof(base: Omit<DeviceGateState, 'proof'>) {
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, canonical(base));
  return `DG-${digest.slice(0, 16).toUpperCase()}`;
}

function signalsPassed(c: DeviceGateCounters) {
  return [c.authSuccess >= 2, c.userCancel >= 1, c.backgroundTimeouts >= 1, c.preAuthBlocks >= 1, c.simulations >= 1, c.sessionStarts >= 2].filter(Boolean).length;
}

async function loadState(): Promise<DeviceGateState | null> {
  if (!(await SecureStore.isAvailableAsync())) throw new Error('DEVICE_GATE_SECURESTORE_UNAVAILABLE');
  const raw = await SecureStore.getItemAsync(DEVICE_GATE_KEY, secureStoreOptions);
  if (!raw) return null;
  const state = JSON.parse(raw) as DeviceGateState;
  if (state.v !== 1 || !state.counters || !Number.isSafeInteger(state.updatedAt) || state.updatedAt <= 0 || typeof state.proof !== 'string') throw new Error('DEVICE_GATE_STRUCTURE');
  const counters = cap(state.counters);
  const expected = await makeProof({ v: 1, counters, updatedAt: state.updatedAt });
  if (expected !== state.proof) throw new Error('DEVICE_GATE_PROOF');
  return { ...state, counters };
}

async function saveCounters(counters: DeviceGateCounters) {
  const base: Omit<DeviceGateState, 'proof'> = { v: VERSION, counters: cap(counters), updatedAt: Date.now() };
  const state: DeviceGateState = { ...base, proof: await makeProof(base) };
  await SecureStore.setItemAsync(DEVICE_GATE_KEY, JSON.stringify(state), secureStoreOptions);
  return state;
}

function snapshotFromState(state: DeviceGateState | null): DeviceGateSnapshot {
  const counters = state?.counters ?? zeroCounters();
  return { valid: true, error: '', counters, signalsPassed: signalsPassed(counters), proof: state?.proof ?? 'DG-EMPTY', updatedAt: state?.updatedAt ?? 0 };
}

export async function readDeviceGatePassport(): Promise<DeviceGateSnapshot> {
  try {
    return snapshotFromState(await loadState());
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'DEVICE_GATE_INVALID', counters: zeroCounters(), signalsPassed: 0, proof: 'DG-INVALID', updatedAt: 0 };
  }
}

export async function seedDeviceGateFromAudit(seed: AuditEvidenceSeed): Promise<DeviceGateSnapshot> {
  const current = await readDeviceGatePassport();
  if (!current.valid) return current;
  const next = cap({
    authSuccess: Math.max(current.counters.authSuccess, seed.authSuccess),
    userCancel: Math.max(current.counters.userCancel, seed.authUserCancels),
    backgroundTimeouts: Math.max(current.counters.backgroundTimeouts, seed.backgroundTimeouts),
    preAuthBlocks: Math.max(current.counters.preAuthBlocks, seed.preAuthBlocks),
    simulations: Math.max(current.counters.simulations, seed.simulations),
    sessionStarts: Math.max(current.counters.sessionStarts, seed.sessionStarts),
  });
  const changed = JSON.stringify(next) !== JSON.stringify(current.counters);
  return changed ? snapshotFromState(await saveCounters(next)) : current;
}

export async function recordDeviceGateAuditEvent(kind: string, outcome: string, code: string): Promise<void> {
  const current = await readDeviceGatePassport();
  if (!current.valid) throw new Error(current.error || 'DEVICE_GATE_INVALID');
  const next = { ...current.counters };
  if (kind === 'session-start') next.sessionStarts += 1;
  if (kind === 'auth' && outcome === 'success') next.authSuccess += 1;
  if (kind === 'auth' && outcome === 'rejected' && code === 'USER_CANCEL') next.userCancel += 1;
  if (kind === 'lock' && outcome === 'timeout') next.backgroundTimeouts += 1;
  if (kind === 'transfer-draft' && outcome === 'blocked') next.preAuthBlocks += 1;
  if (kind === 'transfer-intent' && outcome === 'simulated') next.simulations += 1;
  await saveCounters(next);
}

export async function runDeviceGateIntegritySelfTest() {
  const base: Omit<DeviceGateState, 'proof'> = { v: 1, counters: { authSuccess: 2, userCancel: 1, backgroundTimeouts: 1, preAuthBlocks: 1, simulations: 1, sessionStarts: 2 }, updatedAt: 1_700_000_000_000 };
  const state: DeviceGateState = { ...base, proof: await makeProof(base) };
  const valid = state.proof === await makeProof(base);
  const tamperedBase = { ...base, counters: { ...base.counters, userCancel: 0 } };
  const tamperRejected = state.proof !== await makeProof(tamperedBase);
  return { valid, tamperRejected, signalsPassed: signalsPassed(base.counters) };
}
