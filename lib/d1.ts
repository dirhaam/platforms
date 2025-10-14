// lib/d1.ts
// PostgreSQL implementation to replace D1 functionality

import {
  testPostgresConnection,
  setTenant as setTenantPg,
  getTenant as getTenantPg,
  deleteTenant as deleteTenantPg,
  setSession as setSessionPg,
  getSession as getSessionPg,
  deleteSession as deleteSessionPg,
  setCache as setCachePg,
  getCache as getCachePg,
  deleteCache as deleteCachePg,
  cleanupExpiredData as cleanupExpiredDataPg,
  deleteCacheByPattern as deleteCacheByPatternPg,
  listCacheKeys as listCacheKeysPg,
  listTenantSubdomains as listTenantSubdomainsPg,
} from '@/lib/database/postgres-service';

// Fungsi untuk menguji koneksi PostgreSQL
export async function testD1Connection(): Promise<boolean> {
  try {
    return await testPostgresConnection();
  } catch (error) {
    console.error('PostgreSQL connection failed:', error);
    return false;
  }
}

// Fungsi-fungsi tambahan yang bisa digunakan sebagai pengganti operasi Redis
export async function setTenant(subdomain: string, tenantData: any): Promise<boolean> {
  try {
    return await setTenantPg(subdomain, tenantData);
  } catch (error) {
    console.error('Error setting tenant in PostgreSQL:', error);
    return false;
  }
}

export async function getTenant(subdomain: string): Promise<any | null> {
  try {
    return await getTenantPg(subdomain);
  } catch (error) {
    console.error('Error getting tenant from PostgreSQL:', error);
    return null;
  }
}

export async function deleteTenant(subdomain: string): Promise<boolean> {
  try {
    return await deleteTenantPg(subdomain);
  } catch (error) {
    console.error('Error deleting tenant from PostgreSQL:', error);
    return false;
  }
}

export async function setSession(sessionId: string, userId: string, tenantId: string, sessionData: any, ttl: number = 86400): Promise<boolean> {
  try {
    return await setSessionPg(sessionId, userId, tenantId, sessionData, ttl);
  } catch (error) {
    console.error('Error setting session in PostgreSQL:', error);
    return false;
  }
}

export async function getSession(sessionId: string): Promise<any | null> {
  try {
    return await getSessionPg(sessionId);
  } catch (error) {
    console.error('Error getting session from PostgreSQL:', error);
    return null;
  }
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    return await deleteSessionPg(sessionId);
  } catch (error) {
    console.error('Error deleting session from PostgreSQL:', error);
    return false;
  }
}

export async function setCache(key: string, value: any, ttl: number = 3600): Promise<boolean> {
  try {
    return await setCachePg(key, value, ttl);
  } catch (error) {
    console.error('Error setting cache in PostgreSQL:', error);
    return false;
  }
}

export async function getCache(key: string): Promise<any | null> {
  try {
    return await getCachePg(key);
  } catch (error) {
    console.error('Error getting cache from PostgreSQL:', error);
    return null;
  }
}

export async function deleteCache(key: string): Promise<boolean> {
  try {
    return await deleteCachePg(key);
  } catch (error) {
    console.error('Error deleting cache from PostgreSQL:', error);
    return false;
  }
}

export async function cleanupExpiredData(): Promise<boolean> {
  try {
    return await cleanupExpiredDataPg();
  } catch (error) {
    console.error('Error cleaning up expired data:', error);
    return false;
  }
}

export async function deleteCacheByPattern(pattern: string): Promise<number> {
  return await deleteCacheByPatternPg(pattern);
}

export async function listCacheKeys(pattern?: string): Promise<string[]> {
  return await listCacheKeysPg(pattern ?? '%');
}

export async function listTenantSubdomains(pattern?: string): Promise<string[]> {
  return await listTenantSubdomainsPg(pattern ?? '%');
}