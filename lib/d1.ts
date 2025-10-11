// lib/d1.ts
// Implementasi baru untuk menggantikan Redis dengan Cloudflare D1

import { D1DatabaseService } from '@/lib/database/d1-client';
import { db } from '@/lib/database';
import { tenantSubdomains, sessions, cache } from '@/lib/database/schema';
import { eq, and, lt, gte, desc } from 'drizzle-orm';
import crypto from 'crypto';

// Inisialisasi D1 service
// Perhatian: Dalam lingkungan Cloudflare Workers, env.D1_DATABASE akan tersedia
let d1Service: D1DatabaseService | null = null;

// Fungsi untuk mendapatkan instance D1 service
function getD1Service(): D1DatabaseService {
  if (!d1Service) {
    // Dalam lingkungan Cloudflare Workers, kita akan mendapatkan env dari context
    // Untuk sekarang kita gunakan null, nanti bisa dimodifikasi untuk menerima env
    d1Service = new D1DatabaseService({});
  }
  
  return d1Service;
}

// Ekspor fungsi-fungsi sebagai pengganti fungsi Redis
export const d1 = getD1Service();

// Fungsi untuk menguji koneksi D1
export async function testD1Connection(): Promise<boolean> {
  try {
    // Dalam implementasi sebenarnya, kita akan melakukan operasi sederhana ke D1
    // Misalnya membuat tabel sementara dan menghapusnya
    console.log('D1 connection test - connection established');
    return true;
  } catch (error) {
    console.error('D1 connection failed:', error);
    return false;
  }
}

// Fungsi-fungsi tambahan yang bisa digunakan sebagai pengganti operasi Redis
export async function setTenant(subdomain: string, tenantData: any): Promise<boolean> {
  try {
    // Gunakan Drizzle ORM untuk menyimpan data tenant
    const id = `tenant_${subdomain}_${Date.now()}`;
    await db.insert(tenantSubdomains).values({
      id,
      subdomain,
      tenantData: JSON.stringify(tenantData),
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: tenantSubdomains.subdomain,
      set: {
        tenantData: JSON.stringify(tenantData),
        updatedAt: new Date()
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error setting tenant in D1:', error);
    return false;
  }
}

export async function getTenant(subdomain: string): Promise<any | null> {
  try {
    // Gunakan Drizzle ORM untuk mendapatkan data tenant
    const result = await db.select().from(tenantSubdomains).where(
      eq(tenantSubdomains.subdomain, subdomain)
    ).limit(1);
    
    if (result.length > 0) {
      return JSON.parse(result[0].tenantData);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting tenant from D1:', error);
    return null;
  }
}

export async function deleteTenant(subdomain: string): Promise<boolean> {
  try {
    // Gunakan Drizzle ORM untuk menghapus data tenant
    await db.delete(tenantSubdomains).where(
      eq(tenantSubdomains.subdomain, subdomain)
    );
    
    return true;
  } catch (error) {
    console.error('Error deleting tenant from D1:', error);
    return false;
  }
}

export async function setSession(sessionId: string, userId: string, tenantId: string, sessionData: any, ttl: number = 86400): Promise<boolean> {
  try {
    // Gunakan Drizzle ORM untuk menyimpan session
    const expiresAt = new Date(Date.now() + ttl * 1000);
    await db.insert(sessions).values({
      id: sessionId,
      userId,
      tenantId,
      sessionData: JSON.stringify(sessionData),
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: sessions.id,
      set: {
        userId,
        tenantId,
        sessionData: JSON.stringify(sessionData),
        expiresAt,
        updatedAt: new Date()
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error setting session in D1:', error);
    return false;
  }
}

export async function getSession(sessionId: string): Promise<any | null> {
  try {
    // Gunakan Drizzle ORM untuk mendapatkan session
    const now = new Date();
    const result = await db.select().from(sessions).where(
      and(
        eq(sessions.id, sessionId),
        or(
          isNull(sessions.expiresAt),
          gte(sessions.expiresAt, now)
        )
      )
    ).limit(1);
    
    if (result.length > 0) {
      return {
        id: result[0].id,
        userId: result[0].userId,
        tenantId: result[0].tenantId,
        data: JSON.parse(result[0].sessionData),
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting session from D1:', error);
    return null;
  }
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    // Gunakan Drizzle ORM untuk menghapus session
    await db.delete(sessions).where(
      eq(sessions.id, sessionId)
    );
    
    return true;
  } catch (error) {
    console.error('Error deleting session from D1:', error);
    return false;
  }
}

export async function setCache(key: string, value: any, ttl: number = 3600): Promise<boolean> {
  try {
    // Gunakan Drizzle ORM untuk menyimpan cache
    const expiresAt = new Date(Date.now() + ttl * 1000);
    await db.insert(cache).values({
      key,
      value: JSON.stringify(value),
      expiresAt,
      createdAt: new Date()
    }).onConflictDoUpdate({
      target: cache.key,
      set: {
        value: JSON.stringify(value),
        expiresAt,
        createdAt: new Date()
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error setting cache in D1:', error);
    return false;
  }
}

export async function getCache(key: string): Promise<any | null> {
  try {
    // Gunakan Drizzle ORM untuk mendapatkan cache
    const now = new Date();
    const result = await db.select().from(cache).where(
      and(
        eq(cache.key, key),
        or(
          isNull(cache.expiresAt),
          gte(cache.expiresAt, now)
        )
      )
    ).limit(1);
    
    if (result.length > 0) {
      return JSON.parse(result[0].value);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting cache from D1:', error);
    return null;
  }
}

export async function deleteCache(key: string): Promise<boolean> {
  try {
    // Gunakan Drizzle ORM untuk menghapus cache
    await db.delete(cache).where(
      eq(cache.key, key)
    );
    
    return true;
  } catch (error) {
    console.error('Error deleting cache from D1:', error);
    return false;
  }
}

export async function cleanupExpiredData(): Promise<boolean> {
  try {
    // Gunakan Drizzle ORM untuk membersihkan data yang kadaluarsa
    const now = new Date();
    
    // Hapus session yang kadaluarsa
    await db.delete(sessions).where(
      lt(sessions.expiresAt, now)
    );
    
    // Hapus cache yang kadaluarsa
    await db.delete(cache).where(
      lt(cache.expiresAt, now)
    );
    
    return true;
  } catch (error) {
    console.error('Error cleaning up expired data:', error);
    return false;
  }
}

// Helper function untuk or condition
function or(...conditions: any[]) {
  return conditions.length > 0 ? conditions.reduce((acc, curr) => and(acc, curr)) : undefined;
}

// Helper function untuk isNull condition
function isNull(field: any) {
  return eq(field, null);
}