const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
/** URL base para o Socket.IO: apenas o origin (evita que /api vire namespace e cause "Invalid namespace") */
function socketUrl() {
    if (API_URL.startsWith('/'))
        return '';
    try {
        const u = new URL(API_URL);
        return `${u.protocol}//${u.host}`;
    }
    catch {
        return API_URL;
    }
}
/** Path do Socket.IO no servidor (ex: /api/socket.io quando API_URL é https://host/api) */
function socketPath() {
    if (API_URL.startsWith('/'))
        return `${API_URL}/socket.io`;
    try {
        const u = new URL(API_URL);
        const p = u.pathname.replace(/\/$/, '') || '';
        return p ? `${p}/socket.io` : '/socket.io';
    }
    catch {
        return '/socket.io';
    }
}
export const SOCKET_URL = socketUrl();
export const SOCKET_PATH = socketPath();
export async function api(path, opts = {}, token) {
    const res = await fetch(`${API_URL}${path}`, {
        ...opts,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(opts.headers ?? {}),
        },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
        throw data;
    return data;
}
export { API_URL };
