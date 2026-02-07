import { useEffect, useMemo, useState } from 'react';
import type { ZoneDTO, ZoneType, Role } from '@zones/shared';
import { api } from '../../lib/api';
import { useAppStore } from '../store';
import clsx from 'clsx';

const ZONE_TYPES: { type: ZoneType; label: string }[] = [
  { type: 'FREE_EDIT', label: 'Livre' },
  { type: 'LOCKED_ZONE', label: 'Bloqueada (Fila)' },
  { type: 'REVIEW_REQUIRED', label: 'Revisão obrigatória' },
  { type: 'READ_ONLY', label: 'Somente leitura' },
];

const ROLES: Role[] = ['owner', 'editor', 'reviewer', 'viewer'];

export function ZoneManager({
  boardId,
  zones,
  selectedZoneId,
  onSelect,
  onRefresh,
  onDelete,
}: {
  boardId: string;
  zones: ZoneDTO[];
  selectedZoneId?: string;
  onSelect: (id: string) => void;
  onRefresh: () => void;
  onDelete: (id: string) => void;
}) {
  const token = useAppStore((s) => s.token);
  const selected = zones.find((z) => z.id === selectedZoneId) ?? null;
  const zonesUniq = useMemo(
    () => zones.filter((z, i, a) => a.findIndex((x) => x.id === z.id) === i),
    [zones],
  );

  const [name, setName] = useState('');
  const [type, setType] = useState<ZoneType>('FREE_EDIT');
  const [maxEditors, setMaxEditors] = useState<number | ''>('');
  const [maxEditSeconds, setMaxEditSeconds] = useState<number | ''>('');
  const [allowedRoles, setAllowedRoles] = useState<Role[]>(['owner', 'editor', 'reviewer', 'viewer']);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setName(selected.name);
    setType(selected.type);
    setMaxEditors(selected.rules?.maxEditors ?? '');
    setMaxEditSeconds(selected.rules?.maxEditSeconds ?? '');
    setAllowedRoles(selected.rules?.allowedRoles ?? ['owner', 'editor', 'reviewer', 'viewer']);
  }, [selected?.id]);

  async function save() {
    if (!token || !selected) return;
    setSaving(true);
    try {
      await api(
        `/boards/${boardId}/zones/${selected.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            name,
            type,
            rules: {
              allowedRoles,
              ...(maxEditors !== '' ? { maxEditors: Number(maxEditors) } : {}),
              ...(maxEditSeconds !== '' ? { maxEditSeconds: Number(maxEditSeconds) } : {}),
            },
          }),
        },
        token,
      );
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-nowrap gap-4">
      <div className="min-w-[220px] w-[220px] flex-shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="text-sm font-semibold">Zonas</div>
        <div className="mt-2 space-y-2">
          {zonesUniq.length === 0 && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Nenhuma zona criada. Use “Criar zona” no canvas.
            </div>
          )}
          {zonesUniq.map((z) => (
            <div
              key={z.id}
              className={clsx(
                'flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs transition',
                selectedZoneId === z.id
                  ? 'border-slate-900 bg-slate-50 dark:border-slate-50 dark:bg-slate-950'
                  : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/40',
              )}
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => onSelect(z.id)}
              >
                <span className="font-medium">{z.name}</span>
                <span className="ml-1 text-slate-500 dark:text-slate-400">{z.type}</span>
              </button>
              <button
                type="button"
                className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-900/30 dark:hover:text-rose-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(z.id);
                }}
                title="Excluir zona"
                aria-label="Excluir zona"
              >
                <span aria-hidden>🗑</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="min-w-[260px] flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="text-sm font-semibold">Regras</div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {selected ? 'Edite regras e salve' : 'Selecione uma zona'}
        </div>

        <div className={clsx('mt-4 space-y-3', !selected && 'opacity-50')}>
          <label className="block text-xs">
            Nome
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!selected}
            />
          </label>

          <label className="block text-xs">
            Tipo
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={type}
              onChange={(e) => setType(e.target.value as ZoneType)}
              disabled={!selected}
            >
              {ZONE_TYPES.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs">
              Max editores (opcional)
              <input
                type="number"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                value={maxEditors}
                onChange={(e) => setMaxEditors(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={!selected}
                min={1}
              />
            </label>
            <label className="block text-xs">
              Max tempo (s) (opcional)
              <input
                type="number"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                value={maxEditSeconds}
                onChange={(e) => setMaxEditSeconds(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={!selected}
                min={10}
              />
            </label>
          </div>

          <div className="text-xs">
            <div className="font-medium">Roles permitidas</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {ROLES.map((r) => {
                const on = allowedRoles.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    className={clsx(
                      'rounded-xl px-3 py-1.5 text-xs font-medium transition',
                      on
                        ? 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-950'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900/40',
                    )}
                    onClick={() =>
                      setAllowedRoles((prev) =>
                        prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
                      )
                    }
                    disabled={!selected}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm text-white shadow-sm transition hover:opacity-90 disabled:opacity-50 dark:bg-slate-50 dark:text-slate-950"
            onClick={save}
            disabled={!selected || saving || allowedRoles.length === 0}
            type="button"
          >
            {saving ? 'Salvando...' : 'Salvar regras'}
          </button>
        </div>
      </div>
    </div>
  );
}
