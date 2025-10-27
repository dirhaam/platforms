-- Isolated RLS Policy Creation to Identify the Problem
-- We'll create policies one by one to identify which one is causing the error

-- First, disable RLS on all tables to start fresh
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
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE cache DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || 
                ' ON ' || quote_ident(policy_record.schemaname) || '.' || quote_ident(policy_record.tablename) || ';';
    END LOOP;
END $$;

-- Now create policies one by one to identify the problematic one

-- 1. Start with a simple tenants policy
CREATE POLICY "Tenants: Users can view their own tenant" ON tenants
  FOR SELECT USING (
    auth.jwt() ->> 'email' = email
    OR EXISTS (
      SELECT 1 FROM super_admins 
      WHERE super_admins.email = auth.jwt() ->> 'email'
      AND super_admins.is_active = true
    )
  );

-- 2. Create sessions policy with explicit type casting
CREATE POLICY "Sessions: Access allowed for valid session" ON sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenants t
      WHERE t.id = sessions.tenant_id::text  -- Explicit cast to text to match tenants.id
      AND (auth.jwt() ->> 'email' = t.email OR auth.uid() = sessions.user_id::uuid)
    )
    OR EXISTS (
      SELECT 1 FROM super_admins sa
      WHERE sa.email = auth.jwt() ->> 'email'
      AND sa.is_active = true
      AND sa.can_access_all_tenants = true
    )
  );

-- 3. Create a basic services policy
CREATE POLICY "Services: Users can view services from their tenant" ON services
  FOR SELECT USING (
    services.tenant_id::text IN (  -- Cast to text to match tenants.id
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

-- 4. Create a basic customers policy
CREATE POLICY "Customers: Users can view customers from their tenant" ON customers
  FOR SELECT USING (
    customers.tenant_id::text IN (  -- Cast to text to match tenants.id
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

-- 5. Create super_admins policy
CREATE POLICY "Super Admins: Full access" ON super_admins
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

-- Enable RLS on tables that have policies
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Check which policies were created successfully
SELECT 
    schemaname, 
    tablename, 
    policyname
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

SELECT 'Initial RLS policies created with explicit type casting' as status;