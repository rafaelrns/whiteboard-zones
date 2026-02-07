import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { useAppStore } from '../store';
import clsx from 'clsx';
const ROLES = [
    { value: 'editor', label: 'Editor' },
    { value: 'reviewer', label: 'Revisor' },
    { value: 'viewer', label: 'Visualizador' },
];
export function ShareInviteModal({ boardId, open, onClose, }) {
    const token = useAppStore((s) => s.token);
    const inviteListRefreshTrigger = useAppStore((s) => s.inviteListRefreshTrigger);
    const [mode, setMode] = useState('user');
    const [userQuery, setUserQuery] = useState('');
    const [userResults, setUserResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('editor');
    const [inviteLink, setInviteLink] = useState(null);
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stopSharingLoading, setStopSharingLoading] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [success, setSuccess] = useState(null);
    const refreshList = useCallback(() => {
        if (!token || !boardId)
            return;
        api(`/boards/${boardId}/invites`, { method: 'GET' }, token)
            .then(setList)
            .catch(() => setList([]));
    }, [token, boardId]);
    useEffect(() => {
        if (!open || !token || !boardId)
            return;
        setError(null);
        setInviteLink(null);
        setSuccess(null);
        setSelectedUser(null);
        setUserQuery('');
        refreshList();
    }, [open, token, boardId, refreshList]);
    useEffect(() => {
        if (inviteListRefreshTrigger > 0 && open && boardId)
            refreshList();
    }, [inviteListRefreshTrigger, open, boardId, refreshList]);
    useEffect(() => {
        if (!token || userQuery.length < 2) {
            setUserResults([]);
            return;
        }
        const t = setTimeout(() => {
            api(`/users/search?q=${encodeURIComponent(userQuery)}`, { method: 'GET' }, token)
                .then(setUserResults)
                .catch(() => setUserResults([]));
        }, 300);
        return () => clearTimeout(t);
    }, [token, userQuery]);
    async function handleInviteUser() {
        setError(null);
        setSuccess(null);
        if (mode === 'user') {
            if (!selectedUser) {
                setError('Selecione um usuário da lista.');
                return;
            }
        }
        else {
            if (!email.trim()) {
                setError('Informe o e-mail.');
                return;
            }
        }
        setLoading(true);
        try {
            const body = mode === 'user'
                ? { userId: selectedUser.id, role }
                : { email: email.trim(), role };
            const res = await api(`/boards/${boardId}/invites`, {
                method: 'POST',
                body: JSON.stringify(body),
            }, token);
            setInviteLink(res.inviteUrl);
            refreshList();
            setSuccess(mode === 'user'
                ? `${selectedUser.name} receberá uma notificação para aceitar.`
                : 'Link gerado. Compartilhe com quem não tem conta.');
            setSelectedUser(null);
            setEmail('');
        }
        catch (e) {
            const msg = e?.error === 'forbidden'
                ? 'Apenas o dono do quadro pode convidar.'
                : e?.error === 'already_invited'
                    ? 'Este usuário já foi convidado.'
                    : e?.error ?? 'Erro ao convidar.';
            setError(msg);
        }
        finally {
            setLoading(false);
        }
    }
    function copyLink(link) {
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
    async function handleStopSharing() {
        if (!token || !boardId)
            return;
        setError(null);
        setStopSharingLoading(true);
        try {
            await api(`/boards/${boardId}/invites`, { method: 'DELETE' }, token);
            refreshList();
            setSuccess('Compartilhamento encerrado. Todos os convites foram revogados.');
            setInviteLink(null);
        }
        catch (e) {
            setError(e?.error === 'forbidden' ? 'Apenas o dono pode encerrar o compartilhamento.' : 'Erro ao encerrar.');
        }
        finally {
            setStopSharingLoading(false);
        }
    }
    if (!open)
        return null;
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40", onClick: onClose, children: _jsxs("div", { className: "w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-hidden flex flex-col", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800", children: [_jsx("h2", { className: "text-sm font-semibold", children: "Compartilhar e convidar" }), _jsx("button", { type: "button", className: "rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800", onClick: onClose, "aria-label": "Fechar", children: "\u2715" })] }), _jsxs("div", { className: "p-4 space-y-4 overflow-auto", children: [_jsxs("div", { className: "flex gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800", children: [_jsx("button", { type: "button", className: `flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${mode === 'user' ? 'bg-white shadow dark:bg-slate-700' : 'text-slate-600 dark:text-slate-400'}`, onClick: () => setMode('user'), children: "Usu\u00E1rio cadastrado" }), _jsx("button", { type: "button", className: `flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${mode === 'email' ? 'bg-white shadow dark:bg-slate-700' : 'text-slate-600 dark:text-slate-400'}`, onClick: () => setMode('email'), children: "Por e-mail (sem conta)" })] }), mode === 'user' ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Busque e selecione um usu\u00E1rio. Ele receber\u00E1 uma notifica\u00E7\u00E3o para aceitar o convite." }), _jsxs("div", { children: [_jsx("input", { type: "text", placeholder: "Buscar por nome ou e-mail...", className: "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950", value: userQuery, onChange: (e) => setUserQuery(e.target.value) }), _jsxs("div", { className: "mt-2 max-h-32 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700", children: [userResults.length === 0 && userQuery.length >= 2 && (_jsx("div", { className: "p-3 text-xs text-slate-500", children: "Nenhum usu\u00E1rio encontrado." })), userResults.map((u) => (_jsxs("button", { type: "button", className: clsx('w-full flex items-center justify-between px-3 py-2 text-left text-sm transition', selectedUser?.id === u.id
                                                        ? 'bg-indigo-50 dark:bg-indigo-950/50'
                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'), onClick: () => setSelectedUser(selectedUser?.id === u.id ? null : u), children: [_jsx("span", { className: "font-medium", children: u.name }), _jsx("span", { className: "text-xs text-slate-500", children: u.email })] }, u.id)))] }), selectedUser && (_jsxs("p", { className: "mt-2 text-xs text-slate-600 dark:text-slate-300", children: ["Selecionado: ", _jsx("strong", { children: selectedUser.name })] }))] })] })) : (_jsxs(_Fragment, { children: [_jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Para quem ainda n\u00E3o tem conta. O link permite criar conta e acessar o quadro." }), _jsx("input", { type: "email", placeholder: "E-mail do convidado", className: "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950", value: email, onChange: (e) => setEmail(e.target.value) })] })), _jsxs("div", { className: "flex gap-2", children: [_jsx("select", { className: "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950", value: role, onChange: (e) => setRole(e.target.value), children: ROLES.map((r) => (_jsx("option", { value: r.value, children: r.label }, r.value))) }), _jsx("button", { type: "button", className: "flex-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600", onClick: handleInviteUser, disabled: loading || (mode === 'user' && !selectedUser) || (mode === 'email' && !email.trim()), children: loading ? 'Enviando…' : 'Convidar' })] }), error && _jsx("p", { className: "text-xs text-rose-600 dark:text-rose-400", children: error }), success && _jsx("p", { className: "text-xs text-green-600 dark:text-green-400", children: success }), inviteLink && mode === 'email' && (_jsxs("div", { className: "rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50", children: [_jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400 mb-2", children: "Link (v\u00E1lido 7 dias):" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { readOnly: true, className: "flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-950", value: inviteLink }), _jsx("button", { type: "button", className: "rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-white hover:bg-slate-700", onClick: () => copyLink(inviteLink), children: copied ? 'Copiado!' : 'Copiar' })] })] })), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-slate-600 dark:text-slate-300 mb-2", children: "Convites deste quadro" }), list.length === 0 ? (_jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Nenhum convite ainda." })) : (_jsx("ul", { className: "space-y-1.5 max-h-32 overflow-auto", children: list.map((inv, i) => (_jsxs("li", { className: clsx('flex items-center justify-between rounded-lg px-3 py-2 text-xs', inv.acceptedAt
                                            ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-500'
                                            : 'bg-slate-50 dark:bg-slate-800/30'), children: [_jsx("span", { className: "font-medium", children: inv.email }), _jsx("span", { className: "text-slate-500", children: inv.acceptedAt ? 'Aceito' : inv.role })] }, inv.id || i))) }))] }), _jsx("div", { className: "pt-2 border-t border-slate-200 dark:border-slate-800", children: _jsx("button", { type: "button", onClick: handleStopSharing, disabled: stopSharingLoading, className: "w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-800 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200 dark:hover:bg-rose-900/50", title: "Revoga todos os convites e para de compartilhar o quadro", children: stopSharingLoading ? 'Encerrando…' : 'Parar de compartilhar' }) })] })] }) }));
}
