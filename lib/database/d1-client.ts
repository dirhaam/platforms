// lib/database/d1-client.ts
// Client untuk berinteraksi dengan Cloudflare D1, baik melalui binding langsung maupun REST API.

type QueryParams = unknown[];

export type EdgeD1PreparedStatement = {
  bind(...params: QueryParams): {
    run(): Promise<any>;
    first(): Promise<any | null>;
    all(): Promise<{ results: any[] } | null>;
  };
};

export type EdgeD1Database = {
  prepare(query: string): EdgeD1PreparedStatement;
};

interface StatementExecutionResult {
  rows: any[];
  changes: number;
}

class D1HttpClient {
  private readonly accountId: string;
  private readonly databaseId: string;
  private readonly apiToken: string;
  private readonly baseUrl: string;

  constructor() {
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID ?? '';
    this.databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID ?? '';
    this.apiToken = process.env.CLOUDFLARE_D1_API_TOKEN ?? '';
    this.baseUrl = process.env.CLOUDFLARE_API_BASE_URL ?? 'https://api.cloudflare.com/client/v4';

    if (!this.accountId || !this.databaseId || !this.apiToken) {
      throw new Error(
        'Cloudflare D1 API credentials are missing. Please set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, and CLOUDFLARE_D1_API_TOKEN.'
      );
    }
  }

  private get endpoint(): string {
    return `${this.baseUrl}/accounts/${this.accountId}/d1/database/${this.databaseId}/query`;
  }

  async execute(sql: string, params: QueryParams = []): Promise<StatementExecutionResult> {
    const payload = [
      {
        sql,
        params,
      },
    ];

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      const apiError = data?.errors?.[0]?.message ?? response.statusText;
      throw new Error(`Cloudflare D1 query failed: ${apiError}`);
    }

    const statement = Array.isArray(data.result) ? data.result[0] : null;
    return {
      rows: statement?.results ?? [],
      changes: statement?.meta?.changes ?? 0,
    };
  }

  async first(sql: string, params: QueryParams = []): Promise<any | null> {
    const { rows } = await this.execute(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }
}

// Fungsi untuk membuat koneksi ke D1 (binding hanya tersedia di environment Cloudflare Workers)
export function createD1Connection(env?: any): EdgeD1Database | null {
  if (env && env.D1_DATABASE) {
    return env.D1_DATABASE as EdgeD1Database;
  }
  return null;
}

function createHttpClient(): D1HttpClient | null {
  try {
    return new D1HttpClient();
  } catch (error) {
    console.warn('Cloudflare D1 REST client not configured:', error instanceof Error ? error.message : error);
    return null;
  }
}

class HttpBackedD1Database implements EdgeD1Database {
  constructor(private readonly client: D1HttpClient) {}

  prepare(query: string): EdgeD1PreparedStatement {
    return {
      bind: (...params: QueryParams) => {
        const boundParams = params ?? [];
        return {
          run: async () => {
            const result = await this.client.execute(query, boundParams);
            return { success: true, meta: { changes: result.changes } };
          },
          first: async () => {
            return await this.client.first(query, boundParams);
          },
          all: async () => {
            const result = await this.client.execute(query, boundParams);
            return { results: result.rows };
          },
        };
      },
    };
  }
}

class MissingD1Database implements EdgeD1Database {
  prepare(): EdgeD1PreparedStatement {
    return {
      bind: () => ({
        run: async () => {
          throw new Error('Cloudflare D1 is not configured. Provide D1 binding or REST credentials.');
        },
        first: async () => {
          throw new Error('Cloudflare D1 is not configured. Provide D1 binding or REST credentials.');
        },
        all: async () => {
          throw new Error('Cloudflare D1 is not configured. Provide D1 binding or REST credentials.');
        },
      }),
    };
  }
}

export function createDrizzleD1Database(env?: any): EdgeD1Database {
  const binding = createD1Connection(env);
  if (binding) {
    return binding;
  }

  const client = createHttpClient();
  if (client) {
    return new HttpBackedD1Database(client);
  }

  return new MissingD1Database();
}

export class D1DatabaseService {
  private readonly db: EdgeD1Database | null;
  private readonly httpClient: D1HttpClient | null;

  constructor(env?: any) {
    this.db = createD1Connection(env);
    this.httpClient = this.db ? null : createHttpClient();
  }

  private ensureClient() {
    if (!this.db && !this.httpClient) {
      throw new Error('Cloudflare D1 is not configured. Provide Workers env binding or REST credentials.');
    }
  }

  private async run(sql: string, params: QueryParams = []): Promise<number> {
    if (this.db) {
      await this.db.prepare(sql).bind(...params).run();
      return 1;
    }

    this.ensureClient();
    const result = await this.httpClient!.execute(sql, params);
    return result.changes;
  }

  private async first<T>(sql: string, params: QueryParams = []): Promise<T | null> {
    if (this.db) {
      const row = await this.db.prepare(sql).bind(...params).first();
      return (row as T) ?? null;
    }

    this.ensureClient();
    const row = await this.httpClient!.first(sql, params);
    return (row as T) ?? null;
  }

  private async all<T>(sql: string, params: QueryParams = []): Promise<T[]> {
    if (this.db) {
      const statement = await this.db.prepare(sql).bind(...params).all();
      return (statement?.results as T[]) ?? [];
    }

    this.ensureClient();
    const result = await this.httpClient!.execute(sql, params);
    return (result.rows as T[]) ?? [];
  }

  // Operasi untuk menyimpan data tenant
  async setTenant(subdomain: string, tenantData: any): Promise<boolean> {
    try {
      const sql = `
        INSERT INTO tenant_subdomains (id, subdomain, tenant_data, created_at, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(subdomain) DO UPDATE SET
          tenant_data = excluded.tenant_data,
          updated_at = excluded.updated_at
      `;

      const id = `tenant_${subdomain}_${Date.now()}`;
      await this.run(sql, [id, subdomain, JSON.stringify(tenantData)]);
      return true;
    } catch (error) {
      console.error('Error setting tenant in D1:', error);
      return false;
    }
  }

  // Operasi untuk mendapatkan data tenant
  async getTenant(subdomain: string): Promise<any | null> {
    try {
      const sql = 'SELECT tenant_data FROM tenant_subdomains WHERE subdomain = ?';
      const result = await this.first<{ tenant_data: string }>(sql, [subdomain]);
      return result?.tenant_data ? JSON.parse(result.tenant_data) : null;
    } catch (error) {
      console.error('Error getting tenant from D1:', error);
      return null;
    }
  }

  // Operasi untuk menghapus data tenant
  async deleteTenant(subdomain: string): Promise<boolean> {
    try {
      await this.run('DELETE FROM tenant_subdomains WHERE subdomain = ?', [subdomain]);
      return true;
    } catch (error) {
      console.error('Error deleting tenant from D1:', error);
      return false;
    }
  }

  // Operasi untuk menyimpan session
  async setSession(
    sessionId: string,
    userId: string,
    tenantId: string,
    sessionData: any,
    ttl: number = 86400
  ): Promise<boolean> {
    try {
      const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
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

      await this.run(sql, [sessionId, userId, tenantId, JSON.stringify(sessionData), expiresAt]);
      return true;
    } catch (error) {
      console.error('Error setting session in D1:', error);
      return false;
    }
  }

  // Operasi untuk mendapatkan session
  async getSession(sessionId: string): Promise<any | null> {
    try {
      const now = new Date().toISOString();
      const sql = 'SELECT * FROM sessions WHERE id = ? AND (expires_at IS NULL OR expires_at > ?)';
      const result = await this.first<any>(sql, [sessionId, now]);

      if (!result) {
        return null;
      }

      return {
        id: result.id,
        userId: result.user_id,
        tenantId: result.tenant_id,
        data: result.session_data ? JSON.parse(result.session_data) : null,
      };
    } catch (error) {
      console.error('Error getting session from D1:', error);
      return null;
    }
  }

  // Operasi untuk menghapus session
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      await this.run('DELETE FROM sessions WHERE id = ?', [sessionId]);
      return true;
    } catch (error) {
      console.error('Error deleting session from D1:', error);
      return false;
    }
  }

  // Operasi untuk menyimpan cache
  async setCache(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const expiresAt = typeof ttl === 'number' && ttl > 0
        ? new Date(Date.now() + ttl * 1000).toISOString()
        : null;
      const sql = `
        INSERT INTO cache (key, value, expires_at, created_at, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          expires_at = excluded.expires_at,
          updated_at = excluded.updated_at
      `;

      await this.run(sql, [key, JSON.stringify(value), expiresAt]);
      return true;
    } catch (error) {
      console.error('Error setting cache in D1:', error);
      return false;
    }
  }

  // Operasi untuk mendapatkan cache
  async getCache(key: string): Promise<any | null> {
    try {
      const now = new Date().toISOString();
      const sql = 'SELECT value FROM cache WHERE key = ? AND (expires_at IS NULL OR expires_at > ?)';
      const result = await this.first<{ value: string }>(sql, [key, now]);
      return result?.value ? JSON.parse(result.value) : null;
    } catch (error) {
      console.error('Error getting cache from D1:', error);
      return null;
    }
  }

  // Operasi untuk menghapus cache
  async deleteCache(key: string): Promise<boolean> {
    try {
      await this.run('DELETE FROM cache WHERE key = ?', [key]);
      return true;
    } catch (error) {
      console.error('Error deleting cache from D1:', error);
      return false;
    }
  }

  // Membersihkan data yang kadaluarsa
  async cleanupExpiredData(): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      await this.run('DELETE FROM sessions WHERE expires_at IS NOT NULL AND expires_at < ?', [now]);
      await this.run('DELETE FROM cache WHERE expires_at IS NOT NULL AND expires_at < ?', [now]);
      return true;
    } catch (error) {
      console.error('Error cleaning up expired data:', error);
      return false;
    }
  }

  async deleteCacheByPattern(pattern: string): Promise<number> {
    try {
      const likePattern = pattern.replace(/\*/g, '%');
      return await this.run('DELETE FROM cache WHERE key LIKE ?', [likePattern]);
    } catch (error) {
      console.error('Error deleting cache by pattern in D1:', error);
      return 0;
    }
  }

  async listCacheKeys(pattern: string = '%'): Promise<string[]> {
    try {
      const likePattern = pattern.replace(/\*/g, '%');
      const rows = await this.all<{ key: string }>('SELECT key FROM cache WHERE key LIKE ?', [likePattern]);
      return rows.map(row => row.key);
    } catch (error) {
      console.error('Error listing cache keys from D1:', error);
      return [];
    }
  }

  async listTenantSubdomains(pattern: string = '%'): Promise<string[]> {
    try {
      const likePattern = pattern.replace(/\*/g, '%');
      const rows = await this.all<{ subdomain: string }>(
        'SELECT subdomain FROM tenant_subdomains WHERE subdomain LIKE ?',
        [likePattern]
      );
      return rows.map(row => row.subdomain);
    } catch (error) {
      console.error('Error listing tenant subdomains from D1:', error);
      return [];
    }
  }
}