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
    notifRefreshTrigger: 0,
    inviteListRefreshTrigger: 0,
    boardOnlineCount: null,
    currentBoardId: null,
    setTheme: (theme) => set({ theme }),
    triggerNotifRefresh: () => set((s) => ({ notifRefreshTrigger: s.notifRefreshTrigger + 1 })),
    triggerInviteListRefresh: () => set((s) => ({ inviteListRefreshTrigger: s.inviteListRefreshTrigger + 1 })),
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
