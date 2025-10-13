// lib/redis.ts
// Implementation baru untuk menggantikan Redis dengan Cloudflare D1

import {
  getTenant,
  setTenant,
  deleteTenant,
  getCache,
  setCache,
  deleteCache,
  listCacheKeys,
  listTenantSubdomains,
} from '@/lib/d1';

const SUBDOMAIN_PREFIX = 'subdomain:';

async function getValue(key: string): Promise<any> {
  if (key.startsWith(SUBDOMAIN_PREFIX)) {
    const subdomain = key.slice(SUBDOMAIN_PREFIX.length);
    return await getTenant(subdomain);
  }

  return await getCache(key);
}

async function setValue(key: string, value: any, ttl?: number): Promise<boolean> {
  if (key.startsWith(SUBDOMAIN_PREFIX)) {
    const subdomain = key.slice(SUBDOMAIN_PREFIX.length);
    return await setTenant(subdomain, value);
  }

  return await setCache(key, value, ttl);
}

async function deleteValue(key: string): Promise<boolean> {
  if (key.startsWith(SUBDOMAIN_PREFIX)) {
    const subdomain = key.slice(SUBDOMAIN_PREFIX.length);
    const existing = await getTenant(subdomain);
    if (!existing) {
      return false;
    }
    return await deleteTenant(subdomain);
  }

  const existing = await getCache(key);
  if (existing === null || existing === undefined) {
    return false;
  }
  return await deleteCache(key);
}

async function listKeys(pattern: string): Promise<string[]> {
  if (pattern.startsWith(SUBDOMAIN_PREFIX)) {
    const suffixPattern = pattern.slice(SUBDOMAIN_PREFIX.length) || '*';
    const subdomains = await listTenantSubdomains(suffixPattern);
    return subdomains.map(sub => `${SUBDOMAIN_PREFIX}${sub}`);
  }

  return await listCacheKeys(pattern);
}

function normaliseStop(length: number, stop: number): number {
  if (stop < 0) {
    const computed = length + stop;
    return computed < 0 ? 0 : computed;
  }
  return stop;
}

class RedisPipeline {
  private commands: Array<() => Promise<any>> = [];

  set(key: string, value: any) {
    this.commands.push(() => setValue(key, value));
    return this;
  }

  del(key: string) {
    this.commands.push(() => deleteValue(key));
    return this;
  }

  async exec() {
    const results: any[] = [];
    for (const command of this.commands) {
      results.push(await command());
    }
    this.commands = [];
    return results;
  }
}

// Fungsi untuk mendapatkan instance D1 (mock untuk sekarang)
function getD1Client(): any {
  // Dalam lingkungan Cloudflare Workers, ini akan menggunakan D1 binding
  // Untuk sekarang kita akan return mock object
  return {
    // Mock methods untuk kompatibilitas dengan Redis API
    get: async (key: string) => {
      return await getValue(key);
    },
    
    set: async (key: string, value: any, options?: { ex?: number }) => {
      return await setValue(key, value, options?.ex);
    },
    
    del: async (...keys: string[]) => {
      let deleted = 0;
      for (const key of keys) {
        if (await deleteValue(key)) {
          deleted++;
        }
      }
      return deleted;
    },
    
    // Method-method lain yang mungkin digunakan
    keys: async (pattern: string) => {
      return await listKeys(pattern);
    },
    
    mget: async (...keys: string[]) => {
      return await Promise.all(keys.map(key => getValue(key)));
    },
    
    sadd: async (key: string, ...members: string[]) => {
      const existing = await getValue(key);
      const current = Array.isArray(existing) ? new Set(existing) : new Set<string>();
      let added = 0;
      for (const member of members) {
        if (!current.has(member)) {
          current.add(member);
          added++;
        }
      }
      await setValue(key, Array.from(current));
      return added;
    },
    
    smembers: async (key: string) => {
      const existing = await getValue(key);
      return Array.isArray(existing) ? existing : [];
    },
    
    srem: async (key: string, ...members: string[]) => {
      const existing = await getValue(key);
      if (!Array.isArray(existing)) {
        return 0;
      }
      const initialLength = existing.length;
      const filtered = existing.filter((item: string) => !members.includes(item));
      await setValue(key, filtered);
      return initialLength - filtered.length;
    },
    
    scard: async (key: string) => {
      const existing = await getValue(key);
      return Array.isArray(existing) ? existing.length : 0;
    },
    
    exists: async (key: string) => {
      const value = await getValue(key);
      return value !== null && value !== undefined ? 1 : 0;
    },
    
    ping: async () => {
      // Test connection
      return 'PONG';
    },
    
    flushall: async () => {
      // Flush all data (simulasi - dalam praktiknya kita tidak akan menghapus semua data)
      console.warn('Flushall is not recommended in production. Use specific key deletions instead.');
      return 'OK';
    },
    
    expire: async (key: string, seconds: number) => {
      const value = await getValue(key);
      if (value === null || value === undefined) {
        return 0;
      }
      await setValue(key, value, seconds);
      return 1;
    },
    
    pexpire: async (key: string, milliseconds: number) => {
      return await getD1Client().expire(key, Math.floor(milliseconds / 1000));
    },
    
    ttl: async (key: string) => {
      const value = await getValue(key);
      return value !== null && value !== undefined ? -1 : -2;
    },
    
    incr: async (key: string) => {
      const value = await getValue(key);
      const current = parseInt(value ?? '0', 10) || 0;
      const next = current + 1;
      await setValue(key, next.toString());
      return next;
    },
    
    incrby: async (key: string, increment: number) => {
      const value = await getValue(key);
      const current = parseInt(value ?? '0', 10) || 0;
      const next = current + increment;
      await setValue(key, next.toString());
      return next;
    },
    
    decr: async (key: string) => {
      const value = await getValue(key);
      const current = parseInt(value ?? '0', 10) || 0;
      const next = current - 1;
      await setValue(key, next.toString());
      return next;
    },
    
    decrby: async (key: string, decrement: number) => {
      const value = await getValue(key);
      const current = parseInt(value ?? '0', 10) || 0;
      const next = current - decrement;
      await setValue(key, next.toString());
      return next;
    },

    lpush: async (key: string, value: any) => {
      const existing = await getValue(key);
      const list = Array.isArray(existing) ? existing : [];
      list.unshift(value);
      await setValue(key, list);
      return list.length;
    },

    ltrim: async (key: string, start: number, stop: number) => {
      const existing = await getValue(key);
      if (!Array.isArray(existing)) {
        return 'OK';
      }
      const normalizedStop = normaliseStop(existing.length, stop);
      const trimmed = existing.slice(start, normalizedStop + 1);
      await setValue(key, trimmed);
      return 'OK';
    },

    lrange: async (key: string, start: number, stop: number) => {
      const existing = await getValue(key);
      if (!Array.isArray(existing)) {
        return [];
      }
      const normalizedStop = normaliseStop(existing.length, stop);
      return existing.slice(start, normalizedStop + 1);
    },

    pipeline: () => new RedisPipeline(),
  };
}

// Export the D1-compatible instance
export const redis = getD1Client();

// Test D1 connection
export async function testRedisConnection(): Promise<boolean> {
  try {
    if (typeof window !== 'undefined') {
      return false; // Cannot test on client-side
    }
    
    const client = getD1Client();
    const result = await client.ping();
    return result === 'PONG';
  } catch (error) {
    console.error('D1 connection failed:', error);
    return false;
  }
}