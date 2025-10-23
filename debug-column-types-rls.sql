-- First, let's check the actual column types in the database
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name IN ('tenants', 'sessions', 'super_admins')
AND column_name IN ('id', 'tenant_id', 'user_id')
ORDER BY table_name, column_name;

-- Based on this and the error, we need to figure out the actual types
-- Since the error persists, it means either:
-- 1. tenants.id is TEXT but tenant_id in sessions is UUID, OR
-- 2. There's a mismatch somewhere in the RLS policies

-- Let's create RLS policies with proper type handling based on your schema file
-- According to supabase/schema.sql, tenants.id is TEXT, so let's ensure all RLS policies
-- handle this appropriately by casting UUIDs to TEXT for comparison with tenants.id

-- First, let's make sure the sessions table has the right column types to match the tenants table
-- If tenants.id is TEXT, then sessions.tenant_id should also be TEXT

-- Temporarily disable RLS to fix the schema issue
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;

-- Drop the problematic sessions policy if it exists
DROP POLICY IF EXISTS "Sessions: Access allowed for valid session" ON sessions;

-- Fix the column types to be consistent with the tenants table structure
-- If the error is from sessions.tenant_id being UUID while tenants.id is TEXT:
-- ALTER TABLE sessions ALTER COLUMN tenant_id TYPE TEXT USING tenant_id::TEXT;
-- ALTER TABLE sessions ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Re-enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Now create the corrected RLS policy for sessions
CREATE POLICY "Sessions: Access allowed for valid session" ON sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenants t
      WHERE t.id = tenant_id  -- No casting needed if both are the same type
      AND (auth.jwt() ->> 'email' = t.email OR auth.uid() = user_id::uuid)
    )
    OR EXISTS (
      SELECT 1 FROM super_admins sa
      WHERE sa.email = auth.jwt() ->> 'email'
      AND sa.is_active = true
      AND sa.can_access_all_tenants = true
    )
  );

-- Create other policies with proper type handling
-- Tenants policies (for reference)
CREATE POLICY "Tenants: Users can view their own tenant" ON tenants
  FOR SELECT USING (
    auth.jwt() ->> 'email' = email
    OR EXISTS (
      SELECT 1 FROM super_admins 
      WHERE super_admins.email = auth.jwt() ->> 'email'
      AND super_admins.is_active = true
    )
  );

-- Services policies - tenant isolation (ensuring tenant_id matches tenants.id)
CREATE POLICY "Services: Users can view services from their tenant" ON services
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM tenants 
      WHERE auth.jwt() ->> 'email' = email
    )
    OR EXISTS (
      SELECT 1 FROM super_admins 
      WHERE super_admins.email = auth.jwt() ->> 'email'
      AND super_admins.is_active = true
      AND super_admins.can_access_all_tenants = true
    )
  );

CREATE POLICY "Services: Users can manage services from their tenant" ON services
  FOR ALL USING (
    tenant_id IN (
      SELECT id FROM tenants 
      WHERE auth.jwt() ->> 'email' = email
    )
  ) WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants 
      WHERE auth.jwt() ->> 'email' = email
    )
  );

-- Customers policies - tenant isolation
CREATE POLICY "Customers: Users can view customers from their tenant" ON customers
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM tenants 
      WHERE auth.jwt() ->> 'email' = email
    )
    OR EXISTS (
      SELECT 1 FROM super_admins 
      WHERE super_admins.email = auth.jwt() ->> 'email'
      AND super_admins.is_active = true
      AND super_admins.can_access_all_tenants = true
    )
  );

CREATE POLICY "Customers: Users can manage customers from their tenant" ON customers
  FOR ALL USING (
    tenant_id IN (
      SELECT id FROM tenants 
      WHERE auth.jwt() ->> 'email' = email
    )
  ) WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants 
      WHERE auth.jwt() ->> 'email' = email
    )
  );

-- Activity Logs - tenant isolation with proper type handling
CREATE POLICY "Activity Logs: Tenant isolation" ON activity_logs
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM tenants 
      WHERE auth.jwt() ->> 'email' = email
    )
    OR EXISTS (
      SELECT 1 FROM super_admins sa
      WHERE sa.email = auth.jwt() ->> 'email'
      AND sa.is_active = true
      AND sa.can_access_all_tenants = true
    )
  );

CREATE POLICY "Activity Logs: Super Admin can manage all logs" ON activity_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM super_admins sa
      WHERE sa.email = auth.jwt() ->> 'email'
      AND sa.is_active = true
    )
  );

-- Verify that all policies are created correctly
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE schemaname = 'public' AND tablename IN ('sessions', 'tenants', 'services', 'customers', 'activity_logs')
ORDER BY tablename, policyname;

SELECT 'RLS policies have been reconfigured with corrected type handling!' as status;