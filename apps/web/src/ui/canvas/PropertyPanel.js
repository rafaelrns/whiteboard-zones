import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import clsx from 'clsx';
/** Usa a mesma lógica do Fabric: checa _renderText (FabricText/IText/Textbox) */
function isTextObject(obj) {
    if (!obj)
        return false;
    if (typeof obj._renderText === 'function')
        return true;
    if (obj instanceof fabric.Textbox || obj instanceof fabric.IText || obj instanceof fabric.FabricText)
        return true;
    const t = String(obj.type ?? '').toLowerCase();
    if (['i-text', 'textbox', 'text', 'itext', 'fabrictext'].includes(t))
        return true;
    return 'fontSize' in obj && ('fontFamily' in obj || 'text' in obj);
}
function getTextFromActive(obj) {
    if (!obj)
        return null;
    if (isTextObject(obj))
        return obj;
    const type = obj.type;
    const hasGetObjects = 'getObjects' in obj && typeof obj.getObjects === 'function';
    if (type === 'group' || type === 'activeSelection' || type === 'ActiveSelection' || hasGetObjects) {
        const objs = ('getObjects' in obj ? obj.getObjects() : obj._objects) ?? [];
        for (const o of objs) {
            const t = getTextFromActive(o);
            if (t)
                return t;
        }
    }
    return null;
}
export function PropertyPanel({ canvas }) {
    const [active, setActive] = useState(null);
    const [fill, setFill] = useState('#111827');
    const [stroke, setStroke] = useState('#111827');
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [fontSize, setFontSize] = useState(18);
    const [fontWeight, setFontWeight] = useState('normal');
    const [fontStyle, setFontStyle] = useState('normal');
    useEffect(() => {
        if (!canvas)
            return;
        const update = () => {
            const obj = canvas.getActiveObject() ?? null;
            setActive(obj);
            if (obj) {
                const target = getTextFromActive(obj) ?? obj;
                // @ts-ignore
                setFill(String(target.fill ?? '#111827'));
                // @ts-ignore
                setStroke(String(target.stroke ?? '#111827'));
                // @ts-ignore
                setStrokeWidth(Number(target.strokeWidth ?? 2));
                const textObj = getTextFromActive(obj);
                if (textObj) {
                    setFontSize(Number(textObj.fontSize ?? 18));
                    setFontWeight(String(textObj.fontWeight ?? 'normal'));
                    setFontStyle(String(textObj.fontStyle ?? 'normal'));
                }
            }
        };
        update();
        canvas.on('selection:created', update);
        canvas.on('selection:updated', update);
        canvas.on('selection:cleared', update);
        canvas.on('text:editing:entered', update);
        canvas.on('text:editing:exited', update);
        canvas.on('text:selection:changed', update);
        return () => {
            canvas.off('selection:created', update);
            canvas.off('selection:updated', update);
            canvas.off('selection:cleared', update);
            canvas.off('text:editing:entered', update);
            canvas.off('text:editing:exited', update);
            canvas.off('text:selection:changed', update);
        };
    }, [canvas]);
    function apply(opts) {
        if (!canvas || !active)
            return;
        const fs = opts?.fontSize ?? fontSize;
        const fw = opts?.fontWeight ?? fontWeight;
        const fi = opts?.fontStyle ?? fontStyle;
        const f = opts?.fill ?? fill;
        const s = opts?.stroke ?? stroke;
        const target = getTextFromActive(active) ?? active;
        // @ts-ignore
        if ('fill' in target)
            target.set('fill', f);
        // @ts-ignore
        if ('stroke' in target)
            target.set('stroke', s);
        // @ts-ignore
        if ('strokeWidth' in target)
            target.set('strokeWidth', strokeWidth);
        const textObj = getTextFromActive(active);
        if (textObj) {
            textObj.set('fontSize', fs);
            textObj.set('fontWeight', fw);
            textObj.set('fontStyle', fi);
            textObj.initDimensions();
            setFontSize(fs);
            setFontWeight(fw);
            setFontStyle(fi);
        }
        if (opts?.fill !== undefined)
            setFill(f);
        if (opts?.stroke !== undefined)
            setStroke(s);
        canvas.requestRenderAll();
    }
    const isText = !!getTextFromActive(active);
    const panelRef = useRef(null);
    const prevIsTextRef = useRef(false);
    useEffect(() => {
        if (isText && !prevIsTextRef.current) {
            panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        }
        prevIsTextRef.current = isText;
    }, [isText]);
    return (_jsxs("div", { ref: panelRef, className: "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900", children: [_jsx("div", { className: "text-sm font-semibold", children: "Propriedades" }), _jsx("div", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: active ? (isText ? 'Texto selecionado' : 'Objeto selecionado') : 'Selecione um objeto' }), isText && (_jsxs("div", { className: "mt-4 space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 dark:border-indigo-800 dark:bg-indigo-950/30", children: [_jsx("div", { className: "text-xs font-semibold text-indigo-800 dark:text-indigo-200", children: "Formata\u00E7\u00E3o de texto" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "button", className: clsx('flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition', fontWeight === 'bold'
                                    ? 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-950'
                                    : 'border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800'), onClick: () => apply({ fontWeight: fontWeight === 'bold' ? 'normal' : 'bold' }), children: "Negrito" }), _jsx("button", { type: "button", className: clsx('flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition italic', fontStyle === 'italic'
                                    ? 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-950'
                                    : 'border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800'), onClick: () => apply({ fontStyle: fontStyle === 'italic' ? 'normal' : 'italic' }), children: "It\u00E1lico" })] }), _jsxs("label", { className: "block text-xs", children: ["Tamanho da fonte", _jsx("input", { type: "number", className: "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950", value: fontSize, onChange: (e) => {
                                    const v = Number(e.target.value);
                                    setFontSize(v);
                                    apply({ fontSize: v });
                                }, min: 8, max: 120 })] })] })), _jsxs("div", { className: clsx('mt-4 space-y-3', !active && 'opacity-50'), children: [_jsxs("label", { className: "block text-xs", children: ["Cor da forma (Fill)", _jsxs("div", { className: "mt-1 flex gap-2", children: [_jsx("input", { type: "color", className: "h-9 w-12 cursor-pointer rounded-lg border border-slate-200 p-0.5 dark:border-slate-700", value: fill.startsWith('#') ? fill : '#111827', onChange: (e) => {
                                            const v = e.target.value;
                                            setFill(v);
                                            apply({ fill: v });
                                        }, disabled: !active, title: "Cor do preenchimento" }), _jsx("input", { className: "flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950", value: fill, onChange: (e) => setFill(e.target.value), disabled: !active, placeholder: "#111827" })] })] }), _jsxs("label", { className: "block text-xs", children: ["Cor da borda (Stroke)", _jsxs("div", { className: "mt-1 flex gap-2", children: [_jsx("input", { type: "color", className: "h-9 w-12 cursor-pointer rounded-lg border border-slate-200 p-0.5 dark:border-slate-700", value: stroke.startsWith('#') ? stroke : '#111827', onChange: (e) => {
                                            const v = e.target.value;
                                            setStroke(v);
                                            apply({ stroke: v });
                                        }, disabled: !active, title: "Cor da borda" }), _jsx("input", { className: "flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950", value: stroke, onChange: (e) => setStroke(e.target.value), disabled: !active, placeholder: "#111827" })] })] }), _jsxs("label", { className: "block text-xs", children: ["Stroke width", _jsx("input", { type: "number", className: "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950", value: strokeWidth, onChange: (e) => setStrokeWidth(Number(e.target.value)), disabled: !active, min: 0, max: 20 })] }), _jsx("button", { className: "w-full rounded-xl bg-slate-900 px-3 py-2 text-sm text-white shadow-sm transition hover:opacity-90 disabled:opacity-50 dark:bg-slate-50 dark:text-slate-950", onClick: () => apply(), disabled: !active, children: "Aplicar" })] })] }));
}
