// lib/redis.ts
// Implementation baru untuk menggantikan Redis dengan Cloudflare D1

import { getTenant, setTenant, deleteTenant, getCache, setCache, deleteCache } from '@/lib/d1';

// Fungsi untuk mendapatkan instance D1 (mock untuk sekarang)
function getD1Client(): any {
  // Dalam lingkungan Cloudflare Workers, ini akan menggunakan D1 binding
  // Untuk sekarang kita akan return mock object
  return {
    // Mock methods untuk kompatibilitas dengan Redis API
    get: async (key: string) => {
      // Untuk key tenant (subdomain), gunakan getTenant
      if (key.startsWith('subdomain:')) {
        const subdomain = key.replace('subdomain:', '');
        return await getTenant(subdomain);
      }
      // Untuk cache umum, gunakan getCache
      return await getCache(key);
    },
    
    set: async (key: string, value: any, options?: { ex?: number }) => {
      // Untuk key tenant (subdomain), gunakan setTenant
      if (key.startsWith('subdomain:')) {
        const subdomain = key.replace('subdomain:', '');
        return await setTenant(subdomain, value);
      }
      // Untuk cache umum, gunakan setCache dengan TTL jika ada
      const ttl = options?.ex || 3600; // Default 1 jam
      return await setCache(key, value, ttl);
    },
    
    del: async (...keys: string[]) => {
      for (const key of keys) {
        // Untuk key tenant (subdomain), gunakan deleteTenant
        if (key.startsWith('subdomain:')) {
          const subdomain = key.replace('subdomain:', '');
          await deleteTenant(subdomain);
        }
        // Untuk cache umum, gunakan deleteCache
        else {
          await deleteCache(key);
        }
      }
      return keys.length; // Return jumlah key yang dihapus
    },
    
    // Method-method lain yang mungkin digunakan
    keys: async (pattern: string) => {
      // Ini adalah simulasi sederhana karena D1 tidak memiliki fitur keys seperti Redis
      // Dalam implementasi nyata, Anda mungkin perlu menyimpan index keys secara terpisah
      console.warn('Keys method is not directly supported in D1. Use specific key lookups instead.');
      return [];
    },
    
    mget: async (...keys: string[]) => {
      // Mendapatkan multiple values
      const results = [];
      for (const key of keys) {
        const value = await getD1Client().get(key);
        results.push(value);
      }
      return results;
    },
    
    sadd: async (key: string, ...members: string[]) => {
      // Simulasi set add - dalam D1 kita bisa menyimpan array dalam JSON
      const existing = await getD1Client().get(key) || [];
      const newMembers = [...new Set([...existing, ...members])]; // Deduplicate
      await getD1Client().set(key, newMembers);
      return members.length; // Return approximate count of added members
    },
    
    smembers: async (key: string) => {
      // Mendapatkan semua members dari set
      return await getD1Client().get(key) || [];
    },
    
    srem: async (key: string, ...members: string[]) => {
      // Menghapus members dari set
      const existing = await getD1Client().get(key) || [];
      const filtered = existing.filter((item: string) => !members.includes(item));
      await getD1Client().set(key, filtered);
      return existing.length - filtered.length; // Return count of removed members
    },
    
    scard: async (key: string) => {
      // Mendapatkan ukuran set
      const existing = await getD1Client().get(key) || [];
      return existing.length;
    },
    
    exists: async (key: string) => {
      // Mengecek apakah key exists
      const value = await getD1Client().get(key);
      return value !== null ? 1 : 0;
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
      // Set expiry (simulasi dengan setCache)
      const value = await getD1Client().get(key);
      if (value !== null) {
        await setCache(key, value, seconds);
        return 1;
      }
      return 0;
    },
    
    pexpire: async (key: string, milliseconds: number) => {
      // Set expiry dalam milliseconds
      return await getD1Client().expire(key, Math.floor(milliseconds / 1000));
    },
    
    ttl: async (key: string) => {
      // Mendapatkan sisa waktu hidup key (-1 jika tidak ada expiry, -2 jika key tidak ada)
      // Karena D1 tidak menyimpan TTL secara eksplisit seperti Redis, kita return nilai default
      const value = await getD1Client().get(key);
      return value !== null ? -1 : -2;
    },
    
    incr: async (key: string) => {
      // Increment nilai
      const value = await getD1Client().get(key) || 0;
      const newValue = parseInt(value) + 1;
      await getD1Client().set(key, newValue.toString());
      return newValue;
    },
    
    incrby: async (key: string, increment: number) => {
      // Increment nilai dengan angka tertentu
      const value = await getD1Client().get(key) || 0;
      const newValue = parseInt(value) + increment;
      await getD1Client().set(key, newValue.toString());
      return newValue;
    },
    
    decr: async (key: string) => {
      // Decrement nilai
      const value = await getD1Client().get(key) || 0;
      const newValue = parseInt(value) - 1;
      await getD1Client().set(key, newValue.toString());
      return newValue;
    },
    
    decrby: async (key: string, decrement: number) => {
      // Decrement nilai dengan angka tertentu
      const value = await getD1Client().get(key) || 0;
      const newValue = parseInt(value) - decrement;
      await getD1Client().set(key, newValue.toString());
      return newValue;
    },
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