import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { useAppStore } from '../store';
import clsx from 'clsx';
const ZONE_TYPES = [
    { type: 'FREE_EDIT', label: 'Livre' },
    { type: 'LOCKED_ZONE', label: 'Bloqueada (Fila)' },
    { type: 'REVIEW_REQUIRED', label: 'Revisão obrigatória' },
    { type: 'READ_ONLY', label: 'Somente leitura' },
];
const ROLES = ['owner', 'editor', 'reviewer', 'viewer'];
export function ZoneManager({ boardId, zones, selectedZoneId, onSelect, onRefresh, onDelete, }) {
    const token = useAppStore((s) => s.token);
    const selected = zones.find((z) => z.id === selectedZoneId) ?? null;
    const zonesUniq = useMemo(() => zones.filter((z, i, a) => a.findIndex((x) => x.id === z.id) === i), [zones]);
    const [name, setName] = useState('');
    const [type, setType] = useState('FREE_EDIT');
    const [maxEditors, setMaxEditors] = useState('');
    const [maxEditSeconds, setMaxEditSeconds] = useState('');
    const [allowedRoles, setAllowedRoles] = useState(['owner', 'editor', 'reviewer', 'viewer']);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        if (!selected)
            return;
        setName(selected.name);
        setType(selected.type);
        setMaxEditors(selected.rules?.maxEditors ?? '');
        setMaxEditSeconds(selected.rules?.maxEditSeconds ?? '');
        setAllowedRoles(selected.rules?.allowedRoles ?? ['owner', 'editor', 'reviewer', 'viewer']);
    }, [selected?.id]);
    async function save() {
        if (!token || !selected)
            return;
        setSaving(true);
        try {
            await api(`/boards/${boardId}/zones/${selected.id}`, {
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
            }, token);
            onRefresh();
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsxs("div", { className: "flex flex-nowrap gap-4", children: [_jsxs("div", { className: "min-w-[220px] w-[220px] flex-shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900", children: [_jsx("div", { className: "text-sm font-semibold", children: "Zonas" }), _jsxs("div", { className: "mt-2 space-y-2", children: [zonesUniq.length === 0 && (_jsx("div", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Nenhuma zona criada. Use \u201CCriar zona\u201D no canvas." })), zonesUniq.map((z) => (_jsxs("div", { className: clsx('flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs transition', selectedZoneId === z.id
                                    ? 'border-slate-900 bg-slate-50 dark:border-slate-50 dark:bg-slate-950'
                                    : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/40'), children: [_jsxs("button", { type: "button", className: "min-w-0 flex-1 text-left", onClick: () => onSelect(z.id), children: [_jsx("span", { className: "font-medium", children: z.name }), _jsx("span", { className: "ml-1 text-slate-500 dark:text-slate-400", children: z.type })] }), _jsx("button", { type: "button", className: "flex-shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-900/30 dark:hover:text-rose-300", onClick: (e) => {
                                            e.stopPropagation();
                                            onDelete(z.id);
                                        }, title: "Excluir zona", "aria-label": "Excluir zona", children: _jsx("span", { "aria-hidden": true, children: "\uD83D\uDDD1" }) })] }, z.id)))] })] }), _jsxs("div", { className: "min-w-[260px] flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900", children: [_jsx("div", { className: "text-sm font-semibold", children: "Regras" }), _jsx("div", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: selected ? 'Edite regras e salve' : 'Selecione uma zona' }), _jsxs("div", { className: clsx('mt-4 space-y-3', !selected && 'opacity-50'), children: [_jsxs("label", { className: "block text-xs", children: ["Nome", _jsx("input", { className: "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950", value: name, onChange: (e) => setName(e.target.value), disabled: !selected })] }), _jsxs("label", { className: "block text-xs", children: ["Tipo", _jsx("select", { className: "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950", value: type, onChange: (e) => setType(e.target.value), disabled: !selected, children: ZONE_TYPES.map((t) => (_jsx("option", { value: t.type, children: t.label }, t.type))) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("label", { className: "block text-xs", children: ["Max editores (opcional)", _jsx("input", { type: "number", className: "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950", value: maxEditors, onChange: (e) => setMaxEditors(e.target.value === '' ? '' : Number(e.target.value)), disabled: !selected, min: 1 })] }), _jsxs("label", { className: "block text-xs", children: ["Max tempo (s) (opcional)", _jsx("input", { type: "number", className: "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950", value: maxEditSeconds, onChange: (e) => setMaxEditSeconds(e.target.value === '' ? '' : Number(e.target.value)), disabled: !selected, min: 10 })] })] }), _jsxs("div", { className: "text-xs", children: [_jsx("div", { className: "font-medium", children: "Roles permitidas" }), _jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: ROLES.map((r) => {
                                            const on = allowedRoles.includes(r);
                                            return (_jsx("button", { type: "button", className: clsx('rounded-xl px-3 py-1.5 text-xs font-medium transition', on
                                                    ? 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-950'
                                                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900/40'), onClick: () => setAllowedRoles((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]), disabled: !selected, children: r }, r));
                                        }) })] }), _jsx("button", { className: "w-full rounded-xl bg-slate-900 px-3 py-2 text-sm text-white shadow-sm transition hover:opacity-90 disabled:opacity-50 dark:bg-slate-50 dark:text-slate-950", onClick: save, disabled: !selected || saving || allowedRoles.length === 0, type: "button", children: saving ? 'Salvando...' : 'Salvar regras' })] })] })] }));
}
