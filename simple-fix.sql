-- Simple fix for UUID issues
-- Run this in Supabase SQL Editor

-- Step 1: Drop sessions table completely
DROP TABLE IF EXISTS sessions CASCADE;

-- Step 2: Convert super_admins table first
-- Delete any problematic records manually
BEGIN;

-- Identify and delete invalid UUID records by pattern matching (without casting)
DELETE FROM super_admins WHERE id LIKE 'sa_%';
DELETE FROM tenants WHERE id LIKE 'sa_%';
DELETE FROM services WHERE id LIKE 'sa_%';
DELETE FROM customers WHERE id LIKE 'sa_%';
DELETE FROM bookings WHERE id LIKE 'sa_%';
DELETE FROM staff WHERE id LIKE 'sa_%';
DELETE FROM whatsapp_devices WHERE id LIKE 'sa_%';
DELETE FROM conversations WHERE id LIKE 'sa_%';
DELETE FROM message_templates WHERE id LIKE 'sa_%';
DELETE FROM business_hours WHERE id LIKE 'sa_%';
DELETE FROM invoices WHERE id LIKE 'sa_%';
DELETE FROM invoice_items WHERE id LIKE 'sa_%';
DELETE FROM service_areas WHERE id LIKE 'sa_%';
DELETE FROM messages WHERE id LIKE 'sa_%';

COMMIT;

-- Step 3: Convert data types (only for tables with valid UUIDs)
ALTER TABLE super_admins ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE tenants ALTER COLUMN id TYPE UUID USING id::uuid;

-- Step 4: Create superadmin
DELETE FROM super_admins WHERE email = 'superadmin@booqing.my.id';

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

-- Step 5: Verify
SELECT id, email, name, is_active FROM super_admins WHERE email = 'superadmin@booqing.my.id';
