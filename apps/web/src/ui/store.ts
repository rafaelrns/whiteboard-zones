import { create } from 'zustand';

type Theme = 'light' | 'dark';

export type AuthUser = { id: string; name: string; email: string; role: string };

export type NotificationItem = { id: string; type: string; readAt?: string | null; createdAt: string; payload?: unknown };

type State = {
  theme: Theme;
  token?: string;
  user?: AuthUser;
  notifications: NotificationItem[];
  /** Incrementa quando notif:new chega via socket — NotificationCenter reage */
  notifRefreshTrigger: number;
  /** Incrementa quando invite:accepted chega — ShareInviteModal reage */
  inviteListRefreshTrigger: number;
  boardOnlineCount: number | null;
  currentBoardId: string | null;
  setTheme: (t: Theme) => void;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
  setNotifications: (n: NotificationItem[]) => void;
  triggerNotifRefresh: () => void;
  triggerInviteListRefresh: () => void;
  setBoardOnlineCount: (n: number | null) => void;
  setCurrentBoardId: (id: string | null) => void;
};

const TOKEN_KEY = 'zones_token';
const USER_KEY = 'zones_user';

function loadJSON<T>(k: string): T | undefined {
  const raw = localStorage.getItem(k);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export const useAppStore = create<State>((set) => ({
  theme: 'light',
  token: loadJSON<string>(TOKEN_KEY),
  user: loadJSON<AuthUser>(USER_KEY),
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
