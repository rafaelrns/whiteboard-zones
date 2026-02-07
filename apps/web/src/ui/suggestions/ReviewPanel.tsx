import { useEffect, useMemo, useState } from 'react';
import * as fabric from 'fabric';
import { api } from '../../lib/api';
import { useAppStore } from '../store';

export function ReviewPanel({
  boardId,
  canvas,
  onApplied,
}: {
  boardId: string;
  canvas: fabric.Canvas | null;
  onApplied: () => void;
}) {
  const token = useAppStore((s) => s.token);
  const user = useAppStore((s) => s.user);

  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');

  const canReview = user?.role === 'owner' || user?.role === 'reviewer';

  async function refresh() {
    if (!token || !boardId) return;
    const list = await api<any[]>(`/boards/${boardId}/suggestions`, { method: 'GET' }, token);
    setItems(list);
    if (selected && !list.find((x) => x.id === selected.id)) setSelected(null);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, boardId]);

  const pending = useMemo(() => items.filter((i) => i.status === 'PENDING'), [items]);

  async function decide(decision: 'APPROVE' | 'REJECT') {
    if (!token || !boardId || !selected) return;
    setLoading(true);
    try {
      await api(
        `/boards/${boardId}/suggestions/${selected.id}/decision`,
        { method: 'POST', body: JSON.stringify({ decision, comment: comment || null }) },
        token,
      );

      if (decision === 'APPROVE' && canvas) {
        // merge aditivo: adiciona objetos sugeridos ao canvas
        const objs = selected.objectsJson as any[];
        const enlivened = await fabric.util.enlivenObjects(objs);
        enlivened.forEach((o: any) => {
          o.__suggestion = false;
          canvas.add(o);
        });
        canvas.requestRenderAll();
        onApplied();
      }

      setSelected(null);
      setComment('');
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Revisão</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Pendentes: {pending.length}</div>
        </div>
        <button
          type="button"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800/50"
          onClick={refresh}
        >
          Atualizar
        </button>
      </div>

      {!canReview && (
        <div className="mt-3 text-xs text-amber-700 dark:text-amber-200">
          Seu role não possui permissão de revisão neste MVP.
        </div>
      )}

      <div className="mt-3 space-y-2">
        {pending.length === 0 && <div className="text-xs text-slate-500 dark:text-slate-400">Nada pendente.</div>}
        {pending.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`w-full rounded-xl border p-3 text-left text-xs transition ${
              selected?.id === s.id
                ? 'border-slate-900 bg-slate-50 dark:border-slate-50 dark:bg-slate-950'
                : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/40'
            }`}
            onClick={() => setSelected(s)}
            disabled={!canReview}
          >
            <div className="font-medium">{s.title}</div>
            <div className="mt-1 text-slate-500 dark:text-slate-400">
              {new Date(s.createdAt).toLocaleString()} • {s.objectsJson?.length ?? 0} objs
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <div className="text-xs text-slate-600 dark:text-slate-300">
            {selected.message ? selected.message : 'Sem mensagem.'}
          </div>

          <label className="block text-xs">
            Comentário (opcional)
            <textarea
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              disabled={!canReview}
            />
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50 dark:bg-slate-50 dark:text-slate-950"
              onClick={() => decide('APPROVE')}
              disabled={!canReview || loading}
            >
              Aprovar
            </button>
            <button
              type="button"
              className="flex-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800 hover:opacity-90 disabled:opacity-50 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200"
              onClick={() => decide('REJECT')}
              disabled={!canReview || loading}
            >
              Rejeitar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
