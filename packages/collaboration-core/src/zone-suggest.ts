import type { ZoneType } from '@zones/shared';

export type Rect = { x: number; y: number; w: number; h: number };

export type ObjectBox = Rect & { id: string; type?: string };

export type ZoneSuggestion = {
  name: string;
  type: ZoneType;
  rect: Rect;
  objectIds: string[];
  confidence: number; // 0..1
};

function rectUnion(a: Rect, b: Rect): Rect {
  const x1 = Math.min(a.x, b.x);
  const y1 = Math.min(a.y, b.y);
  const x2 = Math.max(a.x + a.w, b.x + b.w);
  const y2 = Math.max(a.y + a.h, b.y + b.h);
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

function rectCenter(r: Rect) {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

function dist(a: Rect, b: Rect) {
  const ca = rectCenter(a);
  const cb = rectCenter(b);
  const dx = ca.x - cb.x;
  const dy = ca.y - cb.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function clusterObjects(
  objs: ObjectBox[],
  opts: { maxDistance?: number; minClusterSize?: number } = {},
) {
  const maxDistance = opts.maxDistance ?? 220;
  const minClusterSize = opts.minClusterSize ?? 3;

  const visited = new Set<string>();
  const clusters: ObjectBox[][] = [];

  for (const o of objs) {
    if (visited.has(o.id)) continue;
    visited.add(o.id);

    const neighbors = objs.filter((x) => x.id !== o.id && dist(o, x) <= maxDistance);
    if (neighbors.length + 1 < minClusterSize) continue;

    const cluster: ObjectBox[] = [o];
    const queue = [...neighbors];
    for (const n of queue) {
      if (!visited.has(n.id)) {
        visited.add(n.id);
        const nNeighbors = objs.filter((x) => x.id !== n.id && dist(n, x) <= maxDistance);
        if (nNeighbors.length + 1 >= minClusterSize) {
          queue.push(...nNeighbors);
        }
      }
      if (!cluster.find((c) => c.id === n.id)) cluster.push(n);
    }
    clusters.push(cluster);
  }

  return clusters;
}

// Heurística simples: se há muitas linhas/setas => "fluxograma"
// se há muitos textos => "brainstorm/mindmap"
export function guessBoardContext(objs: ObjectBox[]) {
  const t = objs.filter((o) => (o.type ?? '').toLowerCase().includes('text')).length;
  const l = objs.filter((o) => ['line', 'path', 'polyline'].some((k) => (o.type ?? '').toLowerCase().includes(k))).length;
  if (l >= Math.max(3, t * 0.6)) return 'flowchart';
  if (t >= 6 && l <= 2) return 'brainstorm';
  return 'mixed';
}

export function suggestZones(objs: ObjectBox[]) : ZoneSuggestion[] {
  const clusters = clusterObjects(objs);
  const ctx = guessBoardContext(objs);

  return clusters.map((cluster, i) => {
    let rect = { x: cluster[0]!.x, y: cluster[0]!.y, w: cluster[0]!.w, h: cluster[0]!.h };
    for (const o of cluster.slice(1)) rect = rectUnion(rect, o);

    // padding
    const pad = 40;
    rect = { x: rect.x - pad, y: rect.y - pad, w: rect.w + pad * 2, h: rect.h + pad * 2 };

    // type suggestion heuristic
    let type: ZoneType = 'FREE_EDIT';
    let confidence = 0.55;
    if (ctx === 'flowchart') {
      type = 'LOCKED_ZONE';
      confidence = 0.62;
    } else if (ctx === 'brainstorm') {
      type = 'FREE_EDIT';
      confidence = 0.62;
    } else {
      type = i % 3 === 0 ? 'REVIEW_REQUIRED' : 'FREE_EDIT';
      confidence = 0.55;
    }

    return {
      name: `Zona sugerida ${i + 1}`,
      type,
      rect,
      objectIds: cluster.map((o) => o.id),
      confidence,
    };
  });
}
