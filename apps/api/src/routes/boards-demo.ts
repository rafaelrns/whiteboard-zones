import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth, AuthedRequest } from '../auth/middleware.js';

export const boardsDemoRouter = Router();

boardsDemoRouter.get('/demo', requireAuth, async (req: AuthedRequest, res) => {
  const ownerId = req.user!.id;
  const existing = await prisma.board.findFirst({ where: { ownerId, name: 'demo' } });
  if (existing) return res.json(existing);

  const created = await prisma.board.create({ data: { ownerId, name: 'demo' } });
  return res.json(created);
});
