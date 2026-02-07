import * as fabric from 'fabric';
import type { ZoneDTO, ZoneType } from '@zones/shared';
import { zoneColor } from './colors';

export type ZoneOverlayHandle = {
  sync: (zones: ZoneDTO[]) => void;
  clear: () => void;
};

type ZoneObj = fabric.Rect & { zoneId?: string; zoneType?: ZoneType; __zone?: true };

function makeZoneRect(z: ZoneDTO) {
  const { stroke, fill } = zoneColor(z.type);
  const r = new fabric.Rect({
    left: z.rect.x,
    top: z.rect.y,
    width: z.rect.w,
    height: z.rect.h,
    fill,
    stroke,
    strokeWidth: 2,
    selectable: false,
    evented: false,
    rx: 14,
    ry: 14,
    opacity: 1,
  }) as ZoneObj;
  r.zoneId = z.id;
  r.zoneType = z.type;
  r.__zone = true;
  return r;
}

export function ensureZoneOverlay(canvas: fabric.Canvas): ZoneOverlayHandle {
  const byId = new Map<string, ZoneObj>();

  function sync(zones: ZoneDTO[]) {
    // remove missing
    const keep = new Set(zones.map((z) => z.id));
    for (const [id, obj] of byId.entries()) {
      if (!keep.has(id)) {
        canvas.remove(obj);
        byId.delete(id);
      }
    }

    // upsert
    for (const z of zones) {
      const existing = byId.get(z.id);
      if (!existing) {
        const obj = makeZoneRect(z);
        byId.set(z.id, obj);
        canvas.add(obj);
        canvas.sendObjectToBack(obj);
      } else {
        const { stroke, fill } = zoneColor(z.type);
        existing.set({
          left: z.rect.x,
          top: z.rect.y,
          width: z.rect.w,
          height: z.rect.h,
          stroke,
          fill,
        });
        canvas.sendObjectToBack(existing);
      }
    }

    // keep zones behind
    for (const obj of canvas.getObjects()) {
      // @ts-ignore
      if (obj.__zone) canvas.sendObjectToBack(obj);
    }

    canvas.requestRenderAll();
  }

  function clear() {
    for (const obj of byId.values()) canvas.remove(obj);
    byId.clear();
    canvas.requestRenderAll();
  }

  return { sync, clear };
}
