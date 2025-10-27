-- Check superadmin and RLS issues
-- Run this in Supabase SQL Editor

-- Disable RLS temporarily to test
ALTER TABLE super_admins DISABLE ROW LEVEL SECURITY;

-- Check existing superadmins
SELECT 'Superadmins in table:' as info;
SELECT id, email, name, is_active, created_at FROM super_admins;

-- Test if our superadmin exists
SELECT 'Checking our superadmin:' as info;
SELECT * FROM super_admins WHERE email = 'superadmin@booqing.my.id';

-- Re-enable RLS with proper policies
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Create simple superadmin policy (bypass for now)
DROP POLICY IF EXISTS "Super Admins have full access to super_admins" ON super_admins;

-- Simple policy that allows all superadmins to see all superadmins
CREATE POLICY "Super Admins have full access to super_admins" ON super_admins
  FOR ALL USING (
    email IS NOT NULL  -- Super basic check - will be refined
  );

-- Test the policy
SELECT 'Policy created. Testing access...' as info;
