import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth, AuthedRequest } from '../auth/middleware';
import { CreateSuggestionRequest, DecideSuggestionRequest } from '@zones/shared';

export const suggestionsRouter = Router({ mergeParams: true });

suggestionsRouter.get('/', requireAuth, async (req: AuthedRequest, res) => {
  const boardId = req.params.boardId!;
  const items = await prisma.suggestion.findMany({ where: { boardId }, orderBy: { createdAt: 'desc' } });
  return res.json(items);
});

suggestionsRouter.post('/', requireAuth, async (req: AuthedRequest, res) => {
  const boardId = req.params.boardId!;
  const userId = req.user!.id;

  const parsed = CreateSuggestionRequest.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body', issues: parsed.error.issues });

  const s = await prisma.suggestion.create({
    data: {
      boardId,
      zoneId: parsed.data.zoneId ?? null,
      authorId: userId,
      title: parsed.data.title,
      message: parsed.data.message ?? null,
      objectsJson: parsed.data.objectsJson,
    },
  });

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (board) {
    await prisma.notification.create({
      data: {
        userId: board.ownerId,
        type: 'SUGGESTION_CREATED',
        payload: { boardId, suggestionId: s.id, title: s.title },
      },
    });
  }

  return res.status(201).json(s);
});

suggestionsRouter.get('/:suggestionId', requireAuth, async (req: AuthedRequest, res) => {
  const boardId = req.params.boardId!;
  const suggestionId = req.params.suggestionId!;
  const s = await prisma.suggestion.findFirst({ where: { id: suggestionId, boardId } });
  if (!s) return res.status(404).json({ error: 'not_found' });

  const comments = await prisma.suggestionComment.findMany({ where: { suggestionId }, orderBy: { createdAt: 'asc' } });
  return res.json({ ...s, comments });
});

suggestionsRouter.post('/:suggestionId/decision', requireAuth, async (req: AuthedRequest, res) => {
  const boardId = req.params.boardId!;
  const suggestionId = req.params.suggestionId!;
  const userId = req.user!.id;

  const parsed = DecideSuggestionRequest.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body', issues: parsed.error.issues });

  const s = await prisma.suggestion.findFirst({ where: { id: suggestionId, boardId } });
  if (!s) return res.status(404).json({ error: 'not_found' });

  const status = parsed.data.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';

  const updated = await prisma.suggestion.update({
    where: { id: suggestionId },
    data: { status, decidedAt: new Date(), decidedById: userId },
  });

  if (parsed.data.comment) {
    await prisma.suggestionComment.create({
      data: { suggestionId, authorId: userId, body: parsed.data.comment },
    });
  }

  await prisma.notification.create({
    data: {
      userId: s.authorId,
      type: 'SUGGESTION_DECIDED',
      payload: { boardId, suggestionId, status },
    },
  });

  return res.json(updated);
});
