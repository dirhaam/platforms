#!/usr/bin/env tsx

/**
 * Test SuperAdmin Authentication
 */

import { TenantAuth } from '@/lib/auth/tenant-auth';

async function testSuperAdminAuth() {
  console.log('🔐 Testing SuperAdmin authentication...');
  
  try {
    const email = 'dirhamrozi@gmail.com';
    const password = '12345nabila';
    
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    
    const result = await TenantAuth.authenticateSuperAdmin(
      email,
      password,
      '127.0.0.1',
      'test-user-agent'
    );
    
    console.log('📊 Authentication Result:');
    console.log('  Success:', result.success);
    
    if (result.success) {
      console.log('✅ Authentication successful!');
      console.log('  Session:', {
        userId: result.session?.userId,
        email: result.session?.email,
        name: result.session?.name,
        role: result.session?.role,
        isSuperAdmin: result.session?.isSuperAdmin
      });
    } else {
      console.log('❌ Authentication failed!');
      console.log('  Error:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testSuperAdminAuth();