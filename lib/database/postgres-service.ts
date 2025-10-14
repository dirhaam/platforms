// lib/database/postgres-service.ts
// PostgreSQL-based implementation to replace D1 functionality

import { db } from '@/lib/database';
import { tenantSubdomains, sessions, cache } from '@/lib/database/schema';
import { eq, like, and, or } from 'drizzle-orm';

// Fungsi untuk menguji koneksi PostgreSQL
export async function testPostgresConnection(): Promise<boolean> {
  try {
    // Try a simple query to test the connection
    const result = await db.select().from(tenantSubdomains).limit(1);
    return true;
  } catch (error) {
    console.error('PostgreSQL connection failed:', error);
    return false;
  }
}

// Fungsi-fungsi untuk mengelola tenant
export async function setTenant(subdomain: string, tenantData: any): Promise<boolean> {
  try {
    await db.insert(tenantSubdomains).values({
      subdomain,
      tenantData,
    }).onConflictDoUpdate({
      target: tenantSubdomains.subdomain,
      set: { tenantData, updatedAt: new Date() }
    });
    return true;
  } catch (error) {
    console.error('Error setting tenant in PostgreSQL:', error);
    return false;
  }
}

export async function getTenant(subdomain: string): Promise<any | null> {
  try {
    const result = await db.select().from(tenantSubdomains).where(eq(tenantSubdomains.subdomain, subdomain));
    if (result.length > 0) {
      return result[0].tenantData;
    }
    return null;
  } catch (error) {
    console.error('Error getting tenant from PostgreSQL:', error);
    return null;
  }
}

export async function deleteTenant(subdomain: string): Promise<boolean> {
  try {
    await db.delete(tenantSubdomains).where(eq(tenantSubdomains.subdomain, subdomain));
    return true;
  } catch (error) {
    console.error('Error deleting tenant from PostgreSQL:', error);
    return false;
  }
}

// Fungsi-fungsi untuk mengelola session
export async function setSession(sessionId: string, userId: string, tenantId: string, sessionData: any, ttl: number = 86400): Promise<boolean> {
  try {
    const expiresAt = new Date(Date.now() + ttl * 1000);
    await db.insert(sessions).values({
      id: sessionId,
      userId,
      tenantId,
      sessionData,
      expiresAt,
    }).onConflictDoUpdate({
      target: sessions.id,
      set: { userId, tenantId, sessionData, expiresAt, updatedAt: new Date() }
    });
    return true;
  } catch (error) {
    console.error('Error setting session in PostgreSQL:', error);
    return false;
  }
}

export async function getSession(sessionId: string): Promise<any | null> {
  try {
    const result = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (result.length > 0) {
      const session = result[0];
      // Check if session is expired
      if (session.expiresAt && new Date() > session.expiresAt) {
        await deleteSession(sessionId);
        return null;
      }
      return {
        id: session.id,
        userId: session.userId,
        tenantId: session.tenantId,
        data: session.sessionData,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting session from PostgreSQL:', error);
    return null;
  }
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    return true;
  } catch (error) {
    console.error('Error deleting session from PostgreSQL:', error);
    return false;
  }
}

// Fungsi-fungsi untuk mengelola cache
export async function setCache(key: string, value: any, ttl: number = 3600): Promise<boolean> {
  try {
    const expiresAt = new Date(Date.now() + ttl * 1000);
    await db.insert(cache).values({
      key,
      value,
      expiresAt,
    }).onConflictDoUpdate({
      target: cache.key,
      set: { value, expiresAt, updatedAt: new Date() }
    });
    return true;
  } catch (error) {
    console.error('Error setting cache in PostgreSQL:', error);
    return false;
  }
}

export async function getCache(key: string): Promise<any | null> {
  try {
    const result = await db.select().from(cache).where(eq(cache.key, key));
    if (result.length > 0) {
      const cacheEntry = result[0];
      // Check if cache is expired
      if (cacheEntry.expiresAt && new Date() > cacheEntry.expiresAt) {
        await deleteCache(key);
        return null;
      }
      return cacheEntry.value;
    }
    return null;
  } catch (error) {
    console.error('Error getting cache from PostgreSQL:', error);
    return null;
  }
}

export async function deleteCache(key: string): Promise<boolean> {
  try {
    await db.delete(cache).where(eq(cache.key, key));
    return true;
  } catch (error) {
    console.error('Error deleting cache from PostgreSQL:', error);
    return false;
  }
}

// Membersihkan data yang kadaluarsa
export async function cleanupExpiredData(): Promise<boolean> {
  try {
    const now = new Date();
    await db.delete(sessions).where(or(
      eq(sessions.expiresAt, null),
      and(sessions.expiresAt < now)
    ));
    await db.delete(cache).where(or(
      eq(cache.expiresAt, null),
      and(cache.expiresAt < now)
    ));
    return true;
  } catch (error) {
    console.error('Error cleaning up expired data:', error);
    return false;
  }
}

// Fungsi tambahan untuk cache pattern (menggunakan LIKE operator)
export async function deleteCacheByPattern(pattern: string): Promise<number> {
  try {
    const likePattern = pattern.replace(/\*/g, '%');
    const result = await db.delete(cache).where(like(cache.key, likePattern));
    return result;
  } catch (error) {
    console.error('Error deleting cache by pattern in PostgreSQL:', error);
    return 0;
  }
}

export async function listCacheKeys(pattern: string = '%'): Promise<string[]> {
  try {
    const likePattern = pattern.replace(/\*/g, '%');
    const result = await db.select({ key: cache.key }).from(cache).where(like(cache.key, likePattern));
    return result.map(row => row.key);
  } catch (error) {
    console.error('Error listing cache keys from PostgreSQL:', error);
    return [];
  }
}

export async function listTenantSubdomains(pattern: string = '%'): Promise<string[]> {
  try {
    const likePattern = pattern.replace(/\*/g, '%');
    const result = await db.select({ subdomain: tenantSubdomains.subdomain }).from(tenantSubdomains).where(like(tenantSubdomains.subdomain, likePattern));
    return result.map(row => row.subdomain);
  } catch (error) {
    console.error('Error listing tenant subdomains from PostgreSQL:', error);
    return [];
  }
}