export type ApiMode = 'mock' | 'live';

export const apiConfig = {
  mode: 'mock' as ApiMode,
  baseUrl: 'https://orchidpay.online',
};

export async function healthCheck() {
  if (apiConfig.mode === 'mock') {
    return { ok: true, mode: 'mock', status: 200 };
  }

  const response = await fetch(`${apiConfig.baseUrl}/healthz`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  return {
    ok: response.ok,
    mode: 'live' as const,
    status: response.status,
  };
}

export async function createTransferIntent() {
  if (apiConfig.mode === 'mock') {
    return {
      ok: true,
      mode: 'mock' as const,
      executable: false,
      reference: `SIM-${Date.now()}`,
    };
  }

  throw new Error('Live transfer execution is intentionally disabled until signed API contracts are wired.');
}
