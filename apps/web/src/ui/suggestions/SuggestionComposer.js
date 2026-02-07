import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { useAppStore } from '../store';
export function SuggestionComposer({ boardId, zoneId, canvas, enabled, onSubmitted, }) {
    const token = useAppStore((s) => s.token);
    const [title, setTitle] = useState('Sugestão');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const objects = useMemo(() => {
        if (!canvas)
            return [];
        return canvas.getObjects().filter((o) => o.__suggestion === true);
    }, [canvas]);
    async function submit() {
        if (!token || !boardId || !canvas)
            return;
        const objs = canvas.getObjects().filter((o) => o.__suggestion === true);
        if (!objs.length)
            return;
        setSending(true);
        try {
            const objectsJson = objs.map((o) => o.toObject(['__oid', '__suggestion']));
            await api(`/boards/${boardId}/suggestions`, {
                method: 'POST',
                body: JSON.stringify({
                    zoneId: zoneId ?? null,
                    title,
                    message: message || null,
                    objectsJson,
                }),
            }, token);
            objs.forEach((o) => canvas.remove(o));
            canvas.requestRenderAll();
            onSubmitted();
        }
        finally {
            setSending(false);
        }
    }
    return (_jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900", children: [_jsx("div", { className: "text-sm font-semibold", children: "Modo sugest\u00E3o" }), _jsx("div", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: "No canvas, ative \u201CSugest\u00E3o: ON\u201D. Objetos tracejados s\u00E3o enviados para revis\u00E3o." }), _jsxs("div", { className: "mt-3 space-y-3", children: [_jsxs("label", { className: "block text-xs", children: ["T\u00EDtulo", _jsx("input", { className: "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950", value: title, onChange: (e) => setTitle(e.target.value), disabled: !enabled })] }), _jsxs("label", { className: "block text-xs", children: ["Mensagem (opcional)", _jsx("textarea", { className: "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950", value: message, onChange: (e) => setMessage(e.target.value), disabled: !enabled, rows: 3 })] }), _jsx("button", { type: "button", className: "w-full rounded-xl bg-slate-900 px-3 py-2 text-sm text-white shadow-sm transition hover:opacity-90 disabled:opacity-50 dark:bg-slate-50 dark:text-slate-950", disabled: !enabled || sending || objects.length === 0, onClick: submit, children: sending ? 'Enviando...' : `Enviar (${objects.length})` }), objects.length === 0 && (_jsx("div", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Nenhuma anota\u00E7\u00E3o para enviar." }))] })] }));
}
