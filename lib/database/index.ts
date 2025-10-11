import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize Drizzle ORM
export const db = drizzle(pool);

// Export the pool for direct use if needed
export { pool };