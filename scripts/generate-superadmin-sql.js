const bcrypt = require('bcryptjs');

const email = 'superadmin@booqing.my.id';
const password = 'ChangeThisPassword123!';

async function generateSQL() {
  // Generate bcrypt hash
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Generate ID
  const id = `sa_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  
  // Generate SQL command
  const sql = `
-- SuperAdmin Creation SQL for Production
-- Generated at: ${new Date().toISOString()}
-- Email: ${email}
-- Password: ${password}

-- First check if exists
SELECT * FROM super_admins WHERE email = '${email}';

-- Create SuperAdmin if not exists
INSERT INTO super_admins (
  id,
  email,
  name,
  password_hash,
  is_active,
  login_attempts,
  permissions,
  can_access_all_tenants,
  created_at,
  updated_at
) VALUES (
  '${id}',
  '${email}',
  'Super Admin',
  '${passwordHash}',
  true,
  0,
  '["*"]'::jsonb,
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  password_hash = '${passwordHash}',
  is_active = true,
  login_attempts = 0,
  updated_at = NOW();

-- Verify creation
SELECT id, email, name, is_active FROM super_admins WHERE email = '${email}';
`;

  console.log('========================================');
  console.log('SUPERADMIN SQL COMMAND GENERATED');
  console.log('========================================');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('Password Hash:', passwordHash);
  console.log('========================================');
  console.log('\nCOPY AND RUN THIS SQL IN SUPABASE:');
  console.log('========================================');
  console.log(sql);
  console.log('========================================');
  console.log('\n⚠️  IMPORTANT: Change password after first login!');
}

generateSQL().catch(console.error);
