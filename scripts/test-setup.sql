-- Test Data Setup Script for Tenant Dashboard Integration Testing
-- Run this in Supabase SQL Editor to create test data

-- Test Tenant 1
INSERT INTO public.tenants (
  subdomain, business_name, owner_name, email, phone, 
  subscription_plan, subscription_status, business_category, created_at
) VALUES (
  'test-demo', 'Test Demo Business', 'Test Owner', 
  'owner@testdemo.com', '+62812345678', 'basic', 'active', 'salon', NOW()
) ON CONFLICT DO NOTHING;

-- Get test tenant ID
DO $$
DECLARE
  test_tenant_id UUID;
BEGIN
  SELECT id INTO test_tenant_id FROM public.tenants WHERE subdomain = 'test-demo' LIMIT 1;
  
  -- Test Staff User (for tenant)
  INSERT INTO public.staff (
    tenant_id, name, email, role, password_hash, is_active, created_at
  ) VALUES (
    test_tenant_id,
    'Test Staff', 'staff@testdemo.com', 'admin', 
    '$2b$10$YEHzJ9/B3QXFVQyH6Qe1.uIFLHe5x/qJDBvyLpCFDjAeH9ywkCPLK', -- password: test123
    true, NOW()
  ) ON CONFLICT DO NOTHING;

  -- Test Services
  INSERT INTO public.services (
    tenant_id, name, description, duration, price, 
    category, is_active, created_at
  ) VALUES
  (
    test_tenant_id,
    'Haircut', 'Professional haircut service', 60, 50000,
    'hair', true, NOW()
  ),
  (
    test_tenant_id,
    'Hair Coloring', 'Hair coloring service', 120, 150000,
    'hair', true, NOW()
  ),
  (
    test_tenant_id,
    'Massage', 'Relaxing massage therapy', 90, 120000,
    'massage', true, NOW()
  )
  ON CONFLICT DO NOTHING;

  -- Test Customers
  INSERT INTO public.customers (
    tenant_id, name, phone, email, address, created_at
  ) VALUES
  (
    test_tenant_id,
    'John Doe', '+62812345678', 'john@example.com', 'Jakarta', NOW()
  ),
  (
    test_tenant_id,
    'Jane Smith', '+62813456789', 'jane@example.com', 'Bandung', NOW()
  ),
  (
    test_tenant_id,
    'Bob Johnson', '+62814567890', 'bob@example.com', 'Surabaya', NOW()
  )
  ON CONFLICT DO NOTHING;

  -- Test Bookings (with today's date)
  INSERT INTO public.bookings (
    tenant_id, customer_id, service_id, status,
    scheduled_at, duration, total_amount, notes, created_at
  ) VALUES
  (
    test_tenant_id,
    (SELECT id FROM public.customers WHERE email = 'john@example.com' AND tenant_id = test_tenant_id LIMIT 1),
    (SELECT id FROM public.services WHERE name = 'Haircut' AND tenant_id = test_tenant_id LIMIT 1),
    'confirmed',
    NOW() + INTERVAL '2 days', 60, 50000, 'Regular haircut', NOW()
  ),
  (
    test_tenant_id,
    (SELECT id FROM public.customers WHERE email = 'jane@example.com' AND tenant_id = test_tenant_id LIMIT 1),
    (SELECT id FROM public.services WHERE name = 'Hair Coloring' AND tenant_id = test_tenant_id LIMIT 1),
    'pending',
    NOW() + INTERVAL '3 days', 120, 150000, 'Blonde coloring', NOW()
  ),
  (
    test_tenant_id,
    (SELECT id FROM public.customers WHERE email = 'bob@example.com' AND tenant_id = test_tenant_id LIMIT 1),
    (SELECT id FROM public.services WHERE name = 'Massage' AND tenant_id = test_tenant_id LIMIT 1),
    'completed',
    NOW() - INTERVAL '1 day', 90, 120000, 'Full body massage', NOW()
  )
  ON CONFLICT DO NOTHING;

  -- Test Invoices
  INSERT INTO public.invoices (
    tenant_id, booking_id, customer_id, amount, status,
    due_date, created_at
  ) VALUES
  (
    test_tenant_id,
    (SELECT id FROM public.bookings WHERE status = 'confirmed' AND tenant_id = test_tenant_id LIMIT 1),
    (SELECT id FROM public.customers WHERE email = 'john@example.com' AND tenant_id = test_tenant_id LIMIT 1),
    50000, 'pending', NOW() + INTERVAL '7 days', NOW()
  ),
  (
    test_tenant_id,
    (SELECT id FROM public.bookings WHERE status = 'completed' AND tenant_id = test_tenant_id LIMIT 1),
    (SELECT id FROM public.customers WHERE email = 'bob@example.com' AND tenant_id = test_tenant_id LIMIT 1),
    120000, 'paid', NOW() - INTERVAL '7 days', NOW()
  )
  ON CONFLICT DO NOTHING;

END $$;

-- Verify test data was created
SELECT 'Test Tenant Created' as status, COUNT(*) as count FROM public.tenants WHERE subdomain = 'test-demo';
SELECT 'Test Staff Created' as status, COUNT(*) as count FROM public.staff WHERE email = 'staff@testdemo.com';
SELECT 'Test Services Created' as status, COUNT(*) as count FROM public.services WHERE tenant_id = (SELECT id FROM public.tenants WHERE subdomain = 'test-demo');
SELECT 'Test Customers Created' as status, COUNT(*) as count FROM public.customers WHERE tenant_id = (SELECT id FROM public.tenants WHERE subdomain = 'test-demo');
SELECT 'Test Bookings Created' as status, COUNT(*) as count FROM public.bookings WHERE tenant_id = (SELECT id FROM public.tenants WHERE subdomain = 'test-demo');
SELECT 'Test Invoices Created' as status, COUNT(*) as count FROM public.invoices WHERE tenant_id = (SELECT id FROM public.tenants WHERE subdomain = 'test-demo');
