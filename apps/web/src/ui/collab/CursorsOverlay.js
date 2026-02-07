import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
function colorFor(id) {
    const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#a855f7', '#ef4444', '#22c55e', '#06b6d4'];
    return colors[id % colors.length];
}
/** Converte coordenadas do canvas (fabric) para pixels do overlay (considerando pan/zoom + offset do canvas) */
function fabricToScreen(canvas, x, y, offset) {
    if (!canvas)
        return { x: x + offset.x, y: y + offset.y };
    const vpt = canvas.viewportTransform;
    if (!vpt)
        return { x: x + offset.x, y: y + offset.y };
    return {
        x: vpt[0] * x + vpt[2] * y + vpt[4] + offset.x,
        y: vpt[1] * x + vpt[3] * y + vpt[5] + offset.y,
    };
}
export function CursorsOverlay({ awareness, canvas, visible = true, }) {
    const [cursors, setCursors] = useState([]);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);
    useEffect(() => {
        if (!canvas || !containerRef.current)
            return;
        const updateOffset = () => {
            const container = containerRef.current;
            const el = canvas.getElement?.();
            if (!container || !el)
                return;
            const cr = el.getBoundingClientRect();
            const wr = container.getBoundingClientRect();
            setOffset({ x: cr.left - wr.left, y: cr.top - wr.top });
        };
        updateOffset();
        const el = canvas.getElement?.();
        if (!el)
            return;
        const observer = new ResizeObserver(updateOffset);
        observer.observe(el);
        window.addEventListener('scroll', updateOffset, true);
        window.addEventListener('resize', updateOffset);
        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', updateOffset, true);
            window.removeEventListener('resize', updateOffset);
        };
    }, [canvas]);
    useEffect(() => {
        if (!awareness)
            return;
        const update = () => {
            const out = [];
            awareness.getStates().forEach((s, clientId) => {
                if (!s?.cursor)
                    return;
                out.push({
                    clientId,
                    name: s.user?.name ?? 'User',
                    color: s.user?.color ?? colorFor(clientId),
                    x: s.cursor.x,
                    y: s.cursor.y,
                    zoneId: s.cursor.zoneId,
                });
            });
            setCursors(out);
        };
        update();
        awareness.on('change', update);
        return () => awareness.off('change', update);
    }, [awareness]);
    if (!visible)
        return null;
    return (_jsx("div", { ref: containerRef, className: "pointer-events-none absolute inset-0 z-30", children: cursors.map((c) => {
            const { x, y } = fabricToScreen(canvas, c.x, c.y, offset);
            return (_jsxs("div", { className: "absolute flex items-center gap-1", style: { left: x, top: y }, children: [_jsx("div", { className: "h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white shadow", style: { background: c.color }, "aria-hidden": true }), _jsxs("div", { className: "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-white shadow", style: { background: c.color }, children: [c.name, c.zoneId ? ` • ${String(c.zoneId).slice(0, 4)}` : ''] })] }, c.clientId));
        }) }));
}
