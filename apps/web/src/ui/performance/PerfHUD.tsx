import { useEffect, useMemo, useRef, useState } from 'react';
import type * as fabric from 'fabric';

export function PerfHUD({
  canvas,
  pingMs,
  connected,
}: {
  canvas: fabric.Canvas | null;
  pingMs: number | null;
  connected: boolean;
}) {
  const [fps, setFps] = useState<number>(0);
  const frames = useRef(0);
  const last = useRef(performance.now());

  useEffect(() => {
    let raf = 0;
    const loop = (t: number) => {
      frames.current += 1;
      const dt = t - last.current;
      if (dt >= 1000) {
        setFps(Math.round((frames.current * 1000) / dt));
        frames.current = 0;
        last.current = t;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const objCount = useMemo(() => {
    if (!canvas) return 0;
    return canvas.getObjects().filter((o: any) => !o.__zone).length;
  }, [canvas]);

  return (
    <div className="pointer-events-none absolute right-3 bottom-3 z-40 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 text-[11px] text-slate-700 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-200">
      <div className="font-semibold">Perf</div>
      <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
        <div>FPS</div>
        <div className="text-right tabular-nums">{fps}</div>
        <div>Ping</div>
        <div className="text-right tabular-nums">{pingMs ?? '—'} ms</div>
        <div>Objs</div>
        <div className="text-right tabular-nums">{objCount}</div>
        <div>WS</div>
        <div className="text-right">{connected ? 'on' : 'off'}</div>
      </div>
    </div>
  );
}
