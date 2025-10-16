-- Create Additional Super Admin Users
-- Run this in Supabase SQL Editor

-- Check existing superadmins
SELECT 'Current Super Admins:' as info, id, email, name, is_active, created_at FROM super_admins;

-- Create additional superadmin users
INSERT INTO super_admins (
  email, 
  name, 
  is_active, 
  password_hash, 
  permissions, 
  can_access_all_tenants
) VALUES 
(
  'admin@booqing.my.id',
  'Admin User',
  true,
  '$2b$10$yxLNNmJqQEVW6mRcC8uQLulNK/smTVEe4TDm5IT.EqUd13bq4CVRS',
  '["*"]',
  true
),
(
  'support@booqing.my.id',
  'Support Team',
  true,
  '$2b$10$yxLNNmJqQEVW6mRcC8uQLulNK/smTVEe4TDm5IT.EqUd13bq4CVRS',
  '["read:*", "manage:tenants", "manage:customers", "manage:bookings"]',
  true
),
(
  'developer@booqing.my.id',
  'Developer',
  true,
  '$2b$10$yxLNNmJqQEVW6mRcC8uQLulNK/smTVEe4TDm5IT.EqUd13bq4CVRS',
  '["*"]',
  true
);

-- Verify all superadmins
SELECT 'All Super Admins after creation:' as info;
SELECT 
  id, 
  email, 
  name, 
  is_active, 
  can_access_all_tenants,
  created_at 
FROM super_admins 
ORDER BY created_at;

-- Show credentials
SELECT 'Superadmin Login Credentials:' as login_info;
SELECT 
  email,
  name,
  'Password: ChangeThisPassword123!' as password,
  CASE 
    WHEN permissions = '["*"]' THEN 'Full Access'
    ELSE 'Limited Access'
  END as access_level
FROM super_admins 
WHERE is_active = true
ORDER BY created_at;
