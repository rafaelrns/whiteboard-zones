import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { requireAuthOptional, AuthedRequestOptional } from '../auth/middleware';
import { CreateFeedbackRequest } from '@zones/shared';

export const feedbackRouter = Router();

feedbackRouter.post('/', requireAuthOptional, async (req: AuthedRequestOptional, res) => {
  const parsed = CreateFeedbackRequest.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body', issues: parsed.error.issues });

  const created = await prisma.feedback.create({
    data: {
      userId: req.user?.id ?? null,
      boardId: parsed.data.boardId ?? null,
      kind: parsed.data.kind,
      message: parsed.data.message,
      meta: parsed.data.meta ?? Prisma.DbNull,
    },
  });

  return res.status(201).json(created);
});
