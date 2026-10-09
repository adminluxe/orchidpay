import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const CARD_CONTROL_KEY = 'orchidpay.card.control.v1';
const VERSION = 1 as const;
const MODE = 'LOCAL_DEMO_ONLY' as const;

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
};

export type DemoCardControlState = {
  v: 1;
  locked: boolean;
  mode: typeof MODE;
  updatedAt: number;
  proof: string;
};

export type DemoCardControlSnapshot = {
  valid: boolean;
  error: string;
  locked: boolean;
  mode: typeof MODE;
  updatedAt: number;
  proof: string;
};

function canonical(base: Omit<DemoCardControlState, 'proof'>) {
  return [base.v, base.locked ? 1 : 0, base.mode, base.updatedAt].join('|');
}

async function makeProof(base: Omit<DemoCardControlState, 'proof'>) {
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, canonical(base));
  return `CC-${digest.slice(0, 16).toUpperCase()}`;
}

async function makeState(locked: boolean, updatedAt = Date.now()): Promise<DemoCardControlState> {
  const base: Omit<DemoCardControlState, 'proof'> = { v: VERSION, locked, mode: MODE, updatedAt };
  return { ...base, proof: await makeProof(base) };
}

async function verifyState(state: DemoCardControlState) {
  if (state?.v !== VERSION || state.mode !== MODE || typeof state.locked !== 'boolean' || !Number.isSafeInteger(state.updatedAt) || state.updatedAt <= 0) {
    return false;
  }
  const { proof, ...base } = state;
  return /^CC-[A-F0-9]{16}$/.test(proof) && proof === await makeProof(base);
}

function failClosed(error: string): DemoCardControlSnapshot {
  return { valid: false, error, locked: true, mode: MODE, updatedAt: 0, proof: 'CC-INVALID' };
}

function snapshot(state: DemoCardControlState): DemoCardControlSnapshot {
  return { valid: true, error: '', locked: state.locked, mode: state.mode, updatedAt: state.updatedAt, proof: state.proof };
}

export async function ensureDemoCardControl(): Promise<DemoCardControlSnapshot> {
  try {
    if (!(await SecureStore.isAvailableAsync())) return failClosed('SECURESTORE_UNAVAILABLE');
    const raw = await SecureStore.getItemAsync(CARD_CONTROL_KEY, secureStoreOptions);
    if (!raw) {
      const initial = await makeState(true);
      await SecureStore.setItemAsync(CARD_CONTROL_KEY, JSON.stringify(initial), secureStoreOptions);
      return snapshot(initial);
    }
    const state = JSON.parse(raw) as DemoCardControlState;
    if (!(await verifyState(state))) return failClosed('CARD_CONTROL_PROOF');
    return snapshot(state);
  } catch {
    return failClosed('CARD_CONTROL_INVALID');
  }
}

export async function setDemoCardLocked(locked: boolean): Promise<DemoCardControlSnapshot> {
  try {
    if (!(await SecureStore.isAvailableAsync())) return failClosed('SECURESTORE_UNAVAILABLE');
    const current = await ensureDemoCardControl();
    if (!current.valid) return current;
    const next = await makeState(locked);
    await SecureStore.setItemAsync(CARD_CONTROL_KEY, JSON.stringify(next), secureStoreOptions);
    return snapshot(next);
  } catch {
    return failClosed('CARD_CONTROL_WRITE');
  }
}

export async function runCardControlIntegritySelfTest() {
  const state = await makeState(true, 1_700_000_000_000);
  const valid = await verifyState(state);
  const tampered = { ...state, locked: false };
  const tamperRejected = !(await verifyState(tampered));
  return { valid, tamperRejected, defaultLocked: state.locked === true, modeLocalOnly: state.mode === MODE };
}
