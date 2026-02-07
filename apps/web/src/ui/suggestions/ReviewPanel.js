import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import * as fabric from 'fabric';
import { api } from '../../lib/api';
import { useAppStore } from '../store';
export function ReviewPanel({ boardId, canvas, onApplied, }) {
    const token = useAppStore((s) => s.token);
    const user = useAppStore((s) => s.user);
    const [items, setItems] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(false);
    const [comment, setComment] = useState('');
    const canReview = user?.role === 'owner' || user?.role === 'reviewer';
    async function refresh() {
        if (!token || !boardId)
            return;
        const list = await api(`/boards/${boardId}/suggestions`, { method: 'GET' }, token);
        setItems(list);
        if (selected && !list.find((x) => x.id === selected.id))
            setSelected(null);
    }
    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, boardId]);
    const pending = useMemo(() => items.filter((i) => i.status === 'PENDING'), [items]);
    async function decide(decision) {
        if (!token || !boardId || !selected)
            return;
        setLoading(true);
        try {
            await api(`/boards/${boardId}/suggestions/${selected.id}/decision`, { method: 'POST', body: JSON.stringify({ decision, comment: comment || null }) }, token);
            if (decision === 'APPROVE' && canvas) {
                // merge aditivo: adiciona objetos sugeridos ao canvas
                const objs = selected.objectsJson;
                const enlivened = await fabric.util.enlivenObjects(objs);
                enlivened.forEach((o) => {
                    o.__suggestion = false;
                    canvas.add(o);
                });
                canvas.requestRenderAll();
                onApplied();
            }
            setSelected(null);
            setComment('');
            await refresh();
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-semibold", children: "Revis\u00E3o" }), _jsxs("div", { className: "text-xs text-slate-500 dark:text-slate-400", children: ["Pendentes: ", pending.length] })] }), _jsx("button", { type: "button", className: "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800/50", onClick: refresh, children: "Atualizar" })] }), !canReview && (_jsx("div", { className: "mt-3 text-xs text-amber-700 dark:text-amber-200", children: "Seu role n\u00E3o possui permiss\u00E3o de revis\u00E3o neste MVP." })), _jsxs("div", { className: "mt-3 space-y-2", children: [pending.length === 0 && _jsx("div", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Nada pendente." }), pending.map((s) => (_jsxs("button", { type: "button", className: `w-full rounded-xl border p-3 text-left text-xs transition ${selected?.id === s.id
                            ? 'border-slate-900 bg-slate-50 dark:border-slate-50 dark:bg-slate-950'
                            : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/40'}`, onClick: () => setSelected(s), disabled: !canReview, children: [_jsx("div", { className: "font-medium", children: s.title }), _jsxs("div", { className: "mt-1 text-slate-500 dark:text-slate-400", children: [new Date(s.createdAt).toLocaleString(), " \u2022 ", s.objectsJson?.length ?? 0, " objs"] })] }, s.id)))] }), selected && (_jsxs("div", { className: "mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800", children: [_jsx("div", { className: "text-xs text-slate-600 dark:text-slate-300", children: selected.message ? selected.message : 'Sem mensagem.' }), _jsxs("label", { className: "block text-xs", children: ["Coment\u00E1rio (opcional)", _jsx("textarea", { className: "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950", value: comment, onChange: (e) => setComment(e.target.value), rows: 2, disabled: !canReview })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "button", className: "flex-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50 dark:bg-slate-50 dark:text-slate-950", onClick: () => decide('APPROVE'), disabled: !canReview || loading, children: "Aprovar" }), _jsx("button", { type: "button", className: "flex-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800 hover:opacity-90 disabled:opacity-50 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200", onClick: () => decide('REJECT'), disabled: !canReview || loading, children: "Rejeitar" })] })] }))] }));
}
