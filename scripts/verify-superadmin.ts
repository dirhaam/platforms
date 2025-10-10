#!/usr/bin/env tsx

/**
 * Verify SuperAdmin Creation
 */

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: "https://precise-mite-9437.upstash.io",
  token: "ASTdAAImcDJlMzU2YzViYjYwMmI0N2NiYTE2MTM5ZmY1Y2UxMWNjNnAyOTQzNw",
});

async function verifySetup() {
  console.log('🔍 Verifying SuperAdmin setup...');
  
  try {
    // Test Redis connection
    await redis.ping();
    console.log('✅ Redis connection: OK');
    
    // Check if SuperAdmin exists
    const superAdminId = await redis.get('superadmin:email:dirhamrozi@gmail.com');
    console.log('📧 SuperAdmin ID for dirhamrozi@gmail.com:', superAdminId);
    
    if (superAdminId) {
      console.log('✅ SuperAdmin exists in Redis');
      console.log('🎉 Setup complete!');
      
      console.log('\n📝 Login Instructions:');
      console.log('1. Go to: http://localhost:3000/login');
      console.log('2. Select "Super Admin" tab');
      console.log('3. Email: dirhamrozi@gmail.com');
      console.log('4. Password: 12345nabila');
      console.log('5. You will be redirected to /admin with full platform access');
      
      console.log('\n🔑 Current RBAC Roles:');
      console.log('- superadmin: Platform-wide access to all tenants');
      console.log('- owner: Full access to their tenant');
      console.log('- admin: Administrative access with most features');
      console.log('- staff: Basic staff access for daily operations');
      console.log('- receptionist: Front desk operations and customer management');
      
    } else {
      console.log('❌ SuperAdmin not found');
    }
    
  } catch (error) {
    console.error('💥 Verification failed:', error);
  }
}

verifySetup();