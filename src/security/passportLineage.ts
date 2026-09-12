import * as Crypto from 'expo-crypto';
import {
  BACKEND_CONTRACT_VERSION,
  INTENT_SCHEMA_VERSION,
  MAX_CLOCK_SKEW_MS,
  MAX_INTENT_TTL_MS,
  MAX_REPLAY_ENTRIES,
  backendContractPolicy,
  endpointContract,
  liveOperations,
} from './backendContract';
import type { IntegrationBoundaryPassport } from './integrationBoundaryPassport';

export const PASSPORT_LINEAGE_VERSION = 1 as const;

async function sha(value: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}

function upper16(hex: string) {
  return hex.slice(0, 16).toUpperCase();
}

export type IntegrationBoundarySemanticState = Pick<
  IntegrationBoundaryPassport,
  'release' | 'status' | 'liveReady' | 'coreSuitePassed' | 'coreSuiteTotal' | 'blockerCount' | 'blockerDigest' | 'serverSigned'
>;

export function canonicalIntegrationBoundaryLineage(state: IntegrationBoundarySemanticState) {
  return [
    PASSPORT_LINEAGE_VERSION,
    'integration-boundary',
    state.release,
    state.status,
    state.liveReady ? 1 : 0,
    state.coreSuitePassed,
    state.coreSuiteTotal,
    state.blockerCount,
    state.blockerDigest,
    state.serverSigned ? 1 : 0,
  ].join('|');
}

export async function deriveIntegrationBoundaryLineage(state: IntegrationBoundarySemanticState) {
  return `IBL-${upper16(await sha(canonicalIntegrationBoundaryLineage(state)))}`;
}

export function canonicalBackendContractLineage(boundaryLineage: string) {
  const endpoints = liveOperations
    .map((operation) => {
      const entry = endpointContract[operation];
      return `${operation}:${entry.method}:${entry.path}`;
    })
    .join(',');
  return [
    PASSPORT_LINEAGE_VERSION,
    'backend-contract',
    BACKEND_CONTRACT_VERSION,
    INTENT_SCHEMA_VERSION,
    boundaryLineage,
    backendContractPolicy.networkExecutionEnabled ? 1 : 0,
    backendContractPolicy.liveIntentSubmissionEnabled ? 1 : 0,
    backendContractPolicy.serverResponseTrustEnabled ? 1 : 0,
    MAX_INTENT_TTL_MS,
    MAX_CLOCK_SKEW_MS,
    MAX_REPLAY_ENTRIES,
    endpoints,
  ].join('|');
}

export async function deriveBackendContractLineage(boundaryLineage: string) {
  if (!/^IBL-[A-F0-9]{16}$/.test(boundaryLineage)) throw new Error('INVALID_BOUNDARY_LINEAGE');
  return `BCL-${upper16(await sha(canonicalBackendContractLineage(boundaryLineage)))}`;
}
