-- Fix UUID casting issues in existing tables
-- Run this SQL manually in Supabase SQL Editor

-- 1. Fix primary key columns first - Convert TEXT to UUID
-- Tenants table
ALTER TABLE tenants 
ALTER COLUMN id TYPE UUID USING id::uuid;

-- All other tables that reference tenants
ALTER TABLE services ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
ALTER TABLE customers ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
ALTER TABLE bookings ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
ALTER TABLE staff ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
ALTER TABLE whatsapp_devices ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
ALTER TABLE conversations ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
ALTER TABLE message_templates ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
ALTER TABLE business_hours ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
ALTER TABLE invoices ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
ALTER TABLE service_areas ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;

-- Fix UUID references for other tables
ALTER TABLE bookings ALTER COLUMN customer_id TYPE UUID USING customer_id::uuid;
ALTER TABLE bookings ALTER COLUMN service_id TYPE UUID USING service_id::uuid;
ALTER TABLE customers ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE services ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE bookings ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE staff ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE whatsapp_devices ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE conversations ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE conversations ALTER COLUMN customer_id TYPE UUID USING customer_id::uuid;
ALTER TABLE conversations ALTER COLUMN assigned_to_id TYPE UUID USING assigned_to_id::uuid;
ALTER TABLE message_templates ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE business_hours ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE invoices ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE invoices ALTER COLUMN customer_id TYPE UUID USING customer_id::uuid;
ALTER TABLE invoices ALTER COLUMN booking_id TYPE UUID USING booking_id::uuid;
ALTER TABLE service_areas ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE super_admins ALTER COLUMN id TYPE UUID USING id::uuid;

-- Fix sessions table
ALTER TABLE sessions 
DROP COLUMN IF EXISTS user_id,
DROP COLUMN IF EXISTS tenant_id;

ALTER TABLE sessions 
ADD COLUMN user_id UUID,
ADD COLUMN tenant_id UUID;

-- 2. Fix messages table relationships
ALTER TABLE messages ALTER COLUMN conversation_id TYPE UUID USING conversation_id::uuid;
ALTER TABLE messages ALTER COLUMN id TYPE UUID USING id::uuid;

-- 3. Fix invoice_items table relationships
ALTER TABLE invoice_items ALTER COLUMN invoice_id TYPE UUID USING invoice_id::uuid;
ALTER TABLE invoice_items ALTER COLUMN service_id TYPE UUID USING service_id::uuid;
ALTER TABLE invoice_items ALTER COLUMN id TYPE UUID USING id::uuid;

-- 4. Add foreign key constraint for sessions
ALTER TABLE sessions 
ADD CONSTRAINT fk_sessions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 5. Add missing columns
ALTER TABLE business_hours 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 6. Add missing constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenants_subdomain_unique') THEN
        ALTER TABLE tenants ADD CONSTRAINT tenants_subdomain_unique UNIQUE(subdomain);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'super_admins_email_unique') THEN
        ALTER TABLE super_admins ADD CONSTRAINT super_admins_email_unique UNIQUE(email);
    END IF;
END $$;
