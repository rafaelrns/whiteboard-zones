import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { createSession, deleteSession } from '../auth/token';
import { LoginRequest, RegisterRequest } from '@zones/shared';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const parsed = RegisterRequest.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body', issues: parsed.error.issues });

  const { name, email, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: 'email_in_use' });

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hash, role: 'owner' }, // MVP: primeiro user como owner
    select: { id: true, name: true, email: true, role: true },
  });

  const token = await createSession(user.id);
  return res.json({ token, user });
});

authRouter.post('/login', async (req, res) => {
  const parsed = LoginRequest.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body', issues: parsed.error.issues });

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.password) return res.status(401).json({ error: 'invalid_credentials' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

  const token = await createSession(user.id);
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

authRouter.post('/logout', async (req, res) => {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (token) await deleteSession(token);
  return res.json({ ok: true });
});
