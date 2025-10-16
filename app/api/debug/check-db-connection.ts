// This file tests direct database connection
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL not configured');
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : false,
  max: 1, // Limit connections for testing
  connectionTimeoutMillis: 10000, // 10 second timeout
});

export async function connect() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    return result.rows[0];
  } finally {
    client.release();
  }
}

// Test connection immediately
connect().then(result => {
  console.log('✅ Database connection test successful:', result);
}).catch(error => {
  console.error('❌ Database connection test failed:', error);
});
