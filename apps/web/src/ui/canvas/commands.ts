import * as fabric from 'fabric';
import { ArrowLine, type ArrowType } from './ArrowLine';

export type Tool =
  | 'select'
  | 'rect'
  | 'roundedRect'
  | 'circle'
  | 'ellipse'
  | 'diamond'
  | 'parallelogram'
  | 'cylinder'
  | 'cloud'
  | 'line'
  | 'arrow'
  | 'text'
  | 'eraser';

export type { ArrowType };

export type CanvasCommand = { type: string; payload?: any };

/** Cria seta usando ArrowLine (classe customizada, sem Group) — evita duplicação e problemas de renderização */
export function makeArrow(
  from: { x: number; y: number },
  to: { x: number; y: number },
  type: ArrowType = 'simple',
) {
  return new ArrowLine([from.x, from.y, to.x, to.y], { arrowType: type });
}
