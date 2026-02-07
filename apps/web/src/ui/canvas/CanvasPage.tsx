import { useEffect, useMemo, useRef, useState } from 'react';
import type * as fabric from 'fabric';
import type { ZoneDTO } from '@zones/shared';
import type { ZoneSuggestion, ObjectBox } from '@zones/collaboration-core';

import { FabricBoard } from './FabricBoard';
import { TextFormatToolbar } from './TextFormatToolbar';
import { ShapeFormatToolbar } from './ShapeFormatToolbar';
import { ZoneManager } from '../zones/ZoneManager';
import { ZoneSuggestPanel } from '../zones/ZoneSuggestPanel';
import { ReviewPanel } from '../suggestions/ReviewPanel';
import { SuggestionComposer } from '../suggestions/SuggestionComposer';
import { TemplatesPanel } from '../templates/TemplatesPanel';
import { ExportPanel } from '../export/ExportPanel';
import { api, SOCKET_URL, SOCKET_PATH } from '../../lib/api';
import { useAppStore } from '../store';
import { ensureZoneOverlay } from '../zones/ZoneOverlay';

import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { createClientDoc, applyMessage, encodeAwarenessUpdate, encodeSyncStep1, encodeDocUpdate } from '../collab/yjs';
import { CursorsOverlay } from '../collab/CursorsOverlay';
import { PerfHUD } from '../performance/PerfHUD';
import { io } from 'socket.io-client';

type CanvasPageProps = {
  initialBoardId?: string;
  /** Chamado quando um quadro é carregado (ex.: demo) para atualizar abas */
  onBoardLoaded?: (id: string, name: string) => void;
  /** Quadro recém-criado — exibir em branco (sem conteúdo de localStorage) */
  isNewBoard?: boolean;
};

export function CanvasPage({ initialBoardId, onBoardLoaded, isNewBoard }: CanvasPageProps = {}) {
  const token = useAppStore((s) => s.token);
  const user = useAppStore((s) => s.user);
  const setBoardOnlineCount = useAppStore((s) => s.setBoardOnlineCount);
  const setCurrentBoardId = useAppStore((s) => s.setCurrentBoardId);

  const [boardId, setBoardId] = useState<string | null>(initialBoardId ?? null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [zones, setZones] = useState<ZoneDTO[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | undefined>(undefined);

  // Collab state — novo doc por quadro para evitar mistura de conteúdo
  const { doc, awareness } = useMemo(() => {
    const c = createClientDoc();
    return { doc: c.doc, awareness: c.awareness as unknown as Awareness };
  }, [boardId ?? '']);
  const [awarenessReady, setAwarenessReady] = useState(false);
  const [remoteCanvasJson, setRemoteCanvasJson] = useState<any>(null);

  const socketRef = useRef<any>(null);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const lockedObjectIds = useRef<Set<string>>(new Set());
  const [lockedVersion, setLockedVersion] = useState(0);

  // overlay zones
  useEffect(() => {
    if (!canvas) return;
    const overlay = ensureZoneOverlay(canvas);
    overlay.sync(zones);
    return () => overlay.clear();
  }, [canvas, zones]);

  async function refreshZones() {
    if (!token || !boardId) return;
    const zs = await api<ZoneDTO[]>(`/boards/${boardId}/zones`, { method: 'GET' }, token);
    setZones(zs);
    if (selectedZoneId && !zs.find((z) => z.id === selectedZoneId)) setSelectedZoneId(undefined);
  }

  // Sincroniza boardId quando a aba muda (troca de quadro via URL /board/:id)
  useEffect(() => {
    if (typeof initialBoardId === 'string') {
      setBoardId(initialBoardId);
      setRemoteCanvasJson(null); // evita aplicar conteúdo do quadro anterior ao novo
    }
  }, [initialBoardId]);

  // get/create demo board quando não há initialBoardId (rota /)
  useEffect(() => {
    if (initialBoardId !== undefined) return;
    (async () => {
      if (!token) return;
      const b = await api<{ id: string; name?: string }>(`/boards/demo`, { method: 'GET' }, token);
      setBoardId(b.id);
      onBoardLoaded?.(b.id, b.name ?? 'Demo');
    })();
  }, [token, initialBoardId, onBoardLoaded]);

  useEffect(() => {
    setCurrentBoardId(boardId);
    return () => setCurrentBoardId(null);
  }, [boardId, setCurrentBoardId]);

  useEffect(() => {
    refreshZones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, boardId]);

  // Yjs shared state: canvas + zones snapshot (antes do socket effect)
  const yCanvas = useMemo(() => doc.getMap<any>('canvas'), [doc]);

  // Carregar canvas da API ao abrir quadro (permite trabalhar em qualquer lugar)
  useEffect(() => {
    if (!token || !boardId || isNewBoard) return;
    (async () => {
      try {
        const data = await api<{ canvas: any }>(`/boards/${boardId}/canvas`, { method: 'GET' }, token);
        if (data?.canvas) {
          yCanvas.set('json', data.canvas);
          setRemoteCanvasJson(data.canvas);
        }
      } catch {
        // Quadro pode não existir ou usuário sem acesso — ignora
      }
    })();
  }, [token, boardId, isNewBoard, yCanvas]);
  const yZones = useMemo(() => doc.getArray<any>('zones'), [doc]);

  // Socket.IO: already established in App.tsx; for MVP we create a dedicated connection here using same token
  // (Etapa 6: centralizar conexão em store)
  useEffect(() => {
    if (!token || !boardId) return;

    const onDocUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === 'remote') return;
      socketRef.current?.emit('yjs:message', { boardId, data: Array.from(encodeDocUpdate(update)) });
    };
    doc.on('update', onDocUpdate);

    let s: ReturnType<typeof io> | null = null;
    // Pequeno atraso evita conexão/desconexão dupla do React Strict Mode em dev
    const t = setTimeout(() => {
      s = io(SOCKET_URL, { path: SOCKET_PATH, transports: ['websocket'], auth: { token } });
      socketRef.current = s;

      s.on('connect', () => {
        setWsConnected(true);
        s!.emit('board:join', { boardId });
        const step1 = encodeSyncStep1(doc);
        s!.emit('yjs:message', { boardId, data: Array.from(step1) });
        setAwarenessReady(true);
      });
      s.on('presence:update', (p: { onlineCount?: number }) => {
        setBoardOnlineCount(p?.onlineCount ?? null);
      });
      s.on('connect_error', (err) => {
        console.warn('[Socket Canvas] connect_error:', err.message);
        setWsConnected(false);
      });
      s.on('server:ping', (p: any) => {
        const sent = p?.t as number | undefined;
        if (typeof sent === 'number') setPingMs(Math.max(0, Date.now() - sent));
        s!.emit('client:pong');
      });
      s.on('yjs:message', (data: number[] | Uint8Array | ArrayBuffer | undefined) => {
        const payload =
          Array.isArray(data) && data.length > 0
            ? Uint8Array.from(data)
            : data instanceof Uint8Array && data.length > 0
              ? data
              : data instanceof ArrayBuffer
                ? new Uint8Array(data)
                : new Uint8Array(0);
        const isSync = payload.length > 0 && payload[0] === 0;
        const reply = applyMessage(doc, awareness, payload);
        if (reply) s!.emit('yjs:message', { boardId, data: Array.from(reply) });
        // Atualiza canvas apenas em mensagens sync (não em awareness, que dispara em excesso)
        if (isSync) {
          const json = yCanvas.get('json');
          if (json) setRemoteCanvasJson(json);
        }
      });
      s.on('obj:lock:update', ({ objectId, owner }: { objectId: string; owner: string | null }) => {
        if (owner) lockedObjectIds.current.add(objectId);
        else lockedObjectIds.current.delete(objectId);
        setLockedVersion((v) => v + 1);
      });
    }, 50);

    return () => {
      doc.off('update', onDocUpdate);
      clearTimeout(t);
      setWsConnected(false);
      setBoardOnlineCount(null);
      if (s) {
        s.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, boardId, doc, awareness, setBoardOnlineCount, yCanvas]);

  // Apply remote canvas JSON when yCanvas changes
  useEffect(() => {
    const onUpdate = () => {
      const json = yCanvas.get('json');
      if (json) setRemoteCanvasJson(json);
      const z = yZones.toArray();
      if (z.length) setZones(z as any);
    };
    onUpdate();
    yCanvas.observe(onUpdate);
    yZones.observe(onUpdate);
    return () => {
      yCanvas.unobserve(onUpdate);
      yZones.unobserve(onUpdate);
    };
  }, [yCanvas, yZones]);

  // set awareness local state
  useEffect(() => {
    if (!awarenessReady || !user) return;
    awareness.setLocalStateField('user', {
      name: user.name,
      color: '#0ea5e9',
    });
    const u = encodeAwarenessUpdate(awareness, [awareness.clientID]);
    socketRef.current?.emit('yjs:message', { boardId, data: Array.from(u) });
  }, [awarenessReady, user, awareness, boardId]);

  async function createZoneFromRect(rect: { x: number; y: number; w: number; h: number }) {
    if (!token || !boardId) return;
    const created = await api<any>(
      `/boards/${boardId}/zones`,
      {
        method: 'POST',
        body: JSON.stringify({
          type: 'FREE_EDIT',
          name: `Zona ${zones.length + 1}`,
          rect,
          rules: { allowedRoles: ['owner', 'editor', 'reviewer', 'viewer'] },
        }),
      },
      token,
    );
    await refreshZones();
    // publish to Yjs (best-effort)
    yZones.delete(0, yZones.length);
    yZones.push(zones.concat([created]) as any);
  }

  async function deleteZone(zoneId: string) {
    if (!token || !boardId) return;
    await api(`/boards/${boardId}/zones/${zoneId}`, { method: 'DELETE' }, token);
    await refreshZones();
    yZones.delete(0, yZones.length);
    yZones.push(zones.filter((z) => z.id !== zoneId) as any);
  }

  function extractObjectBoxes(): ObjectBox[] {
    if (!canvas) return [];
    return canvas
      .getObjects()
      .filter((o: fabric.FabricObject) => !(o as fabric.FabricObject & { __zone?: boolean }).__zone)
      .map((o: fabric.FabricObject, idx: number) => {
        const b = o.getBoundingRect();
        const ext = o as fabric.FabricObject & { __oid?: string; id?: string };
        return { id: String(ext.__oid ?? ext.id ?? idx), x: b.left, y: b.top, w: b.width, h: b.height, type: o.type };
      });
  }

  async function applySuggestions(sugs: ZoneSuggestion[]) {
    if (!token || !boardId) return;
    const created: any[] = [];
    for (const s of sugs) {
      const z = await api<any>(
        `/boards/${boardId}/zones`,
        {
          method: 'POST',
          body: JSON.stringify({
            type: s.type,
            name: s.name,
            rect: s.rect,
            rules: { allowedRoles: ['owner', 'editor', 'reviewer', 'viewer'] },
          }),
        },
        token,
      );
      created.push(z);
    }
    await refreshZones();
    yZones.delete(0, yZones.length);
    yZones.push(zones.concat(created) as any);
  }

  function onCanvasJson(json: any) {
    // publish full JSON (MVP); in Etapa 7 vira deltas/CRDT por objeto
    yCanvas.set('json', json);
  }

  async function saveCanvasToApi(canvasJson: any) {
    if (!token || !boardId) return;
    await api(`/boards/${boardId}/canvas`, {
      method: 'PUT',
      body: JSON.stringify({ canvas: canvasJson }),
    }, token);
  }

  function onPointer(p: { x: number; y: number; zoneId?: string }) {
    awareness.setLocalStateField('cursor', { x: p.x, y: p.y, zoneId: selectedZoneId });
    const u = encodeAwarenessUpdate(awareness, [awareness.clientID]);
    socketRef.current?.emit('yjs:message', { boardId, data: Array.from(u) });
  }

  // object locks: lock on selection
  useEffect(() => {
    if (!canvas || !socketRef.current) return;
    const s = socketRef.current;

    const onSelect = () => {
      const obj: any = canvas.getActiveObject();
      const objectId = obj?.__oid as string | undefined;
      if (!objectId) return;

      s.emit('obj:lock:try', { objectId }, (res: any) => {
        // if lock denied, discard selection
        if (!res?.ok) {
          canvas.discardActiveObject();
          canvas.requestRenderAll();
        }
      });
    };
    const onClear = () => {
      // release lock for previous? (MVP: release all selected)
      // keep simple: do nothing; TTL auto-release
    };

    canvas.on('selection:created', onSelect);
    canvas.on('selection:updated', onSelect);
    canvas.on('selection:cleared', onClear);

    return () => {
      canvas.off('selection:created', onSelect);
      canvas.off('selection:updated', onSelect);
      canvas.off('selection:cleared', onClear);
    };
  }, [canvas, boardId]);

  const [pointerInsideQuadro, setPointerInsideQuadro] = useState(false);
  const quadroRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  function toggleFullscreen() {
    if (!quadroRef.current) return;
    if (!document.fullscreenElement) {
      quadroRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;
    const t = setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    return () => clearTimeout(t);
  }, [isFullscreen]);

  return (
    <div className="relative flex flex-col gap-4">
      {/* Quadro em largura total */}
      <div
        ref={quadroRef}
        className={`relative flex w-full min-h-[400px] flex-col ${isFullscreen ? 'min-h-screen min-w-screen' : ''}`}
        onMouseEnter={() => setPointerInsideQuadro(true)}
        onMouseLeave={() => setPointerInsideQuadro(false)}
      >
        <button
          type="button"
          onClick={toggleFullscreen}
          className="absolute right-3 top-3 z-40 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
        >
          {isFullscreen ? '⤡ Sair' : '⛶ Tela cheia'}
        </button>
        <PerfHUD canvas={canvas} pingMs={pingMs} connected={wsConnected} />
        <div className={isFullscreen ? 'flex min-h-0 flex-1' : ''}>
        <FabricBoard
          key={boardId ?? 'none'}
          __onCanvas={setCanvas}
          __onZoneRect={createZoneFromRect}
          __zones={zones}
          __onCanvasJson={onCanvasJson}
          __applyRemoteJson={remoteCanvasJson}
          __onPointer={onPointer}
          __lockedObjectIds={lockedObjectIds.current}
          __isNewBoard={isNewBoard}
          __onSaveToApi={boardId && token ? saveCanvasToApi : undefined}
          __isFullscreen={isFullscreen}
        />
        <CursorsOverlay
          awareness={awarenessReady ? (awareness as any) : null}
          canvas={canvas}
          visible={pointerInsideQuadro}
        />
        <TextFormatToolbar canvas={canvas} />
        <ShapeFormatToolbar canvas={canvas} />
        </div>
      </div>

      {/* Menu de cards abaixo do quadro com scroll horizontal */}
      <div className="w-full overflow-x-auto overflow-y-hidden pb-2 px-4">
        <div className="flex gap-4 min-w-max">
          <div className="flex-shrink-0 w-[280px]">
            <TemplatesPanel canvas={canvas} onApplied={() => { if (canvas) yCanvas.set('json', canvas.toDatalessJSON()); }} />
          </div>
          <div className="flex-shrink-0 w-[280px]">
            <ExportPanel canvas={canvas} />
          </div>
          <div className="flex-shrink-0 w-[280px]">
            <ReviewPanel boardId={boardId ?? ''} canvas={canvas} onApplied={() => { if (canvas) yCanvas.set('json', canvas.toDatalessJSON()); }} />
          </div>
          <div className="flex-shrink-0 w-[280px]">
            <SuggestionComposer boardId={boardId ?? ''} zoneId={selectedZoneId ?? null} canvas={canvas} enabled={!!boardId} onSubmitted={() => {}} />
          </div>
          <div className="flex-shrink-0 w-[520px] min-w-[520px]">
            <ZoneManager
              boardId={boardId ?? ''}
              zones={zones}
              selectedZoneId={selectedZoneId}
              onSelect={setSelectedZoneId}
              onRefresh={refreshZones}
              onDelete={deleteZone}
            />
          </div>
          <div className="flex-shrink-0 w-[280px]">
            <ZoneSuggestPanel objects={extractObjectBoxes()} onApply={applySuggestions} />
          </div>
        </div>
      </div>
    </div>
  );
}
