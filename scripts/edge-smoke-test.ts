import { persistSession, retrieveSession, removeSession } from '@/lib/auth/session-store';
import type { TenantSession } from '@/lib/auth/types';
import {
  setCache,
  getCache,
  deleteCache,
  setTenant,
  getTenant,
  deleteTenant,
} from '@/lib/d1';

type StatementParams = unknown[];

type PreparedRunner = {
  run(): Promise<void>;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
};

class MockD1Binding {
  private sessions = new Map<string, { userId: string; tenantId: string; data: any; expiresAt?: string | null }>();
  private cache = new Map<string, { value: any; expiresAt?: string | null }>();
  private tenants = new Map<string, { tenantData: any; updatedAt: string }>();

  prepare(sql: string) {
    return {
      bind: (...params: StatementParams): PreparedRunner => ({
        run: () => this.handleRun(sql, params),
        first: <T>() => this.handleFirst<T>(sql, params),
        all: <T>() => this.handleAll<T>(sql, params),
      }),
    };
  }

  private async handleRun(sql: string, params: StatementParams): Promise<void> {
    if (sql.includes('INSERT INTO sessions')) {
      const [id, userId, tenantId, sessionData, expiresAt] = params as [string, string, string, string, string | null];
      this.sessions.set(id, {
        userId,
        tenantId,
        data: JSON.parse(sessionData as string),
        expiresAt,
      });
      return;
    }

    if (sql.startsWith('DELETE FROM sessions')) {
      const [id] = params as [string];
      this.sessions.delete(id);
      return;
    }

    if (sql.includes('INSERT INTO cache')) {
      const [key, value, expiresAt] = params as [string, string, string | null];
      this.cache.set(key, { value: JSON.parse(value as string), expiresAt });
      return;
    }

    if (sql.startsWith('DELETE FROM cache WHERE key =')) {
      const [key] = params as [string];
      this.cache.delete(key);
      return;
    }

    if (sql.startsWith('DELETE FROM cache WHERE key LIKE')) {
      const [pattern] = params as [string];
      const regex = new RegExp('^' + pattern.replace(/%/g, '.*') + '$');
      for (const key of Array.from(this.cache.keys())) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
      return;
    }

    if (sql.includes('INSERT INTO tenant_subdomains')) {
      const [id, subdomain, tenantData] = params as [string, string, string];
      this.tenants.set(subdomain, { tenantData: JSON.parse(tenantData), updatedAt: new Date().toISOString() });
      return;
    }

    if (sql.startsWith('DELETE FROM tenant_subdomains')) {
      const [subdomain] = params as [string];
      this.tenants.delete(subdomain);
      return;
    }
  }

  private async handleFirst<T>(sql: string, params: StatementParams): Promise<T | null> {
    if (sql.startsWith('SELECT * FROM sessions')) {
      const [id] = params as [string];
      const session = this.sessions.get(id);
      if (!session) return null;
      return {
        id,
        user_id: session.userId,
        tenant_id: session.tenantId,
        session_data: JSON.stringify(session.data),
        expires_at: session.expiresAt,
      } as unknown as T;
    }

    if (sql.startsWith('SELECT value FROM cache')) {
      const [key] = params as [string];
      const entry = this.cache.get(key);
      if (!entry) return null;
      return { value: JSON.stringify(entry.value) } as unknown as T;
    }

    if (sql.startsWith('SELECT tenant_data FROM tenant_subdomains')) {
      const [subdomain] = params as [string];
      const entry = this.tenants.get(subdomain);
      if (!entry) return null;
      return { tenant_data: JSON.stringify(entry.tenantData) } as unknown as T;
    }

    return null;
  }

  private async handleAll<T>(sql: string, params: StatementParams): Promise<{ results: T[] }> {
    if (sql.startsWith('SELECT key FROM cache')) {
      const [pattern] = params as [string];
      const regex = new RegExp('^' + pattern.replace(/%/g, '.*') + '$');
      const results = Array.from(this.cache.keys())
        .filter(key => regex.test(key))
        .map(key => ({ key })) as T[];
      return { results };
    }

    if (sql.startsWith('SELECT subdomain FROM tenant_subdomains')) {
      const [pattern] = params as [string];
      const regex = new RegExp('^' + pattern.replace(/%/g, '.*') + '$');
      const results = Array.from(this.tenants.keys())
        .filter(subdomain => regex.test(subdomain))
        .map(subdomain => ({ subdomain })) as T[];
      return { results };
    }

    return { results: [] };
  }
}

async function runSmokeTest() {
  const env = { D1_DATABASE: new MockD1Binding() };

  const session: TenantSession = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    role: 'owner',
    permissions: ['*'],
    email: 'owner@example.com',
    name: 'Owner Example',
  };

  const sessionId = await persistSession(session, env);
  const restored = await retrieveSession(sessionId, env);

  if (!restored || restored.userId !== session.userId) {
    throw new Error('Session restore failed');
  }

  await removeSession(sessionId, env);
  const afterRemoval = await retrieveSession(sessionId, env);
  if (afterRemoval) {
    throw new Error('Session removal failed');
  }

  // Cache operations
  const cacheSet = await setCache('test:key', { hello: 'world' }, 60, env);
  if (!cacheSet) {
    throw new Error('Failed to set cache');
  }

  const cacheValue = await getCache('test:key', env);
  if (!cacheValue || cacheValue.hello !== 'world') {
    throw new Error('Cache retrieval failed');
  }

  await deleteCache('test:key', env);
  const cacheAfterDelete = await getCache('test:key', env);
  if (cacheAfterDelete) {
    throw new Error('Cache deletion failed');
  }

  // Tenant storage operations
  const tenantPayload = { subdomain: 'demo', emoji: '🏢' };
  const tenantSet = await setTenant('demo', tenantPayload, env);
  if (!tenantSet) {
    throw new Error('Failed to persist tenant payload');
  }

  const tenantValue = await getTenant('demo', env);
  if (!tenantValue || tenantValue.emoji !== '🏢') {
    throw new Error('Tenant retrieval failed');
  }

  await deleteTenant('demo', env);
  const tenantAfterDelete = await getTenant('demo', env);
  if (tenantAfterDelete) {
    throw new Error('Tenant deletion failed');
  }

  // eslint-disable-next-line no-console
  console.log('Edge smoke test passed');
}

runSmokeTest().catch(error => {
  console.error('Edge smoke test failed:', error);
  process.exit(1);
});
