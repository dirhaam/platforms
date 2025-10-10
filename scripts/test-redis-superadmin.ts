#!/usr/bin/env tsx

/**
 * Test Redis Connection and Create SuperAdmin
 */

import { Redis } from '@upstash/redis';
import bcrypt from 'bcryptjs';

// Initialize Redis with explicit configuration
const redis = new Redis({
  url: "https://precise-mite-9437.upstash.io",
  token: "ASTdAAImcDJlMzU2YzViYjYwMmI0N2NiYTE2MTM5ZmY1Y2UxMWNjNnAyOTQzNw",
});

async function testRedisConnection() {
  console.log('🔍 Testing Redis connection...');
  
  try {
    const result = await redis.ping();
    console.log('✅ Redis connection successful:', result);
    return true;
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    return false;
  }
}

async function createSuperAdminDirect() {
  console.log('🚀 Creating SuperAdmin directly...');
  
  try {
    const email = 'dirhamrozi@gmail.com';
    const password = '12345nabila';
    const name = 'Super Administrator';
    
    // Check if already exists
    const existingId = await redis.get(`superadmin:email:${email}`);
    if (existingId) {
      console.log('⚠️ SuperAdmin already exists, updating...');
      
      // Hash new password
      const passwordHash = await bcrypt.hash(password, 12);
      
      // Update existing
      const superAdmin = {
        id: existingId,
        email,
        name,
        isActive: true,
        passwordHash,
        loginAttempts: 0,
        permissions: ['*'],
        canAccessAllTenants: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await redis.set(`superadmin:${existingId}`, JSON.stringify(superAdmin));
      
      console.log('✅ SuperAdmin updated successfully!');
      console.log(`🆔 ID: ${existingId}`);
      console.log(`📧 Email: ${email}`);
      console.log(`👤 Name: ${name}`);
      
      return;
    }
    
    // Create new SuperAdmin
    const id = `sa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const passwordHash = await bcrypt.hash(password, 12);
    
    const superAdmin = {
      id,
      email,
      name,
      isActive: true,
      passwordHash,
      loginAttempts: 0,
      permissions: ['*'],
      canAccessAllTenants: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Store in Redis
    await redis.set(`superadmin:${id}`, JSON.stringify(superAdmin));
    await redis.set(`superadmin:email:${email}`, id);
    await redis.sadd('superadmin:list', id);
    
    console.log('✅ SuperAdmin created successfully!');
    console.log(`🆔 ID: ${id}`);
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Name: ${name}`);
    console.log(`🔑 Permissions: Platform-wide access (*)`);
    console.log(`🏢 Tenant Access: All tenants`);
    
  } catch (error) {
    console.error('💥 Failed to create SuperAdmin:', error);
    throw error;
  }
}

async function listSuperAdmins() {
  console.log('📋 Listing SuperAdmins...');
  
  try {
    const ids = await redis.smembers('superadmin:list');
    
    if (!ids || ids.length === 0) {
      console.log('📭 No SuperAdmins found');
      return;
    }
    
    console.log(`\n👥 Found ${ids.length} SuperAdmin(s):`);
    console.log('═'.repeat(80));
    
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i] as string;
      const data = await redis.get(`superadmin:${id}`);
      
      if (data) {
        const admin = JSON.parse(data as string);
        console.log(`\n${i + 1}. ${admin.name}`);
        console.log(`   📧 Email: ${admin.email}`);
        console.log(`   🆔 ID: ${admin.id}`);
        console.log(`   ✅ Active: ${admin.isActive ? 'Yes' : 'No'}`);
        console.log(`   🏢 All Tenants: ${admin.canAccessAllTenants ? 'Yes' : 'No'}`);
        console.log(`   🔑 Permissions: ${admin.permissions.join(', ')}`);
        console.log(`   📅 Created: ${new Date(admin.createdAt).toLocaleString()}`);
      }
    }
    
  } catch (error) {
    console.error('💥 Failed to list SuperAdmins:', error);
    throw error;
  }
}

async function testAuthentication() {
  console.log('🔐 Testing SuperAdmin authentication...');
  
  try {
    const email = 'dirhamrozi@gmail.com';
    const password = '12345nabila';
    
    // Get SuperAdmin by email
    const superAdminId = await redis.get(`superadmin:email:${email}`);
    if (!superAdminId) {
      console.log('❌ SuperAdmin not found');
      return;
    }
    
    const data = await redis.get(`superadmin:${superAdminId}`);
    if (!data) {
      console.log('❌ SuperAdmin data not found');
      return;
    }
    
    const superAdmin = JSON.parse(data as string);
    
    // Verify password
    const isValid = await bcrypt.compare(password, superAdmin.passwordHash);
    
    if (isValid) {
      console.log('✅ Authentication successful!');
      console.log(`👤 Welcome, ${superAdmin.name}!`);
      console.log(`📧 Email: ${superAdmin.email}`);
      console.log(`🔑 Role: SuperAdmin`);
    } else {
      console.log('❌ Authentication failed - Invalid password');
    }
    
  } catch (error) {
    console.error('💥 Authentication test failed:', error);
    throw error;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'create';

  // Test Redis connection first
  const isConnected = await testRedisConnection();
  if (!isConnected) {
    console.error('❌ Cannot proceed without Redis connection');
    process.exit(1);
  }

  switch (command) {
    case 'create':
      await createSuperAdminDirect();
      break;
    
    case 'list':
      await listSuperAdmins();
      break;
    
    case 'test':
      await testAuthentication();
      break;
    
    case 'all':
      await createSuperAdminDirect();
      await listSuperAdmins();
      await testAuthentication();
      break;
    
    case 'help':
      console.log('Redis SuperAdmin Test Script');
      console.log('============================');
      console.log('');
      console.log('Commands:');
      console.log('  create   Create SuperAdmin');
      console.log('  list     List all SuperAdmins');
      console.log('  test     Test authentication');
      console.log('  all      Run all commands');
      console.log('  help     Show this help message');
      break;
    
    default:
      console.error(`❌ Unknown command: ${command}`);
      console.log('Run with "help" for available commands');
      process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Script execution failed:', error);
    process.exit(1);
  });
}