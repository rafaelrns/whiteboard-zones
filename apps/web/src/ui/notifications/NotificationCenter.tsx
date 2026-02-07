import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, type NotificationItem } from '../store';
import { api } from '../../lib/api';

type InvitePayload = {
  inviteToken?: string;
  boardId?: string;
  boardName?: string;
  inviterName?: string;
};

export function NotificationCenter() {
  const token = useAppStore((s) => s.token);
  const items = useAppStore((s) => s.notifications);
  const setNotifications = useAppStore((s) => s.setNotifications);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const n = await api<NotificationItem[]>(`/notifications`, { method: 'GET' }, token);
      setNotifications(Array.isArray(n) ? n : []);
    } catch {
      setNotifications([]);
    }
  }, [token, setNotifications]);

  useEffect(() => {
    if (!token) return;
    refresh();
  }, [token, refresh]);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  async function handleAcceptInvite(n: NotificationItem) {
    const payload = n.payload as InvitePayload | undefined;
    if (!payload?.inviteToken || !payload?.boardId) return;
    setProcessing(n.id);
    try {
      await api<{ boardId: string }>(
        `/invite/accept?token=${encodeURIComponent(payload.inviteToken)}`,
        { method: 'GET' },
        token,
      );
      await api(`/notifications/${n.id}/read`, { method: 'POST' }, token);
      await refresh();
      setOpen(false);
      navigate(`/board/${payload.boardId}`, { replace: true });
    } catch {
      // ignore
    } finally {
      setProcessing(null);
    }
  }

  async function handleRejectInvite(n: NotificationItem) {
    setProcessing(n.id);
    try {
      await api(`/notifications/${n.id}/read`, { method: 'POST' }, token);
      await refresh();
    } catch {
      // ignore
    } finally {
      setProcessing(null);
    }
  }

  const safeItems = Array.isArray(items) ? items : [];
  const unread = safeItems.filter((x: NotificationItem) => !x.readAt).length;

  return (
    <div className="relative z-50">
      <button
        type="button"
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
        onClick={() => setOpen((v) => !v)}
      >
        Notificações {unread ? `(${unread})` : ''}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 z-[100] w-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
          <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold dark:border-slate-800">
            Central
          </div>
          <div className="max-h-96 overflow-auto p-2">
            {safeItems.length === 0 && (
              <div className="p-3 text-xs text-slate-500 dark:text-slate-400">Sem notificações.</div>
            )}
            {safeItems.map((n: NotificationItem) => {
              const payload = n.payload as InvitePayload | undefined;
              const isInvite = n.type === 'BOARD_INVITE' && payload?.inviteToken;
              return (
                <div
                  key={n.id}
                  className={`rounded-xl border p-3 text-xs dark:border-slate-800 ${
                    n.readAt ? 'border-slate-200 bg-slate-50 dark:bg-slate-900/50' : 'border-indigo-200 bg-indigo-50/30 dark:border-indigo-800 dark:bg-indigo-950/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">
                        {isInvite
                          ? `${payload?.inviterName ?? 'Alguém'} convidou você para o quadro ${payload?.boardName ?? ''}`
                          : n.type}
                      </div>
                      <div className="mt-1 text-slate-500 dark:text-slate-400">
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                      {isInvite && !n.readAt && (
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            onClick={() => handleAcceptInvite(n)}
                            disabled={processing === n.id}
                          >
                            Aceitar
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                            onClick={() => handleRejectInvite(n)}
                            disabled={processing === n.id}
                          >
                            Rejeitar
                          </button>
                        </div>
                      )}
                    </div>
                    {!n.readAt && !isInvite && <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
