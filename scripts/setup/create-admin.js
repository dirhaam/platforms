// Untuk membuat super admin pertama kali - simpan sebagai create-admin.js
//jalankan: node create-admin.js

const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  const envVars = {};
  
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=');
        if (key && values.length > 0) {
          envVars[key] = values.join('=').replace(/['"]/g, '');
        }
      }
    }
  }
  
  return envVars;
}

const env = loadEnvFile();

// Konfigurasi Supabase
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY; // Service role key untuk admin operations

// Database connection
const connectionString = env.DATABASE_URL;

if (!supabaseUrl || !supabaseServiceKey || !connectionString) {
  console.error('❌ Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  console.error('- DATABASE_URL');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const pool = new Pool({
  connectionString: connectionString,
});

async function createSuperAdmin() {
  console.log('🚀 Starting Super Admin Creation Process...\n');
  
  const client = await pool.connect();
  
  try {
    // Informasi admin - GANTI INI
    const adminConfig = {
      email: 'dirhamrozi@gmail.com',     // ⚠️ GANTI dengan email Anda
      password: 'Dirham123!!!',  // ⚠️ GANTI dengan password Anda
      name: 'Super Admin',               // ⚠️ GANTI dengan nama Anda
      isAdmin: true
    };

    console.log('📋 Admin Configuration:');
    console.log(`   Email: ${adminConfig.email}`);
    console.log(`   Name: ${adminConfig.name}`);
    console.log(`   Role: Super Admin\n`);

    // STEP 1: Create user in Supabase Auth
    console.log('🔐 Step 1: Creating user in Supabase Auth...');
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminConfig.email,
      password: adminConfig.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: adminConfig.name,
        role: 'superadmin',
        is_superuser: true
      }
    });

    if (authError) {
      // Jika user sudah ada, coba get existing user
      if (authError.message.includes('duplicate')) {
        console.log('⚠️ User already exists in Auth, proceeding with existing user...');
        
        const { data: existingUser } = await supabase.auth.admin.getUserByEmail(adminConfig.email);
        if (existingUser.user) {
          authData.user = existingUser.user;
        }
      } else {
        throw authError;
      }
    } else {
      console.log('✅ User created successfully in Supabase Auth');
      console.log(`   User ID: ${authData.user.id}`);
    }

    // STEP 2: Create/update record in super_admins table
    console.log('\n📝 Step 2: Creating record in super_admins table...');
    
    const passwordHash = await bcrypt.hash(adminConfig.password, 10);
    
    const query = `
      INSERT INTO super_admins (
        id, email, name, is_active, password_hash, 
        permissions, can_access_all_tenants, created_at, updated_at
      ) VALUES (
        $1, $2, $3, true, $4,
        '["admin.all", "tenant.create", "tenant.update", "tenant.delete", "superadmin.all"]',
        true, NOW(), NOW()
      )
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        is_active = EXCLUDED.is_active,
        password_hash = EXCLUDED.password_hash,
        permissions = EXCLUDED.permissions,
        can_access_all_tenants = EXCLUDED.can_access_all_tenants,
        updated_at = EXCLUDED.updated_at
      RETURNING id, email, name, permissions, can_access_all_tenants;
    `;
    
    const result = await client.query(query, [
      authData.user.id,
      adminConfig.email,
      adminConfig.name,
      passwordHash
    ]);
    
    console.log('✅ Super admin record created/updated successfully:');
    const adminRecord = result.rows[0];
    console.log(`   ID: ${adminRecord.id}`);
    console.log(`   Email: ${adminRecord.email}`);
    console.log(`   Name: ${adminRecord.name}`);
    console.log(`   Permissions: [${adminRecord.permissions.join(', ')}]`);
    console.log(`   Can Access All Tenants: ${adminRecord.can_access_all_tenants}`);

    // STEP 3: Test authentication
    console.log('\n🧪 Step 3: Testing authentication...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminConfig.email,
      password: adminConfig.password
    });

    if (signInError) {
      console.error('❌ Authentication test failed:', signInError.message);
    } else {
      console.log('✅ Authentication test successful');
      console.log(`   Session Active: ${signInData.session ? 'Yes' : 'No'}`);
    }

    console.log('\n🎉 Super Admin setup completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Login ke: http://localhost:3000/admin');
    console.log(`2. Email: ${adminConfig.email}`);
    console.log(`3. Password: ${adminConfig.password}`);
    console.log('4. Configure tenant settings');

  } catch (err) {
    console.error('❌ Error creating super admin:', err.message);
    
    if (err.message.includes('duplicate key')) {
      console.log('\n💡 Suggestion: Admin with this email might already exist.');
      console.log('   Try using different email or check existing admin records.');
    }
    
  } finally {
    client.release();
    await pool.end();
  }
}

// Helper function to validate email format
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Safety check
console.log('🔒 Starting admin creation script...');
console.log('⚠️ Make sure you are running this in a secure environment!');

// Run the function
createSuperAdmin().then(() => {
  console.log('\n✨ Process completed');
}).catch(err => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});