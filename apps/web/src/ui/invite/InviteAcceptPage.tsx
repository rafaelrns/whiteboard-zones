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

  const [status, setStatus] = useState<'idle' | 'accepting' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!inviteToken) {
      setError('Link de convite inválido. Falta o token.');
      return;
    }
    if (!token || !user) return;

    let cancelled = false;
    setStatus('accepting');
    setError(null);
    api<{ boardId: string }>(`/invite/accept?token=${encodeURIComponent(inviteToken)}`, { method: 'GET' }, token)
      .then((data) => {
        if (cancelled) return;
        setStatus('done');
        navigate(`/board/${data.boardId}`, { replace: true });
      })
      .catch((e: { error?: string }) => {
        if (cancelled) return;
        setStatus('error');
        const msg =
          e?.error === 'not_found'
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
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 max-w-md w-full text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300">{error}</p>
          <a href="/" className="mt-4 inline-block text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
            Voltar ao início
          </a>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <header className="border-b border-slate-200/70 dark:border-slate-800">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div className="text-sm font-semibold">Zonas Colaborativas</div>
          </div>
        </header>
        <main className="mx-auto max-w-md px-4 py-8">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 mb-6 dark:border-indigo-800 dark:bg-indigo-950/30">
            <p className="text-sm text-indigo-900 dark:text-indigo-100">
              Você foi convidado para colaborar em um quadro. Entre com sua conta ou crie uma para acessar.
            </p>
          </div>
          <LoginCard returnUrl={returnUrl} />
        </main>
      </div>
    );
  }

  if (status === 'accepting') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-300">Aceitando convite e abrindo o quadro…</p>
        </div>
      </div>
    );
  }

  if (status === 'error' && error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 max-w-md w-full text-center">
          <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
          <a href="/" className="mt-4 inline-block text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
            Voltar ao início
          </a>
        </div>
      </div>
    );
  }

  return null;
}
