#!/usr/bin/env node

// Setup Supabase Admin - Complete setup untuk super admin pertama kali
// Usage: node setup-supabase-admin.js

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
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

// Readline interface untuk interactive input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePassword(password) {
  return password.length >= 8;
}

async function setupSupabaseAdmin() {
  console.log('🚀 Booqing Platform - Supabase Admin Setup\n');
  
  // Check environment variables
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const databaseUrl = env.DATABASE_URL;

  if (!supabaseUrl || !supabaseServiceKey || !databaseUrl) {
    console.error('❌ Missing required environment variables:');
    console.error('Please add these to your .env.local file:');
    console.error('  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
    console.error('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
    console.error('  DATABASE_URL=postgresql://...');
    process.exit(1);
  }

  console.log('✅ Environment variables loaded\n');

  // Get admin configuration interactively
  console.log('📝 Konfigurasi Super Admin:\n');
  
  const adminEmail = await question('Email admin: ');
  if (!validateEmail(adminEmail)) {
    console.error('❌ Email tidak valid!');
    process.exit(1);
  }

  const adminName = await question('Nama lengkap: ');
  if (!adminName || adminName.trim().length < 2) {
    console.error('❌_nama harus diisi minimal 2 karakter!');
    process.exit(1);
  }

  const adminPassword = await question('Password (min 8 karakter): ');
  if (!validatePassword(adminPassword)) {
    console.error('❌ Password harus minimal 8 karakter!');
    process.exit(1);
  }

  const confirmPassword = await question('Konfirmasi password: ');
  if (adminPassword !== confirmPassword) {
    console.error('❌ Password tidak sesuai!');
    process.exit(1);
  }

  console.log('\n🔐 Konfigurasi yang akan dibuat:');
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Nama: ${adminName}`);
  console.log(`   Password: ${'*'.repeat(adminPassword.length)}`);

  const confirm = await question('\n✅ Lanjutkan? (y/N): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ Dibatalkan oleh user.');
    process.exit(0);
  }

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('\n🔄 Memulai proses setup...\n');

  try {
    // Step 1: Create user in Supabase Auth
    console.log('1️⃣ Membuat user di Supabase Auth...');
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        name: adminName,
        role: 'superadmin',
        is_superuser: true,
        created_by: 'setup-script'
      }
    });

    if (authError) {
      if (authError.message.includes('duplicate') || authError.message.includes('already registered')) {
        console.log('⚠️ User sudah ada, menggunakan existing user...');
        
        const { data: existingUser } = await supabase.auth.admin.getUserByEmail(adminEmail);
        if (!existingUser?.user) {
          throw new Error('User exists but cannot be retrieved');
        }
        
        authData.user = existingUser.user;
      } else {
        throw authError;
      }
    } else {
      console.log(`✅ User berhasil dibuat dengan ID: ${authData.user.id}`);
    }

    // Step 2: Create super admin record in database
    console.log('\n2️⃣ Membuat record di tabel super_admins...');
    
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: databaseUrl
    });
    
    const client = await pool.connect();
    
    try {
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      
      const query = `
        INSERT INTO super_admins (
          id, email, name, is_active, password_hash,
          permissions, can_access_all_tenants, created_at, updated_at
        ) VALUES (
          $1, $2, $3, true, $4,
          ARRAY[
            'admin.all',
            'tenant.create', 'tenant.read', 'tenant.update', 'tenant.delete',
            'superadmin.all',
            'analytics.view', 'analytics.export',
            'security.audit'
          ],
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
        adminEmail,
        adminName,
        passwordHash
      ]);
      
      const adminRecord = result.rows[0];
      console.log('✅ Super admin record berhasil dibuat:');
      console.log(`   ID: ${adminRecord.id}`);
      console.log(`   Email: ${adminRecord.email}`);
      console.log(`   Permissions: ${adminRecord.permissions.length} permissions`);
      
    } finally {
      client.release();
      await pool.end();
    }

    // Step 3: Test authentication
    console.log('\n3️⃣ Testing authentication...');
    
    // Create new client for testing (without admin rights)
    const testClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: signInData, error: signInError } = await testClient.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });

    if (signInError) {
      console.error('❌ Authentication test failed:', signInError.message);
    } else {
      console.log('✅ Authentication test successful');
      console.log(`   Session created: ${signInData.session ? 'Yes' : 'No'}`);
      
      // Sign out test session
      await testClient.auth.signOut();
    }

    // Step 4: Create initial system configuration if needed
    console.log('\n4️⃣ Checking system configuration...');
    
    // Check if system config exists
    const { data: configCheck, error: configError } = await supabase
      .from('activity_logs')
      .select('count')
      .limit(1);
      
    if (!configError && configCheck !== null) {
      console.log('✅ Database tables access verified');
    }

    console.log('\n🎉 Setup completed successfully!\n');
    
    console.log('📋 Login Information:');
    console.log('   URL: http://localhost:3000/admin');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    
    console.log('\n🔗 Important Links:');
    console.log('   - Supabase Dashboard: https://app.supabase.com');
    console.log('   - Local Development: http://localhost:3000');
    console.log('   - Admin Panel: http://localhost:3000/admin');
    
    console.log('\n📝 Next Steps:');
    console.log('   1. Start development server: pnpm dev');
    console.log('   2. Login ke admin panel dengan credentials di atas');
    console.log('   3. Create first tenant untuk testing');
    console.log('   4. Configure tenant settings');
    
    console.log('\n⚠️ Security Notes:');
    console.log('   - Simpan credentials ini dengan aman');
    console.log('   - Ganti password setelah login pertama');
    console.log('   - Enable 2FA jika available di production');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    
    if (error.message.includes('duplicate key')) {
      console.log('\n💡 Tip: Admin dengan email ini mungkin sudah ada.');
      console.log('   Coba gunakan email berbeda atau hapus admin yang ada.');
    }
    
    if (error.message.includes('connection') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Tip: Connection error - coba periksa:');
      console.log('   - Supabase service sedang aktif');
      console.log('   - Environment variables benar');
      console.log('   - Network connection stabil');
    }
    
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Safety warning
console.log('⚠️  IMPORTANT: This script creates super admin credentials\n');

setupSupabaseAdmin().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
