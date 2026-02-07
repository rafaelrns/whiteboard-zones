import { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { env } from './env.js';
import { getSession } from './auth/token.js';
import { redis } from './redis.js';
import { prisma } from './db.js';
import { inc } from './observability/metrics.js';

import { createRoom, encodeSyncStep1, handleMessage, type YRoom } from './collab/yjs-room.js';
import { lockObject, unlockObject, getObjectLock, lockZone, unlockZone, getZoneLock } from './collab/locks.js';

type AuthedSocket = Parameters<Parameters<Server['use']>[0]>[0] & {
  data: { userId?: string; role?: string; name?: string };
};

const PRESENCE_PREFIX = 'presence:board:';
const rooms = new Map<string, YRoom>();

function getRoom(boardId: string) {
  const key = `board:${boardId}`;
  const existing = rooms.get(key);
  if (existing) {
    existing.lastUsedAt = Date.now();
    return existing;
  }
  const created = createRoom();
  rooms.set(key, created);
  return created;
}

// basic garbage collection
setInterval(() => {
  const now = Date.now();
  for (const [k, room] of rooms.entries()) {
    if (now - room.lastUsedAt > 1000 * 60 * 30) rooms.delete(k);
  }
}, 1000 * 60 * 10);

// Origens permitidas para WebSocket (navegador pode enviar localhost ou 127.0.0.1)
const allowedOrigins = [
  env.CORS_ORIGIN,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter((o, i, a) => a.indexOf(o) === i);

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    perMessageDeflate: true,
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(null, allowedOrigins[0]);
      },
      credentials: true,
    },
    transports: ['websocket'],
  });

  io.use(async (socket: AuthedSocket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error('missing_token'));
      const session = await getSession(token);
      if (!session) return next(new Error('invalid_token'));

      const user = await prisma.user.findUnique({ where: { id: session.userId } });
      if (!user) return next(new Error('user_not_found'));

      socket.data.userId = user.id;
      socket.data.role = user.role;
      socket.data.name = user.name;
      return next();
    } catch {
      return next(new Error('auth_error'));
    }
  });

  io.on('connection', (socket: AuthedSocket) => {
    inc('socket_connections_total');
    socket.emit('server:hello', { time: new Date().toISOString() });
    socket.join(`user:${socket.data.userId}`);

    // Heartbeat app-level (além do ping/pong nativo)
    const interval = setInterval(() => socket.emit('server:ping', { t: Date.now() }), 25000);
    socket.on('client:pong', () => void 0);

    socket.on('board:join', async ({ boardId }: { boardId: string }) => {
      const roomName = `board:${boardId}`;
      socket.join(roomName);

      // presença simples em Redis
      const key = `${PRESENCE_PREFIX}${boardId}`;
      await redis.sadd(key, socket.data.userId!);
      await redis.expire(key, 60 * 10);
      io.to(roomName).emit('presence:update', { boardId, onlineCount: await redis.scard(key) });

      // Yjs: enviar sync step1 inicial
      const room = getRoom(boardId);
      const step1 = encodeSyncStep1(room.doc);
      socket.emit('yjs:message', step1);

      // Awareness: set local state on server (client também manda)
      socket.emit('board:joined', { boardId });
    });

    socket.on('yjs:message', ({ boardId, data }: { boardId: string; data?: number[] }) => {
      inc('socket_messages_total');
      inc('yjs_messages_total');
      const roomName = `board:${boardId}`;
      const room = getRoom(boardId);
      const payload = Array.isArray(data) ? Uint8Array.from(data) : new Uint8Array(0);
      const reply = handleMessage(room, payload);
      room.lastUsedAt = Date.now();

      // broadcast original to others for update/awareness propagation
      if (Array.isArray(data) && data.length > 0) socket.to(roomName).emit('yjs:message', data);

      // reply to sender if needed (sync step2 etc.)
      if (reply) socket.emit('yjs:message', Array.from(reply));
    });

    socket.on('notif:poll', async (cb?: (p: any) => void) => {
      const userId = socket.data.userId!;
      const items = await prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 });
      cb?.({ items });
    });

    // Queue (LOCKED_ZONE)
    socket.on('zone:queue:join', async ({ zoneId }: { zoneId: string }) => {
      const userId = socket.data.userId!;
      const count = await prisma.editQueueItem.count({ where: { zoneId } });
      await prisma.editQueueItem.create({ data: { zoneId, userId, position: count + 1 } });
      io.emit('zone:queue:update', { zoneId });
    });

    socket.on('zone:queue:leave', async ({ zoneId }: { zoneId: string }) => {
      const userId = socket.data.userId!;
      await prisma.editQueueItem.deleteMany({ where: { zoneId, userId } });
      const items = await prisma.editQueueItem.findMany({ where: { zoneId }, orderBy: { createdAt: 'asc' } });
      await Promise.all(items.map((it: { id: string }, idx: number) => prisma.editQueueItem.update({ where: { id: it.id }, data: { position: idx + 1 } })));
      io.emit('zone:queue:update', { zoneId });
    });

    socket.on('zone:lock:try', async ({ zoneId }: { zoneId: string }, cb?: (p: any) => void) => {
      inc('locks_try_total');
      const userId = socket.data.userId!;
      const ok = await lockZone(zoneId, userId, 120);
      const owner = await getZoneLock(zoneId);
      cb?.({ ok, owner });
      io.emit('zone:lock:update', { zoneId, owner });
    });

    socket.on('zone:lock:release', async ({ zoneId }: { zoneId: string }, cb?: (p: any) => void) => {
      const userId = socket.data.userId!;
      const ok = await unlockZone(zoneId, userId);
      const owner = await getZoneLock(zoneId);
      cb?.({ ok, owner });
      io.emit('zone:lock:update', { zoneId, owner });
    });

    // Object locks
    socket.on('obj:lock:try', async ({ objectId }: { objectId: string }, cb?: (p: any) => void) => {
      inc('locks_try_total');
      const userId = socket.data.userId!;
      const ok = await lockObject(objectId, userId, 120);
      const owner = await getObjectLock(objectId);
      cb?.({ ok, owner });
      io.emit('obj:lock:update', { objectId, owner });
    });

    socket.on('obj:lock:release', async ({ objectId }: { objectId: string }, cb?: (p: any) => void) => {
      const userId = socket.data.userId!;
      const ok = await unlockObject(objectId, userId);
      const owner = await getObjectLock(objectId);
      cb?.({ ok, owner });
      io.emit('obj:lock:update', { objectId, owner });
    });

    socket.on('disconnect', async () => {
      clearInterval(interval);
    });
  });

  return io;
}
