import { redis } from '../redis';

const OBJ_PREFIX = 'lock:obj:';
const ZONE_PREFIX = 'lock:zone:';

export async function lockObject(objectId: string, userId: string, ttlSeconds = 120) {
  const key = `${OBJ_PREFIX}${objectId}`;
  // set if not exists
  const ok = await redis.set(key, userId, 'EX', ttlSeconds, 'NX');
  return ok === 'OK';
}
export async function unlockObject(objectId: string, userId: string) {
  const key = `${OBJ_PREFIX}${objectId}`;
  const owner = await redis.get(key);
  if (!owner) return true;
  if (owner !== userId) return false;
  await redis.del(key);
  return true;
}
export async function getObjectLock(objectId: string) {
  return redis.get(`${OBJ_PREFIX}${objectId}`);
}

export async function lockZone(zoneId: string, userId: string, ttlSeconds = 120) {
  const key = `${ZONE_PREFIX}${zoneId}`;
  const ok = await redis.set(key, userId, 'EX', ttlSeconds, 'NX');
  return ok === 'OK';
}
export async function unlockZone(zoneId: string, userId: string) {
  const key = `${ZONE_PREFIX}${zoneId}`;
  const owner = await redis.get(key);
  if (!owner) return true;
  if (owner !== userId) return false;
  await redis.del(key);
  return true;
}
export async function getZoneLock(zoneId: string) {
  return redis.get(`${ZONE_PREFIX}${zoneId}`);
}
