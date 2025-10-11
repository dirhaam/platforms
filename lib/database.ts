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

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Database utilities
export class DatabaseUtils {
  static async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    timestamp: Date;
    details?: string;
  }> {
    try {
      const start = Date.now();
      await pool.query('SELECT 1');
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