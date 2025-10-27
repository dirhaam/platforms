-- Corrected Comprehensive RLS Policy Setup for BooQing Platform
-- Fixed type mismatch errors between UUID and TEXT

-- Step 1: Enable RLS on all application tables (not auth tables)
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

-- Step 2: Create RLS Policies for multi-tenant isolation
-- Determine the actual column types first and adjust accordingly
-- Based on the main schema in supabase/schema.sql, tenants.id is TEXT
-- So we need to ensure consistency with the sessions table

-- Tenant-level policies using JWT claims (supabase's auth.userdata)
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

-- Service policies - tenant isolation
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

-- Customer policies - tenant isolation
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

-- Booking policies - tenant isolation
CREATE POLICY "Bookings: Users can view bookings from their tenant" ON bookings
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

CREATE POLICY "Bookings: Users can manage bookings from their tenant" ON bookings
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

-- Staff policies - tenant isolation
CREATE POLICY "Staff: Users can view staff from their tenant" ON staff
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

CREATE POLICY "Staff: Users can manage staff from their tenant" ON staff
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

-- Super Admin policies - full access
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

-- Policies for other tables following the same pattern
CREATE POLICY "WhatsApp Devices: Tenant isolation" ON whatsapp_devices
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

CREATE POLICY "WhatsApp Devices: Manage tenant devices" ON whatsapp_devices
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

CREATE POLICY "Conversations: Tenant isolation" ON conversations
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

CREATE POLICY "Conversations: Manage tenant conversations" ON conversations
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

CREATE POLICY "Messages: Tenant isolation" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND c.tenant_id IN (
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

CREATE POLICY "Messages: Send messages in tenant conversations" ON messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND c.tenant_id IN (
        SELECT id FROM tenants 
        WHERE auth.jwt() ->> 'email' = email
      )
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND c.tenant_id IN (
        SELECT id FROM tenants 
        WHERE auth.jwt() ->> 'email' = email
      )
    )
  );

CREATE POLICY "Message Templates: Tenant isolation" ON message_templates
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

CREATE POLICY "Message Templates: Manage tenant templates" ON message_templates
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

CREATE POLICY "Business Hours: Tenant isolation" ON business_hours
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

CREATE POLICY "Business Hours: Manage tenant business hours" ON business_hours
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

CREATE POLICY "Invoices: Tenant isolation" ON invoices
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

CREATE POLICY "Invoices: Manage tenant invoices" ON invoices
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

CREATE POLICY "Invoice Items: Tenant isolation" ON invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_id
      AND i.tenant_id IN (
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

CREATE POLICY "Invoice Items: Manage tenant invoice items" ON invoice_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_id
      AND i.tenant_id IN (
        SELECT id FROM tenants 
        WHERE auth.jwt() ->> 'email' = email
      )
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_id
      AND i.tenant_id IN (
        SELECT id FROM tenants 
        WHERE auth.jwt() ->> 'email' = email
      )
    )
  );

CREATE POLICY "Service Areas: Tenant isolation" ON service_areas
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

CREATE POLICY "Service Areas: Manage tenant service areas" ON service_areas
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

-- Sessions table - corrected to handle UUID/TEXT type mismatches
-- Assuming from the error that sessions.tenant_id is UUID and tenants.id is TEXT
-- We need to cast appropriately
CREATE POLICY "Sessions: Access allowed for valid session" ON sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenants t
      WHERE t.id = tenant_id::text  -- Cast UUID to text for comparison with tenants.id
      AND (auth.jwt() ->> 'email' = t.email OR auth.uid() = user_id::uuid)
    )
    OR EXISTS (
      SELECT 1 FROM super_admins sa
      WHERE sa.email = auth.jwt() ->> 'email'
      AND sa.is_active = true
      AND sa.can_access_all_tenants = true
    )
  );

-- Security Audit Logs - mostly for super admins
CREATE POLICY "Security Audit Logs: Super Admin Access" ON security_audit_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM super_admins sa
      WHERE sa.email = auth.jwt() ->> 'email'
      AND sa.is_active = true
    )
  );

-- Activity Logs - tenant isolation with super admin override
CREATE POLICY "Activity Logs: Tenant isolation" ON activity_logs
  FOR SELECT USING (
    tenant_id IN (
      SELECT id::text FROM tenants  -- Cast to text if needed for comparison
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

-- Tenant Subdomains - mostly for super admins
CREATE POLICY "Tenant Subdomains: Super Admin Access" ON tenant_subdomains
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM super_admins sa
      WHERE sa.email = auth.jwt() ->> 'email'
      AND sa.is_active = true
    )
  );

-- Cache - mostly for application use, but with security
CREATE POLICY "Cache: Access with proper authentication" ON cache
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

-- Step 3: Verify all policies are created
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

SELECT 'RLS policies have been configured successfully with proper type handling!' as status;