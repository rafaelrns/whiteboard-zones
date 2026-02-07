import crypto from 'node:crypto';
import { redis } from '../redis.js';

const SESSION_PREFIX = 'session:';

export type Session = {
  userId: string;
  createdAt: string;
};

export function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

export async function createSession(userId: string) {
  const token = generateToken(32);
  const session: Session = { userId, createdAt: new Date().toISOString() };
  // TTL 7 dias
  await redis.set(`${SESSION_PREFIX}${token}`, JSON.stringify(session), 'EX', 60 * 60 * 24 * 7);
  return token;
}

export async function getSession(token: string) {
  const raw = await redis.get(`${SESSION_PREFIX}${token}`);
  if (!raw) return null;
  return JSON.parse(raw) as Session;
}

export async function deleteSession(token: string) {
  await redis.del(`${SESSION_PREFIX}${token}`);
}
