import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import {
  authenticateStrong,
  ensureDeviceBindingId,
  getDeviceBindingFingerprint,
  inspectNativeSecurity,
  type NativeSecuritySnapshot,
  type NativeSecurityState,
} from './nativeSecurity';
import { appendAuditEvent, readAuditSummary } from './auditLedger';
import { seedDeviceGateFromAudit } from './deviceGatePassport';

export type SessionStatus = 'authenticated' | 'locked';
export type SessionLockReason = 'startup' | 'manual' | 'background-timeout';

type StrongAuthOutcome = 'none' | 'success' | 'rejected';

export type StrongAuthDecision =
  | { ok: true; code: 'strong_auth'; message: string }
  | { ok: false; code: string; message: string };

type SessionContextValue = {
  status: SessionStatus;
  lastUnlockAt: number;
  lastStrongAuthAt: number;
  lock: () => void;
  unlock: () => Promise<boolean>;
  requireStrongAuth: (promptMessage: string) => Promise<boolean>;
  requireStrongAuthDetailed: (promptMessage: string) => Promise<StrongAuthDecision>;
  refreshNativeSecurity: () => Promise<void>;
  lockAfterBackgroundMs: number;
  biometricState: NativeSecurityState;
  biometricTypes: string[];
  secureStoreAvailable: boolean;
  secureStoreBiometricCapable: boolean;
  deviceBindingReady: boolean;
  deviceBindingFingerprint: string;
  securityError: string;
  lastLockReason: SessionLockReason;
  lastBackgroundDurationMs: number;
  strongAuthSuccessCount: number;
  strongAuthRejectCount: number;
  lastStrongAuthOutcome: StrongAuthOutcome;
  lastStrongAuthCode: string;
};

const LOCK_AFTER_BACKGROUND_MS = 60_000;

const emptyNativeState: NativeSecuritySnapshot = {
  secureStoreAvailable: false,
  secureStoreBiometricCapable: false,
  biometricHardware: false,
  biometricEnrolled: false,
  biometricTypes: [],
  securityLevel: 0,
  biometricState: 'checking',
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: React.PropsWithChildren) {
  const [status, setStatus] = useState<SessionStatus>('locked');
  const [lastUnlockAt, setLastUnlockAt] = useState(0);
  const [lastStrongAuthAt, setLastStrongAuthAt] = useState(0);
  const [nativeState, setNativeState] = useState<NativeSecuritySnapshot>(emptyNativeState);
  const [deviceBindingReady, setDeviceBindingReady] = useState(false);
  const [deviceBindingFingerprint, setDeviceBindingFingerprint] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [lastLockReason, setLastLockReason] = useState<SessionLockReason>('startup');
  const [lastBackgroundDurationMs, setLastBackgroundDurationMs] = useState(0);
  const [strongAuthSuccessCount, setStrongAuthSuccessCount] = useState(0);
  const [strongAuthRejectCount, setStrongAuthRejectCount] = useState(0);
  const [lastStrongAuthOutcome, setLastStrongAuthOutcome] = useState<StrongAuthOutcome>('none');
  const [lastStrongAuthCode, setLastStrongAuthCode] = useState('none');
  const backgroundAt = useRef<number | null>(null);
  const authInFlight = useRef(false);

  const refreshNativeSecurity = useCallback(async () => {
    const [next, fingerprint] = await Promise.all([
      inspectNativeSecurity(),
      getDeviceBindingFingerprint().catch(() => ''),
    ]);
    setNativeState(next);
    setDeviceBindingReady(Boolean(fingerprint));
    setDeviceBindingFingerprint(fingerprint);
  }, []);

  useEffect(() => {
    void (async () => {
      await refreshNativeSecurity();
      // Migrate the already-proven R12.6 audit signals into the durable Device Gate
      // BEFORE the new session-start can rotate the bounded 20-entry audit ledger.
      const preStartAudit = await readAuditSummary();
      await seedDeviceGateFromAudit(preStartAudit).catch(() => null);
      const fingerprint = await getDeviceBindingFingerprint().catch(() => '');
      await appendAuditEvent('session-start', 'observed', 'APP_START', fingerprint || 'NO_BINDING').catch(() => null);
    })();
  }, [refreshNativeSecurity]);

  useEffect(() => {
    const listener = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        if (backgroundAt.current === null) backgroundAt.current = Date.now();
        return;
      }

      if (next === 'active') {
        const started = backgroundAt.current;
        backgroundAt.current = null;
        void refreshNativeSecurity();

        if (started) {
          const duration = Date.now() - started;
          setLastBackgroundDurationMs(duration);
          if (duration >= LOCK_AFTER_BACKGROUND_MS) {
            setLastLockReason('background-timeout');
            setStatus('locked');
            void appendAuditEvent('lock', 'timeout', `BACKGROUND_${Math.round(duration / 1000)}S`).catch(() => {});
          }
        }
      }
    });

    return () => listener.remove();
  }, [refreshNativeSecurity]);

  const runStrongAuthDetailed = useCallback(async (promptMessage: string): Promise<StrongAuthDecision> => {
    if (authInFlight.current) {
      return { ok: false, code: 'auth_in_flight', message: 'Une validation biométrique est déjà en cours.' };
    }
    authInFlight.current = true;
    setSecurityError('');

    try {
      const result = await authenticateStrong(promptMessage);
      if (!result.ok) {
        setSecurityError(result.message);
        setLastStrongAuthOutcome('rejected');
        setLastStrongAuthCode(result.code);
        setStrongAuthRejectCount((count) => count + 1);
        await appendAuditEvent('auth', 'rejected', result.code.toUpperCase()).catch(() => null);
        await refreshNativeSecurity();
        return result;
      }

      await ensureDeviceBindingId();
      const fingerprint = await getDeviceBindingFingerprint();
      setDeviceBindingReady(Boolean(fingerprint));
      setDeviceBindingFingerprint(fingerprint);
      setLastStrongAuthAt(Date.now());
      setLastStrongAuthOutcome('success');
      setLastStrongAuthCode('strong_auth');
      setStrongAuthSuccessCount((count) => count + 1);
      await appendAuditEvent('auth', 'success', 'STRONG_AUTH', fingerprint).catch(() => null);
      return { ok: true, code: 'strong_auth', message: 'Biométrie forte validée.' };
    } catch {
      const decision: StrongAuthDecision = { ok: false, code: 'local_auth_error', message: 'La validation sécurisée locale a échoué.' };
      setSecurityError(decision.message);
      setLastStrongAuthOutcome('rejected');
      setLastStrongAuthCode(decision.code);
      setStrongAuthRejectCount((count) => count + 1);
      await appendAuditEvent('auth', 'rejected', 'LOCAL_AUTH_ERROR').catch(() => null);
      return decision;
    } finally {
      authInFlight.current = false;
    }
  }, [refreshNativeSecurity]);

  const runStrongAuth = useCallback(async (promptMessage: string) => {
    return (await runStrongAuthDetailed(promptMessage)).ok;
  }, [runStrongAuthDetailed]);

  const unlock = useCallback(async () => {
    const ok = await runStrongAuth('Déverrouiller OrchidPay');
    if (!ok) return false;

    const now = Date.now();
    setLastUnlockAt(now);
    setStatus('authenticated');
    return true;
  }, [runStrongAuth]);

  const requireStrongAuthDetailed = useCallback(async (promptMessage: string): Promise<StrongAuthDecision> => {
    if (status !== 'authenticated') {
      const decision: StrongAuthDecision = { ok: false, code: 'session_locked', message: 'La session doit être déverrouillée avant cette opération.' };
      setSecurityError(decision.message);
      return decision;
    }
    return runStrongAuthDetailed(promptMessage);
  }, [runStrongAuthDetailed, status]);

  const requireStrongAuth = useCallback(async (promptMessage: string) => {
    return (await requireStrongAuthDetailed(promptMessage)).ok;
  }, [requireStrongAuthDetailed]);

  const lock = useCallback(() => {
    setLastLockReason('manual');
    setStatus('locked');
    void appendAuditEvent('lock', 'observed', 'MANUAL_LOCK').catch(() => {});
  }, []);

  const value = useMemo<SessionContextValue>(() => ({
    status,
    lastUnlockAt,
    lastStrongAuthAt,
    lock,
    unlock,
    requireStrongAuth,
    requireStrongAuthDetailed,
    refreshNativeSecurity,
    lockAfterBackgroundMs: LOCK_AFTER_BACKGROUND_MS,
    biometricState: nativeState.biometricState,
    biometricTypes: nativeState.biometricTypes,
    secureStoreAvailable: nativeState.secureStoreAvailable,
    secureStoreBiometricCapable: nativeState.secureStoreBiometricCapable,
    deviceBindingReady,
    deviceBindingFingerprint,
    securityError,
    lastLockReason,
    lastBackgroundDurationMs,
    strongAuthSuccessCount,
    strongAuthRejectCount,
    lastStrongAuthOutcome,
    lastStrongAuthCode,
  }), [
    status,
    lastUnlockAt,
    lastStrongAuthAt,
    lock,
    unlock,
    requireStrongAuth,
    requireStrongAuthDetailed,
    refreshNativeSecurity,
    nativeState,
    deviceBindingReady,
    deviceBindingFingerprint,
    securityError,
    lastLockReason,
    lastBackgroundDurationMs,
    strongAuthSuccessCount,
    strongAuthRejectCount,
    lastStrongAuthOutcome,
    lastStrongAuthCode,
  ]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
