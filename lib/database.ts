import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import { sql } from 'drizzle-orm';
import * as schema from './database/schema';
import { createDrizzleD1Database } from './database/d1-client';

type DatabaseInstance = DrizzleD1Database<typeof schema>;

let cachedDb: DatabaseInstance | null = null;

export function getDb(env?: any): DatabaseInstance {
  if (env) {
    return drizzle(createDrizzleD1Database(env), { schema });
  }

  if (!cachedDb) {
    const database = createDrizzleD1Database();
    cachedDb = drizzle(database, { schema });
  }

  return cachedDb;
}

export const db = getDb();

export async function checkDatabaseConnection(env?: any): Promise<boolean> {
  try {
    const database = createDrizzleD1Database(env);
    await database.prepare('SELECT 1').bind().first();
    return true;
  } catch (error) {
    console.error('Cloudflare D1 connection failed:', error);
    return false;
  }
}

export class DatabaseUtils {
  static async healthCheck(env?: any): Promise<{
    status: 'healthy' | 'unhealthy';
    timestamp: Date;
    details?: string;
  }> {
    try {
      const start = Date.now();
      const database = createDrizzleD1Database(env);
      await database.prepare('SELECT 1').bind().first();
      const duration = Date.now() - start;

      return {
        status: 'healthy',
        timestamp: new Date(),
        details: `Response time: ${duration}ms`,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}