import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { useAppStore } from '../store';
import clsx from 'clsx';

const ROLES = [
  { value: 'editor', label: 'Editor' },
  { value: 'reviewer', label: 'Revisor' },
  { value: 'viewer', label: 'Visualizador' },
] as const;

type InviteItem = {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
};

type UserItem = { id: string; name: string; email: string };

export function ShareInviteModal({
  boardId,
  open,
  onClose,
}: {
  boardId: string;
  open: boolean;
  onClose: () => void;
}) {
  const token = useAppStore((s) => s.token);
  const [mode, setMode] = useState<'user' | 'email'>('user');
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState<UserItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'reviewer' | 'viewer'>('editor');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [list, setList] = useState<InviteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [stopSharingLoading, setStopSharingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const refreshList = useCallback(() => {
    if (!token || !boardId) return;
    api<InviteItem[]>(`/boards/${boardId}/invites`, { method: 'GET' }, token)
      .then(setList)
      .catch(() => setList([]));
  }, [token, boardId]);

  useEffect(() => {
    if (!open || !token || !boardId) return;
    setError(null);
    setInviteLink(null);
    setSuccess(null);
    setSelectedUser(null);
    setUserQuery('');
    refreshList();
  }, [open, token, boardId, refreshList]);

  useEffect(() => {
    if (!token || userQuery.length < 2) {
      setUserResults([]);
      return;
    }
    const t = setTimeout(() => {
      api<UserItem[]>(`/users/search?q=${encodeURIComponent(userQuery)}`, { method: 'GET' }, token)
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
    } else {
      if (!email.trim()) {
        setError('Informe o e-mail.');
        return;
      }
    }

    setLoading(true);
    try {
      const body = mode === 'user'
        ? { userId: selectedUser!.id, role }
        : { email: email.trim(), role };
      const res = await api<{ inviteUrl: string }>(`/boards/${boardId}/invites`, {
        method: 'POST',
        body: JSON.stringify(body),
      }, token);
      setInviteLink(res.inviteUrl);
      refreshList();
      setSuccess(mode === 'user'
        ? `${selectedUser!.name} receberá uma notificação para aceitar.`
        : 'Link gerado. Compartilhe com quem não tem conta.');
      setSelectedUser(null);
      setEmail('');
    } catch (e: any) {
      const msg = e?.error === 'forbidden'
        ? 'Apenas o dono do quadro pode convidar.'
        : e?.error === 'already_invited'
          ? 'Este usuário já foi convidado.'
          : e?.error ?? 'Erro ao convidar.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function copyLink(link: string) {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleStopSharing() {
    if (!token || !boardId) return;
    setError(null);
    setStopSharingLoading(true);
    try {
      await api(`/boards/${boardId}/invites`, { method: 'DELETE' }, token);
      refreshList();
      setSuccess('Compartilhamento encerrado. Todos os convites foram revogados.');
      setInviteLink(null);
    } catch (e: any) {
      setError(e?.error === 'forbidden' ? 'Apenas o dono pode encerrar o compartilhamento.' : 'Erro ao encerrar.');
    } finally {
      setStopSharingLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="text-sm font-semibold">Compartilhar e convidar</h2>
          <button
            type="button"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-auto">
          <div className="flex gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                mode === 'user' ? 'bg-white shadow dark:bg-slate-700' : 'text-slate-600 dark:text-slate-400'
              }`}
              onClick={() => setMode('user')}
            >
              Usuário cadastrado
            </button>
            <button
              type="button"
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                mode === 'email' ? 'bg-white shadow dark:bg-slate-700' : 'text-slate-600 dark:text-slate-400'
              }`}
              onClick={() => setMode('email')}
            >
              Por e-mail (sem conta)
            </button>
          </div>

          {mode === 'user' ? (
            <>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Busque e selecione um usuário. Ele receberá uma notificação para aceitar o convite.
              </p>
              <div>
                <input
                  type="text"
                  placeholder="Buscar por nome ou e-mail..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                />
                <div className="mt-2 max-h-32 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  {userResults.length === 0 && userQuery.length >= 2 && (
                    <div className="p-3 text-xs text-slate-500">Nenhum usuário encontrado.</div>
                  )}
                  {userResults.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className={clsx(
                        'w-full flex items-center justify-between px-3 py-2 text-left text-sm transition',
                        selectedUser?.id === u.id
                          ? 'bg-indigo-50 dark:bg-indigo-950/50'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
                      )}
                      onClick={() => setSelectedUser(selectedUser?.id === u.id ? null : u)}
                    >
                      <span className="font-medium">{u.name}</span>
                      <span className="text-xs text-slate-500">{u.email}</span>
                    </button>
                  ))}
                </div>
                {selectedUser && (
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                    Selecionado: <strong>{selectedUser.name}</strong>
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Para quem ainda não tem conta. O link permite criar conta e acessar o quadro.
              </p>
              <input
                type="email"
                placeholder="E-mail do convidado"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </>
          )}

          <div className="flex gap-2">
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={role}
              onChange={(e) => setRole(e.target.value as 'editor' | 'reviewer' | 'viewer')}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              onClick={handleInviteUser}
              disabled={loading || (mode === 'user' && !selectedUser) || (mode === 'email' && !email.trim())}
            >
              {loading ? 'Enviando…' : 'Convidar'}
            </button>
          </div>

          {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
          {success && <p className="text-xs text-green-600 dark:text-green-400">{success}</p>}

          {inviteLink && mode === 'email' && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Link (válido 7 dias):</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-950"
                  value={inviteLink}
                />
                <button
                  type="button"
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-white hover:bg-slate-700"
                  onClick={() => copyLink(inviteLink)}
                >
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Convites deste quadro</p>
            {list.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">Nenhum convite ainda.</p>
            ) : (
              <ul className="space-y-1.5 max-h-32 overflow-auto">
                {list.map((inv, i) => (
                  <li
                    key={inv.id || i}
                    className={clsx(
                      'flex items-center justify-between rounded-lg px-3 py-2 text-xs',
                      inv.acceptedAt
                        ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-500'
                        : 'bg-slate-50 dark:bg-slate-800/30',
                    )}
                  >
                    <span className="font-medium">{inv.email}</span>
                    <span className="text-slate-500">{inv.acceptedAt ? 'Aceito' : inv.role}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleStopSharing}
              disabled={stopSharingLoading}
              className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-800 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200 dark:hover:bg-rose-900/50"
              title="Revoga todos os convites e para de compartilhar o quadro"
            >
              {stopSharingLoading ? 'Encerrando…' : 'Parar de compartilhar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
