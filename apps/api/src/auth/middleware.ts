import { Request, Response, NextFunction } from 'express';
import { getSession } from './token.js';
import { prisma } from '../db.js';

export type AuthedRequest = Request & { user?: { id: string; role: string; email: string; name: string } };

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;

  if (!token) return res.status(401).json({ error: 'missing_token' });

  const session = await getSession(token);
  if (!session) return res.status(401).json({ error: 'invalid_token' });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return res.status(401).json({ error: 'user_not_found' });

  req.user = { id: user.id, role: user.role, email: user.email, name: user.name };
  return next();
}

export function requireOwner(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  if (req.user.role !== 'owner') return res.status(403).json({ error: 'forbidden' });
  return next();
}


export type AuthedRequestOptional = Request & { user?: { id: string; name: string; role: string } };

export async function requireAuthOptional(req: AuthedRequestOptional, _res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return next();
  const token = auth.slice('Bearer '.length);
  const session = await getSession(token);
  if (!session) return next();
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (user) req.user = { id: user.id, name: user.name, role: user.role };
  next();
}
