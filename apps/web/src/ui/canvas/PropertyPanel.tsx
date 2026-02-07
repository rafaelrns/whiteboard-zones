import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import clsx from 'clsx';

/** Usa a mesma lógica do Fabric: checa _renderText (FabricText/IText/Textbox) */
function isTextObject(obj: fabric.Object | null): obj is fabric.IText | fabric.Textbox | fabric.FabricText {
  if (!obj) return false;
  if (typeof (obj as any)._renderText === 'function') return true;
  if (obj instanceof fabric.Textbox || obj instanceof fabric.IText || obj instanceof fabric.FabricText) return true;
  const t = String((obj as any).type ?? '').toLowerCase();
  if (['i-text', 'textbox', 'text', 'itext', 'fabrictext'].includes(t)) return true;
  return 'fontSize' in obj && ('fontFamily' in obj || 'text' in obj);
}

function getTextFromActive(obj: fabric.Object | null): fabric.IText | fabric.Textbox | fabric.FabricText | null {
  if (!obj) return null;
  if (isTextObject(obj)) return obj;
  const type = (obj as any).type;
  const hasGetObjects = 'getObjects' in obj && typeof (obj as any).getObjects === 'function';
  if (type === 'group' || type === 'activeSelection' || type === 'ActiveSelection' || hasGetObjects) {
    const objs = ('getObjects' in obj ? (obj as fabric.Group).getObjects() : (obj as any)._objects) ?? [];
    for (const o of objs) {
      const t = getTextFromActive(o);
      if (t) return t;
    }
  }
  return null;
}

export function PropertyPanel({ canvas }: { canvas: fabric.Canvas | null }) {
  const [active, setActive] = useState<fabric.Object | null>(null);
  const [fill, setFill] = useState<string>('#111827');
  const [stroke, setStroke] = useState<string>('#111827');
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [fontSize, setFontSize] = useState<number>(18);
  const [fontWeight, setFontWeight] = useState<string>('normal');
  const [fontStyle, setFontStyle] = useState<string>('normal');

  useEffect(() => {
    if (!canvas) return;
    const update = () => {
      const obj = canvas.getActiveObject() ?? null;
      setActive(obj);
      if (obj) {
        const target = getTextFromActive(obj) ?? obj;
        // @ts-ignore
        setFill(String((target as any).fill ?? '#111827'));
        // @ts-ignore
        setStroke(String((target as any).stroke ?? '#111827'));
        // @ts-ignore
        setStrokeWidth(Number((target as any).strokeWidth ?? 2));
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
    canvas.on('text:editing:entered' as any, update);
    canvas.on('text:editing:exited' as any, update);
    canvas.on('text:selection:changed' as any, update);
    return () => {
      canvas.off('selection:created', update);
      canvas.off('selection:updated', update);
      canvas.off('selection:cleared', update);
      canvas.off('text:editing:entered' as any, update);
      canvas.off('text:editing:exited' as any, update);
      canvas.off('text:selection:changed' as any, update);
    };
  }, [canvas]);

  function apply(opts?: { fontSize?: number; fontWeight?: string; fontStyle?: string; fill?: string; stroke?: string }) {
    if (!canvas || !active) return;
    const fs = opts?.fontSize ?? fontSize;
    const fw = opts?.fontWeight ?? fontWeight;
    const fi = opts?.fontStyle ?? fontStyle;
    const f = opts?.fill ?? fill;
    const s = opts?.stroke ?? stroke;
    const target = getTextFromActive(active) ?? active;
    // @ts-ignore
    if ('fill' in target) (target as any).set('fill', f);
    // @ts-ignore
    if ('stroke' in target) (target as any).set('stroke', s);
    // @ts-ignore
    if ('strokeWidth' in target) (target as any).set('strokeWidth', strokeWidth);
    const textObj = getTextFromActive(active);
    if (textObj) {
      textObj.set('fontSize', fs);
      textObj.set('fontWeight', fw as 'normal' | 'bold');
      textObj.set('fontStyle', fi as 'normal' | 'italic');
      textObj.initDimensions();
      setFontSize(fs);
      setFontWeight(fw);
      setFontStyle(fi);
    }
    if (opts?.fill !== undefined) setFill(f);
    if (opts?.stroke !== undefined) setStroke(s);
    canvas.requestRenderAll();
  }

  const isText = !!getTextFromActive(active);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevIsTextRef = useRef(false);
  useEffect(() => {
    if (isText && !prevIsTextRef.current) {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }
    prevIsTextRef.current = isText;
  }, [isText]);

  return (
    <div ref={panelRef} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="text-sm font-semibold">Propriedades</div>
      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {active ? (isText ? 'Texto selecionado' : 'Objeto selecionado') : 'Selecione um objeto'}
      </div>

      {isText && (
        <div className="mt-4 space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 dark:border-indigo-800 dark:bg-indigo-950/30">
          <div className="text-xs font-semibold text-indigo-800 dark:text-indigo-200">Formatação de texto</div>
          <div className="flex gap-2">
            <button
              type="button"
              className={clsx(
                'flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition',
                fontWeight === 'bold'
                  ? 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-950'
                  : 'border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800',
              )}
              onClick={() => apply({ fontWeight: fontWeight === 'bold' ? 'normal' : 'bold' })}
            >
              Negrito
            </button>
            <button
              type="button"
              className={clsx(
                'flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition italic',
                fontStyle === 'italic'
                  ? 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-950'
                  : 'border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800',
              )}
              onClick={() => apply({ fontStyle: fontStyle === 'italic' ? 'normal' : 'italic' })}
            >
              Itálico
            </button>
          </div>
          <label className="block text-xs">
            Tamanho da fonte
            <input
              type="number"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={fontSize}
              onChange={(e) => {
                const v = Number(e.target.value);
                setFontSize(v);
                apply({ fontSize: v });
              }}
              min={8}
              max={120}
            />
          </label>
        </div>
      )}

      <div className={clsx('mt-4 space-y-3', !active && 'opacity-50')}>
        <label className="block text-xs">
          Cor da forma (Fill)
          <div className="mt-1 flex gap-2">
            <input
              type="color"
              className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 p-0.5 dark:border-slate-700"
              value={fill.startsWith('#') ? fill : '#111827'}
              onChange={(e) => {
                const v = e.target.value;
                setFill(v);
                apply({ fill: v });
              }}
              disabled={!active}
              title="Cor do preenchimento"
            />
            <input
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={fill}
              onChange={(e) => setFill(e.target.value)}
              disabled={!active}
              placeholder="#111827"
            />
          </div>
        </label>
        <label className="block text-xs">
          Cor da borda (Stroke)
          <div className="mt-1 flex gap-2">
            <input
              type="color"
              className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 p-0.5 dark:border-slate-700"
              value={stroke.startsWith('#') ? stroke : '#111827'}
              onChange={(e) => {
                const v = e.target.value;
                setStroke(v);
                apply({ stroke: v });
              }}
              disabled={!active}
              title="Cor da borda"
            />
            <input
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={stroke}
              onChange={(e) => setStroke(e.target.value)}
              disabled={!active}
              placeholder="#111827"
            />
          </div>
        </label>
        <label className="block text-xs">
          Stroke width
          <input
            type="number"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            disabled={!active}
            min={0}
            max={20}
          />
        </label>
        <button
          className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm text-white shadow-sm transition hover:opacity-90 disabled:opacity-50 dark:bg-slate-50 dark:text-slate-950"
          onClick={() => apply()}
          disabled={!active}
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}
