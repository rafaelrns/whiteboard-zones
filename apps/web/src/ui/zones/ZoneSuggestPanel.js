import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { suggestZones } from '@zones/collaboration-core';
export function ZoneSuggestPanel({ objects, onApply, }) {
    const [zones, setZones] = useState(null);
    const ctx = useMemo(() => {
        if (!objects.length)
            return null;
        return zones ? null : null;
    }, [objects.length, zones]);
    function run() {
        const zs = suggestZones(objects);
        setZones(zs);
    }
    return (_jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900", children: [_jsx("div", { className: "text-sm font-semibold", children: "Detec\u00E7\u00E3o autom\u00E1tica" }), _jsx("div", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: "Agrupa objetos por proximidade e sugere zonas e tipos." }), _jsx("button", { className: "mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800/50", onClick: run, type: "button", disabled: objects.length < 3, children: "Gerar sugest\u00F5es" }), zones && (_jsxs("div", { className: "mt-3 space-y-2 text-xs", children: [zones.length === 0 && (_jsx("div", { className: "text-slate-500 dark:text-slate-400", children: "Sem clusters suficientes." })), zones.map((z, i) => (_jsxs("div", { className: "rounded-xl border border-slate-200 p-2 dark:border-slate-800", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "font-medium", children: z.name }), _jsxs("div", { className: "text-slate-500 dark:text-slate-400", children: [z.type, " \u2022 ", Math.round(z.confidence * 100), "%"] })] }), _jsxs("div", { className: "mt-1 text-slate-500 dark:text-slate-400", children: [z.objectIds.length, " objs \u2022 rect (", Math.round(z.rect.w), "\u00D7", Math.round(z.rect.h), ")"] })] }, i))), _jsx("button", { className: "mt-2 w-full rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:opacity-90 dark:bg-slate-50 dark:text-slate-950", onClick: () => onApply(zones), type: "button", disabled: zones.length === 0, children: "Aplicar sugest\u00F5es (criar zonas)" })] }))] }));
}
