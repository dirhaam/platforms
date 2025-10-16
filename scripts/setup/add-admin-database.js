#!/usr/bin/env node

// Simple script to add admin record to database after manual user creation
// Usage: node add-admin-database.js

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load environment variables
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found!');
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

if (!env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

console.log('🔐 Add Super Admin to Database');
console.log('=============================\n');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

async function addAdminRecord() {
  const email = await question('📧 Email admin (dari Supabase Auth): ');
  const name = await question('👤 Nama lengkap: ');
  const password = await question('🔒 Password (sama dengan di Supabase): ');

  console.log('\n📋 Input validation:');
  console.log(`   Email: ${email}`);
  console.log(`   Nama: ${name}`);
  console.log(`   Password: ${'*'.repeat(password.length)}`);

  const confirm = await question('\n✅ Add this admin to database? (y/N): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ Cancelled');
    rl.close();
    process.exit(0);
  }

  const pool = new Pool({ connectionString: env.DATABASE_URL });

  try {
    const client = await pool.connect();
    
    try {
      const passwordHash = await bcrypt.hash(password, 10);
      const permissionsJson = JSON.stringify([
        'admin.all', 
        'tenant.all', 
        'superadmin.all',
        'analytics.view',
        'security.audit'
      ]);
      
      console.log('\n💾 Creating admin record...');
      
      const query = `
        INSERT INTO super_admins (
          email, name, is_active, password_hash,
          permissions, can_access_all_tenants, created_at, updated_at
        ) VALUES (
          $1, $2, true, $3,
          $4,
          true, NOW(), NOW()
        )
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          is_active = EXCLUDED.is_active,
          password_hash = EXCLUDED.password_hash,
          permissions = EXCLUDED.permissions,
          can_access_all_tenants = EXCLUDED.can_access_all_tenants,
          updated_at = EXCLUDED.updated_at
        RETURNING id, email, name, is_active, created_at;
      `;
      
      const result = await client.query(query, [
        email, 
        name, 
        passwordHash,
        permissionsJson
      ]);
      
      const adminRecord = result.rows[0];
      
      console.log('\n✅ Super admin record created successfully!');
      console.log('📋 Record Details:');
      console.log(`   ID: ${adminRecord.id}`);
      console.log(`   Email: ${adminRecord.email}`);
      console.log(`   Name: ${adminRecord.name}`);
      console.log(`   Active: ${adminRecord.is_active ? 'Yes' : 'No'}`);
      console.log(`   Created: ${adminRecord.created_at}`);

      console.log('\n🚀 Setup completed!');
      console.log('\n📝 Next Steps:');
      console.log('   1. Start development: pnpm dev');
      console.log(`   2. Open admin panel: http://localhost:3000/admin`);
      console.log(`   3. Login with: ${email}`);
      console.log(`   4. Password: ${password}`);
      console.log('   5. Create first tenant');

    } catch (error) {
      console.error('❌ Database error:', error.message);
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    await pool.end();
    rl.close();
  }
}

console.log('ℹ️ Make sure you have created the user in Supabase Dashboard first!');
console.log('Navigation: Authentication → Users → Add user\n');

addAdminRecord().catch(err => {
  console.error('\n💥 Fatal error:', err.message);
  rl.close();
  process.exit(1);
});
