import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

export type SessionStatus = 'authenticated' | 'locked';

type SessionContextValue = {
  status: SessionStatus;
  accountName: string;
  publicAlias: string;
  lastUnlockAt: number;
  lock: () => void;
  unlockDemo: () => void;
  lockAfterBackgroundMs: number;
  biometricState: 'native-module-pending';
};

const LOCK_AFTER_BACKGROUND_MS = 60_000;

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: React.PropsWithChildren) {
  const [status, setStatus] = useState<SessionStatus>('authenticated');
  const [lastUnlockAt, setLastUnlockAt] = useState(Date.now());
  const backgroundAt = useRef<number | null>(null);

  useEffect(() => {
    const listener = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        if (backgroundAt.current === null) backgroundAt.current = Date.now();
        return;
      }

      if (next === 'active') {
        const started = backgroundAt.current;
        backgroundAt.current = null;
        if (started && Date.now() - started >= LOCK_AFTER_BACKGROUND_MS) {
          setStatus('locked');
        }
      }
    });

    return () => listener.remove();
  }, []);

  const value = useMemo<SessionContextValue>(() => ({
    status,
    accountName: 'Afripay',
    publicAlias: '@afripay',
    lastUnlockAt,
    lock: () => setStatus('locked'),
    unlockDemo: () => {
      setLastUnlockAt(Date.now());
      setStatus('authenticated');
    },
    lockAfterBackgroundMs: LOCK_AFTER_BACKGROUND_MS,
    biometricState: 'native-module-pending',
  }), [status, lastUnlockAt]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
