-- Comprehensive SQL script to fix UUID issues in the database
-- Run these commands in the Supabase SQL Editor

-- 1. Add gen_random_uuid extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create a temporary backup of problematic records
-- Using regex pattern matching instead of SIMILAR TO since UUID is a specific type
CREATE TEMP TABLE temp_invalid_uuids AS
SELECT 
  'super_admins' as table_name,
  id as old_id,
  gen_random_uuid() as new_id
FROM super_admins 
WHERE id IS NULL OR id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
UNION ALL
SELECT 
  'tenants' as table_name,
  id as old_id,
  gen_random_uuid() as new_id
FROM tenants 
WHERE id IS NULL OR id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
UNION ALL
SELECT 
  'services' as table_name,
  id as old_id,
  gen_random_uuid() as new_id
FROM services 
WHERE id IS NULL OR id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
UNION ALL
SELECT 
  'customers' as table_name,
  id as old_id,
  gen_random_uuid() as new_id
FROM customers 
WHERE id IS NULL OR id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
UNION ALL
SELECT 
  'bookings' as table_name,
  id as old_id,
  gen_random_uuid() as new_id
FROM bookings 
WHERE id IS NULL OR id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 3. Update foreign key references before updating primary keys
-- First, temporarily remove foreign key constraints
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_tenant_id_fkey;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_tenant_id_fkey;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_tenant_id_fkey;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_customer_id_fkey;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_service_id_fkey;
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_tenant_id_fkey;
ALTER TABLE whatsapp_devices DROP CONSTRAINT IF EXISTS whatsapp_devices_tenant_id_fkey;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_customer_id_fkey;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_assigned_to_id_fkey;
ALTER TABLE message_templates DROP CONSTRAINT IF EXISTS message_templates_tenant_id_fkey;
ALTER TABLE business_hours DROP CONSTRAINT IF EXISTS business_hours_tenant_id_fkey;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_tenant_id_fkey;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_customer_id_fkey;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_booking_id_fkey;
ALTER TABLE invoice_items DROP CONSTRAINT IF EXISTS invoice_items_invoice_id_fkey;
ALTER TABLE invoice_items DROP CONSTRAINT IF EXISTS invoice_items_service_id_fkey;
ALTER TABLE service_areas DROP CONSTRAINT IF EXISTS service_areas_tenant_id_fkey;

-- 4. Update records with invalid UUIDs
UPDATE super_admins 
SET id = temp.new_id
FROM temp_invalid_uuids temp
WHERE super_admins.id = temp.old_id AND temp.table_name = 'super_admins';

UPDATE tenants 
SET id = temp.new_id
FROM temp_invalid_uuids temp
WHERE tenants.id = temp.old_id AND temp.table_name = 'tenants';

UPDATE services 
SET id = temp.new_id
FROM temp_invalid_uuids temp
WHERE services.id = temp.old_id AND temp.table_name = 'services';

UPDATE customers 
SET id = temp.new_id
FROM temp_invalid_uuids temp
WHERE customers.id = temp.old_id AND temp.table_name = 'customers';

UPDATE bookings 
SET id = temp.new_id
FROM temp_invalid_uuids temp
WHERE bookings.id = temp.old_id AND temp.table_name = 'bookings';

-- 5. Update foreign key references with new UUIDs
UPDATE services 
SET tenant_id = temp.new_id
FROM temp_invalid_uuids temp
WHERE services.tenant_id = temp.old_id AND temp.table_name = 'tenants';

UPDATE customers 
SET tenant_id = temp.new_id
FROM temp_invalid_uuids temp
WHERE customers.tenant_id = temp.old_id AND temp.table_name = 'tenants';

UPDATE bookings 
SET tenant_id = temp.new_id
FROM temp_invalid_uuids temp
WHERE bookings.tenant_id = temp.old_id AND temp.table_name = 'tenants';

UPDATE bookings 
SET customer_id = temp.new_id
FROM temp_invalid_uuids temp
WHERE bookings.customer_id = temp.old_id AND temp.table_name = 'customers';

UPDATE bookings 
SET service_id = temp.new_id
FROM temp_invalid_uuids temp
WHERE bookings.service_id = temp.old_id AND temp.table_name = 'services';

UPDATE staff 
SET tenant_id = temp.new_id
FROM temp_invalid_uuids temp
WHERE staff.tenant_id = temp.old_id AND temp.table_name = 'tenants';

UPDATE whatsapp_devices 
SET tenant_id = temp.new_id
FROM temp_invalid_uuids temp
WHERE whatsapp_devices.tenant_id = temp.old_id AND temp.table_name = 'tenants';

UPDATE conversations 
SET customer_id = temp.new_id
FROM temp_invalid_uuids temp
WHERE conversations.customer_id = temp.old_id AND temp.table_name = 'customers';

UPDATE message_templates 
SET tenant_id = temp.new_id
FROM temp_invalid_uuids temp
WHERE message_templates.tenant_id = temp.old_id AND temp.table_name = 'tenants';

UPDATE business_hours 
SET tenant_id = temp.new_id
FROM temp_invalid_uuids temp
WHERE business_hours.tenant_id = temp.old_id AND temp.table_name = 'tenants';

UPDATE invoices 
SET tenant_id = temp.new_id
FROM temp_invalid_uuids temp
WHERE invoices.tenant_id = temp.old_id AND temp.table_name = 'tenants';

UPDATE invoices 
SET customer_id = temp.new_id
FROM temp_invalid_uuids temp
WHERE invoices.customer_id = temp.old_id AND temp.table_name = 'customers';

UPDATE invoices 
SET booking_id = temp.new_id
FROM temp_invalid_uuids temp
WHERE invoices.booking_id = temp.old_id AND temp.table_name = 'bookings';

UPDATE invoice_items 
SET invoice_id = temp.new_id
FROM temp_invalid_uuids temp
WHERE invoice_items.invoice_id = temp.old_id AND temp.table_name = 'invoices';

UPDATE invoice_items 
SET service_id = temp.new_id
FROM temp_invalid_uuids temp
WHERE invoice_items.service_id = temp.old_id AND temp.table_name = 'services';

UPDATE service_areas 
SET tenant_id = temp.new_id
FROM temp_invalid_uuids temp
WHERE service_areas.tenant_id = temp.old_id AND temp.table_name = 'tenants';

-- 6. Add foreign key constraints back
ALTER TABLE services ADD CONSTRAINT services_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE customers ADD CONSTRAINT customers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE bookings ADD CONSTRAINT bookings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE bookings ADD CONSTRAINT bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE bookings ADD CONSTRAINT bookings_service_id_fkey FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;
ALTER TABLE staff ADD CONSTRAINT staff_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE whatsapp_devices ADD CONSTRAINT whatsapp_devices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD CONSTRAINT conversations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD CONSTRAINT conversations_assigned_to_id_fkey FOREIGN KEY (assigned_to_id) REFERENCES staff(id) ON DELETE SET NULL;
ALTER TABLE message_templates ADD CONSTRAINT message_templates_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE business_hours ADD CONSTRAINT business_hours_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE invoices ADD CONSTRAINT invoices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE invoices ADD CONSTRAINT invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE invoices ADD CONSTRAINT invoices_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;
ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_service_id_fkey FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL;
ALTER TABLE service_areas ADD CONSTRAINT service_areas_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 7. Verify all records now have valid UUIDs
SELECT 
  'super_admins' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') as valid_uuid_records
FROM super_admins
UNION ALL
SELECT 
  'tenants' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') as valid_uuid_records
FROM tenants
UNION ALL
SELECT 
  'services' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') as valid_uuid_records
FROM services
UNION ALL
SELECT 
  'customers' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') as valid_uuid_records
FROM customers
UNION ALL
SELECT 
  'bookings' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') as valid_uuid_records
FROM bookings;

-- 8. Clean up temp table
DROP TABLE temp_invalid_uuids;

-- 9. Success confirmation
SELECT 'UUID fixes applied successfully' as status;