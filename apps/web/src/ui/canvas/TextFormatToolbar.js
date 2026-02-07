import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
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
export function TextFormatToolbar({ canvas }) {
    const [active, setActive] = useState(null);
    const [fontSize, setFontSize] = useState(18);
    const [fontWeight, setFontWeight] = useState('normal');
    const [fontStyle, setFontStyle] = useState('normal');
    const [fontFamily, setFontFamily] = useState('Arial');
    const [fillColor, setFillColor] = useState('#111827');
    const FONTS = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New', 'Trebuchet MS', 'Comic Sans MS', 'Impact'];
    useEffect(() => {
        if (!canvas)
            return;
        const update = () => {
            const obj = canvas.getActiveObject() ?? null;
            setActive(obj);
            const textObj = getTextFromActive(obj);
            if (textObj) {
                setFontSize(Number(textObj.fontSize ?? 18));
                setFontWeight(String(textObj.fontWeight ?? 'normal'));
                setFontStyle(String(textObj.fontStyle ?? 'normal'));
                setFontFamily(String(textObj.fontFamily ?? 'Arial'));
                const f = textObj.fill;
                setFillColor(typeof f === 'string' ? f : '#111827');
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
        const ff = opts?.fontFamily ?? fontFamily;
        const fc = opts?.fill ?? fillColor;
        const textObj = getTextFromActive(active);
        if (textObj) {
            textObj.set('fontSize', fs);
            textObj.set('fontWeight', fw);
            textObj.set('fontStyle', fi);
            textObj.set('fontFamily', ff);
            textObj.set('fill', fc);
            textObj.initDimensions();
            setFontSize(fs);
            setFontWeight(fw);
            setFontStyle(fi);
            setFontFamily(ff);
            setFillColor(fc);
            canvas.fire('object:modified', { target: active });
        }
        canvas.requestRenderAll();
    }
    const isText = !!getTextFromActive(active);
    if (!isText)
        return null;
    return (_jsx("div", { className: "absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-xl border border-indigo-200 bg-white px-4 py-2 shadow-lg dark:border-indigo-800 dark:bg-slate-900", onClick: (e) => e.stopPropagation(), role: "toolbar", "aria-label": "Formata\u00E7\u00E3o de texto", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-xs font-medium text-slate-600 dark:text-slate-300", children: "Texto" }), _jsx("button", { type: "button", className: clsx('rounded-lg px-3 py-1.5 text-xs font-medium transition', fontWeight === 'bold'
                        ? 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-950'
                        : 'border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800'), onClick: () => apply({ fontWeight: fontWeight === 'bold' ? 'normal' : 'bold' }), children: "Negrito" }), _jsx("button", { type: "button", className: clsx('rounded-lg px-3 py-1.5 text-xs font-medium italic transition', fontStyle === 'italic'
                        ? 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-950'
                        : 'border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800'), onClick: () => apply({ fontStyle: fontStyle === 'italic' ? 'normal' : 'italic' }), children: "It\u00E1lico" }), _jsxs("label", { className: "flex items-center gap-2 text-xs", children: [_jsx("span", { children: "Fonte" }), _jsx("select", { className: "rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950", value: fontFamily, onChange: (e) => {
                                const v = e.target.value;
                                setFontFamily(v);
                                apply({ fontFamily: v });
                            }, children: FONTS.map((f) => (_jsx("option", { value: f, children: f }, f))) })] }), _jsxs("label", { className: "flex items-center gap-2 text-xs", children: [_jsx("span", { children: "Tamanho" }), _jsx("input", { type: "number", className: "w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950", value: fontSize, onChange: (e) => {
                                const v = Number(e.target.value);
                                setFontSize(v);
                                apply({ fontSize: v });
                            }, min: 8, max: 120 })] }), _jsxs("label", { className: "flex items-center gap-2 text-xs", children: [_jsx("span", { children: "Cor" }), _jsx("input", { type: "color", className: "h-8 w-10 cursor-pointer rounded-lg border border-slate-200 p-0.5 dark:border-slate-700", value: fillColor, onChange: (e) => {
                                const v = e.target.value;
                                setFillColor(v);
                                apply({ fill: v });
                            }, title: "Cor do texto" })] })] }) }));
}
