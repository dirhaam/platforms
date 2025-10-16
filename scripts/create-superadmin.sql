-- Script to create SuperAdmin in production database
-- Run this in Supabase SQL Editor

-- First, check if superadmin already exists
SELECT * FROM super_admins WHERE email = 'superadmin@booqing.my.id';

-- If not exists, create one
-- Note: You need to hash the password first using bcrypt
-- Password: ChangeThisPassword123!
-- Bcrypt hash (10 rounds): $2a$10$YourHashedPasswordHere

-- Example insert (you need to generate the actual bcrypt hash):
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
  'sa_' || gen_random_uuid(),
  'superadmin@booqing.my.id',
  'Super Admin',
  '$2a$10$aZXQHX9kCp5pFMLBzzVAuuYfhVwvPWNrLJGzj6rCcovzgXaR8lTYi', -- This is example hash, generate your own!
  true,
  0,
  '["*"]',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;
