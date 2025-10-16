-- Script to create SuperAdmin in production database
-- Run this in Supabase SQL Editor

-- First, check if superadmin already exists
-- SELECT * FROM super_admins WHERE email = 'your-admin-email@example.com';

-- If not exists, create one
-- Note: You need to hash the password first using bcrypt
-- Generate your own bcrypt hash using: https://bcrypt-generator.com/
-- Or use Node.js: require('bcrypt').hashSync('your-password', 10)

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
  gen_random_uuid(),
  'your-admin-email@example.com',
  'Your Admin Name',
  '$2a$10$your-generated-bcrypt-hash-here',
  true,
  0,
  '["*"]',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;
