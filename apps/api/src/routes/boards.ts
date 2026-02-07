import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth, AuthedRequest } from '../auth/middleware.js';

export const boardsRouter = Router();

boardsRouter.get('/', requireAuth, async (req: AuthedRequest, res) => {
  const boards = await prisma.board.findMany({
    where: { ownerId: req.user!.id },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, name: true, ownerId: true, createdAt: true, updatedAt: true },
  });
  return res.json(boards);
});

boardsRouter.post('/', requireAuth, async (req: AuthedRequest, res) => {
  const name = String(req.body?.name ?? 'Novo quadro');
  const board = await prisma.board.create({
    data: { name, ownerId: req.user!.id },
    select: { id: true, name: true, ownerId: true, createdAt: true, updatedAt: true },
  });
  return res.status(201).json(board);
});

boardsRouter.get('/:id/access', requireAuth, async (req: AuthedRequest, res) => {
  const id = req.params.id!;
  const userId = req.user!.id;
  const board = await prisma.board.findUnique({ where: { id }, select: { ownerId: true, name: true } });
  if (!board) return res.status(404).json({ error: 'not_found' });
  const isOwner = board.ownerId === userId;
  if (isOwner) return res.json({ isOwner: true, boardName: board.name });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  const acceptedInvite = await prisma.invite.findFirst({
    where: { boardId: id, email: user.email, acceptedAt: { not: null } },
  });
  return res.json({ isOwner: false, canAccess: !!acceptedInvite, boardName: board.name });
});

boardsRouter.get('/:id', requireAuth, async (req: AuthedRequest, res) => {
  const id = req.params.id!;
  const board = await prisma.board.findFirst({
    where: { id, ownerId: req.user!.id },
    include: { zones: true },
  });
  if (!board) return res.status(404).json({ error: 'not_found' });
  return res.json(board);
});
