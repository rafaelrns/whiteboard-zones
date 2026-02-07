import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth, AuthedRequest } from '../auth/middleware';

export const notificationsRouter = Router();

notificationsRouter.get('/', requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const items = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return res.json(items);
});

notificationsRouter.post('/:id/read', requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const id = req.params.id!;
  const n = await prisma.notification.findFirst({ where: { id, userId } });
  if (!n) return res.status(404).json({ error: 'not_found' });
  const updated = await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  return res.json(updated);
});
