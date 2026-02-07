import { useMemo, useState } from 'react';
import type { ZoneType } from '@zones/shared';
import { suggestZones, type ZoneSuggestion, type ObjectBox } from '@zones/collaboration-core';

export function ZoneSuggestPanel({
  objects,
  onApply,
}: {
  objects: ObjectBox[];
  onApply: (zones: ZoneSuggestion[]) => void;
}) {
  const [zones, setZones] = useState<ZoneSuggestion[] | null>(null);

  const ctx = useMemo(() => {
    if (!objects.length) return null;
    return zones ? null : null;
  }, [objects.length, zones]);

  function run() {
    const zs = suggestZones(objects);
    setZones(zs);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="text-sm font-semibold">Detecção automática</div>
      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Agrupa objetos por proximidade e sugere zonas e tipos.
      </div>

      <button
        className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800/50"
        onClick={run}
        type="button"
        disabled={objects.length < 3}
      >
        Gerar sugestões
      </button>

      {zones && (
        <div className="mt-3 space-y-2 text-xs">
          {zones.length === 0 && (
            <div className="text-slate-500 dark:text-slate-400">Sem clusters suficientes.</div>
          )}
          {zones.map((z, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-2 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="font-medium">{z.name}</div>
                <div className="text-slate-500 dark:text-slate-400">
                  {z.type} • {Math.round(z.confidence * 100)}%
                </div>
              </div>
              <div className="mt-1 text-slate-500 dark:text-slate-400">
                {z.objectIds.length} objs • rect ({Math.round(z.rect.w)}×{Math.round(z.rect.h)})
              </div>
            </div>
          ))}
          <button
            className="mt-2 w-full rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:opacity-90 dark:bg-slate-50 dark:text-slate-950"
            onClick={() => onApply(zones)}
            type="button"
            disabled={zones.length === 0}
          >
            Aplicar sugestões (criar zonas)
          </button>
        </div>
      )}
    </div>
  );
}
