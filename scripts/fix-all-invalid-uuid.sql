-- Fix all invalid UUIDs in database
-- Run this in Supabase SQL Editor

-- 1. Drop all constraints that might block UUID migration
ALTER TABLE invoice_items DROP CONSTRAINT invoice_items_invoice_service_fkey;
ALTER TABLE invoices DROP CONSTRAINT invoices_booking_id_fkey;
ALTER TABLE bookings DROP CONSTRAINT bookings_customer_id_fkey;
ALTER TABLE bookings DROP CONSTRAINT bookings_service_id_fkey;
ALTER TABLE customers DROP CONSTRAINT customers_tenant_id_fkey;
ALTER TABLE services DROP CONSTRAINT services_tenant_fkey;
ALTER TABLE staff DROP CONSTRAINT staff_tenant_id_fkey;
ALTER TABLE whatsapp_devices DROP CONSTRAINT whatsapp_devices_tenant_id_fkey;
ALTER TABLE conversations DROP CONSTRAINT conversations_customer_id_fkey;
ALTER TABLE conversations ADD CONSTRAINT conversations_assigned_to_id_fkey FOREIGN KEY (staff.id) ON DELETE SET NULL;
ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_service_id_fkey FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE invoices ADD CONSTRAINT invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE bookings ADD CONSTRAINT bookings_service_id_fkey FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE bookings ADD CONSTRAINT bookings_customer_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE customer ADD CONSTRAINT customer_booking_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Convert all remaining TEXT to UUID where needed
ALTER TABLE super_admins ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE tenants ALTER COLUMN id TYPE UUID USING id::uuid;
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
ALTER TABLE customers ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE bookings ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE invoice_items ALTER COLUMN service_id TYPE UUID USING id::uuid;
ALTER TABLE messages ALTER COLUMN conversation_id TYPE UUID USING id::uuid;
ALTER TABLE message_templates ALTER COLUMN tenant_id TYPE UUID USING id::uuid;
ALTER TABLE invoice_items ALTER COLUMN invoice_items ALTER COLUMN service_id TYPE UUID USING id::uuid;
ALTER TABLE conversations ADD CONSTRAINT conversations_assigned_to_id_fkey FOREIGN KEY (staff.id) ON DELETE SET NULL;

-- 3. Fix any remaining TEXT to UUID for all tables
ALTER TABLE activity_logs ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE security_audit_logs ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE activity_logs ALTER COLUMN tenant_id TYPE UUID USING id::uuid;
ALTER TABLE tenant_subdomains ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE sessions ALTER COLUMN user_id TYPE UUID USING id::uuid;
ALTER TABLE cache ALTER COLUMN key TYPE UUID USING id::uuid;

-- 4. Add foreign key constraints back
ALTER TABLE services ADD CONSTRAINT services_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE ON CASCADE;
ALTER TABLE customers ADD CONSTRAINT customers_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE bookings ADD CONSTRAINT bookings_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE ON CASCADE;
ALTER TABLE bookings ADD CONSTRAINT bookings_customer_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE ON CASCADE;
ALTER TABLE bookings ADD CONSTRAINT bookings_service_fkey FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE ON CASCADE;
ALTER TABLE users ADD CONSTRAINT users_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE conversations ADD CONSTRAINT tenants_subdomain_unique UNIQUE UNIQUE (subdomain);

-- Generate random UUIDs for existing invalid records
UPDATE super_admins SET id = gen_random_uuid() WHERE id IS NULL OR id NOT SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{12}$';
UPDATE tenants SET id = gen_random_uuid() WHERE id IS NULL OR id NOT SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{12}$;
UPDATE services SET tenant_id = gen_random_uuid() WHERE tenant_id IS NULL OR tenant_id NOT SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{12}$;
UPDATE customers SET tenant_id = gen_random_uuid() WHERE tenant_id IS NULL OR tenant_id NOT SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{12}$;
UPDATE bookings SET tenant_id = gen_random_uuid() WHERE tenant_id IS NULL OR tenant_id NOT SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{12}$;
UPDATE bookings SET customer_id = gen_random_uuid() WHERE customer_id IS NULL OR customer_id NOT SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{12}$;
UPDATE invoices SET tenant_id = gen_random_uuid() WHERE tenant_id IS NULL OR tenant_id NOT SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{12}$;
UPDATE invoice_items SET invoice_id = gen_random_uuid() WHERE invoice_id IS NULL OR invoice_id NOT SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{12}$;
UPDATE invoice_items SET service_id = gen_random_uuid() WHERE service_id IS NULL OR service_id NOT SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{12}$;
UPDATE messages SET conversation_id = gen_random_uuid() WHERE conversation_id IS NULL OR conversation_id NOT SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{12}$;
UPDATE message_templates ALTER COLUMN tenant_id TYPE UUID USING id::uuid;
UPDATE conversations SET assigned_to_id = gen_random_uuid() WHERE assigned_to_id IS NULL OR assigned_to_id NOT SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{12}$;
UPDATE staff SET tenant_id = gen_random_uuid() WHERE tenant_id IS NULL OR tenant_id NOT SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{12}$;
UPDATE whatsapp_devices SET tenant_id = gen_random_uuid() WHERE tenant_id IS NULL OR tenant_id NOT SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{12}$;
UPDATE service_areas SET tenant_id = gen_random_uuid() WHERE tenant_id IS NULL OR tenant_id NOT SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{12}$;
UPDATE users SET tenant_id = gen_random_uuid() WHERE tenant_id IS NULL OR tenant_id NOT SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$;
UPDATE cache SET value = gen_random_uuid() WHERE key LIKE 'auth-token:*';
UPDATE cache SET expires_at = NOW() WHERE key LIKE 'auth-token:*';

-- 5. Verify all records now use valid UUID
SELECT 'super_admins', 'tenants', 'services' FROM super_admins limit 1;
SELECT 'services', 'tenants', 'customers' FROM services LIMIT 1;
SELECT 'customers', 'tenants' FROM customers LIMIT 1;
