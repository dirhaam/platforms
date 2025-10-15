// Server-only database module - DO NOT IMPORT IN CLIENT CODE
import 'server-only';

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create the drizzle instance
const db = drizzle(pool, { schema });

export { db };