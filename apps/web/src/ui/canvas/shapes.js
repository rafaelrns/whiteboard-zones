/**
 * Formas de fluxograma e diagramas
 * - Retângulo: processo, etapa, ação
 * - Retângulo arredondado: processo alternativo
 * - Losango: decisão (sim/não)
 * - Elipse: início ou fim
 * - Paralelogramo: entrada/saída de dados
 * - Cilindro: banco de dados
 * - Nuvem: internet/rede
 */
import * as fabric from 'fabric';
const FILL = 'rgba(59,130,246,0.15)';
const STROKE = '#3b82f6';
const FILL_GREEN = 'rgba(16,185,129,0.15)';
const STROKE_GREEN = '#10b981';
export function createRoundedRect(left, top, width, height) {
    return new fabric.Rect({
        left,
        top,
        width,
        height,
        rx: 16,
        ry: 16,
        fill: FILL,
        stroke: STROKE,
        strokeWidth: 2,
        selectable: true,
    });
}
/** Losango - decisão (pontos relativos a left,top com origin left/top) */
export function createDiamond(left, top, width, height) {
    const w2 = width / 2;
    const h2 = height / 2;
    const points = [
        { x: w2, y: 0 },
        { x: width, y: h2 },
        { x: w2, y: height },
        { x: 0, y: h2 },
    ];
    const p = new fabric.Polygon(points, {
        left,
        top,
        originX: 'left',
        originY: 'top',
        fill: FILL_GREEN,
        stroke: STROKE_GREEN,
        strokeWidth: 2,
        selectable: true,
        objectCaching: false,
    });
    p.__shapeType = 'diamond';
    return p;
}
/** Paralelogramo - entrada/saída (pontos relativos a left,top) */
export function createParallelogram(left, top, width, height) {
    const skew = width * 0.15;
    const points = [
        { x: skew, y: 0 },
        { x: width + skew, y: 0 },
        { x: width - skew, y: height },
        { x: -skew, y: height },
    ];
    const p = new fabric.Polygon(points, {
        left,
        top,
        originX: 'left',
        originY: 'top',
        fill: FILL,
        stroke: STROKE,
        strokeWidth: 2,
        selectable: true,
        objectCaching: false,
    });
    p.__shapeType = 'parallelogram';
    return p;
}
/** Cilindro - banco de dados (pílula: retângulo com rx grande) */
export function createCylinder(left, top, width, height) {
    const w = Math.max(width, 20);
    const h = Math.max(height, 30);
    const rx = Math.min(w / 2, h / 2);
    const r = new fabric.Rect({
        left,
        top,
        width: w,
        height: h,
        rx,
        ry: rx,
        fill: FILL,
        stroke: STROKE,
        strokeWidth: 2,
        selectable: true,
        objectCaching: false,
    });
    r.__shapeType = 'cylinder';
    return r;
}
/** Nuvem - internet/rede (Path SVG com curvas Bézier, 3 lobos no topo, base plana) */
const CLOUD_PATH = 'M 12,38 C 4,38 0,30 4,24 C 8,18 16,14 24,18 C 30,12 42,12 48,20 C 58,16 72,22 70,34 C 78,40 76,48 64,46 L 20,46 C 8,48 2,44 12,38 Z';
export function createCloud(left, top, width, height) {
    const w = Math.max(width, 40);
    const h = Math.max(height, 30);
    const path = new fabric.Path(CLOUD_PATH, {
        left,
        top,
        originX: 'left',
        originY: 'top',
        scaleX: w / 80,
        scaleY: h / 40,
        fill: FILL,
        stroke: STROKE,
        strokeWidth: 2,
        selectable: true,
        objectCaching: false,
    });
    path.__shapeType = 'cloud';
    return path;
}
