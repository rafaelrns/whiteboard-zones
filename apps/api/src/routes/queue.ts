import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth, AuthedRequest } from '../auth/middleware';

export const queueRouter = Router({ mergeParams: true });

queueRouter.get('/', requireAuth, async (req: AuthedRequest, res) => {
  const zoneId = req.params.zoneId!;
  const q = await prisma.editQueueItem.findMany({ where: { zoneId }, orderBy: { position: 'asc' } });
  return res.json(q);
});

queueRouter.post('/join', requireAuth, async (req: AuthedRequest, res) => {
  const zoneId = req.params.zoneId!;
  const count = await prisma.editQueueItem.count({ where: { zoneId } });
  const item = await prisma.editQueueItem.create({
    data: { zoneId, userId: req.user!.id, position: count + 1 },
  });
  return res.status(201).json(item);
});

queueRouter.post('/leave', requireAuth, async (req: AuthedRequest, res) => {
  const zoneId = req.params.zoneId!;
  const del = await prisma.editQueueItem.deleteMany({ where: { zoneId, userId: req.user!.id } });
  // recompacta posições (MVP simples)
  const items = await prisma.editQueueItem.findMany({ where: { zoneId }, orderBy: { createdAt: 'asc' } });
  await Promise.all(items.map((it: { id: string }, idx: number) => prisma.editQueueItem.update({ where: { id: it.id }, data: { position: idx + 1 } })));
  return res.json({ ok: true, deleted: del.count });
});
