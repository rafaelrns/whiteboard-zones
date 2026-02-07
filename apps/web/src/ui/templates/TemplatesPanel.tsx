import * as fabric from 'fabric';
import { TEMPLATES } from './templates';

export function TemplatesPanel({
  canvas,
  onApplied,
}: {
  canvas: fabric.Canvas | null;
  onApplied: () => void;
}) {
  function applyTemplate(id: string) {
    if (!canvas) return;
    const t = TEMPLATES.find((x) => x.id === id);
    if (!t) return;

    // Limpa o canvas atual
    canvas.getObjects().forEach((o: fabric.FabricObject) => canvas.remove(o));

    // Cria e adiciona os objetos do template
    const objects = t.build();
    objects.forEach((o) => {
      (o as any).__suggestion = false;
      canvas.add(o);
    });

    canvas.requestRenderAll();
    onApplied();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="text-sm font-semibold">Templates</div>
      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Comece rápido com estruturas prontas.</div>

      <div className="mt-3 grid grid-cols-1 gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            className="rounded-xl border border-slate-200 bg-white p-3 text-left text-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800/40"
            onClick={() => applyTemplate(t.id)}
            disabled={!canvas}
          >
            <div className="font-medium">{t.name}</div>
            <div className="mt-1 text-slate-500 dark:text-slate-400">{t.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
