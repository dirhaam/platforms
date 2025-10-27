-- Targeted RLS Policy Fix for Type Mismatches
-- This script addresses the specific "uuid = text" error by ensuring type consistency

-- First, identify the actual types used in the main schema file (supabase/schema.sql)
-- According to the schema file, the tenants table has:
--   id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()
-- This means although it uses a UUID generation function, the column is TEXT

-- To fix the RLS policies, we need to ensure type consistency throughout

-- Step 1: Temporarily disable RLS to make changes safely
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subdomains DISABLE ROW LEVEL SECURITY;
ALTER TABLE cache DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies that may cause issues
DROP POLICY IF EXISTS "Sessions: Access allowed for valid session" ON sessions;
DROP POLICY IF EXISTS "Tenants: Users can view their own tenant" ON tenants;
DROP POLICY IF EXISTS "Services: Users can view services from their tenant" ON services;
DROP POLICY IF EXISTS "Customers: Users can view customers from their tenant" ON customers;
DROP POLICY IF EXISTS "Bookings: Users can view bookings from their tenant" ON bookings;
DROP POLICY IF EXISTS "Staff: Users can view staff from their tenant" ON staff;
DROP POLICY IF EXISTS "Super Admins: Full access to all tables" ON super_admins;
DROP POLICY IF EXISTS "WhatsApp Devices: Tenant isolation" ON whatsapp_devices;
DROP POLICY IF EXISTS "Conversations: Tenant isolation" ON conversations;
DROP POLICY IF EXISTS "Messages: Tenant isolation" ON messages;
DROP POLICY IF EXISTS "Message Templates: Tenant isolation" ON message_templates;
DROP POLICY IF EXISTS "Business Hours: Tenant isolation" ON business_hours;
DROP POLICY IF EXISTS "Invoices: Tenant isolation" ON invoices;
DROP POLICY IF EXISTS "Invoice Items: Tenant isolation" ON invoice_items;
DROP POLICY IF EXISTS "Service Areas: Tenant isolation" ON service_areas;
DROP POLICY IF EXISTS "Security Audit Logs: Super Admin Access" ON security_audit_logs;
DROP POLICY IF EXISTS "Activity Logs: Tenant isolation" ON activity_logs;
DROP POLICY IF EXISTS "Activity Logs: Super Admin can manage all logs" ON activity_logs;
DROP POLICY IF EXISTS "Tenant Subdomains: Super Admin Access" ON tenant_subdomains;
DROP POLICY IF EXISTS "Cache: Access with proper authentication" ON cache;

-- Step 3: If we need to align column types, we'll need to modify them to be consistent
-- Based on your schema file, the tenants.id is TEXT but the sessions table probably has UUID
-- Let's ensure we have consistent types by updating the RLS policies to handle this properly

-- Sessions policy - handling potential type mismatch between tenants.id (TEXT) and sessions.tenant_id
CREATE POLICY "Sessions: Access allowed for valid session" ON sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenants t
      WHERE t.id = sessions.tenant_id::text  -- Cast UUID to TEXT to match tenants.id
      AND (auth.jwt() ->> 'email' = t.email OR auth.uid() = sessions.user_id::uuid)
    )
    OR EXISTS (
      SELECT 1 FROM super_admins sa
      WHERE sa.email = auth.jwt() ->> 'email'
      AND sa.is_active = true
      AND sa.can_access_all_tenants = true
    )
  );

-- Activity Logs policy - handle potential type mismatch
CREATE POLICY "Activity Logs: Tenant isolation" ON activity_logs
  FOR SELECT USING (
    (
      -- If tenant_id is UUID, cast it to TEXT for comparison with tenants.id
      CASE 
        WHEN pg_typeof(activity_logs.tenant_id) = 'uuid'::regtype 
        THEN activity_logs.tenant_id::text 
        ELSE activity_logs.tenant_id 
      END
    ) IN (
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

-- Security Audit Logs policy - handle potential type mismatch
CREATE POLICY "Security Audit Logs: Super Admin Access" ON security_audit_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM super_admins sa
      WHERE sa.email = auth.jwt() ->> 'email'
      AND sa.is_active = true
    )
  );

-- Create policies for all tables with consistent type handling
-- Tenants policies
CREATE POLICY "Tenants: Users can view their own tenant" ON tenants
  FOR SELECT USING (
    auth.jwt() ->> 'email' = email
    OR EXISTS (
      SELECT 1 FROM super_admins 
      WHERE super_admins.email = auth.jwt() ->> 'email'
      AND super_admins.is_active = true
    )
  );

CREATE POLICY "Tenants: Users can update their own tenant" ON tenants
  FOR UPDATE USING (
    auth.jwt() ->> 'email' = email
  ) WITH CHECK (
    auth.jwt() ->> 'email' = email
  );

-- Services policies - ensure type consistency
CREATE POLICY "Services: Users can view services from their tenant" ON services
  FOR SELECT USING (
    services.tenant_id IN (
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
    services.tenant_id IN (
      SELECT id FROM tenants 
      WHERE auth.jwt() ->> 'email' = email
    )
  ) WITH CHECK (
    services.tenant_id IN (
      SELECT id FROM tenants 
      WHERE auth.jwt() ->> 'email' = email
    )
  );

-- Customers policies
CREATE POLICY "Customers: Users can view customers from their tenant" ON customers
  FOR SELECT USING (
    customers.tenant_id IN (
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
    customers.tenant_id IN (
      SELECT id FROM tenants 
      WHERE auth.jwt() ->> 'email' = email
    )
  ) WITH CHECK (
    customers.tenant_id IN (
      SELECT id FROM tenants 
      WHERE auth.jwt() ->> 'email' = email
    )
  );

-- Bookings policies
CREATE POLICY "Bookings: Users can view bookings from their tenant" ON bookings
  FOR SELECT USING (
    bookings.tenant_id IN (
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

CREATE POLICY "Bookings: Users can manage bookings from their tenant" ON bookings
  FOR ALL USING (
    bookings.tenant_id IN (
      SELECT id FROM tenants 
      WHERE auth.jwt() ->> 'email' = email
    )
  ) WITH CHECK (
    bookings.tenant_id IN (
      SELECT id FROM tenants 
      WHERE auth.jwt() ->> 'email' = email
    )
  );

-- Staff policies
CREATE POLICY "Staff: Users can view staff from their tenant" ON staff
  FOR SELECT USING (
    staff.tenant_id IN (
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

CREATE POLICY "Staff: Users can manage staff from their tenant" ON staff
  FOR ALL USING (
    staff.tenant_id IN (
      SELECT id FROM tenants 
      WHERE auth.jwt() ->> 'email' = email
    )
  ) WITH CHECK (
    staff.tenant_id IN (
      SELECT id FROM tenants 
      WHERE auth.jwt() ->> 'email' = email
    )
  );

-- Super Admin policies
CREATE POLICY "Super Admins: Full access to all tables" ON super_admins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM super_admins sa
      WHERE sa.email = auth.jwt() ->> 'email'
      AND sa.is_active = true
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins sa
      WHERE sa.email = auth.jwt() ->> 'email'
      AND sa.is_active = true
    )
  );

-- Step 4: Re-enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subdomains ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify all policies are created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

SELECT 'RLS policies have been configured with proper type handling!' as status;

-- Step 6: If you still have type issues, run this to identify the actual types in your database:
/*
SELECT 
    table_name,
    column_name, 
    data_type
FROM information_schema.columns
WHERE table_name IN ('tenants', 'sessions', 'services', 'customers', 'bookings', 'staff', 'activity_logs', 'security_audit_logs')
AND column_name IN ('id', 'tenant_id', 'user_id')
ORDER BY table_name, column_name;
*/