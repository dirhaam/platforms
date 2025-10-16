-- Enable Row Level Security for all tables
-- Run this in Supabase SQL Editor

-- Enable RLS on all tables
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
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Tenants policies
CREATE POLICY "Users can view their own tenant" ON tenants
  FOR SELECT USING (auth.email() = email);

CREATE POLICY "Users can update their own tenant" ON tenants
  FOR UPDATE USING (auth.email() = email);

-- Services policies
CREATE POLICY "Users can view services from their tenant" ON services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE tenants.id = services.tenant_id 
      AND auth.email() = tenants.email
    )
  );

CREATE POLICY "Users can manage services from their tenant" ON services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE tenants.id = services.tenant_id 
      AND auth.email() = tenants.email
    )
  );

-- Customers policies  
CREATE POLICY "Users can view customers from their tenant" ON customers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE tenants.id = customers.tenant_id 
      AND auth.email() = tenants.email
    )
  );

CREATE POLICY "Users can manage customers from their tenant" ON customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE tenants.id = customers.tenant_id 
      AND auth.email() = tenants.email
    )
  );

-- Bookings policies
CREATE POLICY "Users can view bookings from their tenant" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE tenants.id = bookings.tenant_id 
      AND auth.email() = tenants.email
    )
  );

CREATE POLICY "Users can manage bookings from their tenant" ON bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE tenants.id = bookings.tenant_id 
      AND auth.email() = tenants.email
    )
  );

-- Staff policies
CREATE POLICY "Users can view staff from their tenant" ON staff
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE tenants.id = staff.tenant_id 
      AND auth.email() = tenants.email
    )
  );

CREATE POLICY "Users can manage staff from their tenant" ON staff
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE tenants.id = staff.tenant_id 
      AND auth.email() = tenants.email
    )
  );

-- Super Admin policies (bypass RLS)
CREATE POLICY "Super Admins have full access to tenants" ON tenants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE super_admins.email = auth.email()
      AND super_admins.is_active = true
    )
  );

CREATE POLICY "Super Admins have full access to services" ON services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE super_admins.email = auth.email()
      AND super_admins.is_active = true
    )
  );

CREATE POLICY "Super Admins have full access to customers" ON customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE super_admins.email = auth.email()
      AND super_admins.is_active = true
    )
  );

CREATE POLICY "Super Admins have full access to bookings" ON bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE super_admins.email = auth.email()
      AND super_admins.is_active = true
    )
  );

CREATE POLICY "Super Admins have full access to staff" ON staff
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE super_admins.email = auth.email()
      AND super_admins.is_active = true
    )
  );

CREATE POLICY "Super Admins have full access to super_admins" ON super_admins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE super_admins.email = auth.email()
      AND super_admins.is_active = true
    )
  );

-- Similar policies for other tables...
CREATE POLICY "Super Admins full access - conversations" ON conversations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE super_admins.email = auth.email()
      AND super_admins.is_active = true
    )
  );

CREATE POLICY "Super Admins full access - messages" ON messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE super_admins.email = auth.email()
      AND super_admins.is_active = true
    )
  );

CREATE POLICY "Super Admins full access - invoices" ON invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE super_admins.email = auth.email()
      AND super_admins.is_active = true
    )
  );

CREATE POLICY "Super Admins full access - message templates" ON message_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE super_admins.email = auth.email()
      AND super_admins.is_active = true
    )
  );

CREATE POLICY "Super Admins full access - business hours" ON business_hours
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE super_admins.email = auth.email()
      AND super_admins.is_active = true
    )
  );

CREATE POLICY "Super Admins full access - service areas" ON service_areas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE super_admins.email = auth.email()
      AND super_admins.is_active = true
    )
  );

CREATE POLICY "Super Admins full access - whatsapp devices" ON whatsapp_devices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE super_admins.email = auth.email()
      AND super_admins.is_active = true
    )
  );

CREATE POLICY "Super Admins full access - invoice items" ON invoice_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE super_admins.email = auth.email()
      AND super_admins.is_active = true
    )
  );

SELECT 'RLS enabled and policies created successfully!' as status;
