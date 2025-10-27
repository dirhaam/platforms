-- Temporarily disable RLS for testing
-- Run this in Supabase SQL Editor

-- Disable RLS on super_admins to allow authentication
ALTER TABLE super_admins DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT 'RLS disabled on super_admins table for testing' as status;

-- Check existing superadmins
SELECT id, email, name, is_active FROM super_admins WHERE email LIKE '%booqing.my.id';
