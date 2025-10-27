-- Update RLS Policies to Allow Superadmin Creation
-- Run this in Supabase SQL Editor

-- Drop existing superadmin policies
DROP POLICY IF EXISTS "Super Admins have full access to super_admins" ON super_admins;

-- Create new policies for super_admins table
CREATE POLICY "Allow anonymous to create superadmins" ON super_admins
  FOR INSERT WITH CHECK (true);  -- Allow creation during signup

CREATE POLICY "Super Admins can read all superadmins" ON super_admins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE super_admins.email = auth.email()
      AND super_admins.is_active = true
    )
  );

CREATE POLICY "Super Admins can update themselves" ON super_admins
  FOR UPDATE USING (
    email = auth.email()
  );

CREATE POLICY "Super Admins can delete themselves" ON super_admins
  FOR DELETE USING (
    email = auth.email()
  );

-- For now, disable RLS on super_admins to allow easier testing
ALTER TABLE super_admins DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT 'RLS policies updated for super_admins table' as status;

-- Show current policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'super_admins';
