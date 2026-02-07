import { useMemo, useState } from 'react';
import type * as fabric from 'fabric';
import { api } from '../../lib/api';
import { useAppStore } from '../store';

export function SuggestionComposer({
  boardId,
  zoneId,
  canvas,
  enabled,
  onSubmitted,
}: {
  boardId: string;
  zoneId?: string | null;
  canvas: fabric.Canvas | null;
  enabled: boolean;
  onSubmitted: () => void;
}) {
  const token = useAppStore((s) => s.token);
  const [title, setTitle] = useState('Sugestão');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const objects = useMemo(() => {
    if (!canvas) return [];
    return canvas.getObjects().filter((o: any) => o.__suggestion === true);
  }, [canvas]);

  async function submit() {
    if (!token || !boardId || !canvas) return;
    const objs = canvas.getObjects().filter((o: any) => o.__suggestion === true);
    if (!objs.length) return;

    setSending(true);
    try {
      const objectsJson = objs.map((o: any) => o.toObject(['__oid', '__suggestion']));
      await api(
        `/boards/${boardId}/suggestions`,
        {
          method: 'POST',
          body: JSON.stringify({
            zoneId: zoneId ?? null,
            title,
            message: message || null,
            objectsJson,
          }),
        },
        token,
      );

      objs.forEach((o: any) => canvas.remove(o));
      canvas.requestRenderAll();
      onSubmitted();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="text-sm font-semibold">Modo sugestão</div>
      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        No canvas, ative “Sugestão: ON”. Objetos tracejados são enviados para revisão.
      </div>

      <div className="mt-3 space-y-3">
        <label className="block text-xs">
          Título
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!enabled}
          />
        </label>

        <label className="block text-xs">
          Mensagem (opcional)
          <textarea
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={!enabled}
            rows={3}
          />
        </label>

        <button
          type="button"
          className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm text-white shadow-sm transition hover:opacity-90 disabled:opacity-50 dark:bg-slate-50 dark:text-slate-950"
          disabled={!enabled || sending || objects.length === 0}
          onClick={submit}
        >
          {sending ? 'Enviando...' : `Enviar (${objects.length})`}
        </button>

        {objects.length === 0 && (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Nenhuma anotação para enviar.
          </div>
        )}
      </div>
    </div>
  );
}
