-- Complete Schema Fix - Convert all TEXT to UUID and add foreign keys
-- Run this in Supabase SQL Editor

-- Step 1: Drop all existing constraints that might block the migration
DROP TABLE IF EXISTS sessions CASCADE;  -- Drop sessions first to avoid FK issues

-- Step 2: Convert all primary key columns from TEXT to UUID
ALTER TABLE tenants ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE super_admins ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE services ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE customers ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE bookings ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE staff ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE whatsapp_devices ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE conversations ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE message_templates ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE business_hours ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE invoices ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE invoice_items ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE service_areas ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE messages ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE activity_logs ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE security_audit_logs ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE tenant_subdomains ALTER COLUMN id TYPE UUID USING id::uuid;

-- Step 3: Convert all foreign key columns to UUID
ALTER TABLE services ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
ALTER TABLE customers ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
ALTER TABLE bookings ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
ALTER TABLE bookings ALTER COLUMN customer_id TYPE UUID USING customer_id::uuid;
ALTER TABLE bookings ALTER COLUMN service_id TYPE UUID USING service_id::uuid;
ALTER TABLE staff ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
ALTER TABLE whatsapp_devices ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
ALTER TABLE conversations ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
ALTER TABLE conversations ALTER COLUMN customer_id TYPE UUID USING customer_id::uuid;
ALTER TABLE conversations ALTER COLUMN assigned_to_id TYPE UUID USING assigned_to_id::uuid;
ALTER TABLE message_templates ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
ALTER TABLE business_hours ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
ALTER TABLE invoices ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
ALTER TABLE invoices ALTER COLUMN customer_id TYPE UUID USING customer_id::uuid;
ALTER TABLE invoices ALTER COLUMN booking_id TYPE UUID USING booking_id::uuid;
ALTER TABLE invoice_items ALTER COLUMN invoice_id TYPE UUID USING invoice_id::uuid;
ALTER TABLE invoice_items ALTER COLUMN service_id TYPE UUID USING service_id::uuid;
ALTER TABLE service_areas ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
ALTER TABLE messages ALTER COLUMN conversation_id TYPE UUID USING conversation_id::uuid;

-- Step 4: Add missing columns
ALTER TABLE business_hours ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 5: Add all foreign key constraints
ALTER TABLE services ADD CONSTRAINT services_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE customers ADD CONSTRAINT customers_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE bookings ADD CONSTRAINT bookings_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE bookings ADD CONSTRAINT bookings_customer_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE bookings ADD CONSTRAINT bookings_service_fkey FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;
ALTER TABLE staff ADD CONSTRAINT staff_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE whatsapp_devices ADD CONSTRAINT whatsapp_devices_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD CONSTRAINT conversations_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD CONSTRAINT conversations_customer_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD CONSTRAINT conversations_assigned_fkey FOREIGN KEY (assigned_to_id) REFERENCES staff(id) ON DELETE SET NULL;
ALTER TABLE message_templates ADD CONSTRAINT message_templates_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE business_hours ADD CONSTRAINT business_hours_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE invoices ADD CONSTRAINT invoices_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE invoices ADD CONSTRAINT invoices_customer_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE invoices ADD CONSTRAINT invoices_booking_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_invoice_fkey FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;
ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_service_fkey FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL;
ALTER TABLE service_areas ADD CONSTRAINT service_areas_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE messages ADD CONSTRAINT messages_conversation_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

-- Step 6: Recreate sessions table with proper UUID types
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    session_data JSONB,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_sessions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Step 7: Add unique constraints
ALTER TABLE tenants ADD CONSTRAINT tenants_subdomain_unique UNIQUE(subdomain);
ALTER TABLE super_admins ADD CONSTRAINT super_admins_email_unique UNIQUE(email);
ALTER TABLE business_hours ADD CONSTRAINT business_hours_tenant_unique UNIQUE(tenant_id);
ALTER TABLE invoices ADD CONSTRAINT invoices_invoice_number_unique UNIQUE(invoice_number);
ALTER TABLE tenant_subdomains ADD CONSTRAINT tenant_subdomains_subdomain_unique UNIQUE(subdomain);

-- Step 8: Fix superadmin with proper UUID
DELETE FROM super_admins WHERE id = 'sa_94ba830505f44f3e9f67234d23a485e0';

INSERT INTO super_admins (
  id, 
  email, 
  name, 
  is_active, 
  password_hash, 
  permissions, 
  can_access_all_tenants, 
  created_at, 
  updated_at
) VALUES (
  gen_random_uuid(),
  'superadmin@booqing.my.id',
  'Super Admin',
  true,
  '$2b$10$yxLNNmJqQEVW6mRcC8uQLulNK/smTVEe4TDm5IT.EqUd13bq4CVRS',
  '["*"]',
  true,
  NOW(),
  NOW()
);

-- Step 9: Verify the superadmin record
SELECT id, email, name, is_active FROM super_admins WHERE email = 'superadmin@booqing.my.id';
