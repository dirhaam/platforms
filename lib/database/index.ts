import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';
import { createDrizzleD1Database } from './d1-client';

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