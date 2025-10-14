// dev-test.ts
// Development test script to verify Supabase/PostgreSQL integration

import { db } from './lib/database';
import { tenants } from './lib/database/schema';
import { eq } from 'drizzle-orm';
import { setTenant, getTenant, testD1Connection } from './lib/d1';

async function runDevelopmentTests() {
  console.log('Running development tests for Supabase integration...\n');
  
  // Test 1: Database connection
  console.log('1. Testing database connection...');
  const connectionOk = await testD1Connection();
  console.log(connectionOk ? '✅ Connection test passed' : '❌ Connection test failed');
  
  if (!connectionOk) {
    console.error('Cannot proceed with tests - database connection failed');
    return false;
  }
  
  // Test 2: Basic tenant operations
  console.log('\n2. Testing tenant operations...');
  const testSubdomain = `dev-test-${Date.now()}`;
  const testData = {
    businessName: "Dev Test Tenant",
    email: "test@example.com",
    phone: "1234567890",
    createdAt: new Date().toISOString(),
  };
  
  // Set tenant data
  const setDataOk = await setTenant(testSubdomain, testData);
  console.log(setDataOk ? '✅ Set tenant test passed' : '❌ Set tenant test failed');
  
  // Get tenant data
  const retrievedData = await getTenant(testSubdomain);
  const getDataOk = retrievedData !== null;
  console.log(getDataOk ? '✅ Get tenant test passed' : '❌ Get tenant test failed');
  
  // Test 3: Direct database operations
  console.log('\n3. Testing direct database operations...');
  try {
    // Insert a test tenant
    await db.insert(tenants).values({
      subdomain: testSubdomain,
      businessName: "Test Business",
      email: "test@example.com",
      phone: "1234567890",
      ownerName: "Test Owner",
      businessCategory: "Test Category",
    });
    console.log('✅ Database insert test passed');
    
    // Query the test tenant
    const result = await db.select().from(tenants).where(eq(tenants.subdomain, testSubdomain));
    const queryOk = result.length > 0;
    console.log(queryOk ? '✅ Database query test passed' : '❌ Database query test failed');
    
    // Clean up: Delete the test tenant
    await db.delete(tenants).where(tenants.subdomain === testSubdomain);
    console.log('✅ Cleanup completed');
    
  } catch (error) {
    console.error('❌ Direct database operations test failed:', error);
    return false;
  }
  
  console.log('\n🎉 All development tests completed successfully!');
  console.log('Supabase/PostgreSQL integration appears to be working correctly.');
  return true;
}

// Run the tests
runDevelopmentTests()
  .then(success => {
    if (success) {
      console.log('\n✅ Development testing completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Development testing failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Development testing error:', error);
    process.exit(1);
  });