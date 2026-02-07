import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
function isTextObject(obj) {
    if (!obj)
        return false;
    if (typeof obj._renderText === 'function')
        return true;
    const t = String(obj.type ?? '').toLowerCase();
    if (['i-text', 'textbox', 'text', 'itext', 'fabrictext'].includes(t))
        return true;
    return 'fontSize' in obj && ('fontFamily' in obj || 'text' in obj);
}
/** Retorna o primeiro objeto "forma" (não texto) de um Group/ActiveSelection */
function getShapeFromActive(obj) {
    if (!obj)
        return null;
    if (obj.__zone)
        return null; // overlay de zona
    if (isTextObject(obj))
        return null;
    const type = obj.type;
    const hasGetObjects = 'getObjects' in obj && typeof obj.getObjects === 'function';
    if (type === 'group' || type === 'activeSelection' || type === 'ActiveSelection' || hasGetObjects) {
        const objs = ('getObjects' in obj ? obj.getObjects() : obj._objects) ?? [];
        for (const o of objs) {
            const s = getShapeFromActive(o);
            if (s)
                return s;
        }
        return null;
    }
    return obj;
}
function toHexColor(val) {
    if (typeof val === 'string' && val.startsWith('#'))
        return val;
    if (typeof val === 'string' && val.startsWith('rgb')) {
        const m = val.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (m && m[1] && m[2] && m[3]) {
            return '#' + [m[1], m[2], m[3]].map((n) => parseInt(n, 10).toString(16).padStart(2, '0')).join('');
        }
    }
    return '#111827';
}
export function ShapeFormatToolbar({ canvas }) {
    const [active, setActive] = useState(null);
    const [fill, setFill] = useState('#111827');
    const [stroke, setStroke] = useState('#111827');
    const [strokeWidth, setStrokeWidth] = useState(2);
    useEffect(() => {
        if (!canvas)
            return;
        const update = () => {
            const obj = canvas.getActiveObject() ?? null;
            setActive(obj);
            const shape = getShapeFromActive(obj);
            if (shape) {
                const f = shape.fill;
                const s = shape.stroke;
                setFill(toHexColor(f ?? '#111827'));
                setStroke(toHexColor(s ?? '#111827'));
                setStrokeWidth(Number(shape.strokeWidth ?? 2));
            }
        };
        update();
        canvas.on('selection:created', update);
        canvas.on('selection:updated', update);
        canvas.on('selection:cleared', update);
        return () => {
            canvas.off('selection:created', update);
            canvas.off('selection:updated', update);
            canvas.off('selection:cleared', update);
        };
    }, [canvas]);
    function handleDelete() {
        if (!canvas || !active)
            return;
        canvas.remove(active);
        canvas.discardActiveObject();
        canvas.requestRenderAll();
    }
    function apply(opts) {
        if (!canvas || !active)
            return;
        const obj = getShapeFromActive(active) ?? active;
        const f = opts?.fill ?? fill;
        const s = opts?.stroke ?? stroke;
        const sw = opts?.strokeWidth ?? strokeWidth;
        if ('fill' in obj)
            obj.set('fill', f);
        if ('stroke' in obj)
            obj.set('stroke', s);
        if ('strokeWidth' in obj)
            obj.set('strokeWidth', sw);
        setFill(f);
        setStroke(s);
        setStrokeWidth(sw);
        canvas.fire('object:modified', { target: obj });
        canvas.requestRenderAll();
    }
    const shape = getShapeFromActive(active);
    if (!shape)
        return null;
    return (_jsx("div", { className: "absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-lg dark:border-slate-800 dark:bg-slate-900", onClick: (e) => e.stopPropagation(), role: "toolbar", "aria-label": "Formata\u00E7\u00E3o da forma", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("span", { className: "text-xs font-medium text-slate-600 dark:text-slate-300", children: "Forma" }), _jsxs("label", { className: "flex items-center gap-2 text-xs", children: [_jsx("span", { children: "Fundo" }), _jsx("input", { type: "color", className: "h-8 w-10 cursor-pointer rounded-lg border border-slate-200 p-0.5 dark:border-slate-700", value: fill, onChange: (e) => {
                                const v = e.target.value;
                                setFill(v);
                                apply({ fill: v });
                            }, title: "Cor do fundo" })] }), _jsxs("label", { className: "flex items-center gap-2 text-xs", children: [_jsx("span", { children: "Borda" }), _jsx("input", { type: "color", className: "h-8 w-10 cursor-pointer rounded-lg border border-slate-200 p-0.5 dark:border-slate-700", value: stroke, onChange: (e) => {
                                const v = e.target.value;
                                setStroke(v);
                                apply({ stroke: v });
                            }, title: "Cor da borda" })] }), _jsxs("label", { className: "flex items-center gap-2 text-xs", children: [_jsx("span", { children: "Esp. borda" }), _jsx("input", { type: "number", className: "w-14 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950", value: strokeWidth, onChange: (e) => {
                                const v = Number(e.target.value);
                                setStrokeWidth(v);
                                apply({ strokeWidth: v });
                            }, min: 0, max: 20 })] }), _jsx("button", { type: "button", onClick: handleDelete, className: "rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300 dark:hover:bg-red-900/50", title: "Excluir", children: "Excluir" })] }) }));
}
