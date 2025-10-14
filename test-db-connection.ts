// test-db-connection.ts
// Simple test to verify PostgreSQL connection

import { db } from './lib/database';
import { tenants } from './lib/database/schema';

async function testConnection() {
  try {
    console.log('Testing PostgreSQL connection...');
    
    // Try to select from tenants table (should be empty initially)
    const result = await db.select().from(tenants).limit(5);
    
    console.log('✅ Connection successful!');
    console.log('Sample data from tenants table:', result);
    
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error);
    return false;
  }
}

// Run the test
testConnection().then(success => {
  if (success) {
    console.log('Database connection test passed!');
    process.exit(0);
  } else {
    console.log('Database connection test failed!');
    process.exit(1);
  }
});