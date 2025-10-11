// lib/database/d1-client.ts
// Client untuk berinteraksi dengan Cloudflare D1

import { D1Database } from '@cloudflare/workers-types';

// Interface untuk D1 client
export interface D1Client {
  query(sql: string): any;
  prepare(sql: string): any;
  batch(queries: string[]): any;
}

// Fungsi untuk membuat koneksi ke D1 (dalam lingkungan Cloudflare Workers)
export function createD1Connection(env: any): D1Database | null {
  if (env && env.D1_DATABASE) {
    return env.D1_DATABASE;
  }
  
  console.warn('D1_DATABASE environment variable not found');
  return null;
}

// Alternatif: Fungsi untuk operasi database D1
export class D1DatabaseService {
  private db: D1Database | null;
  
  constructor(env: any) {
    this.db = createD1Connection(env);
  }
  
  // Operasi untuk menyimpan data tenant (menggantikan operasi Redis)
  async setTenant(subdomain: string, tenantData: any): Promise<boolean> {
    if (!this.db) {
      throw new Error('D1 Database not available');
    }
    
    try {
      const sql = `
        INSERT INTO tenant_subdomains (id, subdomain, tenant_data, created_at, updated_at) 
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
        ON CONFLICT(subdomain) DO UPDATE SET 
          tenant_data = excluded.tenant_data,
          updated_at = excluded.updated_at
      `;
      
      const id = `tenant_${subdomain}_${Date.now()}`;
      await this.db.prepare(sql)
        .bind(id, subdomain, JSON.stringify(tenantData))
        .run();
      
      return true;
    } catch (error) {
      console.error('Error setting tenant in D1:', error);
      return false;
    }
  }
  
  // Operasi untuk mendapatkan data tenant (menggantikan operasi Redis)
  async getTenant(subdomain: string): Promise<any | null> {
    if (!this.db) {
      throw new Error('D1 Database not available');
    }
    
    try {
      const sql = 'SELECT tenant_data FROM tenant_subdomains WHERE subdomain = ?';
      const result = await this.db.prepare(sql)
        .bind(subdomain)
        .first();
      
      return result ? JSON.parse(result.tenant_data) : null;
    } catch (error) {
      console.error('Error getting tenant from D1:', error);
      return null;
    }
  }
  
  // Operasi untuk menghapus data tenant (menggantikan operasi Redis)
  async deleteTenant(subdomain: string): Promise<boolean> {
    if (!this.db) {
      throw new Error('D1 Database not available');
    }
    
    try {
      const sql = 'DELETE FROM tenant_subdomains WHERE subdomain = ?';
      await this.db.prepare(sql)
        .bind(subdomain)
        .run();
      
      return true;
    } catch (error) {
      console.error('Error deleting tenant from D1:', error);
      return false;
    }
  }
  
  // Operasi untuk menyimpan session
  async setSession(sessionId: string, userId: string, tenantId: string, sessionData: any, ttl: number = 86400): Promise<boolean> {
    if (!this.db) {
      throw new Error('D1 Database not available');
    }
    
    try {
      const expiresAt = new Date(Date.now() + ttl * 1000);
      const sql = `
        INSERT INTO sessions (id, user_id, tenant_id, session_data, expires_at, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
        ON CONFLICT(id) DO UPDATE SET 
          user_id = excluded.user_id,
          tenant_id = excluded.tenant_id,
          session_data = excluded.session_data,
          expires_at = excluded.expires_at,
          updated_at = excluded.updated_at
      `;
      
      await this.db.prepare(sql)
        .bind(sessionId, userId, tenantId, JSON.stringify(sessionData), expiresAt.toISOString())
        .run();
      
      return true;
    } catch (error) {
      console.error('Error setting session in D1:', error);
      return false;
    }
  }
  
  // Operasi untuk mendapatkan session
  async getSession(sessionId: string): Promise<any | null> {
    if (!this.db) {
      throw new Error('D1 Database not available');
    }
    
    try {
      const now = new Date().toISOString();
      const sql = 'SELECT * FROM sessions WHERE id = ? AND (expires_at IS NULL OR expires_at > ?)';
      const result = await this.db.prepare(sql)
        .bind(sessionId, now)
        .first();
      
      if (!result) return null;
      
      return {
        id: result.id,
        userId: result.user_id,
        tenantId: result.tenant_id,
        data: JSON.parse(result.session_data),
      };
    } catch (error) {
      console.error('Error getting session from D1:', error);
      return null;
    }
  }
  
  // Operasi untuk menghapus session
  async deleteSession(sessionId: string): Promise<boolean> {
    if (!this.db) {
      throw new Error('D1 Database not available');
    }
    
    try {
      const sql = 'DELETE FROM sessions WHERE id = ?';
      await this.db.prepare(sql)
        .bind(sessionId)
        .run();
      
      return true;
    } catch (error) {
      console.error('Error deleting session from D1:', error);
      return false;
    }
  }
  
  // Operasi untuk menyimpan cache
  async setCache(key: string, value: any, ttl: number = 3600): Promise<boolean> {
    if (!this.db) {
      throw new Error('D1 Database not available');
    }
    
    try {
      const expiresAt = new Date(Date.now() + ttl * 1000);
      const sql = `
        INSERT INTO cache (key, value, expires_at, created_at) 
        VALUES (?, ?, ?, CURRENT_TIMESTAMP) 
        ON CONFLICT(key) DO UPDATE SET 
          value = excluded.value,
          expires_at = excluded.expires_at
      `;
      
      await this.db.prepare(sql)
        .bind(key, JSON.stringify(value), expiresAt.toISOString())
        .run();
      
      return true;
    } catch (error) {
      console.error('Error setting cache in D1:', error);
      return false;
    }
  }
  
  // Operasi untuk mendapatkan cache
  async getCache(key: string): Promise<any | null> {
    if (!this.db) {
      throw new Error('D1 Database not available');
    }
    
    try {
      const now = new Date().toISOString();
      const sql = 'SELECT value FROM cache WHERE key = ? AND (expires_at IS NULL OR expires_at > ?)';
      const result = await this.db.prepare(sql)
        .bind(key, now)
        .first();
      
      return result ? JSON.parse(result.value) : null;
    } catch (error) {
      console.error('Error getting cache from D1:', error);
      return null;
    }
  }
  
  // Operasi untuk menghapus cache
  async deleteCache(key: string): Promise<boolean> {
    if (!this.db) {
      throw new Error('D1 Database not available');
    }
    
    try {
      const sql = 'DELETE FROM cache WHERE key = ?';
      await this.db.prepare(sql)
        .bind(key)
        .run();
      
      return true;
    } catch (error) {
      console.error('Error deleting cache from D1:', error);
      return false;
    }
  }
  
  // Fungsi untuk membersihkan data yang kadaluarsa
  async cleanupExpiredData(): Promise<boolean> {
    if (!this.db) {
      throw new Error('D1 Database not available');
    }
    
    try {
      const now = new Date().toISOString();
      
      // Hapus session yang kadaluarsa
      await this.db.prepare('DELETE FROM sessions WHERE expires_at < ?')
        .bind(now)
        .run();
      
      // Hapus cache yang kadaluarsa
      await this.db.prepare('DELETE FROM cache WHERE expires_at < ?')
        .bind(now)
        .run();
      
      return true;
    } catch (error) {
      console.error('Error cleaning up expired data:', error);
      return false;
    }
  }
}