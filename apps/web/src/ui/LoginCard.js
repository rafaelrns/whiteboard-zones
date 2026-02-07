import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAppStore } from './store';
const ERROR_MESSAGES = {
    email_in_use: 'Este e-mail já está em uso. Use outro ou entre na conta existente.',
    invalid_credentials: 'E-mail ou senha incorretos.',
    invalid_body: 'Preencha todos os campos corretamente.',
    erro: 'Ocorreu um erro. Tente novamente.',
};
export function LoginCard({ returnUrl, title }) {
    const setAuth = useAppStore((s) => s.setAuth);
    const navigate = useNavigate();
    const [mode, setMode] = useState('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [err, setErr] = useState(null);
    const [loading, setLoading] = useState(false);
    async function submit() {
        setErr(null);
        if (mode === 'register' && (!name.trim() || !email.trim() || password.length < 8)) {
            setErr('Preencha nome, e-mail e use uma senha com pelo menos 8 caracteres.');
            return;
        }
        if (mode === 'login' && (!email.trim() || !password)) {
            setErr('Informe e-mail e senha.');
            return;
        }
        setLoading(true);
        try {
            const path = mode === 'login' ? '/auth/login' : '/auth/register';
            const body = mode === 'login' ? { email, password } : { name: name.trim(), email: email.trim(), password };
            const res = await api(path, { method: 'POST', body: JSON.stringify(body) });
            setAuth(res.token, res.user);
            if (returnUrl)
                navigate(returnUrl, { replace: true });
        }
        catch (e) {
            setErr(ERROR_MESSAGES[e?.error] ?? e?.error ?? 'Ocorreu um erro. Tente novamente.');
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs("div", { className: "mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900", children: [_jsxs("div", { className: "mb-4 flex gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800", children: [_jsx("button", { type: "button", className: `flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition ${mode === 'login'
                            ? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`, onClick: () => setMode('login'), children: "Entrar" }), _jsx("button", { type: "button", className: `flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition ${mode === 'register'
                            ? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`, onClick: () => setMode('register'), children: "Criar conta" })] }), _jsxs("div", { className: "mb-3", children: [_jsx("div", { className: "text-sm font-semibold", children: title ?? (mode === 'login' ? 'Entrar na sua conta' : 'Cadastre-se') }), _jsx("div", { className: "mt-0.5 text-xs text-slate-500 dark:text-slate-400", children: mode === 'login' ? 'Use seu e-mail e senha' : 'Preencha os dados para colaborar no quadro' })] }), _jsxs("div", { className: "mt-4 space-y-3", children: [mode === 'register' && (_jsxs("label", { className: "block text-xs", children: ["Nome", _jsx("input", { className: "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950", value: name, onChange: (e) => setName(e.target.value) })] })), _jsxs("label", { className: "block text-xs", children: ["Email", _jsx("input", { className: "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950", value: email, onChange: (e) => setEmail(e.target.value) })] }), _jsxs("label", { className: "block text-xs", children: ["Senha", _jsx("input", { type: "password", className: "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950", value: password, onChange: (e) => setPassword(e.target.value) })] }), err && _jsx("div", { className: "rounded-xl bg-rose-50 p-2 text-xs text-rose-800 dark:bg-rose-900/30 dark:text-rose-200", children: err }), _jsx("button", { className: "w-full rounded-xl bg-slate-900 px-3 py-2 text-sm text-white shadow-sm transition hover:opacity-90 disabled:opacity-50 dark:bg-slate-50 dark:text-slate-950", onClick: submit, disabled: loading, children: loading ? '...' : mode === 'login' ? 'Entrar' : 'Criar conta' })] })] }));
}
