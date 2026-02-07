/**
 * Classe customizada ArrowLine — seta como Line com pontas desenhadas em _render.
 * Evita problemas do Group (duplicação, pontas que não aparecem).
 * Baseado em: https://stackoverflow.com/questions/31238010/arrows-in-fabricjs
 */
import * as fabric from 'fabric';

export type ArrowType = 'simple' | 'double' | 'dashed';

type ArrowLineOptions = Partial<fabric.FabricObjectProps> & {
  arrowType?: ArrowType;
  strokeDashArray?: number[];
};

export class ArrowLine extends fabric.Line {
  static type = 'ArrowLine';
  declare arrowType: ArrowType;

  constructor(points: [number, number, number, number] = [0, 0, 0, 0], options: ArrowLineOptions = {} as ArrowLineOptions) {
    const { arrowType = 'simple', strokeDashArray, ...lineOpts } = options;
    const opts: Record<string, unknown> = {
      stroke: '#111827',
      strokeWidth: 2,
      objectCaching: false, // evita corte das pontas no cache
      ...lineOpts,
    };
    if (arrowType === 'dashed') {
      opts.strokeDashArray = [8, 4];
    } else if (strokeDashArray) {
      opts.strokeDashArray = strokeDashArray;
    }
    super(points, opts as any);
    this.arrowType = arrowType;
  }

  /** Expande o bounding box para incluir as pontas da seta (evita corte) */
  _getNonTransformedDimensions(): fabric.Point {
    const dim = super._getNonTransformedDimensions();
    const pad = 20; // tamanho da ponta (headLen + headW)
    dim.x += pad;
    dim.y += pad;
    return dim;
  }

  _render(ctx: CanvasRenderingContext2D): void {
    // Desenha a linha (parent)
    super._render(ctx);

    const p = this.calcLinePoints();
    const x1 = p.x1;
    const y1 = p.y1;
    const x2 = p.x2;
    const y2 = p.y2;

    if (this.width === 0 && this.height === 0) return;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    const headLen = 14;
    const headW = 10;

    const strokeColor = typeof this.stroke === 'string' ? this.stroke : '#111827';

    ctx.save();

    // Ponta no fim (x2, y2)
    ctx.translate(x2, y2);
    ctx.rotate(angle);
    ctx.fillStyle = strokeColor;
    ctx.beginPath();
    ctx.moveTo(headLen, 0);
    ctx.lineTo(-headLen, headW);
    ctx.lineTo(-headLen * 0.6, 0);
    ctx.lineTo(-headLen, -headW);
    ctx.closePath();
    ctx.fill();

    if (this.arrowType === 'double') {
      ctx.restore();
      ctx.save();
      // Ponta no início (x1, y1)
      ctx.translate(x1, y1);
      ctx.rotate(angle + Math.PI);
      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.moveTo(headLen, 0);
      ctx.lineTo(-headLen, headW);
      ctx.lineTo(-headLen * 0.6, 0);
      ctx.lineTo(-headLen, -headW);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  override toObject(propertiesToInclude?: any): any {
    const obj = super.toObject(propertiesToInclude ?? []) as Record<string, unknown>;
    obj.arrowType = this.arrowType;
    obj.type = ArrowLine.type;
    return obj;
  }

  static async fromObject(object: Record<string, unknown>): Promise<ArrowLine> {
    const { arrowType = 'simple', x1, y1, x2, y2, ...rest } = object as any;
    const pts: [number, number, number, number] = [x1 ?? 0, y1 ?? 0, x2 ?? 0, y2 ?? 0];
    return new ArrowLine(pts, { arrowType, ...rest });
  }
}

// Registra para serialização (loadFromJSON/toJSON)
if (typeof fabric.classRegistry !== 'undefined') {
  fabric.classRegistry.setClass(ArrowLine, ArrowLine.type);
}
