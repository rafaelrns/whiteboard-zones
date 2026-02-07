import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAppStore } from '../store';
import { LoginCard } from '../LoginCard';
/** Página de aceitar convite: token na URL. Se não logado, mostra login/cadastro; se logado, aceita e redireciona ao quadro. */
export function InviteAcceptPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = useAppStore((s) => s.token);
    const user = useAppStore((s) => s.user);
    const inviteToken = searchParams.get('token');
    const returnUrl = inviteToken ? `/invite/accept?token=${encodeURIComponent(inviteToken)}` : '/invite/accept';
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!inviteToken) {
            setError('Link de convite inválido. Falta o token.');
            return;
        }
        if (!token || !user)
            return;
        let cancelled = false;
        setStatus('accepting');
        setError(null);
        api(`/invite/accept?token=${encodeURIComponent(inviteToken)}`, { method: 'GET' }, token)
            .then((data) => {
            if (cancelled)
                return;
            setStatus('done');
            navigate(`/board/${data.boardId}`, { replace: true });
        })
            .catch((e) => {
            if (cancelled)
                return;
            setStatus('error');
            const msg = e?.error === 'not_found'
                ? 'Convite não encontrado.'
                : e?.error === 'already_accepted'
                    ? 'Este convite já foi aceito.'
                    : e?.error === 'expired'
                        ? 'Este convite expirou.'
                        : e?.error ?? 'Não foi possível aceitar o convite.';
            setError(msg);
        });
        return () => {
            cancelled = true;
        };
    }, [inviteToken, token, user, navigate]);
    if (!inviteToken) {
        return (_jsx("div", { className: "min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4", children: _jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 max-w-md w-full text-center", children: [_jsx("p", { className: "text-sm text-slate-600 dark:text-slate-300", children: error }), _jsx("a", { href: "/", className: "mt-4 inline-block text-sm text-indigo-600 dark:text-indigo-400 hover:underline", children: "Voltar ao in\u00EDcio" })] }) }));
    }
    if (!token || !user) {
        return (_jsxs("div", { className: "min-h-screen bg-slate-50 dark:bg-slate-950", children: [_jsx("header", { className: "border-b border-slate-200/70 dark:border-slate-800", children: _jsx("div", { className: "mx-auto flex max-w-6xl items-center justify-between px-4 py-3", children: _jsx("div", { className: "text-sm font-semibold", children: "Zonas Colaborativas" }) }) }), _jsxs("main", { className: "mx-auto max-w-md px-4 py-8", children: [_jsx("div", { className: "rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 mb-6 dark:border-indigo-800 dark:bg-indigo-950/30", children: _jsx("p", { className: "text-sm text-indigo-900 dark:text-indigo-100", children: "Voc\u00EA foi convidado para colaborar em um quadro. Entre com sua conta ou crie uma para acessar." }) }), _jsx(LoginCard, { returnUrl: returnUrl })] })] }));
    }
    if (status === 'accepting') {
        return (_jsx("div", { className: "min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4", children: _jsx("div", { className: "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900", children: _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-300", children: "Aceitando convite e abrindo o quadro\u2026" }) }) }));
    }
    if (status === 'error' && error) {
        return (_jsx("div", { className: "min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4", children: _jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 max-w-md w-full text-center", children: [_jsx("p", { className: "text-sm text-rose-600 dark:text-rose-400", children: error }), _jsx("a", { href: "/", className: "mt-4 inline-block text-sm text-indigo-600 dark:text-indigo-400 hover:underline", children: "Voltar ao in\u00EDcio" })] }) }));
    }
    return null;
}
