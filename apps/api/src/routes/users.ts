import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth, AuthedRequest } from '../auth/middleware.js';

export const usersRouter = Router();

/** Busca usuários por nome ou e-mail (para convite). Exclui o próprio usuário. */
usersRouter.get('/search', requireAuth, async (req: AuthedRequest, res) => {
  const q = String(req.query.q ?? '').trim();
  if (q.length < 2) return res.json([]);

  const currentId = req.user!.id;
  const users = await prisma.user.findMany({
    where: {
      id: { not: currentId },
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, email: true },
    take: 10,
  });
  return res.json(users);
});
