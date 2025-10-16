-- User Management Guide
-- This shows both methods

-- METHOD 1: Super Admin Users (SQL Editor)
-- These users bypass Supabase Auth completely

-- Create new superadmin
INSERT INTO super_admins (
  email, 
  name, 
  is_active, 
  password_hash, 
  permissions, 
  can_access_all_tenants
) VALUES (
  'newadmin@booqing.my.id',
  'New Admin',
  true,
  '$2b$10$hash_goes_here', -- Replace with actual bcrypt hash
  '["*"]',
  true
);

-- METHOD 2: Regular Users (Supabase Auth + SQL)
-- Step 1: Create user in Supabase Auth Dashboard first
-- Authentication → Users → Add User

-- Step 2: Create corresponding tenant record
INSERT INTO tenants (
  email,
  name,
  subdomain,
  business_name,
  business_category,
  owner_name,
  phone,
  subscription_plan
) VALUES (
  'user@example.com', -- Must match Auth user email
  'John Doe Business',
  'john Doe Business', -- Must be unique
  'IT Services',
  'Technology',
  'John Doe',
  '+628123456789',
  'basic'
);

-- Check current users
SELECT '=== SUPER ADMIN USERS ===' as section;
SELECT email, name, is_active FROM super_admins;

SELECT '=== TENANT USERS ===' as section;
SELECT email, business_name, subdomain, subscription_status FROM tenants;
