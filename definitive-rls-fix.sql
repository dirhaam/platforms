-- Definitive Solution: RLS Policies with Type Consistency
-- This handles the UUID vs TEXT mismatch by ensuring consistent types

-- First, let's be explicit about the expected data types based on your schema file
-- The supabase/schema.sql defines tenants.id as TEXT, so all related columns should match
-- If any table has UUID columns that reference tenants.id, they should be converted to TEXT

-- 1. Temporarily disable RLS on all tables
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

-- 2. Drop all existing policies
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

-- 3. THE KEY FIX: Ensure type consistency in RLS policies
-- Since tenants.id is defined as TEXT in your schema, all referencing columns should be compatible
-- We'll use casting to ensure proper comparison in all policies

-- Sessions policy - the likely source of the error
CREATE POLICY "Sessions: Access for tenant users" ON sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE tenants.id = sessions.tenant_id::text  -- Cast UUID to TEXT
      AND auth.jwt() ->> 'email' = tenants.email
    )
    OR EXISTS (
      SELECT 1 FROM super_admins 
      WHERE super_admins.email = auth.jwt() ->> 'email'
      AND super_admins.is_active = true
      AND super_admins.can_access_all_tenants = true
    )
  );

-- Tenants policy
CREATE POLICY "Tenants: Users access own tenant" ON tenants
  FOR ALL USING (
    auth.jwt() ->> 'email' = email
    OR EXISTS (
      SELECT 1 FROM super_admins 
      WHERE super_admins.email = auth.jwt() ->> 'email'
      AND super_admins.is_active = true
    )
  );

-- Services policy - cast tenant_id to TEXT to match tenants.id
CREATE POLICY "Services: Tenant isolation" ON services
  FOR ALL USING (
    services.tenant_id::text IN (  -- Cast to TEXT to match tenants.id
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

-- Customers policy
CREATE POLICY "Customers: Tenant isolation" ON customers
  FOR ALL USING (
    customers.tenant_id::text IN (  -- Cast to TEXT to match tenants.id
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

-- Bookings policy
CREATE POLICY "Bookings: Tenant isolation" ON bookings
  FOR ALL USING (
    bookings.tenant_id::text IN (  -- Cast to TEXT to match tenants.id
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

-- Staff policy
CREATE POLICY "Staff: Tenant isolation" ON staff
  FOR ALL USING (
    staff.tenant_id::text IN (  -- Cast to TEXT to match tenants.id
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

-- WhatsApp Devices policy
CREATE POLICY "WhatsApp Devices: Tenant isolation" ON whatsapp_devices
  FOR ALL USING (
    whatsapp_devices.tenant_id::text IN (  -- Cast to TEXT to match tenants.id
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

-- Conversations policy
CREATE POLICY "Conversations: Tenant isolation" ON conversations
  FOR ALL USING (
    conversations.tenant_id::text IN (  -- Cast to TEXT to match tenants.id
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

-- Messages policy
CREATE POLICY "Messages: Tenant isolation" ON messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND c.tenant_id::text IN (  -- Cast to TEXT to match tenants.id
        SELECT id FROM tenants 
        WHERE auth.jwt() ->> 'email' = email
      )
    )
    OR EXISTS (
      SELECT 1 FROM super_admins 
      WHERE super_admins.email = auth.jwt() ->> 'email'
      AND super_admins.is_active = true
      AND super_admins.can_access_all_tenants = true
    )
  );

-- Message Templates policy
CREATE POLICY "Message Templates: Tenant isolation" ON message_templates
  FOR ALL USING (
    message_templates.tenant_id::text IN (  -- Cast to TEXT to match tenants.id
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

-- Business Hours policy
CREATE POLICY "Business Hours: Tenant isolation" ON business_hours
  FOR ALL USING (
    business_hours.tenant_id::text IN (  -- Cast to TEXT to match tenants.id
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

-- Invoices policy
CREATE POLICY "Invoices: Tenant isolation" ON invoices
  FOR ALL USING (
    invoices.tenant_id::text IN (  -- Cast to TEXT to match tenants.id
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

-- Invoice Items policy
CREATE POLICY "Invoice Items: Tenant isolation" ON invoice_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_items.invoice_id
      AND i.tenant_id::text IN (  -- Cast to TEXT to match tenants.id
        SELECT id FROM tenants 
        WHERE auth.jwt() ->> 'email' = email
      )
    )
    OR EXISTS (
      SELECT 1 FROM super_admins 
      WHERE super_admins.email = auth.jwt() ->> 'email'
      AND super_admins.is_active = true
      AND super_admins.can_access_all_tenants = true
    )
  );

-- Service Areas policy
CREATE POLICY "Service Areas: Tenant isolation" ON service_areas
  FOR ALL USING (
    service_areas.tenant_id::text IN (  -- Cast to TEXT to match tenants.id
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

-- Super Admins policy
CREATE POLICY "Super Admins: Full access" ON super_admins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM super_admins sa
      WHERE sa.email = auth.jwt() ->> 'email'
      AND sa.is_active = true
    )
  );

-- Security Audit Logs policy
CREATE POLICY "Security Audit Logs: Super Admin access" ON security_audit_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM super_admins sa
      WHERE sa.email = auth.jwt() ->> 'email'
      AND sa.is_active = true
    )
  );

-- Activity Logs policy
CREATE POLICY "Activity Logs: Tenant isolation" ON activity_logs
  FOR ALL USING (
    (
      CASE 
        WHEN activity_logs.tenant_id IS NOT NULL THEN activity_logs.tenant_id::text 
        ELSE NULL 
      END
    ) IN (  -- Cast to TEXT to match tenants.id
      SELECT id FROM tenants 
      WHERE auth.jwt() ->> 'email' = email
    )
    OR EXISTS (
      SELECT 1 FROM super_admins sa
      WHERE super_admins.email = auth.jwt() ->> 'email'
      AND super_admins.is_active = true
      AND super_admins.can_access_all_tenants = true
    )
  );

-- Tenant Subdomains policy
CREATE POLICY "Tenant Subdomains: Super Admin access" ON tenant_subdomains
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM super_admins sa
      WHERE sa.email = auth.jwt() ->> 'email'
      AND sa.is_active = true
    )
  );

-- Cache policy
CREATE POLICY "Cache: Authenticated access" ON cache
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM super_admins sa
      WHERE sa.email = auth.jwt() ->> 'email'
      AND sa.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM tenants t
      WHERE auth.jwt() ->> 'email' = t.email
    )
  );

-- 4. Enable RLS on tables
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

-- 5. Verify all policies
SELECT 
    schemaname, 
    tablename, 
    policyname
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

SELECT 'RLS policies have been configured with proper type consistency! All tenant_id columns are cast to TEXT to match tenants.id' as status;