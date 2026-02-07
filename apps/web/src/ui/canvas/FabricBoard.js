import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import * as fabric from 'fabric';
import clsx from 'clsx';
import { makeArrow } from './commands';
import { createRoundedRect, createDiamond, createParallelogram, createCylinder, createCloud } from './shapes';
import { CanvasHistory } from './history';
import { loadDoc, saveDoc, clearDoc } from './storage';
function nowISO() {
    return new Date().toISOString();
}
/** Verifica se o objeto é texto em edição — Backspace/Delete não devem remover o objeto */
function isTextEditing(obj) {
    if (!obj)
        return false;
    const t = obj;
    if (t.isEditing)
        return true;
    if (obj.type === 'group' && 'getObjects' in obj) {
        const objs = obj.getObjects();
        return objs.some((o) => isTextEditing(o));
    }
    return false;
}
export function FabricBoard({ className, __onCanvas, __onZoneRect, __zones, __onCanvasJson, __applyRemoteJson, __onPointer, __lockedObjectIds, __isNewBoard }) {
    const hostRef = useRef(null);
    const canvasElRef = useRef(null);
    const [tool, setTool] = useState('select');
    const [arrowType, setArrowType] = useState('simple');
    const [arrowMenuOpen, setArrowMenuOpen] = useState(false);
    const [grid, setGrid] = useState(true);
    const [zoom, setZoom] = useState(1);
    const [zoneMode, setZoneMode] = useState(false);
    const [suggestionMode, setSuggestionMode] = useState(false);
    const [isInsideCanvas, setIsInsideCanvas] = useState(false);
    const canvasRef = useRef(null);
    const historyRef = useRef(null);
    const zoneBadgeRefs = useRef([]);
    // drawing state
    const downRef = useRef(null);
    const tempRef = useRef(null);
    const zoneTempRef = useRef(null);
    const docRef = useRef(null);
    const syncTimerRef = useRef(null);
    const spaceKeyRef = useRef(false);
    /** Evita emitir para Yjs ao aplicar JSON remoto (evita loop) */
    const applyingRemoteRef = useRef(false);
    const lastAppliedRemoteRef = useRef('');
    /** true quando o ponteiro está sobre o quadro (barra de espaço só ativa pan nesse caso) */
    const pointerInsideCanvasRef = useRef(false);
    const toolRef = useRef(tool);
    const arrowTypeRef = useRef(arrowType);
    const gridRef = useRef(grid);
    const zoneModeRef = useRef(zoneMode);
    const suggestionModeRef = useRef(suggestionMode);
    toolRef.current = tool;
    gridRef.current = grid;
    zoneModeRef.current = zoneMode;
    suggestionModeRef.current = suggestionMode;
    function isVisibleInViewport(obj, v, pad = 200) {
        const b = obj.getBoundingRect(true, true);
        const l = v.left - pad;
        const t = v.top - pad;
        const r = v.left + v.width + pad;
        const btm = v.top + v.height + pad;
        return !(b.left > r || b.top > btm || b.left + b.width < l || b.top + b.height < t);
    }
    const cullTimerRef = useRef(null);
    function cullOffscreenObjects() {
        const c = canvasRef.current;
        if (!c)
            return;
        // viewport in canvas coords
        const vp = c.viewportTransform;
        if (!vp)
            return;
        const zoom = c.getZoom();
        const vleft = -vp[4] / zoom;
        const vtop = -vp[5] / zoom;
        const vwidth = c.getWidth() / zoom;
        const vheight = c.getHeight() / zoom;
        const view = { left: vleft, top: vtop, width: vwidth, height: vheight };
        let changed = false;
        c.getObjects().forEach((o) => {
            if (o.__zone)
                return; // never cull zone overlays
            const visible = isVisibleInViewport(o, view);
            if (o.visible !== visible) {
                o.visible = visible;
                changed = true;
            }
        });
        if (changed)
            c.requestRenderAll();
    }
    function cullDebounced() {
        if (cullTimerRef.current)
            window.clearTimeout(cullTimerRef.current);
        cullTimerRef.current = window.setTimeout(() => cullOffscreenObjects(), 120);
    }
    function emitJsonDebounced() {
        if (!__onCanvasJson || applyingRemoteRef.current)
            return;
        const c = canvasRef.current;
        if (!c)
            return;
        if (syncTimerRef.current)
            window.clearTimeout(syncTimerRef.current);
        syncTimerRef.current = window.setTimeout(() => {
            if (applyingRemoteRef.current)
                return;
            __onCanvasJson(c.toDatalessJSON());
        }, 180);
    }
    // Mantém arrowTypeRef em sync — handlers do canvas leem o ref no mouse up
    useEffect(() => {
        arrowTypeRef.current = arrowType;
    }, [arrowType]);
    // autosave every 30s
    useEffect(() => {
        const id = setInterval(() => {
            const c = canvasRef.current;
            if (!c)
                return;
            const doc = {
                version: 1,
                createdAt: docRef.current?.createdAt ?? nowISO(),
                updatedAt: nowISO(),
                canvas: c.toDatalessJSON(),
            };
            saveDoc(doc);
            docRef.current = doc;
        }, 30000);
        return () => clearInterval(id);
    }, []);
    useEffect(() => {
        if (!canvasElRef.current)
            return;
        const c = new fabric.Canvas(canvasElRef.current, {
            backgroundColor: '#ffffff',
            selection: true,
            preserveObjectStacking: true,
        });
        canvasRef.current = c;
        historyRef.current = new CanvasHistory(c);
        __onCanvas?.(c);
        // initial size
        const resize = () => {
            const host = hostRef.current;
            if (!host)
                return;
            c.setWidth(host.clientWidth);
            c.setHeight(host.clientHeight);
            c.requestRenderAll();
        };
        resize();
        window.addEventListener('resize', resize);
        // Quadro novo: canvas em branco. Quadro existente: espera __applyRemoteJson do Yjs (conteúdo vem do servidor)
        if (__isNewBoard) {
            // Canvas em branco
        }
        else {
            // Quadro existente: inicia vazio; o useEffect aplicará __applyRemoteJson quando o sync Yjs completar
        }
        // history snapshots on object changes
        const push = () => historyRef.current?.pushSnapshot();
        c.on('object:added', () => { push(); emitJsonDebounced(); });
        c.on('object:modified', () => { push(); emitJsonDebounced(); });
        c.on('object:removed', () => { push(); emitJsonDebounced(); });
        // snap-to-grid (8px) on moving
        const snap = 8;
        c.on('object:moving', (e) => {
            const obj = e.target;
            if (!obj || !gridRef.current)
                return;
            obj.set({
                left: Math.round((obj.left ?? 0) / snap) * snap,
                top: Math.round((obj.top ?? 0) / snap) * snap,
            });
        });
        // basic pan with spacebar (hold) or middle mouse
        let panning = false;
        const panStart = { x: 0, y: 0 };
        const vptStart = [1, 0, 0, 1, 0, 0];
        const onMouseDown = (opt) => {
            const ev = opt.e;
            if (('button' in ev && ev.button === 1) || spaceKeyRef.current) {
                panning = true;
                panStart.x = 'clientX' in ev ? ev.clientX : 0;
                panStart.y = 'clientY' in ev ? ev.clientY : 0;
                const vpt = c.viewportTransform ?? vptStart;
                vptStart.splice(0, vptStart.length, ...vpt);
                c.setCursor('grabbing');
                return;
            }
            const pointer = c.getPointer(ev);
            downRef.current = { x: pointer.x, y: pointer.y };
            if (zoneModeRef.current) {
                const zr = new fabric.Rect({
                    left: pointer.x,
                    top: pointer.y,
                    width: 1,
                    height: 1,
                    fill: 'rgba(99,102,241,0.10)',
                    stroke: '#6366f1',
                    strokeWidth: 2,
                    selectable: false,
                    evented: false,
                    rx: 14,
                    ry: 14,
                });
                zoneTempRef.current = zr;
                c.add(zr);
                c.bringObjectToFront(zr);
                return;
            }
            if (toolRef.current === 'select')
                return;
            if (toolRef.current === 'eraser') {
                const target = c.findTarget(ev);
                if (target)
                    c.remove(target);
                downRef.current = null;
                return;
            }
            // start temp object
            if (toolRef.current === 'rect') {
                const r = new fabric.Rect({
                    left: pointer.x,
                    top: pointer.y,
                    width: 1,
                    height: 1,
                    fill: 'rgba(59,130,246,0.12)',
                    stroke: '#3b82f6',
                    strokeWidth: 2,
                    selectable: true,
                });
                tempRef.current = r;
                c.add(r);
            }
            else if (toolRef.current === 'roundedRect') {
                const r = createRoundedRect(pointer.x, pointer.y, 1, 1);
                tempRef.current = r;
                c.add(r);
            }
            else if (toolRef.current === 'cylinder') {
                const cyl = createCylinder(pointer.x, pointer.y, 1, 1);
                tempRef.current = cyl;
                c.add(cyl);
            }
            else if (toolRef.current === 'circle') {
                const circ = new fabric.Ellipse({
                    left: pointer.x,
                    top: pointer.y,
                    rx: 1,
                    ry: 1,
                    fill: 'rgba(16,185,129,0.12)',
                    stroke: '#10b981',
                    strokeWidth: 2,
                    selectable: true,
                });
                tempRef.current = circ;
                c.add(circ);
            }
            else if (toolRef.current === 'ellipse') {
                const circ = new fabric.Ellipse({
                    left: pointer.x,
                    top: pointer.y,
                    rx: 1,
                    ry: 1,
                    fill: 'rgba(245,158,11,0.15)',
                    stroke: '#f59e0b',
                    strokeWidth: 2,
                    selectable: true,
                });
                tempRef.current = circ;
                c.add(circ);
            }
            else if (toolRef.current === 'diamond') {
                const d = createDiamond(pointer.x, pointer.y, 1, 1);
                tempRef.current = d;
                c.add(d);
            }
            else if (toolRef.current === 'parallelogram') {
                const p = createParallelogram(pointer.x, pointer.y, 1, 1);
                tempRef.current = p;
                c.add(p);
            }
            else if (toolRef.current === 'cloud') {
                const cl = createCloud(pointer.x, pointer.y, 1, 1);
                tempRef.current = cl;
                c.add(cl);
            }
            else if (toolRef.current === 'line') {
                const ln = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
                    stroke: '#111827',
                    strokeWidth: 2,
                    selectable: true,
                });
                tempRef.current = ln;
                c.add(ln);
            }
            else if (toolRef.current === 'arrow') {
                // arrow created on mouse up (needs end)
                const ln = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
                    stroke: '#111827',
                    strokeWidth: 2,
                    selectable: false,
                    evented: false,
                    opacity: 0.5,
                });
                tempRef.current = ln;
                c.add(ln);
            }
            else if (toolRef.current === 'text') {
                const tb = new fabric.Textbox('', {
                    left: pointer.x,
                    top: pointer.y,
                    width: 220,
                    fontSize: 18,
                    fill: '#111827',
                    backgroundColor: 'transparent',
                    padding: 8,
                    stroke: '#94a3b8',
                    strokeWidth: 1,
                });
                c.add(tb);
                c.setActiveObject(tb);
                setTool('select');
                downRef.current = null;
                requestAnimationFrame(() => {
                    tb.enterEditing();
                    tb.hiddenTextarea?.focus();
                });
            }
        };
        const onMouseMove = (opt) => {
            const ev = opt.e;
            if (__onPointer) {
                const p = c.getPointer(ev);
                // throttle pointer to ~30fps
                // @ts-ignore
                const now = performance.now();
                // @ts-ignore
                const last = c.__lastPtrTs ?? 0;
                if (now - last > 33) {
                    // @ts-ignore
                    c.__lastPtrTs = now;
                    __onPointer({ x: p.x, y: p.y });
                }
            }
            if (panning) {
                const dx = ev.clientX - panStart.x;
                const dy = ev.clientY - panStart.y;
                const vpt = [...vptStart];
                vpt[4] = (vpt[4] ?? 0) + dx;
                vpt[5] = (vpt[5] ?? 0) + dy;
                c.setViewportTransform(vpt);
                return;
            }
            const down = downRef.current;
            const ztemp = zoneTempRef.current;
            if (down && ztemp) {
                const p = c.getPointer(ev);
                const w = p.x - down.x;
                const h = p.y - down.y;
                ztemp.set({ width: Math.abs(w), height: Math.abs(h), left: Math.min(down.x, p.x), top: Math.min(down.y, p.y) });
                c.requestRenderAll();
                return;
            }
            const temp = tempRef.current;
            if (!down || !temp)
                return;
            const p = c.getPointer(ev);
            if (!p)
                return;
            const w = p.x - down.x;
            const h = p.y - down.y;
            if (temp instanceof fabric.Rect) {
                const l = Math.min(down.x, p.x);
                const t = Math.min(down.y, p.y);
                const sw = Math.max(Math.abs(w), 20);
                const sh = Math.max(Math.abs(h), 30);
                const shapeType = temp.__shapeType;
                const opts = { width: sw, height: sh, left: l, top: t };
                if (shapeType === 'cylinder') {
                    const rx = Math.min(sw / 2, sh / 2);
                    opts.rx = rx;
                    opts.ry = rx;
                }
                temp.set(opts);
            }
            else if (temp instanceof fabric.Ellipse) {
                temp.set({ rx: Math.abs(w) / 2, ry: Math.abs(h) / 2, left: Math.min(down.x, p.x), top: Math.min(down.y, p.y) });
            }
            else if (temp instanceof fabric.Polygon) {
                const l = Math.min(down.x, p.x);
                const t = Math.min(down.y, p.y);
                const sw = Math.max(Math.abs(w), 20);
                const sh = Math.max(Math.abs(h), 20);
                const type = temp.__shapeType;
                const opts = { left: l, top: t };
                if (type === 'diamond') {
                    opts.points = [
                        { x: sw / 2, y: 0 },
                        { x: sw, y: sh / 2 },
                        { x: sw / 2, y: sh },
                        { x: 0, y: sh / 2 },
                    ];
                }
                else if (type === 'parallelogram') {
                    const skew = sw * 0.15;
                    opts.points = [
                        { x: skew, y: 0 },
                        { x: sw + skew, y: 0 },
                        { x: sw - skew, y: sh },
                        { x: -skew, y: sh },
                    ];
                }
                if (Object.keys(opts).length > 2)
                    temp.set(opts);
            }
            else if (temp.__shapeType === 'cloud' && 'scaleX' in temp) {
                const l = Math.min(down.x, p.x);
                const t = Math.min(down.y, p.y);
                const sw = Math.max(Math.abs(w), 40);
                const sh = Math.max(Math.abs(h), 30);
                temp.set({ left: l, top: t, scaleX: sw / 80, scaleY: sh / 40 });
            }
            else if (temp instanceof fabric.Line) {
                temp.set({ x2: p.x, y2: p.y });
            }
            c.requestRenderAll();
        };
        const onMouseUp = async (opt) => {
            const ev = opt.e;
            if (panning) {
                panning = false;
                c.setCursor(spaceKeyRef.current ? 'grab' : 'default');
                return;
            }
            const ztemp = zoneTempRef.current;
            if (zoneModeRef.current && ztemp) {
                const rect = {
                    x: ztemp.left ?? 0,
                    y: ztemp.top ?? 0,
                    w: ztemp.width ?? 0,
                    h: ztemp.height ?? 0,
                };
                c.remove(ztemp);
                zoneTempRef.current = null;
                downRef.current = null;
                tempRef.current = null;
                if (rect.w >= 20 && rect.h >= 20)
                    __onZoneRect?.(rect);
                return;
            }
            if (toolRef.current === 'arrow') {
                const down = downRef.current;
                const temp = tempRef.current;
                if (down && temp && temp instanceof fabric.Line) {
                    const p = c.getPointer(ev);
                    tempRef.current = null; // clear before remove to avoid double-processing
                    c.remove(temp);
                    const arrow = makeArrow(down, { x: p.x, y: p.y }, arrowTypeRef.current);
                    c.add(arrow);
                    c.setActiveObject(arrow);
                    c.requestRenderAll();
                }
            }
            downRef.current = null;
            tempRef.current = null;
        };
        c.on('mouse:down', onMouseDown);
        c.on('mouse:move', onMouseMove);
        c.on('mouse:up', onMouseUp);
        // wheel zoom
        c.on('mouse:wheel', (opt) => {
            const ev = opt.e;
            const delta = ev.deltaY;
            let z = c.getZoom();
            z *= 0.999 ** delta;
            z = Math.min(3, Math.max(0.3, z));
            c.zoomToPoint(new fabric.Point(ev.offsetX, ev.offsetY), z);
            setZoom(z);
            ev.preventDefault();
            ev.stopPropagation();
            cullDebounced();
        });
        // prevent selecting locked objects (best-effort)
        const onSelect = () => {
            if (!__lockedObjectIds?.size)
                return;
            const active = c.getActiveObject();
            // @ts-ignore
            const oid = active?.__oid;
            if (oid && __lockedObjectIds.has(oid)) {
                c.discardActiveObject();
                c.requestRenderAll();
            }
        };
        c.on('selection:created', onSelect);
        c.on('selection:updated', onSelect);
        // space key for pan: cursor vira mão; evita scroll da página
        const keyDown = (e) => {
            if (e.key !== ' ')
                return;
            const target = e.target;
            const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
            if (isInput)
                return;
            e.preventDefault();
            e.stopPropagation();
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
            spaceKeyRef.current = true;
            if (canvasRef.current)
                canvasRef.current.setCursor('grab');
        };
        const keyUp = (e) => {
            if (e.key !== ' ')
                return;
            const wasActive = spaceKeyRef.current;
            spaceKeyRef.current = false;
            if (wasActive) {
                const target = e.target;
                const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
                if (!isInput) {
                    e.preventDefault();
                    e.stopPropagation();
                    document.documentElement.style.overflow = '';
                    document.body.style.overflow = '';
                }
                if (canvasRef.current)
                    canvasRef.current.setCursor('default');
            }
        };
        // keyboard shortcuts
        const key = (e) => {
            const hist = historyRef.current;
            if (!hist || !canvasRef.current)
                return;
            const isMac = navigator.platform.toLowerCase().includes('mac');
            const mod = isMac ? e.metaKey : e.ctrlKey;
            // undo/redo
            if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
                e.preventDefault();
                hist.undo();
            }
            if ((mod && e.key.toLowerCase() === 'z' && e.shiftKey) || (mod && e.key.toLowerCase() === 'y')) {
                e.preventDefault();
                hist.redo();
            }
            // delete — não remover quando está editando texto (Backspace apaga caractere, não o objeto)
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const obj = canvasRef.current.getActiveObject();
                if (obj && isTextEditing(obj))
                    return; // deixa o Textbox tratar
                const active = canvasRef.current.getActiveObjects();
                if (active.length) {
                    active.forEach((o) => canvasRef.current?.remove(o));
                    canvasRef.current?.discardActiveObject();
                    canvasRef.current?.requestRenderAll();
                }
            }
        };
        document.addEventListener('keydown', keyDown, true); // document + capture: evita scroll ao pressionar Espaço
        window.addEventListener('keydown', key);
        document.addEventListener('keyup', keyUp, true);
        // cleanup
        return () => {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            window.removeEventListener('resize', resize);
            document.removeEventListener('keydown', keyDown, true);
            window.removeEventListener('keydown', key);
            document.removeEventListener('keyup', keyUp, true);
            __onCanvas?.(null);
            c.dispose();
        };
    }, []); // canvas criado uma vez; tool/grid/zoneMode lidos via refs nos handlers
    const canUndoRedo = useMemo(() => true, []);
    async function doSaveNow() {
        const c = canvasRef.current;
        if (!c)
            return;
        const doc = {
            version: 1,
            createdAt: docRef.current?.createdAt ?? nowISO(),
            updatedAt: nowISO(),
            canvas: c.toDatalessJSON(),
        };
        saveDoc(doc);
        docRef.current = doc;
    }
    async function doLoad() {
        const c = canvasRef.current;
        if (!c)
            return;
        const loaded = loadDoc();
        if (!loaded?.canvas)
            return;
        docRef.current = loaded;
        await c.loadFromJSON(loaded.canvas);
        c.renderAll();
    }
    function doClear() {
        const c = canvasRef.current;
        if (!c)
            return;
        c.getObjects().forEach((o) => c.remove(o));
        c.renderAll();
        clearDoc();
    }
    // Aplica JSON remoto (Yjs) ao canvas — permite que dono e convidado vejam alterações um do outro
    useEffect(() => {
        const c = canvasRef.current;
        if (!c || !__applyRemoteJson)
            return;
        const key = JSON.stringify(__applyRemoteJson);
        if (key === lastAppliedRemoteRef.current)
            return;
        // Evita sobrescrever alterações locais recentes (ex: seta recém-criada antes do emit)
        try {
            const current = c.toDatalessJSON();
            if (JSON.stringify(current) === key)
                return;
        }
        catch {
            /* ignora */
        }
        lastAppliedRemoteRef.current = key;
        applyingRemoteRef.current = true;
        // Cancela emit pendente para não sobrescrever com estado antigo (ex.: dono recebe do convidado)
        if (syncTimerRef.current) {
            window.clearTimeout(syncTimerRef.current);
            syncTimerRef.current = null;
        }
        c.loadFromJSON(__applyRemoteJson)
            .then(() => {
            c.renderAll();
        })
            .finally(() => {
            // Mantém applyingRemoteRef por 220ms para que qualquer debounce pendente (180ms) dispare e seja ignorado
            setTimeout(() => {
                applyingRemoteRef.current = false;
            }, 220);
        });
    }, [__applyRemoteJson]);
    useEffect(() => {
        const c = canvasRef.current;
        if (!c)
            return;
        // remove old badges
        zoneBadgeRefs.current.forEach((t) => c.remove(t));
        zoneBadgeRefs.current = [];
        if (!__zones?.length) {
            c.requestRenderAll();
            return;
        }
        for (const z of __zones) {
            const label = new fabric.Text(z.name ?? 'Zona', {
                left: (z.rect?.x ?? z.rectX ?? 0) + 12,
                top: (z.rect?.y ?? z.rectY ?? 0) - 20,
                fontSize: 12,
                fill: '#111827',
                selectable: false,
                evented: false,
                opacity: 0.85,
            });
            // @ts-ignore
            label.__zone = true;
            zoneBadgeRefs.current.push(label);
            c.add(label);
            c.bringObjectToFront(label);
        }
        c.requestRenderAll();
    }, [__zones]);
    return (_jsx("div", { className: clsx('relative w-full', className), onMouseEnter: () => {
            pointerInsideCanvasRef.current = true;
            setIsInsideCanvas(true);
        }, onMouseLeave: () => {
            pointerInsideCanvasRef.current = false;
            setIsInsideCanvas(false);
            // ao sair do quadro com espaço pressionado, "solta" o pan (cursor e overflow)
            if (spaceKeyRef.current) {
                spaceKeyRef.current = false;
                document.documentElement.style.overflow = '';
                document.body.style.overflow = '';
                if (canvasRef.current)
                    canvasRef.current.setCursor('default');
            }
        }, children: _jsx("div", { className: clsx('relative h-[540px] w-full rounded-2xl transition-all duration-200', isInsideCanvas
                ? 'border-2 border-indigo-500 shadow-[0_0_0_3px_rgba(99,102,241,0.25),inset_0_0_24px_rgba(99,102,241,0.06)] dark:border-indigo-400 dark:shadow-[0_0_0_3px_rgba(99,102,241,0.3),inset_0_0_24px_rgba(99,102,241,0.08)]'
                : 'border-2 border-slate-300 shadow-md dark:border-slate-600 dark:shadow-slate-900/50'), children: _jsxs("div", { className: "absolute inset-0 overflow-hidden rounded-2xl bg-slate-100/80 dark:bg-slate-900/80", children: [_jsxs("div", { className: "absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80", children: [_jsx(ToolButton, { label: "Selecionar", active: tool === 'select', onClick: () => setTool('select'), title: "Selecionar e mover objetos" }), _jsx(ToolButton, { label: "Ret\u00E2ngulo", active: tool === 'rect', onClick: () => setTool('rect'), title: "Processo, etapa, a\u00E7\u00E3o, entidade" }), _jsx(ToolButton, { label: "Ret. arredondado", active: tool === 'roundedRect', onClick: () => setTool('roundedRect'), title: "Processo, etapa, a\u00E7\u00E3o, entidade" }), _jsx(ToolButton, { label: "Losango", active: tool === 'diamond', onClick: () => setTool('diamond'), title: "Decis\u00E3o (sim/n\u00E3o), ponto de condi\u00E7\u00E3o" }), _jsx(ToolButton, { label: "Elipse", active: tool === 'ellipse', onClick: () => setTool('ellipse'), title: "In\u00EDcio ou fim de um processo" }), _jsx(ToolButton, { label: "Paralelogramo", active: tool === 'parallelogram', onClick: () => setTool('parallelogram'), title: "Entrada ou sa\u00EDda de dados (input/output)" }), _jsx(ToolButton, { label: "C\u00EDrculo", active: tool === 'circle', onClick: () => setTool('circle'), title: "Conector (une fluxos em p\u00E1ginas diferentes em fluxogramas complexos)" }), _jsx(ToolButton, { label: "Cilindro", active: tool === 'cylinder', onClick: () => setTool('cylinder'), title: "Banco de dados ou armazenamento de dados" }), _jsx(ToolButton, { label: "Nuvem", active: tool === 'cloud', onClick: () => setTool('cloud'), title: "Internet ou rede em diagramas de infraestrutura" }), _jsx(ToolButton, { label: "Linha", active: tool === 'line', onClick: () => setTool('line'), title: "Conecta formas" }), _jsxs("div", { className: "relative", children: [_jsx(ToolButton, { label: "Seta", active: tool === 'arrow', title: "Conecta formas e mostra fluxo, dire\u00E7\u00E3o ou relacionamento", onClick: () => {
                                            setTool('arrow');
                                            setArrowMenuOpen((o) => !o);
                                        } }), arrowMenuOpen && (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 z-10", onClick: () => setArrowMenuOpen(false), "aria-hidden": true }), _jsxs("div", { className: "absolute left-0 top-full z-20 mt-1 w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800", children: [_jsx("button", { type: "button", className: clsx('block w-full rounded-lg px-3 py-2 text-left text-xs font-medium', arrowType === 'simple' ? 'bg-slate-100 dark:bg-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'), onClick: () => { setArrowType('simple'); setArrowMenuOpen(false); }, children: "Simples \u2192" }), _jsx("button", { type: "button", className: clsx('block w-full rounded-lg px-3 py-2 text-left text-xs font-medium', arrowType === 'double' ? 'bg-slate-100 dark:bg-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'), onClick: () => { setArrowType('double'); setArrowMenuOpen(false); }, children: "Dupla \u2194" }), _jsx("button", { type: "button", className: clsx('block w-full rounded-lg px-3 py-2 text-left text-xs font-medium', arrowType === 'dashed' ? 'bg-slate-100 dark:bg-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'), onClick: () => { setArrowType('dashed'); setArrowMenuOpen(false); }, children: "Tracejada \u22EF\u2192" })] })] }))] }), _jsx(ToolButton, { label: "Texto", active: tool === 'text', onClick: () => setTool('text') }), _jsx(ToolButton, { label: "Borracha", active: tool === 'eraser', onClick: () => setTool('eraser') }), _jsx("div", { className: "mx-1 h-6 w-px bg-slate-200 dark:bg-slate-800" }), _jsx(ToolButton, { label: grid ? 'Grid: ON' : 'Grid: OFF', active: grid, onClick: () => setGrid(!grid) }), _jsx(ToolButton, { label: "Salvar", onClick: doSaveNow }), _jsx(ToolButton, { label: "Carregar", onClick: doLoad }), _jsx(ToolButton, { label: "Limpar", onClick: doClear }), _jsx("div", { className: "mx-1 h-6 w-px bg-slate-200 dark:bg-slate-800" }), _jsx(ToolButton, { label: zoneMode ? 'Criar zona: ON' : 'Criar zona', active: zoneMode, onClick: () => setZoneMode(!zoneMode) }), _jsx(ToolButton, { label: suggestionMode ? 'Sugestão: ON' : 'Sugestão', active: suggestionMode, onClick: () => setSuggestionMode(!suggestionMode) })] }), _jsxs("div", { className: "absolute bottom-3 left-4 z-10 rounded-xl bg-white/90 px-3 py-1 text-xs text-slate-700 shadow-sm backdrop-blur dark:bg-slate-950/80 dark:text-slate-200", children: ["Zoom: ", Math.round(zoom * 100), "% \u2022 Scroll = zoom \u2022 Espa\u00E7o (com mouse no quadro) ou bot\u00E3o do meio = pan \u2022 Ctrl/Cmd+Z = undo"] }), _jsx("div", { ref: hostRef, className: "h-full w-full bg-slate-50 dark:bg-slate-950", children: _jsx("canvas", { ref: canvasElRef, className: "h-full w-full" }) })] }) }) }));
}
function ToolButton({ label, active, onClick, title, }) {
    return (_jsx("button", { title: title, className: clsx('rounded-xl px-3 py-1.5 text-xs font-medium transition', active
            ? 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-950'
            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900/40'), onClick: onClick, type: "button", children: label }));
}
