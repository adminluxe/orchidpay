import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { buildBackendContractSnapshot } from './backendContract';
import { evaluateBackendReadiness } from './backendBoundary';
import { readIntegrationBoundaryPassport } from './integrationBoundaryPassport';
import { deriveBackendContractLineage, deriveIntegrationBoundaryLineage } from './passportLineage';
import {
  appendContinuityEvent,
  validateContinuityJournal,
  type AttestationContinuityJournal,
} from './attestationContinuity';

const KEY = 'orchidpay.backend.contract.attestation.v3';
const VERSION = 3 as const;
const RELEASE = 'R13.2-CONTINUITY-JOURNAL' as const;
const BUNDLE_VERSION = 1 as const;
const secureStoreOptions: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY };

export type BackendContractPassport = {
  v: 3;
  release: typeof RELEASE;
  issuedAt: number;
  status: 'LOCAL_CONTRACT_PROVEN_LIVE_BLOCKED';
  boundaryProof: string;
  boundaryLineage: string;
  contractLineage: string;
  suitePassed: 88;
  suiteTotal: 88;
  liveReady: false;
  networkExecution: false;
  serverSigned: false;
  snapshotDigest: string;
  contractRef: string;
  continuitySequence: number;
  continuityHead: string;
  proof: string;
};

type BackendContractPassportCore = Omit<BackendContractPassport, 'contractRef' | 'continuitySequence' | 'continuityHead' | 'proof'>;

type BackendContractAttestationBundle = {
  v: 1;
  passport: BackendContractPassport;
  continuity: AttestationContinuityJournal;
};

function canonicalCore(value: BackendContractPassportCore) {
  return [
    value.v,
    value.release,
    value.issuedAt,
    value.status,
    value.boundaryProof,
    value.boundaryLineage,
    value.contractLineage,
    value.suitePassed,
    value.suiteTotal,
    value.liveReady ? 1 : 0,
    value.networkExecution ? 1 : 0,
    value.serverSigned ? 1 : 0,
    value.snapshotDigest,
  ].join('|');
}

function canonicalPassport(value: Omit<BackendContractPassport, 'proof'>) {
  return [
    canonicalCore(value),
    value.contractRef,
    value.continuitySequence,
    value.continuityHead,
  ].join('|');
}

async function sha(value: string) { return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value); }
function upper16(hex: string) { return hex.slice(0, 16).toUpperCase(); }

async function deriveContractRef(core: BackendContractPassportCore) {
  return `BCR-${upper16(await sha(canonicalCore(core)))}`;
}

export async function issueBackendContractPassport(suitePassed: number, suiteTotal: number) {
  try {
    if (suitePassed !== 88 || suiteTotal !== 88) return { ok: false as const, reason: 'CONTRACT_SUITE_NOT_88_88' };
    const boundary = evaluateBackendReadiness();
    if (boundary.readyForLive !== false || boundary.status !== 'BLOCKED_EXTERNAL_DEPENDENCIES') return { ok: false as const, reason: 'BOUNDARY_NOT_BLOCKED' };
    const prior = await readIntegrationBoundaryPassport();
    if (!prior.valid || !prior.passport || !/^IB-[A-F0-9]{16}$/.test(prior.passport.proof)) return { ok: false as const, reason: 'VALID_IB_PASSPORT_REQUIRED' };
    if (!(await SecureStore.isAvailableAsync())) return { ok: false as const, reason: 'SECURESTORE_UNAVAILABLE' };
    const boundaryLineage = await deriveIntegrationBoundaryLineage(prior.passport);
    const contractLineage = await deriveBackendContractLineage(boundaryLineage);
    const snapshotDigest = upper16(await sha(buildBackendContractSnapshot(prior.passport.proof)));
    const core: BackendContractPassportCore = {
      v: VERSION,
      release: RELEASE,
      issuedAt: Date.now(),
      status: 'LOCAL_CONTRACT_PROVEN_LIVE_BLOCKED',
      boundaryProof: prior.passport.proof,
      boundaryLineage,
      contractLineage,
      suitePassed: 88,
      suiteTotal: 88,
      liveReady: false,
      networkExecution: false,
      serverSigned: false,
      snapshotDigest,
    };
    const contractRef = await deriveContractRef(core);
    const existingRaw = await SecureStore.getItemAsync(KEY, secureStoreOptions);
    let existing: BackendContractAttestationBundle | null = null;
    if (existingRaw) {
      try { existing = JSON.parse(existingRaw) as BackendContractAttestationBundle; } catch { return { ok: false as const, reason: 'CURRENT_ATTESTATION_INVALID' }; }
      if (existing.v !== BUNDLE_VERSION) return { ok: false as const, reason: 'CURRENT_ATTESTATION_VERSION' };
      const currentContinuity = await validateContinuityJournal(existing.continuity);
      if (!currentContinuity.ok) return { ok: false as const, reason: `CURRENT_CONTINUITY_${currentContinuity.code}` };
      if (existing.passport.boundaryLineage !== boundaryLineage || existing.passport.contractLineage !== contractLineage) return { ok: false as const, reason: 'LINEAGE_DRIFT_REQUIRES_EXPLICIT_MIGRATION' };
    }
    const appended = await appendContinuityEvent(existing?.continuity || null, {
      issuedAt: core.issuedAt,
      boundaryProof: core.boundaryProof,
      boundaryLineage: core.boundaryLineage,
      contractRef,
      contractLineage: core.contractLineage,
      suitePassed: core.suitePassed,
      suiteTotal: core.suiteTotal,
      liveReady: core.liveReady,
      networkExecution: core.networkExecution,
      serverSigned: core.serverSigned,
    });
    if (!appended.ok) return { ok: false as const, reason: `CONTINUITY_${appended.code}` };
    const base: Omit<BackendContractPassport, 'proof'> = {
      ...core,
      contractRef,
      continuitySequence: appended.event.seq,
      continuityHead: appended.event.digest,
    };
    const proof = `BC-${upper16(await sha(canonicalPassport(base)))}`;
    const passport: BackendContractPassport = { ...base, proof };
    const bundle: BackendContractAttestationBundle = { v: BUNDLE_VERSION, passport, continuity: appended.journal };
    await SecureStore.setItemAsync(KEY, JSON.stringify(bundle), secureStoreOptions);
    return { ok: true as const, passport, continuity: appended.journal };
  } catch {
    return { ok: false as const, reason: 'ATTESTATION_WRITE_FAILED' };
  }
}

export async function readBackendContractPassport(): Promise<{ valid: boolean; passport: BackendContractPassport | null; continuity: AttestationContinuityJournal | null; error: string }> {
  try {
    if (!(await SecureStore.isAvailableAsync())) return { valid: false, passport: null, continuity: null, error: 'SECURESTORE_UNAVAILABLE' };
    const raw = await SecureStore.getItemAsync(KEY, secureStoreOptions);
    if (!raw) return { valid: true, passport: null, continuity: null, error: '' };
    const bundle = JSON.parse(raw) as BackendContractAttestationBundle;
    if (bundle.v !== BUNDLE_VERSION || !bundle.passport || !bundle.continuity) return { valid: false, passport: null, continuity: null, error: 'BUNDLE_STRUCTURE' };
    const passport = bundle.passport;
    if (
      passport.v !== VERSION ||
      passport.release !== RELEASE ||
      passport.status !== 'LOCAL_CONTRACT_PROVEN_LIVE_BLOCKED' ||
      passport.suitePassed !== 88 ||
      passport.suiteTotal !== 88 ||
      passport.liveReady !== false ||
      passport.networkExecution !== false ||
      passport.serverSigned !== false ||
      !Number.isSafeInteger(passport.issuedAt) || passport.issuedAt <= 0 ||
      !/^IB-[A-F0-9]{16}$/.test(passport.boundaryProof) ||
      !/^IBL-[A-F0-9]{16}$/.test(passport.boundaryLineage) ||
      !/^BCL-[A-F0-9]{16}$/.test(passport.contractLineage) ||
      !/^BCR-[A-F0-9]{16}$/.test(passport.contractRef) ||
      !/^AC-[A-F0-9]{16}$/.test(passport.continuityHead) ||
      !Number.isSafeInteger(passport.continuitySequence) || passport.continuitySequence <= 0 ||
      !/^[A-F0-9]{16}$/.test(passport.snapshotDigest)
    ) return { valid: false, passport: null, continuity: null, error: 'STRUCTURE' };
    const { proof, contractRef, continuitySequence, continuityHead, ...core } = passport;
    const expectedRef = await deriveContractRef(core);
    if (contractRef !== expectedRef) return { valid: false, passport: null, continuity: null, error: 'CONTRACT_REF' };
    const expected = `BC-${upper16(await sha(canonicalPassport({ ...core, contractRef, continuitySequence, continuityHead })))}`;
    if (proof !== expected) return { valid: false, passport: null, continuity: null, error: 'PROOF' };
    const continuityStatus = await validateContinuityJournal(bundle.continuity);
    if (!continuityStatus.ok) return { valid: false, passport: null, continuity: null, error: `CONTINUITY_${continuityStatus.code}` };
    const head = bundle.continuity.events[bundle.continuity.events.length - 1];
    if (
      bundle.continuity.headDigest !== passport.continuityHead ||
      head.seq !== passport.continuitySequence ||
      head.digest !== passport.continuityHead ||
      head.boundaryProof !== passport.boundaryProof ||
      head.boundaryLineage !== passport.boundaryLineage ||
      head.contractRef !== passport.contractRef ||
      head.contractLineage !== passport.contractLineage
    ) return { valid: false, passport: null, continuity: null, error: 'CONTINUITY_LINK' };
    const prior = await readIntegrationBoundaryPassport();
    if (!prior.valid || !prior.passport || prior.passport.proof !== passport.boundaryProof) return { valid: false, passport: null, continuity: null, error: 'CHAIN_SEAL' };
    const activeBoundaryLineage = await deriveIntegrationBoundaryLineage(prior.passport);
    if (activeBoundaryLineage !== passport.boundaryLineage) return { valid: false, passport: null, continuity: null, error: 'CHAIN_LINEAGE' };
    const activeContractLineage = await deriveBackendContractLineage(activeBoundaryLineage);
    if (activeContractLineage !== passport.contractLineage) return { valid: false, passport: null, continuity: null, error: 'CONTRACT_LINEAGE' };
    return { valid: true, passport, continuity: bundle.continuity, error: '' };
  } catch {
    return { valid: false, passport: null, continuity: null, error: 'INVALID' };
  }
}
