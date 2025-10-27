-- SQL script to fix schema inconsistencies and add missing indexes
-- and potentially missing tables for the BooQing platform

-- 1. Fix sessions table foreign key constraint
-- Current schema has UUID references but tenants table uses TEXT primary key
-- Either change sessions table to TEXT or fix the constraint

-- First, drop the existing constraint
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS fk_sessions_tenant;

-- Then add the correct constraint
ALTER TABLE sessions 
ADD CONSTRAINT fk_sessions_tenant 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Note: The user_id and tenant_id in sessions table should probably be TEXT to match the tenants table

-- 2. Add missing indexes for better performance
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

-- 3. Add tables that might be missing for a complete booking system

-- Payment Methods table
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

-- Payments table
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

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    recipient_type TEXT NOT NULL, -- 'customer', 'staff', 'admin'
    recipient_id TEXT NOT NULL,   -- ID of the recipient
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'booking', 'reminder', 'system', 'marketing'
    status TEXT NOT NULL DEFAULT 'unread', -- 'unread', 'read', 'archived'
    metadata JSONB,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Roles table (for more granular permissions)
CREATE TABLE IF NOT EXISTS user_roles (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    permissions JSONB DEFAULT '[]',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key to staff table to reference user_roles
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'staff' AND column_name = 'role_id') THEN
      ALTER TABLE staff ADD COLUMN role_id TEXT REFERENCES user_roles(id) ON DELETE SET NULL;
   END IF;
END $$;

-- 4. Add missing indexes for better performance on common queries
-- Add composite indexes for frequently queried combinations
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_status ON bookings(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_date ON bookings(tenant_id, date(scheduled_at));
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status ON invoices(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_name ON customers(tenant_id, name);

-- 5. Update the sessions table to use TEXT for user_id to match other tables
-- Note: This would require careful consideration if sessions already exist
-- DO $$
-- BEGIN
--    IF EXISTS (SELECT 1 FROM information_schema.columns 
--               WHERE table_name = 'sessions' AND column_name = 'user_id' AND data_type = 'uuid') THEN
--       -- This would require more complex migration to change uuid to text
--       RAISE NOTICE 'Sessions table has uuid user_id that may need to be converted to text';
--    END IF;
-- END $$;

-- 6. Add comments to existing columns for better documentation
COMMENT ON COLUMN tenants.subscription_plan IS 'Available plans: basic, premium, enterprise';
COMMENT ON COLUMN bookings.status IS 'Booking statuses: pending, confirmed, in_progress, completed, cancelled, no_show';
COMMENT ON COLUMN bookings.payment_status IS 'Payment statuses: pending, paid, partial, cancelled';
COMMENT ON COLUMN invoices.status IS 'Invoice statuses: draft, sent, paid, overdue, cancelled';