import { create } from 'zustand';
const TOKEN_KEY = 'zones_token';
const USER_KEY = 'zones_user';
function loadJSON(k) {
    const raw = localStorage.getItem(k);
    if (!raw)
        return undefined;
    try {
        return JSON.parse(raw);
    }
    catch {
        return undefined;
    }
}
export const useAppStore = create((set) => ({
    theme: 'light',
    token: loadJSON(TOKEN_KEY),
    user: loadJSON(USER_KEY),
    notifications: [],
    boardOnlineCount: null,
    currentBoardId: null,
    setTheme: (theme) => set({ theme }),
    setBoardOnlineCount: (n) => set({ boardOnlineCount: n }),
    setCurrentBoardId: (id) => set({ currentBoardId: id }),
    setAuth: (token, user) => {
        localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        set({ token, user });
    },
    clearAuth: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        set({ token: undefined, user: undefined });
    },
    setNotifications: (notifications) => set({ notifications }),
}));
