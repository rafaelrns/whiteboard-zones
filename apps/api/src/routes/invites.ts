import { Router } from 'express';
import crypto from 'node:crypto';
import { prisma } from '../db.js';
import { requireAuth, AuthedRequest } from '../auth/middleware.js';
import { env } from '../env.js';
import { emitToUser, emitToBoard } from '../socket-emitter.js';
import { sendEmail } from '../email/mailersend.js';

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
    emitToUser(targetUserId, 'notif:new', {});
  }

  const inviteUrl = `${env.APP_URL}/invite/accept?token=${inv.token}`;

  // Enviar email de convite via MailerSend (se configurado)
  sendEmail({
    to: { email: targetEmail },
    subject: `${board.owner.name} convidou você para o quadro "${board.name}"`,
    html: `
      <p>Olá,</p>
      <p><strong>${board.owner.name}</strong> convidou você para colaborar no quadro <strong>${board.name}</strong> como ${role}.</p>
      <p><a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;">Aceitar convite</a></p>
      <p>Este link expira em 7 dias. Se não foi você que solicitou, pode ignorar este email.</p>
      <p>— Whiteboard Zones</p>
    `,
  }).catch((err) => console.warn('[Invite] Falha ao enviar email:', err));

  return res.status(201).json({ invite: inv, inviteUrl });
});

invitesRouter.get('/accept', async (req, res) => {
  const t = String(req.query.token ?? '');
  if (!t) return res.status(400).json({ error: 'missing_token' });

  const inv = await prisma.invite.findUnique({
    where: { token: t },
    include: { board: { select: { id: true, ownerId: true, name: true } } },
  });
  if (!inv) return res.status(404).json({ error: 'not_found' });
  if (inv.acceptedAt) return res.status(409).json({ error: 'already_accepted' });
  if (inv.expiresAt.getTime() < Date.now()) return res.status(410).json({ error: 'expired' });

  const accepted = await prisma.invite.update({ where: { token: t }, data: { acceptedAt: new Date() } });

  const ownerId = inv.board.ownerId;
  const boardId = inv.boardId;
  const boardName = inv.board.name;

  emitToBoard(boardId, 'invite:accepted', { boardId, email: inv.email });
  emitToUser(ownerId, 'invite:accepted', { boardId, email: inv.email });

  const owner = await prisma.user.findUnique({ where: { id: ownerId }, select: { id: true } });
  if (owner) {
    await prisma.notification.create({
      data: {
        userId: owner.id,
        type: 'INVITE_ACCEPTED',
        payload: { boardId, boardName, email: inv.email },
      },
    });
    emitToUser(owner.id, 'notif:new', {});
  }

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
