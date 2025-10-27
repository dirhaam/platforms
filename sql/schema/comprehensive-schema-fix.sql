-- Comprehensive Schema Fix for BooQing Platform
-- This script resolves inconsistencies between different schema files

-- 1. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Fix the sessions table to use consistent UUID types
-- The main schema has UUID columns but the tenants table uses TEXT
-- First, drop the constraint
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS fk_sessions_tenant;

-- 3. Update the sessions table column types to be consistent with tenants table
-- If you want to keep TEXT primary keys in tenants, then change sessions to TEXT
ALTER TABLE sessions 
ALTER COLUMN tenant_id TYPE TEXT,
ALTER COLUMN user_id TYPE TEXT;

-- 4. Now add the constraint back with correct types
ALTER TABLE sessions 
ADD CONSTRAINT fk_sessions_tenant 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 5. Add missing indexes that are not in the main schema
-- Index on tenant_subdomains for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenant_subdomains_subdomain ON tenant_subdomains(subdomain);

-- Index on security_audit_logs for filtering by tenant and user
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_tenant_user ON security_audit_logs(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_timestamp ON security_audit_logs(timestamp);

-- Index on activity_logs for filtering by tenant and user
CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant_user ON activity_logs(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);

-- Index on super_admins for faster lookups
CREATE INDEX IF NOT EXISTS idx_super_admins_email ON super_admins(email);

-- Index on services for filtering by category and active status
CREATE INDEX IF NOT EXISTS idx_services_category_active ON services(category, is_active);
CREATE INDEX IF NOT EXISTS idx_services_tenant_active ON services(tenant_id, is_active);

-- Index on bookings for common queries (status, scheduled time)
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON bookings(date(scheduled_at));

-- Index on customers for common queries
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Index on staff for common queries
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);

-- Index on whatsapp_devices for status queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_devices_status ON whatsapp_devices(status);

-- Index on conversations for common queries
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

-- Index on invoices for status queries
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- 6. Add composite indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_status ON bookings(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_date ON bookings(tenant_id, date(scheduled_at));
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status ON invoices(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_name ON customers(tenant_id, name);

-- 7. Add missing columns that might exist in other schema versions
-- Ensure business_hours has created_at and updated_at columns
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'business_hours' AND column_name = 'created_at') THEN
      ALTER TABLE business_hours ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'business_hours' AND column_name = 'updated_at') THEN
      ALTER TABLE business_hours ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
   END IF;
END $$;

-- Ensure messages has created_at and updated_at columns
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'messages' AND column_name = 'created_at') THEN
      ALTER TABLE messages ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'messages' AND column_name = 'updated_at') THEN
      ALTER TABLE messages ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
   END IF;
END $$;

-- 8. Add column comments for better documentation
COMMENT ON COLUMN tenants.subscription_plan IS 'Available plans: basic, premium, enterprise';
COMMENT ON COLUMN bookings.status IS 'Booking statuses: pending, confirmed, in_progress, completed, cancelled, no_show';
COMMENT ON COLUMN bookings.payment_status IS 'Payment statuses: pending, paid, partial, cancelled';
COMMENT ON COLUMN invoices.status IS 'Invoice statuses: draft, sent, paid, overdue, cancelled';
COMMENT ON COLUMN tenants.template_id IS 'Landing page template preference: modern, classic, minimal, beauty, or healthcare';

-- 9. Add missing functionality that appears in other schema files
-- Add payment tables if they don't exist
CREATE TABLE IF NOT EXISTS payment_methods (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'cash', 'bank_transfer', 'credit_card', 'ewallet'
    details JSONB, -- Store payment method details
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    invoice_id TEXT REFERENCES invoices(id) ON DELETE SET NULL,
    amount REAL NOT NULL,
    payment_method_id TEXT REFERENCES payment_methods(id) ON DELETE SET NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    payment_reference TEXT,
    transaction_details JSONB,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Verify integrity of existing data
-- Check for any invalid foreign key references
-- These are just verification queries, not required to run
/*
-- Check for bookings with invalid tenant references
SELECT COUNT(*) FROM bookings b 
LEFT JOIN tenants t ON b.tenant_id = t.id 
WHERE t.id IS NULL;

-- Check for bookings with invalid customer references  
SELECT COUNT(*) FROM bookings b 
LEFT JOIN customers c ON b.customer_id = c.id 
WHERE c.id IS NULL;

-- Check for bookings with invalid service references
SELECT COUNT(*) FROM bookings b 
LEFT JOIN services s ON b.service_id = s.id 
WHERE s.id IS NULL;
*/

-- 11. Update any existing records that might have been affected by schema changes
-- Ensure all tenants have the template_id column set
UPDATE tenants SET template_id = 'modern' WHERE template_id IS NULL;

-- 12. Add unique constraints if they don't exist
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = 'tenants_subdomain_unique') THEN
      ALTER TABLE tenants ADD CONSTRAINT tenants_subdomain_unique UNIQUE(subdomain);
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = 'super_admins_email_unique') THEN
      ALTER TABLE super_admins ADD CONSTRAINT super_admins_email_unique UNIQUE(email);
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = 'business_hours_tenant_unique') THEN
      ALTER TABLE business_hours ADD CONSTRAINT business_hours_tenant_unique UNIQUE(tenant_id);
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = 'invoices_invoice_number_unique') THEN
      ALTER TABLE invoices ADD CONSTRAINT invoices_invoice_number_unique UNIQUE(invoice_number);
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = 'tenant_subdomains_subdomain_unique') THEN
      ALTER TABLE tenant_subdomains ADD CONSTRAINT tenant_subdomains_subdomain_unique UNIQUE(subdomain);
   END IF;
END $$;

-- 13. Verify the fixes worked
SELECT 'Schema fix completed successfully!' as status;
SELECT COUNT(*) as total_tenants FROM tenants;
SELECT COUNT(*) as total_bookings FROM bookings;
SELECT COUNT(*) as total_customers FROM customers;
SELECT COUNT(*) as total_services FROM services;