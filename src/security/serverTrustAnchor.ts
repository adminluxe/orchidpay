import * as Crypto from 'expo-crypto';

export const SERVER_TRUST_ANCHOR_VERSION = 1 as const;
export const SERVER_TRUST_ANCHOR_RELEASE = 'R13.6-SERVER-TRUST-ANCHOR-CONTRACT' as const;
export const SERVER_TRUST_ALGORITHM = 'Ed25519' as const;
export const MAX_TRUST_ANCHOR_KEYS = 3;
export const MAX_TRUST_ANCHOR_TTL_MS = 86_400_000;
export const MAX_TRUST_CLOCK_SKEW_MS = 5_000;

export const serverTrustAnchorPolicy = Object.freeze({
  scope: 'TRUST_ANCHOR_CONTRACT_ONLY' as const,
  environment: 'CONTRACT_ONLY' as const,
  algorithm: SERVER_TRUST_ALGORITHM,
  productionKeySetProvisioned: false as const,
  serverSignatureVerifierProvisioned: false as const,
  remoteKmsProvisioned: false as const,
  networkExecutionEnabled: false as const,
  livePaymentExecutionEnabled: false as const,
  strongTrustAnchorClaim: false as const,
});

export type TrustKeyState = 'PRIMARY' | 'NEXT' | 'RETIRED' | 'REVOKED';
export type ServerTrustKey = {
  keyId: string;
  fingerprint: string;
  state: TrustKeyState;
  notBefore: number;
  notAfter: number;
};
export type ServerTrustAnchorSet = {
  v: 1;
  release: typeof SERVER_TRUST_ANCHOR_RELEASE;
  environment: typeof serverTrustAnchorPolicy.environment;
  algorithm: typeof SERVER_TRUST_ALGORITHM;
  generatedAt: number;
  expiresAt: number;
  keys: ServerTrustKey[];
  digest: string;
};
export type TrustAnchorInspection = { ok: true } | { ok: false; code: string };

async function sha(value: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}
function upper16(hex: string) { return hex.slice(0, 16).toUpperCase(); }
function validKeyId(value: string) { return /^srvkey\.[a-z0-9][a-z0-9._-]{7,79}$/.test(value); }
function validFingerprint(value: string) { return /^KF-[A-F0-9]{16}$/.test(value); }
function canonicalKey(key: ServerTrustKey) {
  return [key.keyId, key.fingerprint, key.state, key.notBefore, key.notAfter].join(':');
}
function canonicalSet(value: Omit<ServerTrustAnchorSet, 'digest'>) {
  const keys = [...value.keys].sort((a, b) => a.keyId.localeCompare(b.keyId)).map(canonicalKey).join(',');
  return [value.v, value.release, value.environment, value.algorithm, value.generatedAt, value.expiresAt, keys].join('|');
}

export async function buildServerTrustAnchorSet(input: Omit<ServerTrustAnchorSet, 'v' | 'release' | 'environment' | 'algorithm' | 'digest'>): Promise<ServerTrustAnchorSet> {
  const core: Omit<ServerTrustAnchorSet, 'digest'> = {
    v: SERVER_TRUST_ANCHOR_VERSION,
    release: SERVER_TRUST_ANCHOR_RELEASE,
    environment: serverTrustAnchorPolicy.environment,
    algorithm: SERVER_TRUST_ALGORITHM,
    generatedAt: input.generatedAt,
    expiresAt: input.expiresAt,
    keys: input.keys.map((key) => ({ ...key })),
  };
  return { ...core, digest: `TA-${upper16(await sha(canonicalSet(core)))}` };
}

export async function inspectServerTrustAnchorSet(anchor: ServerTrustAnchorSet, now: number): Promise<TrustAnchorInspection> {
  if (anchor.v !== SERVER_TRUST_ANCHOR_VERSION || anchor.release !== SERVER_TRUST_ANCHOR_RELEASE || anchor.environment !== serverTrustAnchorPolicy.environment || anchor.algorithm !== SERVER_TRUST_ALGORITHM) return { ok: false, code: 'ANCHOR_VERSION' };
  if (!Number.isSafeInteger(anchor.generatedAt) || !Number.isSafeInteger(anchor.expiresAt) || anchor.generatedAt <= 0 || anchor.expiresAt <= anchor.generatedAt) return { ok: false, code: 'ANCHOR_TIME_INVALID' };
  if (anchor.expiresAt - anchor.generatedAt > MAX_TRUST_ANCHOR_TTL_MS) return { ok: false, code: 'ANCHOR_TTL_TOO_LONG' };
  if (anchor.generatedAt - now > MAX_TRUST_CLOCK_SKEW_MS) return { ok: false, code: 'ANCHOR_CLOCK_SKEW_FUTURE' };
  if (now > anchor.expiresAt) return { ok: false, code: 'ANCHOR_EXPIRED' };
  if (!Array.isArray(anchor.keys) || anchor.keys.length < 1 || anchor.keys.length > MAX_TRUST_ANCHOR_KEYS) return { ok: false, code: 'ANCHOR_KEY_COUNT' };
  const keyIds = new Set<string>();
  const fingerprints = new Set<string>();
  let primary = 0;
  let next = 0;
  for (const key of anchor.keys) {
    if (!validKeyId(key.keyId) || !validFingerprint(key.fingerprint)) return { ok: false, code: 'ANCHOR_KEY_FORMAT' };
    if (!Number.isSafeInteger(key.notBefore) || !Number.isSafeInteger(key.notAfter) || key.notBefore <= 0 || key.notAfter <= key.notBefore) return { ok: false, code: 'ANCHOR_KEY_TIME' };
    if (key.notAfter < anchor.generatedAt || key.notBefore > anchor.expiresAt) return { ok: false, code: 'ANCHOR_KEY_WINDOW' };
    if (keyIds.has(key.keyId)) return { ok: false, code: 'ANCHOR_DUPLICATE_KEY_ID' };
    if (fingerprints.has(key.fingerprint)) return { ok: false, code: 'ANCHOR_DUPLICATE_FINGERPRINT' };
    keyIds.add(key.keyId); fingerprints.add(key.fingerprint);
    if (key.state === 'PRIMARY') primary += 1;
    if (key.state === 'NEXT') next += 1;
    if (key.state === 'REVOKED' && (key.notAfter > now)) {
      // Revoked material may be retained as history, but never as active PRIMARY/NEXT.
    }
  }
  if (primary !== 1) return { ok: false, code: 'ANCHOR_PRIMARY_COUNT' };
  if (next > 1) return { ok: false, code: 'ANCHOR_NEXT_COUNT' };
  const { digest, ...core } = anchor;
  const expected = `TA-${upper16(await sha(canonicalSet(core)))}`;
  if (digest !== expected) return { ok: false, code: 'ANCHOR_DIGEST_MISMATCH' };
  return { ok: true };
}

export async function inspectTrustAnchorRotation(current: ServerTrustAnchorSet, rotated: ServerTrustAnchorSet, now: number): Promise<TrustAnchorInspection> {
  const [a, b] = await Promise.all([inspectServerTrustAnchorSet(current, now), inspectServerTrustAnchorSet(rotated, now)]);
  if (!a.ok) return { ok: false, code: `CURRENT_${a.code}` };
  if (!b.ok) return { ok: false, code: `ROTATED_${b.code}` };
  const currentPrimary = current.keys.find((key) => key.state === 'PRIMARY');
  const currentNext = current.keys.find((key) => key.state === 'NEXT');
  const rotatedPrimary = rotated.keys.find((key) => key.state === 'PRIMARY');
  if (!currentPrimary || !rotatedPrimary) return { ok: false, code: 'ROTATION_PRIMARY_MISSING' };
  if (currentNext) {
    if (rotatedPrimary.keyId !== currentNext.keyId || rotatedPrimary.fingerprint !== currentNext.fingerprint) return { ok: false, code: 'ROTATION_NEXT_NOT_PROMOTED' };
    const formerPrimary = rotated.keys.find((key) => key.keyId === currentPrimary.keyId);
    if (!formerPrimary || !['RETIRED', 'REVOKED'].includes(formerPrimary.state)) return { ok: false, code: 'ROTATION_OLD_PRIMARY_NOT_RETIRED' };
  } else if (rotatedPrimary.keyId !== currentPrimary.keyId || rotatedPrimary.fingerprint !== currentPrimary.fingerprint) {
    return { ok: false, code: 'ROTATION_UNANNOUNCED_PRIMARY' };
  }
  return { ok: true };
}

export async function deriveServerTrustAnchorPolicyDigest() {
  const raw = [
    SERVER_TRUST_ANCHOR_VERSION,
    SERVER_TRUST_ANCHOR_RELEASE,
    SERVER_TRUST_ALGORITHM,
    MAX_TRUST_ANCHOR_KEYS,
    MAX_TRUST_ANCHOR_TTL_MS,
    MAX_TRUST_CLOCK_SKEW_MS,
    serverTrustAnchorPolicy.scope,
    serverTrustAnchorPolicy.environment,
    0, 0, 0, 0, 0, 0,
  ].join('|');
  return `TAPOL-${upper16(await sha(raw))}`;
}

export function buildServerTrustAnchorSnapshot(anchor: ServerTrustAnchorSet | null) {
  return [
    `serverTrustAnchor=${SERVER_TRUST_ANCHOR_RELEASE}`,
    `scope=${serverTrustAnchorPolicy.scope}`,
    `anchor=${anchor?.digest || 'NONE'}`,
    `algorithm=${SERVER_TRUST_ALGORITHM}`,
    `keys=${anchor?.keys.length || 0}/${MAX_TRUST_ANCHOR_KEYS}`,
    `primary=${anchor?.keys.find((key) => key.state === 'PRIMARY')?.keyId || 'NONE'}`,
    `next=${anchor?.keys.find((key) => key.state === 'NEXT')?.keyId || 'NONE'}`,
    'productionKeySet=false',
    'serverSignatureVerifier=false',
    'remoteKms=false',
    'networkExecution=false',
    'livePaymentExecution=false',
    'strongTrustAnchor=false',
    'rawPublicKey=NOT_STORED',
    'secrets=NONE',
  ].join('\n');
}
