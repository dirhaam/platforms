// lib/d1.ts
// Implementasi baru untuk menggantikan Redis dengan Cloudflare D1

import { D1DatabaseService } from '@/lib/database/d1-client';

let cachedService: D1DatabaseService | null = null;

function getD1Service(env?: any): D1DatabaseService {
  if (env) {
    // Jangan cache instance yang dibuat dengan env khusus context Workers.
    return new D1DatabaseService(env);
  }

  if (!cachedService) {
    cachedService = new D1DatabaseService();
  }

  return cachedService;
}

// Fungsi untuk menguji koneksi D1
export async function testD1Connection(env?: any): Promise<boolean> {
  try {
    const service = getD1Service(env);
    const key = `d1_healthcheck_${Date.now()}`;
    const setResult = await service.setCache(key, 'ok', 30);
    if (!setResult) {
      return false;
    }
    await service.deleteCache(key);
    return true;
  } catch (error) {
    console.error('D1 connection failed:', error);
    return false;
  }
}

// Fungsi-fungsi tambahan yang bisa digunakan sebagai pengganti operasi Redis
export async function setTenant(subdomain: string, tenantData: any, env?: any): Promise<boolean> {
  try {
    const service = getD1Service(env);
    return await service.setTenant(subdomain, tenantData);
  } catch (error) {
    console.error('Error setting tenant in D1:', error);
    return false;
  }
}

export async function getTenant(subdomain: string, env?: any): Promise<any | null> {
  try {
    const service = getD1Service(env);
    return await service.getTenant(subdomain);
  } catch (error) {
    console.error('Error getting tenant from D1:', error);
    return null;
  }
}

export async function deleteTenant(subdomain: string, env?: any): Promise<boolean> {
  try {
    const service = getD1Service(env);
    return await service.deleteTenant(subdomain);
  } catch (error) {
    console.error('Error deleting tenant from D1:', error);
    return false;
  }
}

export async function setSession(sessionId: string, userId: string, tenantId: string, sessionData: any, ttl: number = 86400, env?: any): Promise<boolean> {
  try {
    const service = getD1Service(env);
    return await service.setSession(sessionId, userId, tenantId, sessionData, ttl);
  } catch (error) {
    console.error('Error setting session in D1:', error);
    return false;
  }
}

export async function getSession(sessionId: string, env?: any): Promise<any | null> {
  try {
    const service = getD1Service(env);
    return await service.getSession(sessionId);
  } catch (error) {
    console.error('Error getting session from D1:', error);
    return null;
  }
}

export async function deleteSession(sessionId: string, env?: any): Promise<boolean> {
  try {
    const service = getD1Service(env);
    return await service.deleteSession(sessionId);
  } catch (error) {
    console.error('Error deleting session from D1:', error);
    return false;
  }
}

export async function setCache(key: string, value: any, ttl: number = 3600, env?: any): Promise<boolean> {
  try {
    const service = getD1Service(env);
    return await service.setCache(key, value, ttl);
  } catch (error) {
    console.error('Error setting cache in D1:', error);
    return false;
  }
}

export async function getCache(key: string, env?: any): Promise<any | null> {
  try {
    const service = getD1Service(env);
    return await service.getCache(key);
  } catch (error) {
    console.error('Error getting cache from D1:', error);
    return null;
  }
}

export async function deleteCache(key: string, env?: any): Promise<boolean> {
  try {
    const service = getD1Service(env);
    return await service.deleteCache(key);
  } catch (error) {
    console.error('Error deleting cache from D1:', error);
    return false;
  }
}

export async function cleanupExpiredData(env?: any): Promise<boolean> {
  try {
    const service = getD1Service(env);
    return await service.cleanupExpiredData();
  } catch (error) {
    console.error('Error cleaning up expired data:', error);
    return false;
  }
}

export async function deleteCacheByPattern(pattern: string, env?: any): Promise<number> {
  const service = getD1Service(env);
  return await service.deleteCacheByPattern(pattern);
}

export async function listCacheKeys(pattern?: string, env?: any): Promise<string[]> {
  const service = getD1Service(env);
  return await service.listCacheKeys(pattern ?? '%');
}

export async function listTenantSubdomains(pattern?: string, env?: any): Promise<string[]> {
  const service = getD1Service(env);
  return await service.listTenantSubdomains(pattern ?? '%');
}