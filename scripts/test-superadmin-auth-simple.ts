#!/usr/bin/env tsx

/**
 * Test SuperAdmin Authentication (Simple)
 */

import { SuperAdminService } from '@/lib/auth/superadmin-service';

async function testSuperAdminAuthSimple() {
  console.log('🔐 Testing SuperAdmin authentication (simple)...');
  
  try {
    const email = 'dirhamrozi@gmail.com';
    const password = '12345nabila';
    
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    
    const result = await SuperAdminService.authenticate(email, password);
    
    console.log('📊 Authentication Result:');
    console.log('  Success:', result.success);
    
    if (result.success) {
      console.log('✅ Authentication successful!');
      console.log('  SuperAdmin:', {
        id: result.superAdmin?.id,
        email: result.superAdmin?.email,
        name: result.superAdmin?.name,
        isActive: result.superAdmin?.isActive
      });
    } else {
      console.log('❌ Authentication failed!');
      console.log('  Error:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testSuperAdminAuthSimple();