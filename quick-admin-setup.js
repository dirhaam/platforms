#!/usr/bin/env node

// Quick Admin Setup - Simplified version for testing
// Usage: node quick-admin-setup.js

const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
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

// Validate required variables
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.DATABASE_URL) {
  console.error('❌ Missing required environment variables in .env.local:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY'); 
  console.error('- DATABASE_URL');
  process.exit(1);
}

// Default admin configuration
const ADMIN_CONFIG = {
  email: 'admin@booqing.com',     // Change this
  password: 'Admin123!@#',        // Change this  
  name: 'Platform Admin'          // Change this
};

console.log('🚀 Quick Admin Setup');
console.log('====================\n');

console.log('📋 Admin Configuration:');
console.log(`   Email: ${ADMIN_CONFIG.email}`);
console.log(`   Password: ${ADMIN_CONFIG.password}`);
console.log(`   Name: ${ADMIN_CONFIG.name}`);

// Ask for confirmation
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('\nUse these credentials? (y/N): ', async (answer) => {
  if (answer.toLowerCase() !== 'y') {
    console.log('❌ Setup cancelled');
    rl.close();
    process.exit(0);
  }

  try {
    await createAdmin();
    rl.close();
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    rl.close();
    process.exit(1);
  }
});

async function createAdmin() {
  console.log('\n🔧 Creating Super Admin...\n');
  
  const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const supabaseTest = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const pool = new Pool({ connectionString: env.DATABASE_URL });

  let userId = null;
  let userCreated = false;

  try {
    // Step 1: Check/Create user in Supabase Auth
    console.log('1️⃣ Checking user in Supabase Auth...');
    
    try {
      // First try to create user (this will fail if user exists)
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_CONFIG.email,
        password: ADMIN_CONFIG.password,
        email_confirm: true,
        user_metadata: {
          name: ADMIN_CONFIG.name,
          role: 'superadmin'
        }
      });
      
      // Handle response - check if user was created or exists
      if (createData && createData.user) {
        userId = createData.user.id;
        userCreated = true;
        console.log('✅ New user created successfully');
      } else {
        // User likely exists or we need to handle differently
        console.log('⚠️ User already exists or creation failed, checking existing users...');
        
        try {
          // Try to list users to find existing user
          const { data: userList } = await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 100 // Should be enough for development
          });
          
          const existingUser = userList.users.find(user => user.email === ADMIN_CONFIG.email);
          if (existingUser) {
            userId = existingUser.id;
            console.log('✅ Found existing user');
          } else {
            // If we can't find user by listing, we'll fallback to email-based approach
            console.log('⚠️ User may exist but not found in listing, using email-based lookup');
            userId = null; // We'll handle this in the database step
          }
        } catch (listError) {
          console.log('⚠️ Cannot list users, using email-based lookup');
          userId = null; // Fallback to email-based approach
        }
      }
    } catch (err) {
      console.error('❌ Auth step failed:', err.message);
      throw err;
    }

    if (!userId) {
      throw new Error('Failed to get or create user ID');
    }

    // Step 2: Create/update record in super_admins table
    console.log('2️⃣ Creating record in super_admins table...');
    
    const client = await pool.connect();
    try {
      const passwordHash = await bcrypt.hash(ADMIN_CONFIG.password, 10);
      const permissionsJson = JSON.stringify(['admin.all', 'tenant.all', 'superadmin.all']);
      
      let query, params;
      
      if (userId) {
        // We have user ID, use it directly
        query = `
          INSERT INTO super_admins (
            id, email, name, is_active, password_hash,
            permissions, can_access_all_tenants, created_at, updated_at
          ) VALUES (
            $1, $2, $3, true, $4,
            $5,
            true, NOW(), NOW()
          )
          ON CONFLICT (email) DO UPDATE SET
            id = COALESCE(EXCLUDED.id, $1),
            name = EXCLUDED.name,
            password_hash = EXCLUDED.password_hash,
            permissions = EXCLUDED.permissions,
            updated_at = EXCLUDED.updated_at
          RETURNING id, email, name, created_at;
        `;
        params = [userId, ADMIN_CONFIG.email, ADMIN_CONFIG.name, passwordHash, permissionsJson];
      } else {
        // No user ID - create without ID reference, let auth user link via email later
        query = `
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
            password_hash = EXCLUDED.password_hash,
            permissions = EXCLUDED.permissions,
            updated_at = EXCLUDED.updated_at
          RETURNING id, email, name, created_at;
        `;
        params = [ADMIN_CONFIG.email, ADMIN_CONFIG.name, passwordHash, permissionsJson];
      }
      
      const result = await client.query(query, params);
      
      const adminRecord = result.rows[0];
      console.log('✅ Super admin record created/updated');
      console.log(`   Record Email: ${adminRecord.email}`);
      console.log(`   Record Name: ${adminRecord.name}`);
      
      if (!userId) {
        userId = adminRecord.id; // Use database ID if auth ID not available
        console.log(`   Using database ID: ${userId}`);
      }
      
    } catch (dbError) {
      console.error('❌ Database operation failed:', dbError.message);
      throw dbError;
    } finally {
      client.release();
    }

    // Step 3: Test authentication if user was just created
    if (userCreated) {
      console.log('3️⃣ Testing authentication...');
      try {
        const { data: signInData, error: signInError } = await supabaseTest.auth.signInWithPassword({
          email: ADMIN_CONFIG.email,
          password: ADMIN_CONFIG.password
        });

        if (signInError) {
          console.log('⚠️ Authentication test failed (but user was created):', signInError.message);
        } else {
          console.log('✅ Authentication test successful');
          await supabaseTest.auth.signOut(); // Sign out test session
        }
      } catch (testError) {
        console.log('⚠️ Authentication test error (but user was created):', testError.message);
      }
    } else {
      console.log('⏭️ Skipping authentication test for existing user');
    }

    await pool.end();
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 Login Information:');
    console.log('   URL: http://localhost:3000/admin');
    console.log(`   Email: ${ADMIN_CONFIG.email}`);
    console.log(`   Password: ${ADMIN_CONFIG.password}`);
    console.log(`   User Status: ${userCreated ? 'New user created' : 'Existing user updated'}`);
    
    console.log('\n📝 Next Steps:');
    console.log('   1. pnpm dev');
    console.log('   2. Open http://localhost:3000/admin');
    console.log('   3. Login with credentials above');
    console.log('   4. Create first tenant');

  } catch (error) {
    await pool.end();
    throw error;
  }
}
