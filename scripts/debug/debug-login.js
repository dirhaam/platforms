#!/usr/bin/env node

// Debug Login Issues
// Usage: node debug-login.js

const fs = require('fs');
const path = require('path');

// Load environment variables
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found!');
    console.log('\nPlease create .env.local with:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
    console.log('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
    console.log('DATABASE_URL=postgresql://...');
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
      env[key] = values.join('=').replace(/['"]/g, '');
    }
  });
  
  return env;
}

const env = loadEnv();

console.log('🔍 Debug Login Issues');
console.log('=====================\n');

// Check environment variables
console.log('📦 Environment Variables:');
console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${env.NEXT_PUBLIC_SUPABASE_URL ? '✅ SET' : '❌ MISSING'}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${env.SUPABASE_SERVICE_ROLE_KEY ? '✅ SET' : '❌ MISSING'}`);
console.log(`   DATABASE_URL: ${env.DATABASE_URL ? '✅ SET' : '❌ MISSING'}`);
console.log(`   NODE_ENV: ${env.NODE_ENV || '❌ NOT SET'}`);

// Check for default superadmin config
console.log('\n🦸 SuperAdmin Configuration:');
const defaultEmail = process.env.DEFAULT_SUPERADMIN_EMAIL || 'dirhamrozi@gmail.com';
const defaultPassword = process.env.DEFAULT_SUPERADMIN_PASSWORD || '12345nabila';
console.log(`   Default Email: ${defaultEmail}`);
console.log(`   Default Password: ${defaultPassword}`);

if (env.NODE_ENV === 'development') {
  console.log('   ✅ Development mode - default admin will be auto-created');
} else {
  console.log('   ⚠️ Production mode - manual admin setup required');
}

// Test database connection
console.log('\n🗄️ Testing Database Connection...');
const { Pool } = require('pg');

async function testDatabase() {
  try {
    const pool = new Pool({ connectionString: env.DATABASE_URL });
    const client = await pool.connect();
    
    // Test basic connection
    const result = await client.query('SELECT NOW() as current_time');
    console.log('   ✅ Database connection successful');
    console.log(`   Server time: ${result.rows[0].current_time}`);
    
    // Check super_admins table
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'super_admins'
      );
    const tableExists = tableCheck.rows[0].exists;
    console.log(`   super_admins table: ${tableExists ? '✅ EXISTS' : '❌ MISSING'}`);
    
    // Check existing super admins
    if (tableExists) {
      const adminCount = await client.query('SELECT COUNT(*) as count FROM super_admins');
      console.log(`   Super admins count: ${adminCount.rows[0].count}`);
      
      if (adminCount.rows[0].count > 0) {
        const admins = await client.query('SELECT email, name, is_active FROM super_admins ORDER BY created_at');
        console.log('\n👥 Existing Super Admins:');
        admins.rows.forEach((admin, index) => {
          const status = admin.is_active ? '✅ Active' : '❌ Inactive';
          console.log(`   ${index + 1}. ${admin.name} (${admin.email}) - ${status}`);
        });
      }
    }
    
    await client.release();
    await pool.end();
    
    return true;
  } catch (error) {
    console.error('   ❌ Database connection failed:', error.message);
    return false;
  }
}

async function testSupabaseAuth() {
  console.log('\n🔐 Testing Supabase Auth...');
  
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('   ⚠️ Supabase credentials not configured');
    return false;
  }

  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test connection by listing users
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.log('   ❌ Supabase auth connection failed:', error.message);
      return false;
    }
    
    console.log('   ✅ Supabase auth connection successful');
    console.log(`   Total users: ${data.users.length}`);
    
    // Check for superadmin users
    const superAdminUsers = data.users.filter(user => 
      user.user_metadata?.role === 'superadmin'
    );
    console.log(`   Superadmin users: ${superAdminUsers.length}`);
    
    if (superAdminUsers.length > 0) {
      console.log('\n👥 Superadmin Users:');
      superAdminUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} - ${user.user_metadata?.name || 'No name'}`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('   ❌ Supabase auth test failed:', error.message);
    return false;
  }
}

async function createTestSuperAdmin() {
  console.log('\n🚀 Creating Test Super Admin...');
  
  try {
    const { Pool } = require('pg');
    const bcrypt = require('bcryptjs');
    
    const pool = new Pool({ connectionString: env.DATABASE_URL });
    const client = await pool.connect();
    
    const email = defaultEmail;
    const name = 'Test Super Admin';
    const password = defaultPassword;
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Check if exists
    const existing = await client.query(
      'SELECT id FROM super_admins WHERE email = $1',
      [email]
    );
    
    if (existing.rows.length > 0) {
      console.log('   ⚠️ Super admin already exists');
      
      // Update password
      await client.query(
        'UPDATE super_admins SET password_hash = $1, is_active = true WHERE email = $2',
        [passwordHash, email]
      );
      console.log('   ✅ Updated existing admin password');
    } else {
      // Create new
      await client.query(`
        INSERT INTO super_admins (
          id, email, name, is_active, password_hash,
          permissions, can_access_all_tenants,
          created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          $1, $2, true, $3,
          ARRAY['*'], true, NOW(), NOW()
        )
      `, [email, name, passwordHash]);
      
      console.log('   ✅ Created new super admin');
    }
    
    console.log('\n📋 Test Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    
    await client.release();
    await pool.end();
    
  } catch (error) {
    console.error('   ❌ Failed to create test super admin:', error.message);
  }
}

async function main() {
  const dbConnected = await testDatabase();
  
  if (dbConnected) {
    if (env.NODE_ENV === 'development') {
      await createTestSuperAdmin();
    }
  }
  
  await testSupabaseAuth();
  
  console.log('\n📋 Test Login Credentials:');
  console.log('   Email:', defaultEmail);
  console.log('   Password:', defaultPassword);
  console.log('   Login Type: superadmin');
  console.log('\n💡 Try logging in with these credentials via the admin panel');
  
  console.log('\n🔧 Common Issues:');
  console.log('1. Check .env.local has correct Supabase credentials');
  console.log('2. Verify DATABASE_URL points to correct database');
  console.log('3. Ensure super_admins table exists and has records');
  console.log('4. Check if NODE_ENV is set correctly');
  console.log('5. Verify CORS settings for API access');
}

main().catch(error => {
  console.error('\n💥 Debug failed:', error.message);
  process.exit(1);
});
