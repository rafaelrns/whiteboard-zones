import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { api } from '../../lib/api';
export function NotificationCenter() {
    const token = useAppStore((s) => s.token);
    const items = useAppStore((s) => s.notifications);
    const setNotifications = useAppStore((s) => s.setNotifications);
    const notifRefreshTrigger = useAppStore((s) => s.notifRefreshTrigger);
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [processing, setProcessing] = useState(null);
    const refresh = useCallback(async () => {
        if (!token)
            return;
        try {
            const n = await api(`/notifications`, { method: 'GET' }, token);
            setNotifications(Array.isArray(n) ? n : []);
        }
        catch {
            setNotifications([]);
        }
    }, [token, setNotifications]);
    useEffect(() => {
        if (!token)
            return;
        refresh();
    }, [token, refresh]);
    useEffect(() => {
        if (open)
            refresh();
    }, [open, refresh]);
    useEffect(() => {
        if (notifRefreshTrigger > 0 && token)
            refresh();
    }, [notifRefreshTrigger, token, refresh]);
    async function handleAcceptInvite(n) {
        const payload = n.payload;
        if (!payload?.inviteToken || !payload?.boardId)
            return;
        setProcessing(n.id);
        try {
            await api(`/invite/accept?token=${encodeURIComponent(payload.inviteToken)}`, { method: 'GET' }, token);
            await api(`/notifications/${n.id}/read`, { method: 'POST' }, token);
            await refresh();
            setOpen(false);
            navigate(`/board/${payload.boardId}`, { replace: true });
        }
        catch {
            // ignore
        }
        finally {
            setProcessing(null);
        }
    }
    async function handleRejectInvite(n) {
        setProcessing(n.id);
        try {
            await api(`/notifications/${n.id}/read`, { method: 'POST' }, token);
            await refresh();
        }
        catch {
            // ignore
        }
        finally {
            setProcessing(null);
        }
    }
    const safeItems = Array.isArray(items) ? items : [];
    const unread = safeItems.filter((x) => !x.readAt).length;
    return (_jsxs("div", { className: "relative z-50", children: [_jsxs("button", { type: "button", className: "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800", onClick: () => setOpen((v) => !v), children: ["Notifica\u00E7\u00F5es ", unread ? `(${unread})` : ''] }), open && (_jsxs("div", { className: "absolute right-0 mt-2 z-[100] w-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950", children: [_jsx("div", { className: "border-b border-slate-200 px-4 py-3 text-sm font-semibold dark:border-slate-800", children: "Central" }), _jsxs("div", { className: "max-h-96 overflow-auto p-2", children: [safeItems.length === 0 && (_jsx("div", { className: "p-3 text-xs text-slate-500 dark:text-slate-400", children: "Sem notifica\u00E7\u00F5es." })), safeItems.map((n) => {
                                const payload = n.payload;
                                const isInvite = n.type === 'BOARD_INVITE' && payload?.inviteToken;
                                return (_jsx("div", { className: `rounded-xl border p-3 text-xs dark:border-slate-800 ${n.readAt ? 'border-slate-200 bg-slate-50 dark:bg-slate-900/50' : 'border-indigo-200 bg-indigo-50/30 dark:border-indigo-800 dark:bg-indigo-950/30'}`, children: _jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("div", { className: "font-medium", children: isInvite
                                                            ? `${payload?.inviterName ?? 'Alguém'} convidou você para o quadro ${payload?.boardName ?? ''}`
                                                            : n.type }), _jsx("div", { className: "mt-1 text-slate-500 dark:text-slate-400", children: new Date(n.createdAt).toLocaleString() }), isInvite && !n.readAt && (_jsxs("div", { className: "mt-3 flex gap-2", children: [_jsx("button", { type: "button", className: "rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50", onClick: () => handleAcceptInvite(n), disabled: processing === n.id, children: "Aceitar" }), _jsx("button", { type: "button", className: "rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800", onClick: () => handleRejectInvite(n), disabled: processing === n.id, children: "Rejeitar" })] }))] }), !n.readAt && !isInvite && _jsx("span", { className: "h-2 w-2 shrink-0 rounded-full bg-amber-400" })] }) }, n.id));
                            })] })] }))] }));
}
