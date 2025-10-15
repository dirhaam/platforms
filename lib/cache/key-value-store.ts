import {
  deleteCache,
  getCache,
  setCache,
  listCacheKeys,
} from '@/lib/database-service';

type JsonValue = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

async function readCache<T = JsonValue>(key: string): Promise<T | null> {
  const value = await getCache(key);
  return (value ?? null) as T | null;
}

async function writeCache<T = JsonValue>(key: string, value: T, ttl?: number): Promise<void> {
  await setCache(key, value, ttl);
}

export async function kvGet<T = JsonValue>(key: string): Promise<T | null> {
  return await readCache<T>(key);
}

export async function kvSet<T = JsonValue>(key: string, value: T, ttl?: number): Promise<void> {
  await writeCache(key, value, ttl);
}

export async function kvDelete(key: string): Promise<void> {
  await deleteCache(key);
}

export async function kvExpire(key: string, ttl: number): Promise<void> {
  const current = await kvGet<JsonValue>(key);
  if (current === null) {
    return;
  }
  await kvSet(key, current, ttl);
}

export async function kvList(pattern: string): Promise<string[]> {
  return await listCacheKeys(pattern);
}

export async function kvGetSet(key: string): Promise<string[]> {
  const existing = await kvGet<string[]>(key);
  return Array.isArray(existing) ? existing : [];
}

export async function kvAddToSet(key: string, value: string): Promise<void> {
  const set = await kvGetSet(key);
  if (!set.includes(value)) {
    set.push(value);
    await kvSet(key, set);
  }
}

export async function kvRemoveFromSet(key: string, value: string): Promise<void> {
  const set = await kvGetSet(key);
  const filtered = set.filter(item => item !== value);
  await kvSet(key, filtered);
}

export async function kvPushToList<T = JsonValue>(key: string, value: T, maxLength?: number): Promise<void> {
  const existing = await kvGet<T[]>(key);
  const list = Array.isArray(existing) ? existing : [];
  list.unshift(value);
  if (typeof maxLength === 'number' && maxLength >= 0) {
    list.splice(maxLength);
  }
  await kvSet(key, list);
}

export async function kvGetList<T = JsonValue>(key: string, start = 0, stop = -1): Promise<T[]> {
  const list = await kvGet<T[]>(key);
  if (!Array.isArray(list)) {
    return [];
  }
  const endIndex = stop >= 0 ? stop + 1 : list.length;
  return list.slice(start, endIndex);
}

export async function kvTrimList(key: string, maxLength: number): Promise<void> {
  const list = await kvGet<JsonValue[]>(key);
  if (!Array.isArray(list)) {
    return;
  }
  const trimmed = list.slice(0, maxLength);
  await kvSet(key, trimmed);
}
