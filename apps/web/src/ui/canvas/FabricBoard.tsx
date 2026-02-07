import { useEffect, useMemo, useRef, useState } from 'react';
import * as fabric from 'fabric';
import clsx from 'clsx';
import { Tool, makeArrow, type ArrowType } from './commands';
import { createRoundedRect, createDiamond, createParallelogram, createCylinder, createCloud } from './shapes';
import { CanvasHistory } from './history';
import { loadDoc, saveDoc, clearDoc } from './storage';
import type { CanvasDocument } from './types';

type Props = {
  className?: string;
  /** internal: expose fabric canvas */
  __onCanvas?: (c: fabric.Canvas | null) => void;
  /** Etapa 3: callback para criar zona */
  __onZoneRect?: (rect: { x: number; y: number; w: number; h: number }) => void;
  /** Etapa 3: lista de zonas para badges */
  __zones?: any[];
  /** Etapa 4: callback quando canvas muda (para sync) */
  __onCanvasJson?: (json: any) => void;
  /** Etapa 4: aplica canvas remoto (carregado pelo caller) */
  __applyRemoteJson?: any;
  /** Etapa 4: cursor local */
  __onPointer?: (p: { x: number; y: number; zoneId?: string }) => void;
  /** Etapa 4: locks */
  __lockedObjectIds?: Set<string>;
  /** Quadro recém-criado — iniciar em branco (sem loadDoc nem texto de seed) */
  __isNewBoard?: boolean;
  /** Callback para salvar canvas na API (permite trabalhar em qualquer lugar) */
  __onSaveToApi?: (canvasJson: any) => Promise<void>;
};

function nowISO() {
  return new Date().toISOString();
}

/** Verifica se o objeto é texto em edição — Backspace/Delete não devem remover o objeto */
function isTextEditing(obj: fabric.Object | null): boolean {
  if (!obj) return false;
  const t = obj as fabric.IText & { isEditing?: boolean };
  if (t.isEditing) return true;
  if (obj.type === 'group' && 'getObjects' in obj) {
    const objs = (obj as fabric.Group).getObjects();
    return objs.some((o) => isTextEditing(o));
  }
  return false;
}

export function FabricBoard({ className, __onCanvas, __onZoneRect, __zones, __onCanvasJson, __applyRemoteJson, __onPointer, __lockedObjectIds, __isNewBoard, __onSaveToApi }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);

  const [tool, setTool] = useState<Tool>('select');
  const [arrowType, setArrowType] = useState<ArrowType>('simple');
  const [arrowMenuOpen, setArrowMenuOpen] = useState(false);
  const [grid, setGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [zoneMode, setZoneMode] = useState(false);
  const [suggestionMode, setSuggestionMode] = useState(false);
  const [isInsideCanvas, setIsInsideCanvas] = useState(false);

  const canvasRef = useRef<fabric.Canvas | null>(null);
  const historyRef = useRef<CanvasHistory | null>(null);
  const zoneBadgeRefs = useRef<fabric.Text[]>([]);

  // drawing state
  const downRef = useRef<{ x: number; y: number } | null>(null);
  const tempRef = useRef<fabric.Object | null>(null);
  const zoneTempRef = useRef<fabric.Rect | null>(null);
  /** Seta: origem aguardando destino (click origem → click destino) */
  const arrowOriginRef = useRef<{ type: 'object'; obj: fabric.Object; cx: number; cy: number } | { type: 'point'; x: number; y: number } | null>(null);

  const docRef = useRef<CanvasDocument | null>(null);
  const syncTimerRef = useRef<number | null>(null);
  const spaceKeyRef = useRef(false);
  /** Evita emitir para Yjs ao aplicar JSON remoto (evita loop) */
  const applyingRemoteRef = useRef(false);
  const lastAppliedRemoteRef = useRef<string>('');
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

  function isVisibleInViewport(obj: any, v: { left: number; top: number; width: number; height: number }, pad = 200) {
    const b = obj.getBoundingRect(true, true);
    const l = v.left - pad;
    const t = v.top - pad;
    const r = v.left + v.width + pad;
    const btm = v.top + v.height + pad;
    return !(b.left > r || b.top > btm || b.left + b.width < l || b.top + b.height < t);
  }

  const cullTimerRef = useRef<number | null>(null);
  function cullOffscreenObjects() {
    const c = canvasRef.current;
    if (!c) return;
    // viewport in canvas coords
    const vp = c.viewportTransform;
    if (!vp) return;
    const zoom = c.getZoom();
    const vleft = -vp[4] / zoom;
    const vtop = -vp[5] / zoom;
    const vwidth = c.getWidth() / zoom;
    const vheight = c.getHeight() / zoom;
    const view = { left: vleft, top: vtop, width: vwidth, height: vheight };

    let changed = false;
    c.getObjects().forEach((o: any) => {
      if (o.__zone) return; // never cull zone overlays
      const visible = isVisibleInViewport(o, view);
      if (o.visible !== visible) {
        o.visible = visible;
        changed = true;
      }
    });
    if (changed) c.requestRenderAll();
  }

  function cullDebounced() {
    if (cullTimerRef.current) window.clearTimeout(cullTimerRef.current);
    cullTimerRef.current = window.setTimeout(() => cullOffscreenObjects(), 120);
  }

  function emitJsonDebounced() {
    if (!__onCanvasJson || applyingRemoteRef.current) return;
    const c = canvasRef.current;
    if (!c) return;
    if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    syncTimerRef.current = window.setTimeout(() => {
      if (applyingRemoteRef.current) return;
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
      if (!c) return;
      const doc: CanvasDocument = {
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
    if (!canvasElRef.current) return;

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
      if (!host) return;
      c.setWidth(host.clientWidth);
      c.setHeight(host.clientHeight);
      c.requestRenderAll();
    };
    resize();
    window.addEventListener('resize', resize);

    // Quadro novo: canvas em branco. Quadro existente: espera __applyRemoteJson do Yjs (conteúdo vem do servidor)
    if (__isNewBoard) {
      // Canvas em branco
    } else {
      // Quadro existente: inicia vazio; o useEffect aplicará __applyRemoteJson quando o sync Yjs completar
    }

    const ensureOid = (o: fabric.Object) => {
      if (!(o as any).__oid) (o as any).__oid = `obj-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    };

    // history snapshots on object changes
    const push = () => historyRef.current?.pushSnapshot();
    c.on('object:added', (e: any) => {
      ensureOid(e.target ?? e);
      push();
      emitJsonDebounced();
    });
    // Setas ligadas: atualizar extremidades quando objeto move
    const updateLinkedArrows = (movedObj: fabric.Object) => {
      const oid = (movedObj as any).__oid;
      if (!oid) return;
      const center = movedObj.getCenterPoint();
      c.getObjects().forEach((o: any) => {
        if (o.type !== 'ArrowLine' || (!o.__fromId && !o.__toId)) return;
        const line = o as fabric.Line;
        const p = line.calcLinePoints?.() ?? { x1: 0, y1: 0, x2: 0, y2: 0 };
        let x1 = p.x1; let y1 = p.y1; let x2 = p.x2; let y2 = p.y2;
        if (o.__fromId === oid) { x1 = center.x; y1 = center.y; }
        if (o.__toId === oid) { x2 = center.x; y2 = center.y; }
        line.set({ points: [new fabric.Point(x1, y1), new fabric.Point(x2, y2)] } as any);
        line.setCoords();
      });
      c.requestRenderAll();
    };

    c.on('object:modified', (e: any) => {
      push();
      emitJsonDebounced();
      if (e.target) updateLinkedArrows(e.target);
    });
    c.on('object:removed', () => { push(); emitJsonDebounced(); });
    c.on('object:moving', (e: any) => {
      if (e.target) updateLinkedArrows(e.target);
    });

    // snap-to-grid (8px) on moving
    const snap = 8;
    c.on('object:moving', (e: { target?: fabric.FabricObject }) => {
      const obj = e.target;
      if (!obj || !gridRef.current) return;
      obj.set({
        left: Math.round((obj.left ?? 0) / snap) * snap,
        top: Math.round((obj.top ?? 0) / snap) * snap,
      });
    });

    // basic pan with spacebar (hold) or middle mouse
    let panning = false;
    const panStart = { x: 0, y: 0 };
    const vptStart = [1, 0, 0, 1, 0, 0] as number[];

    const onMouseDown = (opt: { e: MouseEvent | TouchEvent }) => {
      const ev = opt.e as MouseEvent;
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

      if (toolRef.current === 'select') return;

      if (toolRef.current === 'eraser') {
        const target = c.findTarget(ev);
        if (target) c.remove(target);
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
      } else if (toolRef.current === 'roundedRect') {
        const r = createRoundedRect(pointer.x, pointer.y, 1, 1);
        tempRef.current = r;
        c.add(r);
      } else if (toolRef.current === 'cylinder') {
        const cyl = createCylinder(pointer.x, pointer.y, 1, 1);
        tempRef.current = cyl;
        c.add(cyl);
      } else if (toolRef.current === 'circle') {
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
      } else if (toolRef.current === 'ellipse') {
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
      } else if (toolRef.current === 'diamond') {
        const d = createDiamond(pointer.x, pointer.y, 1, 1);
        tempRef.current = d;
        c.add(d);
      } else if (toolRef.current === 'parallelogram') {
        const p = createParallelogram(pointer.x, pointer.y, 1, 1);
        tempRef.current = p;
        c.add(p);
      } else if (toolRef.current === 'cloud') {
        const cl = createCloud(pointer.x, pointer.y, 1, 1);
        tempRef.current = cl;
        c.add(cl);
      } else if (toolRef.current === 'line') {
        const ln = new (fabric.Line as any)([pointer.x, pointer.y, pointer.x, pointer.y], {
          stroke: '#111827',
          strokeWidth: 2,
          selectable: true,
        });
        tempRef.current = ln;
        c.add(ln);
      } else if (toolRef.current === 'arrow') {
        // Seta: clicar origem → clicar destino
        const target = c.findTarget(ev) as fabric.Object | undefined;
        const origin = arrowOriginRef.current;
        const ensureOid = (o: fabric.Object) => {
          if (!(o as any).__oid) (o as any).__oid = `obj-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        };
        if (!origin) {
          if (target && !(target as any).__zone) {
            const center = target.getCenterPoint();
            ensureOid(target);
            arrowOriginRef.current = { type: 'object', obj: target, cx: center.x, cy: center.y };
          } else {
            arrowOriginRef.current = { type: 'point', x: pointer.x, y: pointer.y };
          }
          downRef.current = null;
          return;
        }
        let fromX: number; let fromY: number;
        if (origin.type === 'object') {
          const c2 = origin.obj.getCenterPoint();
          fromX = c2.x; fromY = c2.y;
        } else { fromX = origin.x; fromY = origin.y; }
        let toX: number; let toY: number;
        if (target && !(target as any).__zone) {
          const c2 = target.getCenterPoint();
          toX = c2.x; toY = c2.y;
          ensureOid(target);
        } else { toX = pointer.x; toY = pointer.y; }
        arrowOriginRef.current = null;
        const arrow = makeArrow({ x: fromX, y: fromY }, { x: toX, y: toY }, arrowTypeRef.current);
        if (origin.type === 'object' && target && !(target as any).__zone) {
          (arrow as any).__fromId = (origin.obj as any).__oid;
          (arrow as any).__toId = (target as any).__oid;
        }
        ensureOid(arrow);
        c.add(arrow);
        c.setActiveObject(arrow);
        downRef.current = null;
        tempRef.current = null;
        return;
      } else if (toolRef.current === 'text') {
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

    const onMouseMove = (opt: { e: MouseEvent | TouchEvent }) => {
      const ev = opt.e as MouseEvent;
      if (__onPointer) {
        const p = c.getPointer(ev);
        // throttle pointer to ~30fps
        // @ts-ignore
        const now = performance.now();
        // @ts-ignore
        const last = (c as any).__lastPtrTs ?? 0;
        if (now - last > 33) {
          // @ts-ignore
          (c as any).__lastPtrTs = now;
          __onPointer({ x: p.x, y: p.y });
        }
      }
      if (panning) {
        const dx = ev.clientX - panStart.x;
        const dy = ev.clientY - panStart.y;
        const vpt = [...vptStart];
        vpt[4] = (vpt[4] ?? 0) + dx;
        vpt[5] = (vpt[5] ?? 0) + dy;
        c.setViewportTransform(vpt as any);
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
      if (!down || !temp) return;
      const p = c.getPointer(ev);
      if (!p) return;
      const w = p.x - down.x;
      const h = p.y - down.y;

      if (temp instanceof fabric.Rect) {
        const l = Math.min(down.x, p.x);
        const t = Math.min(down.y, p.y);
        const sw = Math.max(Math.abs(w), 20);
        const sh = Math.max(Math.abs(h), 30);
        const shapeType = (temp as any).__shapeType;
        const opts: Record<string, unknown> = { width: sw, height: sh, left: l, top: t };
        if (shapeType === 'cylinder') {
          const rx = Math.min(sw / 2, sh / 2);
          opts.rx = rx;
          opts.ry = rx;
        }
        temp.set(opts);
      } else if (temp instanceof fabric.Ellipse) {
        temp.set({ rx: Math.abs(w) / 2, ry: Math.abs(h) / 2, left: Math.min(down.x, p.x), top: Math.min(down.y, p.y) });
      } else if (temp instanceof fabric.Polygon) {
        const l = Math.min(down.x, p.x);
        const t = Math.min(down.y, p.y);
        const sw = Math.max(Math.abs(w), 20);
        const sh = Math.max(Math.abs(h), 20);
        const type = (temp as any).__shapeType;
        const opts: Record<string, unknown> = { left: l, top: t };
        if (type === 'diamond') {
          opts.points = [
            { x: sw / 2, y: 0 },
            { x: sw, y: sh / 2 },
            { x: sw / 2, y: sh },
            { x: 0, y: sh / 2 },
          ];
        } else if (type === 'parallelogram') {
          const skew = sw * 0.15;
          opts.points = [
            { x: skew, y: 0 },
            { x: sw + skew, y: 0 },
            { x: sw - skew, y: sh },
            { x: -skew, y: sh },
          ];
        }
        if (Object.keys(opts).length > 2) temp.set(opts);
      } else if ((temp as any).__shapeType === 'cloud' && 'scaleX' in temp) {
        const l = Math.min(down.x, p.x);
        const t = Math.min(down.y, p.y);
        const sw = Math.max(Math.abs(w), 40);
        const sh = Math.max(Math.abs(h), 30);
        temp.set({ left: l, top: t, scaleX: sw / 80, scaleY: sh / 40 });
      } else if (temp instanceof fabric.Line) {
        (temp as fabric.Line).set({ x2: p.x, y2: p.y });
      }
      c.requestRenderAll();
    };

    const onMouseUp = async (opt: { e: MouseEvent | TouchEvent }) => {
      const ev = opt.e as MouseEvent;
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
        if (rect.w >= 20 && rect.h >= 20) __onZoneRect?.(rect);
        return;
      }

      downRef.current = null;
      tempRef.current = null;
    };

    c.on('mouse:down', onMouseDown as (opt: unknown) => void);
    c.on('mouse:move', onMouseMove as (opt: unknown) => void);
    c.on('mouse:up', onMouseUp as (opt: unknown) => void);

    // wheel zoom
    c.on('mouse:wheel', (opt: { e: WheelEvent }) => {
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
      if (!__lockedObjectIds?.size) return;
      const active = c.getActiveObject();
      // @ts-ignore
      const oid = active?.__oid as string | undefined;
      if (oid && __lockedObjectIds.has(oid)) {
        c.discardActiveObject();
        c.requestRenderAll();
      }
    };
    c.on('selection:created', onSelect);
    c.on('selection:updated', onSelect);

    // space key for pan: cursor vira mão; evita scroll da página
    const keyDown = (e: KeyboardEvent) => {
      if (e.key !== ' ') return;
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isInput) return;
      e.preventDefault();
      e.stopPropagation();
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      spaceKeyRef.current = true;
      if (canvasRef.current) canvasRef.current.setCursor('grab');
    };
    const keyUp = (e: KeyboardEvent) => {
      if (e.key !== ' ') return;
      const wasActive = spaceKeyRef.current;
      spaceKeyRef.current = false;
      if (wasActive) {
        const target = e.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        if (!isInput) {
          e.preventDefault();
          e.stopPropagation();
          document.documentElement.style.overflow = '';
          document.body.style.overflow = '';
        }
        if (canvasRef.current) canvasRef.current.setCursor('default');
      }
    };

    const STEP = 8; // pixels para mover com setas (alinhado ao grid)

    // keyboard shortcuts
    const key = (e: KeyboardEvent) => {
      const hist = historyRef.current;
      if (!hist || !canvasRef.current) return;

      const isMac = navigator.platform.toLowerCase().includes('mac');
      const mod = isMac ? e.metaKey : e.ctrlKey;

      // setas direcionais — mover objetos selecionados (exceto quando editando texto ou em input)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const target = e.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        if (isInput) return; // não interceptar quando usuário está em campo de formulário
        const c = canvasRef.current;
        const active = c.getActiveObject();
        if (!active) return;
        if (isTextEditing(active)) return; // deixa o Textbox tratar
        e.preventDefault();
        const dx = e.key === 'ArrowLeft' ? -STEP : e.key === 'ArrowRight' ? STEP : 0;
        const dy = e.key === 'ArrowUp' ? -STEP : e.key === 'ArrowDown' ? STEP : 0;
        const objs = c.getActiveObjects();
        objs.forEach((o: fabric.FabricObject) => {
          o.set({ left: (o.left ?? 0) + dx, top: (o.top ?? 0) + dy });
          o.setCoords();
          updateLinkedArrows(o);
        });
        hist.pushSnapshot();
        c.requestRenderAll();
        emitJsonDebounced();
        return;
      }

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
        if (obj && isTextEditing(obj)) return; // deixa o Textbox tratar
        const active = canvasRef.current.getActiveObjects();
        if (active.length) {
          active.forEach((o: fabric.FabricObject) => canvasRef.current?.remove(o));
          canvasRef.current?.discardActiveObject();
          canvasRef.current?.requestRenderAll();
        }
      }

      // agrupar (Ctrl+G) e desagrupar (Ctrl+Shift+G)
      if (mod && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        const c = canvasRef.current;
        if (!c) return;
        const active = c.getActiveObject();
        if (!active) return;
        if (e.shiftKey) {
          if (active instanceof fabric.Group || active.type === 'group') {
            const g = active as fabric.Group;
            if (typeof (g as any).ungroupOnCanvas === 'function') {
              (g as any).ungroupOnCanvas();
            } else {
              const objs = g.getObjects();
              c.remove(g);
              objs.forEach((o) => c.add(o));
              if (objs.length) c.setActiveObject(new fabric.ActiveSelection(objs, { canvas: c }));
            }
            c.requestRenderAll();
          }
        } else {
          const objs = c.getActiveObjects();
          if (objs.length >= 2) {
            const group = new fabric.Group([...objs], { subTargetCheck: true });
            c.remove(...objs);
            c.add(group);
            c.setActiveObject(group);
            c.requestRenderAll();
          }
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
    if (!c) return;
    const canvasJson = c.toDatalessJSON();
    const doc: CanvasDocument = {
      version: 1,
      createdAt: docRef.current?.createdAt ?? nowISO(),
      updatedAt: nowISO(),
      canvas: canvasJson,
    };
    saveDoc(doc);
    docRef.current = doc;
    if (__onSaveToApi) await __onSaveToApi(canvasJson);
  }

  async function doLoad() {
    const c = canvasRef.current;
    if (!c) return;
    const loaded = loadDoc();
    if (!loaded?.canvas) return;
    docRef.current = loaded;
    await c.loadFromJSON(loaded.canvas);
    c.renderAll();
  }

  function doClear() {
    const c = canvasRef.current;
    if (!c) return;
    c.getObjects().forEach((o: fabric.FabricObject) => c.remove(o));
    c.renderAll();
    clearDoc();
  }

  // Aplica JSON remoto (Yjs) ao canvas — permite que dono e convidado vejam alterações um do outro
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !__applyRemoteJson) return;
    const key = JSON.stringify(__applyRemoteJson);
    if (key === lastAppliedRemoteRef.current) return;
    // Evita sobrescrever alterações locais recentes (ex: seta recém-criada antes do emit)
    try {
      const current = c.toDatalessJSON();
      if (JSON.stringify(current) === key) return;
    } catch {
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
    if (!c) return;

    // remove old badges
    zoneBadgeRefs.current.forEach((t: fabric.FabricObject) => c.remove(t));
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

  return (
    <div
      className={clsx('relative w-full', className)}
      onMouseEnter={() => {
        pointerInsideCanvasRef.current = true;
        setIsInsideCanvas(true);
      }}
      onMouseLeave={() => {
        pointerInsideCanvasRef.current = false;
        setIsInsideCanvas(false);
        // ao sair do quadro com espaço pressionado, "solta" o pan (cursor e overflow)
        if (spaceKeyRef.current) {
          spaceKeyRef.current = false;
          document.documentElement.style.overflow = '';
          document.body.style.overflow = '';
          if (canvasRef.current) canvasRef.current.setCursor('default');
        }
      }}
    >
      {/* Moldura do quadro: borda e sombra que destacam quando o mouse está dentro */}
      <div
        className={clsx(
          'relative h-[540px] w-full rounded-2xl transition-all duration-200',
          isInsideCanvas
            ? 'border-2 border-indigo-500 shadow-[0_0_0_3px_rgba(99,102,241,0.25),inset_0_0_24px_rgba(99,102,241,0.06)] dark:border-indigo-400 dark:shadow-[0_0_0_3px_rgba(99,102,241,0.3),inset_0_0_24px_rgba(99,102,241,0.08)]'
            : 'border-2 border-slate-300 shadow-md dark:border-slate-600 dark:shadow-slate-900/50',
        )}
      >
        <div className="absolute inset-0 overflow-hidden rounded-2xl bg-slate-100/80 dark:bg-slate-900/80">
      {/* toolbar */}
      <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <ToolButton label="Selecionar" active={tool === 'select'} onClick={() => setTool('select')} title="Selecionar e mover objetos" />
        <ToolButton label="Retângulo" active={tool === 'rect'} onClick={() => setTool('rect')} title="Processo, etapa, ação, entidade" />
        <ToolButton label="Ret. arredondado" active={tool === 'roundedRect'} onClick={() => setTool('roundedRect')} title="Processo, etapa, ação, entidade" />
        <ToolButton label="Losango" active={tool === 'diamond'} onClick={() => setTool('diamond')} title="Decisão (sim/não), ponto de condição" />
        <ToolButton label="Elipse" active={tool === 'ellipse'} onClick={() => setTool('ellipse')} title="Início ou fim de um processo" />
        <ToolButton label="Paralelogramo" active={tool === 'parallelogram'} onClick={() => setTool('parallelogram')} title="Entrada ou saída de dados (input/output)" />
        <ToolButton label="Círculo" active={tool === 'circle'} onClick={() => setTool('circle')} title="Conector (une fluxos em páginas diferentes em fluxogramas complexos)" />
        <ToolButton label="Cilindro" active={tool === 'cylinder'} onClick={() => setTool('cylinder')} title="Banco de dados ou armazenamento de dados" />
        <ToolButton label="Nuvem" active={tool === 'cloud'} onClick={() => setTool('cloud')} title="Internet ou rede em diagramas de infraestrutura" />
        <ToolButton label="Linha" active={tool === 'line'} onClick={() => setTool('line')} title="Conecta formas" />
        <div className="relative">
          <ToolButton
            label="Seta"
            active={tool === 'arrow'}
            title="Conecta formas e mostra fluxo, direção ou relacionamento"
            onClick={() => {
              setTool('arrow');
              setArrowMenuOpen((o) => !o);
            }}
          />
          {arrowMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setArrowMenuOpen(false)} aria-hidden />
              <div className="absolute left-0 top-full z-20 mt-1 w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                <button
                  type="button"
                  className={clsx(
                    'block w-full rounded-lg px-3 py-2 text-left text-xs font-medium',
                    arrowType === 'simple' ? 'bg-slate-100 dark:bg-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50',
                  )}
                  onClick={() => { setArrowType('simple'); setArrowMenuOpen(false); }}
                >
                  Simples →
                </button>
                <button
                  type="button"
                  className={clsx(
                    'block w-full rounded-lg px-3 py-2 text-left text-xs font-medium',
                    arrowType === 'double' ? 'bg-slate-100 dark:bg-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50',
                  )}
                  onClick={() => { setArrowType('double'); setArrowMenuOpen(false); }}
                >
                  Dupla ↔
                </button>
                <button
                  type="button"
                  className={clsx(
                    'block w-full rounded-lg px-3 py-2 text-left text-xs font-medium',
                    arrowType === 'dashed' ? 'bg-slate-100 dark:bg-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50',
                  )}
                  onClick={() => { setArrowType('dashed'); setArrowMenuOpen(false); }}
                >
                  Tracejada ⋯→
                </button>
              </div>
            </>
          )}
        </div>
        <ToolButton label="Texto" active={tool === 'text'} onClick={() => setTool('text')} />
        <ToolButton label="Borracha" active={tool === 'eraser'} onClick={() => setTool('eraser')} />

        <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-800" />
        <ToolButton label={grid ? 'Grid: ON' : 'Grid: OFF'} active={grid} onClick={() => setGrid(!grid)} />
        <ToolButton label="Salvar" onClick={doSaveNow} />
        <ToolButton label="Carregar" onClick={doLoad} />
        <ToolButton label="Limpar" onClick={doClear} />
        <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-800" />
        <ToolButton label={zoneMode ? 'Criar zona: ON' : 'Criar zona'} active={zoneMode} onClick={() => setZoneMode(!zoneMode)} />
        <ToolButton label={suggestionMode ? 'Sugestão: ON' : 'Sugestão'} active={suggestionMode} onClick={() => setSuggestionMode(!suggestionMode)} />
      </div>

      {/* zoom/pan hint */}
      <div className="absolute bottom-3 left-4 z-10 rounded-xl bg-white/90 px-3 py-1 text-xs text-slate-700 shadow-sm backdrop-blur dark:bg-slate-950/80 dark:text-slate-200">
        Zoom: {Math.round(zoom * 100)}% • Scroll = zoom • Espaço (com mouse no quadro) ou botão do meio = pan • Ctrl/Cmd+Z = undo
      </div>

      {/* canvas host */}
      <div ref={hostRef} className="h-full w-full bg-slate-50 dark:bg-slate-950">
        <canvas ref={canvasElRef} className="h-full w-full" />
      </div>
        </div>
      </div>
    </div>
  );
}

function ToolButton({
  label,
  active,
  onClick,
  title,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      title={title}
      className={clsx(
        'rounded-xl px-3 py-1.5 text-xs font-medium transition',
        active
          ? 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-950'
          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900/40',
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
