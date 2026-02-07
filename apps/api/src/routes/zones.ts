import { Router } from 'express';
import { prisma } from '../db';
import { CreateZoneRequest } from '@zones/shared';
import { requireAuth, AuthedRequest } from '../auth/middleware';

export const zonesRouter = Router({ mergeParams: true });

zonesRouter.get('/', requireAuth, async (req: AuthedRequest, res) => {
  const boardId = req.params.boardId!;
  const zones = await prisma.zone.findMany({ where: { boardId }, orderBy: { createdAt: 'asc' } });
  return res.json(
    zones.map((z: { rectX: number; rectY: number; rectW: number; rectH: number } & Record<string, unknown>) => ({ ...z, rect: { x: z.rectX, y: z.rectY, w: z.rectW, h: z.rectH } })),
  );
});

zonesRouter.post('/', requireAuth, async (req: AuthedRequest, res) => {
  const boardId = req.params.boardId!;
  const parsed = CreateZoneRequest.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body', issues: parsed.error.issues });

  const { type, name, rect, rules } = parsed.data;

  const zone = await prisma.zone.create({
    data: {
      boardId,
      type,
      name,
      rectX: rect.x,
      rectY: rect.y,
      rectW: rect.w,
      rectH: rect.h,
      rules,
    },
  });

  return res.status(201).json({
    ...zone,
    rect: { x: zone.rectX, y: zone.rectY, w: zone.rectW, h: zone.rectH },
  });
});

zonesRouter.patch('/:zoneId', requireAuth, async (req: AuthedRequest, res) => {
  const boardId = req.params.boardId!;
  const zoneId = req.params.zoneId!;
  const { name, type, rect, rules } = req.body ?? {};

  const zone = await prisma.zone.findFirst({ where: { id: zoneId, boardId } });
  if (!zone) return res.status(404).json({ error: 'not_found' });

  const updated = await prisma.zone.update({
    where: { id: zoneId },
    data: {
      ...(name ? { name: String(name) } : {}),
      ...(type ? { type } : {}),
      ...(rect ? { rectX: rect.x, rectY: rect.y, rectW: rect.w, rectH: rect.h } : {}),
      ...(rules ? { rules } : {}),
    },
  });

  return res.json({
    ...updated,
    rect: { x: updated.rectX, y: updated.rectY, w: updated.rectW, h: updated.rectH },
  });
});

zonesRouter.delete('/:zoneId', requireAuth, async (req: AuthedRequest, res) => {
  const boardId = req.params.boardId!;
  const zoneId = req.params.zoneId!;
  const zone = await prisma.zone.findFirst({ where: { id: zoneId, boardId } });
  if (!zone) return res.status(404).json({ error: 'not_found' });
  await prisma.zone.delete({ where: { id: zoneId } });
  return res.json({ ok: true });
});
