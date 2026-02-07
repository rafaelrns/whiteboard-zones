import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TEMPLATES } from './templates';
export function TemplatesPanel({ canvas, onApplied, }) {
    function applyTemplate(id) {
        if (!canvas)
            return;
        const t = TEMPLATES.find((x) => x.id === id);
        if (!t)
            return;
        // Limpa o canvas atual
        canvas.getObjects().forEach((o) => canvas.remove(o));
        // Cria e adiciona os objetos do template
        const objects = t.build();
        objects.forEach((o) => {
            o.__suggestion = false;
            canvas.add(o);
        });
        canvas.requestRenderAll();
        onApplied();
    }
    return (_jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900", children: [_jsx("div", { className: "text-sm font-semibold", children: "Templates" }), _jsx("div", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: "Comece r\u00E1pido com estruturas prontas." }), _jsx("div", { className: "mt-3 grid grid-cols-1 gap-2", children: TEMPLATES.map((t) => (_jsxs("button", { type: "button", className: "rounded-xl border border-slate-200 bg-white p-3 text-left text-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800/40", onClick: () => applyTemplate(t.id), disabled: !canvas, children: [_jsx("div", { className: "font-medium", children: t.name }), _jsx("div", { className: "mt-1 text-slate-500 dark:text-slate-400", children: t.description })] }, t.id))) })] }));
}
