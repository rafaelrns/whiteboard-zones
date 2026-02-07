import { Router } from 'express';
import crypto from 'node:crypto';
import { prisma } from '../db';
import { requireAuth, AuthedRequest } from '../auth/middleware';
import { env } from '../env';

export const invitesRouter = Router({ mergeParams: true });

function token() {
  return crypto.randomBytes(24).toString('base64url');
}

invitesRouter.post('/', requireAuth, async (req: AuthedRequest, res) => {
  const boardId = req.params.boardId!;
  const { email, userId, role } = req.body ?? {};
  if (!role) return res.status(400).json({ error: 'invalid_body' });

  let targetEmail: string;
  let targetUserId: string | null = null;

  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true } });
    if (!user) return res.status(404).json({ error: 'user_not_found' });
    targetEmail = user.email;
    targetUserId = user.id;
  } else if (email) {
    targetEmail = String(email).trim();
    if (!targetEmail) return res.status(400).json({ error: 'invalid_body' });
    const existingUser = await prisma.user.findUnique({ where: { email: targetEmail }, select: { id: true } });
    if (existingUser) targetUserId = existingUser.id;
  } else {
    return res.status(400).json({ error: 'invalid_body' });
  }

  const board = await prisma.board.findFirst({
    where: { id: boardId, ownerId: req.user!.id },
    include: { owner: { select: { name: true } } },
  });
  if (!board) return res.status(403).json({ error: 'forbidden' });

  const existingInvite = await prisma.invite.findFirst({
    where: { boardId, email: targetEmail, acceptedAt: null },
  });
  if (existingInvite) return res.status(409).json({ error: 'already_invited' });

  const inv = await prisma.invite.create({
    data: {
      boardId,
      email: targetEmail,
      role,
      token: token(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  if (targetUserId) {
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: 'BOARD_INVITE',
        payload: {
          inviteId: inv.id,
          inviteToken: inv.token,
          boardId,
          boardName: board.name,
          inviterName: board.owner.name,
          role,
        },
      },
    });
  }

  const inviteUrl = `${env.APP_URL}/invite/accept?token=${inv.token}`;
  return res.status(201).json({ invite: inv, inviteUrl });
});

invitesRouter.get('/accept', async (req, res) => {
  const t = String(req.query.token ?? '');
  if (!t) return res.status(400).json({ error: 'missing_token' });

  const inv = await prisma.invite.findUnique({ where: { token: t } });
  if (!inv) return res.status(404).json({ error: 'not_found' });
  if (inv.acceptedAt) return res.status(409).json({ error: 'already_accepted' });
  if (inv.expiresAt.getTime() < Date.now()) return res.status(410).json({ error: 'expired' });

  // MVP: marca como aceito (associação de usuário ao board entra na Etapa 3+ com permissões robustas)
  const accepted = await prisma.invite.update({ where: { token: t }, data: { acceptedAt: new Date() } });
  return res.json({ ok: true, invite: accepted, boardId: accepted.boardId });
});

invitesRouter.get('/', requireAuth, async (req: AuthedRequest, res) => {
  const boardId = req.params.boardId!;
  const board = await prisma.board.findFirst({ where: { id: boardId, ownerId: req.user!.id } });
  if (!board) return res.status(403).json({ error: 'forbidden' });
  const list = await prisma.invite.findMany({
    where: { boardId },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(list);
});

/** Revoga todos os convites do quadro — dono para de compartilhar */
invitesRouter.delete('/', requireAuth, async (req: AuthedRequest, res) => {
  const boardId = req.params.boardId!;
  const board = await prisma.board.findFirst({ where: { id: boardId, ownerId: req.user!.id } });
  if (!board) return res.status(403).json({ error: 'forbidden' });
  await prisma.invite.deleteMany({ where: { boardId } });
  return res.json({ ok: true });
});
