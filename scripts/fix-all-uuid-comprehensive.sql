-- Fix all invalid UUIDs and update with gen_random_uuid()
-- Run this in Supabase SQL Editor (step by step)

-- 1. SuperAdmin table
DELETE FROM super_admins WHERE id NOT SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$;

-- 2. Tenants table  
DELETE FROM tenants WHERE id NOT SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$;

-- 3. Other tables (copy paste from previous fix-all-uuid.sql for complete fix)
UPDATE users SET id = gen_random_uuid() WHERE id IS NULL OR id NOT SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$;
UPDATE services SET tenant_id = gen_random_uuid() WHERE tenant_id IS NULL OR tenant_id NOT SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-0-9a-f]{12}$;
UPDATE customers SET id = gen_random_uuid() WHERE id IS NULL OR id NOT SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$;
UPDATE bookings SET customer_id = gen_random_uuid() WHERE id IS NULL OR id NOT SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-0-9a-f]{4}-[0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-[0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4]-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4]-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-[0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4]-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-0-9a-f]{4}-0-9a-f]{4}-0-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]{4}-0-9a-f]}'::uuid) UNCHECK;
--] - Tenants table still uses TEXT for id, needs to be UUID

-- Current problematic records
SELECT 
  id, email, is_active 
FROM super_admins 
WHERE id NOT SIMILAR '^[0-9a-f]{8}[0-9a-f]{4}-[0-9a-f]{4}-0-9a-f]{12}'
ORDER BY id DESC LIMIT 10;
