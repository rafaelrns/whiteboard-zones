import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAppStore } from './store';

const ERROR_MESSAGES: Record<string, string> = {
  email_in_use: 'Este e-mail já está em uso. Use outro ou entre na conta existente.',
  invalid_credentials: 'E-mail ou senha incorretos.',
  invalid_body: 'Preencha todos os campos corretamente.',
  erro: 'Ocorreu um erro. Tente novamente.',
};

export function LoginCard({ returnUrl, title }: { returnUrl?: string; title?: string }) {
  const setAuth = useAppStore((s) => s.setAuth);
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
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
      const res = await api<{ token: string; user: { id: string; name: string; email: string; role: string } }>(
        path,
        { method: 'POST', body: JSON.stringify(body) },
      );
      setAuth(res.token, res.user);
      if (returnUrl) navigate(returnUrl, { replace: true });
    } catch (e: any) {
      setErr(ERROR_MESSAGES[e?.error as string] ?? e?.error ?? 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        <button
          type="button"
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            mode === 'login'
              ? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
          onClick={() => setMode('login')}
        >
          Entrar
        </button>
        <button
          type="button"
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            mode === 'register'
              ? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
          onClick={() => setMode('register')}
        >
          Criar conta
        </button>
      </div>

      <div className="mb-3">
        <div className="text-sm font-semibold">{title ?? (mode === 'login' ? 'Entrar na sua conta' : 'Cadastre-se')}</div>
        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {mode === 'login' ? 'Use seu e-mail e senha' : 'Preencha os dados para colaborar no quadro'}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {mode === 'register' && (
          <label className="block text-xs">
            Nome
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
        )}

        <label className="block text-xs">
          Email
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="block text-xs">
          Senha
          <input
            type="password"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {err && <div className="rounded-xl bg-rose-50 p-2 text-xs text-rose-800 dark:bg-rose-900/30 dark:text-rose-200">{err}</div>}

        <button
          className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm text-white shadow-sm transition hover:opacity-90 disabled:opacity-50 dark:bg-slate-50 dark:text-slate-950"
          onClick={submit}
          disabled={loading}
        >
          {loading ? '...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
        </button>
      </div>
    </div>
  );
}
