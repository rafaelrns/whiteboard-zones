import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
export function PerfHUD({ canvas, pingMs, connected, }) {
    const [fps, setFps] = useState(0);
    const frames = useRef(0);
    const last = useRef(performance.now());
    useEffect(() => {
        let raf = 0;
        const loop = (t) => {
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
        if (!canvas)
            return 0;
        return canvas.getObjects().filter((o) => !o.__zone).length;
    }, [canvas]);
    return (_jsxs("div", { className: "pointer-events-none absolute right-3 bottom-3 z-40 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 text-[11px] text-slate-700 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-200", children: [_jsx("div", { className: "font-semibold", children: "Perf" }), _jsxs("div", { className: "mt-1 grid grid-cols-2 gap-x-3 gap-y-1", children: [_jsx("div", { children: "FPS" }), _jsx("div", { className: "text-right tabular-nums", children: fps }), _jsx("div", { children: "Ping" }), _jsxs("div", { className: "text-right tabular-nums", children: [pingMs ?? '—', " ms"] }), _jsx("div", { children: "Objs" }), _jsx("div", { className: "text-right tabular-nums", children: objCount }), _jsx("div", { children: "WS" }), _jsx("div", { className: "text-right", children: connected ? 'on' : 'off' })] })] }));
}
