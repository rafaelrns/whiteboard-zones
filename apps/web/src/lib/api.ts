const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

/** URL base para o Socket.IO (mesmo host quando API_URL é relativo, ex. /api) */
export const SOCKET_URL = API_URL.startsWith('/') ? '' : API_URL;
/** Path do Socket.IO no servidor (quando usamos proxy, ex. /api/socket.io) */
export const SOCKET_PATH = API_URL.startsWith('/') ? `${API_URL}/socket.io` : '/socket.io';

export type ApiError = { error: string; issues?: unknown };

export async function api<T>(path: string, opts: RequestInit = {}, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data as ApiError;
  return data as T;
}

export { API_URL };
