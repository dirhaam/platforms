-- BEAUTY SALON MOCKUP DATA FOR DEMO
-- Tenant ID: c9d49197-317d-4d28-8fc3-fb4b2a717da0
-- Subdomain: test-demo
-- Currency: IDR (Indonesian Rupiah)
-- Country Code: +62 (Indonesia)
-- ============================================

-- Beauty Services (15 services)
INSERT INTO beauty_services (id, tenant_id, name, description, category, price, duration_minutes, can_add_extensions, extension_price, requires_patch_test, is_active, requires_appointment, required_specialties, image_urls)
VALUES
  ('svc_001', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Bridal Makeup', 'Complete bridal makeup with trial', 'makeup', 750000.00, 120, true, 250000.00, false, true, true, ARRAY['makeup_artist']::staff_specialty[], ARRAY['https://via.placeholder.com/400x300?text=Bridal+Makeup']),
  ('svc_002', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Hair Cut & Style', 'Professional haircut and styling', 'hair_care', 225000.00, 60, false, NULL, false, true, true, ARRAY['hair_stylist']::staff_specialty[], ARRAY['https://via.placeholder.com/400x300?text=Hair+Cut']),
  ('svc_003', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Hair Coloring Full', 'Full head hair coloring with treatment', 'hair_care', 475000.00, 120, true, 150000.00, true, true, true, ARRAY['hair_stylist']::staff_specialty[], ARRAY['https://via.placeholder.com/400x300?text=Hair+Color']),
  ('svc_004', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Hair Coloring Roots', 'Root touch up coloring', 'hair_care', 325000.00, 90, false, NULL, false, true, true, ARRAY['hair_stylist']::staff_specialty[], NULL),
  ('svc_005', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Facial Treatment - Hydrating', 'Deep hydrating facial with moisturizer mask', 'facial', 325000.00, 60, false, NULL, false, true, true, ARRAY['beautician']::staff_specialty[], ARRAY['https://via.placeholder.com/400x300?text=Facial']),
  ('svc_006', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Facial Treatment - Anti-Aging', 'Anti-aging facial with serum and mask', 'facial', 425000.00, 90, false, NULL, false, true, true, ARRAY['beautician']::staff_specialty[], NULL),
  ('svc_007', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Facial Treatment - Acne Control', 'Acne-focused facial treatment', 'facial', 375000.00, 75, false, NULL, false, true, true, ARRAY['beautician']::staff_specialty[], NULL),
  ('svc_008', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Swedish Massage', 'Full body Swedish massage for relaxation', 'body_massage', 400000.00, 90, false, NULL, false, true, true, ARRAY['massage_therapist']::staff_specialty[], ARRAY['https://via.placeholder.com/400x300?text=Massage']),
  ('svc_009', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Deep Tissue Massage', 'Therapeutic deep tissue massage', 'body_massage', 500000.00, 90, false, NULL, false, true, true, ARRAY['massage_therapist']::staff_specialty[], NULL),
  ('svc_010', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Manicure Basic', 'Nail care with regular polish', 'nail_care', 125000.00, 45, true, 75000.00, false, true, true, ARRAY['nail_technician']::staff_specialty[], ARRAY['https://via.placeholder.com/400x300?text=Manicure']),
  ('svc_011', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Manicure Gel', 'Long-lasting gel manicure', 'nail_care', 225000.00, 60, true, 100000.00, false, true, true, ARRAY['nail_technician']::staff_specialty[], NULL),
  ('svc_012', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Pedicure', 'Complete foot care and polish', 'nail_care', 200000.00, 60, false, NULL, false, true, true, ARRAY['nail_technician']::staff_specialty[], NULL),
  ('svc_013', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Full Body Waxing', 'Complete body waxing service', 'waxing', 600000.00, 120, false, NULL, false, true, true, ARRAY['beautician']::staff_specialty[], NULL),
  ('svc_014', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Eyebrow Threading', 'Precise eyebrow shaping', 'threading', 75000.00, 20, false, NULL, false, true, false, ARRAY[]::staff_specialty[], NULL),
  ('svc_015', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Spa Package 3 Hours', 'Facial + Massage + Manicure combo', 'spa', 1000000.00, 180, false, NULL, false, true, true, ARRAY['beautician', 'massage_therapist', 'nail_technician']::staff_specialty[], ARRAY['https://via.placeholder.com/400x300?text=Spa+Package']);

-- Beauty Staff / Beauticians (6 staff members)
INSERT INTO beauty_staff (id, tenant_id, name, phone, email, specialty, experience_years, certifications, available_services, average_rating, total_reviews, is_available, commission_percentage, base_salary, total_appointments, completed_appointments, cancellation_rate)
VALUES
  ('staff_001', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Sarah Johnson', '+62-812-3456-7801', 'sarah@beautysalon.com', 'hair_stylist'::staff_specialty, 7, ARRAY['Certified Hair Stylist', 'Color Specialist'], ARRAY['svc_002', 'svc_003', 'svc_004'], 4.8, 42, true, 15.0, 12500000.00, 125, 120, 3.2),
  ('staff_002', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Emily Davis', '+62-812-3456-7802', 'emily@beautysalon.com', 'beautician'::staff_specialty, 5, ARRAY['Esthetician License', 'Facials Expert'], ARRAY['svc_005', 'svc_006', 'svc_007', 'svc_013', 'svc_015'], 4.7, 35, true, 12.0, 10000000.00, 98, 95, 2.0),
  ('staff_003', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Jessica Martinez', '+62-812-3456-7803', 'jessica@beautysalon.com', 'makeup_artist'::staff_specialty, 8, ARRAY['Professional Makeup Artist', 'Bridal Specialist'], ARRAY['svc_001', 'svc_015'], 4.9, 28, true, 18.0, 13500000.00, 55, 54, 1.8),
  ('staff_004', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Michael Brown', '+62-812-3456-7804', 'michael@beautysalon.com', 'massage_therapist'::staff_specialty, 10, ARRAY['Swedish Massage', 'Deep Tissue', 'Sports Massage'], ARRAY['svc_008', 'svc_009', 'svc_015'], 4.9, 38, true, 14.0, 13000000.00, 102, 100, 1.9),
  ('staff_005', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Lisa Wong', '+62-812-3456-7805', 'lisa@beautysalon.com', 'nail_technician'::staff_specialty, 6, ARRAY['Nail Certification', 'Gel Specialist'], ARRAY['svc_010', 'svc_011', 'svc_012'], 4.6, 31, true, 10.0, 9000000.00, 88, 86, 2.3),
  ('staff_006', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Rachel Kim', '+62-812-3456-7806', 'rachel@beautysalon.com', 'multi_skilled'::staff_specialty, 9, ARRAY['Esthetician', 'Hair Stylist', 'Threading Expert'], ARRAY['svc_002', 'svc_003', 'svc_005', 'svc_006', 'svc_013', 'svc_014'], 4.7, 26, true, 13.0, 12000000.00, 92, 89, 2.5);

-- Customers (7 customers)
INSERT INTO customers (id, tenant_id, name, email, phone, address, notes, total_bookings, last_booking_at, created_at, updated_at)
VALUES
  ('cust_001', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Amanda Wilson', 'amanda@email.com', '+62-821-1234-5601', 'Jalan Merdeka 123, Jakarta', 'Prefers afternoon appointments', 5, NOW() - INTERVAL '3 days', NOW() - INTERVAL '60 days', NOW() - INTERVAL '3 days'),
  ('cust_002', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Catherine Lee', 'catherine@email.com', '+62-821-1234-5602', 'Jalan Sudirman 456, Jakarta', 'Regular customer, loyal to Sarah', 12, NOW() - INTERVAL '1 day', NOW() - INTERVAL '180 days', NOW() - INTERVAL '1 day'),
  ('cust_003', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Michelle Rodriguez', 'michelle@email.com', '+62-821-1234-5603', 'Jalan Ahmad Yani 789, Bandung', 'Sensitive skin, patch test required', 3, NOW() - INTERVAL '14 days', NOW() - INTERVAL '45 days', NOW() - INTERVAL '14 days'),
  ('cust_004', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Angela Thompson', 'angela@email.com', '+62-821-1234-5604', 'Jalan Gatot Subroto 321, Jakarta', 'Wedding coming up in 2 months', 1, NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('cust_005', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Jessica Anderson', 'jessica.a@email.com', '+62-821-1234-5605', 'Jalan Rasuna Said 654, Jakarta', 'Prefers evening appointments after work', 8, NOW() - INTERVAL '7 days', NOW() - INTERVAL '120 days', NOW() - INTERVAL '7 days'),
  ('cust_006', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Laura Martinez', 'laura@email.com', '+62-821-1234-5606', 'Jalan Jenderal Sudirman 987, Surabaya', 'Monthly regular, combo packages', 6, NOW() - INTERVAL '5 days', NOW() - INTERVAL '90 days', NOW() - INTERVAL '5 days'),
  ('cust_007', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Patricia Taylor', 'patricia@email.com', '+62-821-1234-5607', 'Jalan Margonda 147, Depok', 'First time visitor', 1, NOW(), NOW() - INTERVAL '2 days', NOW());

-- Bookings / Appointments (10 bookings)
INSERT INTO bookings (id, tenant_id, customer_id, service_id, staff_id, scheduled_at, booking_status, total_amount, payment_status, notes, created_at, updated_at)
VALUES
  ('booking_001', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'cust_001', 'svc_002', 'staff_001', NOW() + INTERVAL '2 days 10:00', 'confirmed', 225000.00, 'paid', 'Regular haircut', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
  ('booking_002', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'cust_002', 'svc_003', 'staff_001', NOW() + INTERVAL '5 days 14:00', 'confirmed', 475000.00, 'paid', 'Full head color refresh', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  ('booking_003', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'cust_003', 'svc_005', 'staff_002', NOW() + INTERVAL '3 days 11:00', 'pending', 325000.00, 'pending', 'Hydrating facial', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('booking_004', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'cust_004', 'svc_001', 'staff_003', NOW() + INTERVAL '45 days 10:00', 'confirmed', 750000.00, 'pending', 'Bridal makeup trial', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  ('booking_005', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'cust_005', 'svc_008', 'staff_004', NOW() + INTERVAL '4 days 18:00', 'confirmed', 400000.00, 'paid', 'Swedish massage', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
  ('booking_006', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'cust_006', 'svc_011', 'staff_005', NOW() + INTERVAL '6 days 15:00', 'confirmed', 225000.00, 'pending', 'Gel manicure with extensions', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
  ('booking_007', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'cust_002', 'svc_006', 'staff_002', NOW() - INTERVAL '3 days', 'completed', 425000.00, 'paid', 'Anti-aging facial', NOW() - INTERVAL '20 days', NOW() - INTERVAL '3 days'),
  ('booking_008', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'cust_007', 'svc_002', 'staff_001', NOW(), 'completed', 225000.00, 'paid', 'Welcome haircut for new customer', NOW() - INTERVAL '2 days', NOW()),
  ('booking_009', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'cust_001', 'svc_010', 'staff_005', NOW() - INTERVAL '10 days', 'completed', 125000.00, 'paid', 'Basic manicure', NOW() - INTERVAL '15 days', NOW() - INTERVAL '10 days'),
  ('booking_010', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'cust_005', 'svc_012', 'staff_005', NOW() - INTERVAL '7 days', 'completed', 200000.00, 'paid', 'Pedicure', NOW() - INTERVAL '14 days', NOW() - INTERVAL '7 days');

-- Beauty Packages (5 packages)
INSERT INTO beauty_packages (id, tenant_id, name, description, category, included_services, service_count, original_price, package_price, discount_percentage, validity_days, can_repeat_service, max_uses_per_service, is_active)
VALUES
  ('pkg_001', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Bride Pamper Package', 'Complete bridal preparation package', 'makeup', ARRAY['svc_001', 'svc_005', 'svc_015'], 3, 1500000.00, 1250000.00, 16.7, 90, false, 1, true),
  ('pkg_002', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Hair Care Bundle', '3 sessions of hair services', 'hair_care', ARRAY['svc_002', 'svc_003', 'svc_004'], 3, 1000000.00, 800000.00, 20.0, 180, true, 2, true),
  ('pkg_003', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Wellness Spa Package', 'Facial + Massage + Manicure', 'spa', ARRAY['svc_005', 'svc_008', 'svc_011'], 3, 950000.00, 749950.00, 21.1, 60, false, 1, true),
  ('pkg_004', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Nails Premium', '4 manicures or pedicures', 'nail_care', ARRAY['svc_010', 'svc_011', 'svc_012'], 4, 800000.00, 600000.00, 25.0, 120, true, 4, true),
  ('pkg_005', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Facial Refresh', '5 facial treatments', 'facial', ARRAY['svc_005', 'svc_006', 'svc_007'], 5, 1750000.00, 1375000.00, 21.4, 180, true, 5, true);

-- READY TO USE
-- Just copy entire SQL and paste it into your Supabase SQL editor and execute!
-- All tenant IDs are already set to: c9d49197-317d-4d28-8fc3-fb4b2a717da0 (test-demo)
-- All prices are in IDR (Indonesian Rupiah)
-- All phone numbers use +62 (Indonesia country code)
