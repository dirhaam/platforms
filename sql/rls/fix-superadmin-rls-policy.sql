-- Fix RLS Policy for SuperAdmin Creation
-- This allows superadmins to create other superadmins

-- First, temporarily disable RLS on super_admins table
ALTER TABLE super_admins DISABLE ROW LEVEL SECURITY;

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Super Admins: Full access to all tables" ON super_admins;
DROP POLICY IF EXISTS "Super Admins: Full access" ON super_admins;

-- Create a new policy that allows superadmins to manage other superadmins
CREATE POLICY "Super Admins can manage superadmins" ON super_admins
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins current_sa
      WHERE current_sa.email = auth.jwt() ->> 'email'
      AND current_sa.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins current_sa
      WHERE current_sa.email = auth.jwt() ->> 'email'
      AND current_sa.is_active = true
    )
  );

-- Re-enable RLS
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Verify the policy was created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'super_admins';

SELECT 'SuperAdmin RLS policy updated successfully!' as status;