-- Beauty Salon Database Schema
-- Comprehensive schema for beauty salon management

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE service_category AS ENUM (
  'hair_care',
  'facial',
  'body_massage',
  'nail_care',
  'makeup',
  'spa',
  'threading',
  'waxing',
  'other'
);

CREATE TYPE appointment_status AS ENUM (
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
  'rescheduled'
);

CREATE TYPE staff_specialty AS ENUM (
  'hair_stylist',
  'beautician',
  'massage_therapist',
  'nail_technician',
  'makeup_artist',
  'spa_therapist',
  'multi_skilled'
);

-- ============================================
-- SERVICES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS beauty_services (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  description VARCHAR(1000),
  category service_category NOT NULL,
  
  -- Pricing & Duration
  price DECIMAL(10, 2) NOT NULL,
  duration_minutes INTEGER NOT NULL, -- Service duration in minutes
  
  -- Add-ons
  can_add_extensions BOOLEAN DEFAULT false,
  extension_price DECIMAL(10, 2),
  requires_patch_test BOOLEAN DEFAULT false, -- For coloring services
  
  -- Availability
  is_active BOOLEAN DEFAULT true,
  requires_appointment BOOLEAN DEFAULT true,
  
  -- Staff Requirements
  required_specialties staff_specialty[] DEFAULT ARRAY[]::staff_specialty[],
  preferred_staff_count INTEGER DEFAULT 1,
  
  -- Images
  image_urls TEXT[],
  
  -- Inventory (if applicable)
  requires_inventory BOOLEAN DEFAULT false,
  inventory_items TEXT[], -- JSON array of items needed
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_price CHECK (price >= 0),
  CONSTRAINT valid_duration CHECK (duration_minutes > 0)
);

CREATE INDEX idx_beauty_services_tenant ON beauty_services(tenant_id);
CREATE INDEX idx_beauty_services_category ON beauty_services(category);
CREATE INDEX idx_beauty_services_active ON beauty_services(is_active);

-- ============================================
-- BEAUTY STAFF/BEAUTICIANS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS beauty_staff (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  staff_id TEXT REFERENCES staff(id) ON DELETE CASCADE,
  
  -- Personal Info
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  
  -- Professional Info
  specialty staff_specialty NOT NULL,
  experience_years INTEGER,
  certifications TEXT[], -- Array of certification names
  
  -- Services
  available_services TEXT[] NOT NULL, -- service IDs they can provide
  specialization_description VARCHAR(1000),
  
  -- Rating & Reviews
  average_rating DECIMAL(3, 2),
  total_reviews INTEGER DEFAULT 0,
  
  -- Availability
  is_available BOOLEAN DEFAULT true,
  working_hours_per_week INTEGER, -- Total hours per week
  
  -- Pricing
  commission_percentage DECIMAL(5, 2), -- % commission from service revenue
  base_salary DECIMAL(10, 2),
  
  -- Performance
  total_appointments INTEGER DEFAULT 0,
  completed_appointments INTEGER DEFAULT 0,
  cancellation_rate DECIMAL(5, 2),
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_experience CHECK (experience_years >= 0),
  CONSTRAINT valid_rating CHECK (average_rating >= 0 AND average_rating <= 5),
  CONSTRAINT valid_commission CHECK (commission_percentage >= 0 AND commission_percentage <= 100)
);

CREATE INDEX idx_beauty_staff_tenant ON beauty_staff(tenant_id);
CREATE INDEX idx_beauty_staff_specialty ON beauty_staff(specialty);
CREATE INDEX idx_beauty_staff_available ON beauty_staff(is_available);

-- ============================================
-- BEAUTY APPOINTMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS beauty_appointments (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Service Info
  service_id TEXT NOT NULL REFERENCES beauty_services(id) ON DELETE RESTRICT,
  requested_staff_id TEXT REFERENCES beauty_staff(id) ON DELETE SET NULL,
  assigned_staff_id TEXT REFERENCES beauty_staff(id) ON DELETE SET NULL,
  
  -- Appointment Details
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  end_time TIME, -- Calculated from duration
  status appointment_status DEFAULT 'pending',
  
  -- Pricing
  service_price DECIMAL(10, 2) NOT NULL,
  add_ons_price DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL,
  
  -- Add-ons
  add_ons TEXT[], -- Array of add-on services
  
  -- Notes
  customer_notes VARCHAR(1000),
  staff_notes VARCHAR(1000),
  cancellation_reason VARCHAR(500),
  
  -- Customer Preferences
  first_time_customer BOOLEAN DEFAULT false,
  patch_test_done BOOLEAN DEFAULT false,
  patch_test_date DATE,
  
  -- Reminders
  reminder_sent_before_hours INTEGER DEFAULT 24, -- Send reminder X hours before
  reminder_sent_at TIMESTAMP,
  sms_reminder_sent BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP,
  
  CONSTRAINT valid_prices CHECK (service_price >= 0 AND total_price >= 0)
);

CREATE INDEX idx_beauty_appointments_tenant ON beauty_appointments(tenant_id);
CREATE INDEX idx_beauty_appointments_customer ON beauty_appointments(customer_id);
CREATE INDEX idx_beauty_appointments_service ON beauty_appointments(service_id);
CREATE INDEX idx_beauty_appointments_staff ON beauty_appointments(assigned_staff_id);
CREATE INDEX idx_beauty_appointments_date ON beauty_appointments(scheduled_date);
CREATE INDEX idx_beauty_appointments_status ON beauty_appointments(status);

-- ============================================
-- BEAUTY PACKAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS beauty_packages (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description VARCHAR(1000),
  category service_category,
  
  -- Services Included
  included_services TEXT[] NOT NULL, -- Array of service IDs
  service_count INTEGER NOT NULL,
  
  -- Pricing
  original_price DECIMAL(10, 2) NOT NULL,
  package_price DECIMAL(10, 2) NOT NULL,
  discount_percentage DECIMAL(5, 2),
  
  -- Validity
  validity_days INTEGER, -- Valid for X days from purchase
  
  -- Limits
  can_repeat_service BOOLEAN DEFAULT false,
  max_uses_per_service INTEGER,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_beauty_packages_tenant ON beauty_packages(tenant_id);
CREATE INDEX idx_beauty_packages_active ON beauty_packages(is_active);

-- ============================================
-- CUSTOMER BEAUTY PACKAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS customer_beauty_packages (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL REFERENCES beauty_packages(id) ON DELETE RESTRICT,
  
  purchase_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  
  -- Usage
  total_sessions INTEGER NOT NULL,
  used_sessions INTEGER DEFAULT 0,
  remaining_sessions INTEGER,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_customer_beauty_packages_tenant ON customer_beauty_packages(tenant_id);
CREATE INDEX idx_customer_beauty_packages_customer ON customer_beauty_packages(customer_id);
CREATE INDEX idx_customer_beauty_packages_active ON customer_beauty_packages(is_active);

-- ============================================
-- BEAUTY REVIEWS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS beauty_reviews (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  appointment_id TEXT NOT NULL REFERENCES beauty_appointments(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  staff_id TEXT REFERENCES beauty_staff(id) ON DELETE SET NULL,
  
  rating INTEGER NOT NULL,
  title VARCHAR(255),
  comment VARCHAR(1000),
  
  -- Review Aspects
  service_quality_rating INTEGER,
  staff_behavior_rating INTEGER,
  hygiene_rating INTEGER,
  value_for_money_rating INTEGER,
  
  -- Photos
  photo_urls TEXT[],
  
  -- Moderation
  is_verified BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  moderator_notes VARCHAR(500),
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT valid_aspect_ratings CHECK (
    (service_quality_rating IS NULL OR (service_quality_rating >= 1 AND service_quality_rating <= 5)) AND
    (staff_behavior_rating IS NULL OR (staff_behavior_rating >= 1 AND staff_behavior_rating <= 5)) AND
    (hygiene_rating IS NULL OR (hygiene_rating >= 1 AND hygiene_rating <= 5)) AND
    (value_for_money_rating IS NULL OR (value_for_money_rating >= 1 AND value_for_money_rating <= 5))
  )
);

CREATE INDEX idx_beauty_reviews_tenant ON beauty_reviews(tenant_id);
CREATE INDEX idx_beauty_reviews_staff ON beauty_reviews(staff_id);
CREATE INDEX idx_beauty_reviews_published ON beauty_reviews(is_published);

-- ============================================
-- BEAUTY STAFF SCHEDULE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS beauty_staff_schedule (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  staff_id TEXT NOT NULL REFERENCES beauty_staff(id) ON DELETE CASCADE,
  
  -- Schedule Details
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start_time TIME,
  break_end_time TIME,
  break_duration_minutes INTEGER,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_day CHECK (day_of_week >= 0 AND day_of_week <= 6),
  CONSTRAINT valid_times CHECK (start_time < end_time)
);

CREATE INDEX idx_beauty_staff_schedule_tenant ON beauty_staff_schedule(tenant_id);
CREATE INDEX idx_beauty_staff_schedule_staff ON beauty_staff_schedule(staff_id);

-- ============================================
-- BEAUTY STAFF LEAVE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS beauty_staff_leave (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  staff_id TEXT NOT NULL REFERENCES beauty_staff(id) ON DELETE CASCADE,
  
  leave_type VARCHAR(50), -- 'vacation', 'sick', 'personal'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  reason VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_dates CHECK (start_date <= end_date)
);

CREATE INDEX idx_beauty_staff_leave_tenant ON beauty_staff_leave(tenant_id);
CREATE INDEX idx_beauty_staff_leave_staff ON beauty_staff_leave(staff_id);

-- ============================================
-- BEAUTY PROMOTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS beauty_promotions (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description VARCHAR(1000),
  
  -- Discount Details
  discount_type VARCHAR(50), -- 'percentage' or 'fixed'
  discount_value DECIMAL(10, 2) NOT NULL,
  
  -- Applicability
  applicable_services TEXT[], -- null = all services
  applicable_staff TEXT[], -- null = all staff
  min_booking_amount DECIMAL(10, 2),
  
  -- Validity
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Usage Limits
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  max_uses_per_customer INTEGER,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  requires_coupon_code BOOLEAN DEFAULT false,
  coupon_code VARCHAR(50),
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_dates CHECK (start_date <= end_date),
  CONSTRAINT valid_discount CHECK (discount_value > 0)
);

CREATE INDEX idx_beauty_promotions_tenant ON beauty_promotions(tenant_id);
CREATE INDEX idx_beauty_promotions_active ON beauty_promotions(is_active);
CREATE INDEX idx_beauty_promotions_dates ON beauty_promotions(start_date, end_date);

-- ============================================
-- BEAUTY INVENTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS beauty_inventory (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  item_name VARCHAR(255) NOT NULL,
  item_category VARCHAR(100), -- 'hair_product', 'skincare', 'tools', etc.
  brand VARCHAR(255),
  
  -- Stock Management
  quantity_available INTEGER NOT NULL,
  quantity_low_threshold INTEGER,
  
  -- Supplier Info
  supplier_name VARCHAR(255),
  supplier_contact VARCHAR(255),
  cost_per_unit DECIMAL(10, 2),
  
  -- Usage
  usage_unit VARCHAR(50), -- 'ml', 'pieces', 'grams', etc.
  
  last_restocked_date DATE,
  expiry_date DATE,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_beauty_inventory_tenant ON beauty_inventory(tenant_id);
CREATE INDEX idx_beauty_inventory_category ON beauty_inventory(item_category);

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View untuk mendapatkan available staff berdasarkan service dan time slot
CREATE OR REPLACE VIEW v_available_beauty_staff AS
SELECT DISTINCT
  bs.id,
  bs.name,
  bs.specialty,
  bs.average_rating,
  s.id as service_id
FROM beauty_staff bs
JOIN unnest(bs.available_services) AS service_id(id) ON true
JOIN beauty_services s ON s.id = service_id.id
WHERE bs.is_available = true
  AND s.is_active = true;

-- View untuk appointment revenue by staff
CREATE OR REPLACE VIEW v_beauty_appointment_revenue AS
SELECT
  ba.assigned_staff_id,
  COUNT(*) as total_appointments,
  SUM(ba.total_price) as total_revenue,
  AVG(ba.total_price) as avg_revenue,
  SUM(CASE WHEN ba.status = 'completed' THEN 1 ELSE 0 END) as completed_count
FROM beauty_appointments ba
WHERE ba.status IN ('completed', 'confirmed')
GROUP BY ba.assigned_staff_id;

-- View untuk service popularity
CREATE OR REPLACE VIEW v_service_popularity AS
SELECT
  bs.id,
  bs.name,
  bs.category,
  COUNT(ba.id) as total_bookings,
  SUM(ba.total_price) as total_revenue,
  COUNT(DISTINCT ba.customer_id) as unique_customers,
  AVG(br.rating) as avg_rating
FROM beauty_services bs
LEFT JOIN beauty_appointments ba ON bs.id = ba.service_id
LEFT JOIN beauty_reviews br ON ba.id = br.appointment_id
GROUP BY bs.id, bs.name, bs.category;

-- ============================================
-- MOCKUP DATA FOR DEMO
-- Tenant ID: c9d49197-317d-4d28-8fc3-fb4b2a717da0 (test-demo)
-- ============================================

-- Beauty Services
INSERT INTO beauty_services (id, tenant_id, name, description, category, price, duration_minutes, can_add_extensions, extension_price, requires_patch_test, is_active, requires_appointment, required_specialties, image_urls)
VALUES
  ('svc_001', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Bridal Makeup', 'Complete bridal makeup with trial', 'makeup', 150.00, 120, true, 50.00, false, true, true, ARRAY['makeup_artist']::staff_specialty[], ARRAY['https://via.placeholder.com/400x300?text=Bridal+Makeup']),
  ('svc_002', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Hair Cut & Style', 'Professional haircut and styling', 'hair_care', 45.00, 60, false, NULL, false, true, true, ARRAY['hair_stylist']::staff_specialty[], ARRAY['https://via.placeholder.com/400x300?text=Hair+Cut']),
  ('svc_003', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Hair Coloring Full', 'Full head hair coloring with treatment', 'hair_care', 95.00, 120, true, 30.00, true, true, true, ARRAY['hair_stylist']::staff_specialty[], ARRAY['https://via.placeholder.com/400x300?text=Hair+Color']),
  ('svc_004', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Hair Coloring Roots', 'Root touch up coloring', 'hair_care', 65.00, 90, false, NULL, false, true, true, ARRAY['hair_stylist']::staff_specialty[], NULL),
  ('svc_005', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Facial Treatment - Hydrating', 'Deep hydrating facial with moisturizer mask', 'facial', 65.00, 60, false, NULL, false, true, true, ARRAY['beautician']::staff_specialty[], ARRAY['https://via.placeholder.com/400x300?text=Facial']),
  ('svc_006', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Facial Treatment - Anti-Aging', 'Anti-aging facial with serum and mask', 'facial', 85.00, 90, false, NULL, false, true, true, ARRAY['beautician']::staff_specialty[], NULL),
  ('svc_007', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Facial Treatment - Acne Control', 'Acne-focused facial treatment', 'facial', 75.00, 75, false, NULL, false, true, true, ARRAY['beautician']::staff_specialty[], NULL),
  ('svc_008', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Swedish Massage', 'Full body Swedish massage for relaxation', 'body_massage', 80.00, 90, false, NULL, false, true, true, ARRAY['massage_therapist']::staff_specialty[], ARRAY['https://via.placeholder.com/400x300?text=Massage']),
  ('svc_009', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Deep Tissue Massage', 'Therapeutic deep tissue massage', 'body_massage', 100.00, 90, false, NULL, false, true, true, ARRAY['massage_therapist']::staff_specialty[], NULL),
  ('svc_010', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Manicure Basic', 'Nail care with regular polish', 'nail_care', 25.00, 45, true, 15.00, false, true, true, ARRAY['nail_technician']::staff_specialty[], ARRAY['https://via.placeholder.com/400x300?text=Manicure']),
  ('svc_011', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Manicure Gel', 'Long-lasting gel manicure', 'nail_care', 45.00, 60, true, 20.00, false, true, true, ARRAY['nail_technician']::staff_specialty[], NULL),
  ('svc_012', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Pedicure', 'Complete foot care and polish', 'nail_care', 40.00, 60, false, NULL, false, true, true, ARRAY['nail_technician']::staff_specialty[], NULL),
  ('svc_013', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Full Body Waxing', 'Complete body waxing service', 'waxing', 120.00, 120, false, NULL, false, true, true, ARRAY['beautician']::staff_specialty[], NULL),
  ('svc_014', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Eyebrow Threading', 'Precise eyebrow shaping', 'threading', 15.00, 20, false, NULL, false, true, false, ARRAY[]::staff_specialty[], NULL),
  ('svc_015', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Spa Package 3 Hours', 'Facial + Massage + Manicure combo', 'spa', 200.00, 180, false, NULL, false, true, true, ARRAY['beautician', 'massage_therapist', 'nail_technician']::staff_specialty[], ARRAY['https://via.placeholder.com/400x300?text=Spa+Package']);

-- Beauty Staff / Beauticians
INSERT INTO beauty_staff (id, tenant_id, name, phone, email, specialty, experience_years, certifications, available_services, average_rating, total_reviews, is_available, commission_percentage, base_salary, total_appointments, completed_appointments, cancellation_rate)
VALUES
  ('staff_001', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Sarah Johnson', '+1-555-0101', 'sarah@beautysalon.com', 'hair_stylist'::staff_specialty, 7, ARRAY['Certified Hair Stylist', 'Color Specialist'], ARRAY['svc_002', 'svc_003', 'svc_004'], 4.8, 42, true, 15.0, 2500.00, 125, 120, 3.2),
  ('staff_002', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Emily Davis', '+1-555-0102', 'emily@beautysalon.com', 'beautician'::staff_specialty, 5, ARRAY['Esthetician License', 'Facials Expert'], ARRAY['svc_005', 'svc_006', 'svc_007', 'svc_013', 'svc_015'], 4.7, 35, true, 12.0, 2000.00, 98, 95, 2.0),
  ('staff_003', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Jessica Martinez', '+1-555-0103', 'jessica@beautysalon.com', 'makeup_artist'::staff_specialty, 8, ARRAY['Professional Makeup Artist', 'Bridal Specialist'], ARRAY['svc_001', 'svc_015'], 4.9, 28, true, 18.0, 2700.00, 55, 54, 1.8),
  ('staff_004', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Michael Brown', '+1-555-0104', 'michael@beautysalon.com', 'massage_therapist'::staff_specialty, 10, ARRAY['Swedish Massage', 'Deep Tissue', 'Sports Massage'], ARRAY['svc_008', 'svc_009', 'svc_015'], 4.9, 38, true, 14.0, 2600.00, 102, 100, 1.9),
  ('staff_005', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Lisa Wong', '+1-555-0105', 'lisa@beautysalon.com', 'nail_technician'::staff_specialty, 6, ARRAY['Nail Certification', 'Gel Specialist'], ARRAY['svc_010', 'svc_011', 'svc_012'], 4.6, 31, true, 10.0, 1800.00, 88, 86, 2.3),
  ('staff_006', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Rachel Kim', '+1-555-0106', 'rachel@beautysalon.com', 'multi_skilled'::staff_specialty, 9, ARRAY['Esthetician', 'Hair Stylist', 'Threading Expert'], ARRAY['svc_002', 'svc_003', 'svc_005', 'svc_006', 'svc_013', 'svc_014'], 4.7, 26, true, 13.0, 2400.00, 92, 89, 2.5);

-- Customers (for bookings)
INSERT INTO customers (id, tenant_id, name, email, phone, address, notes, total_bookings, last_booking_at, created_at, updated_at)
VALUES
  ('cust_001', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Amanda Wilson', 'amanda@email.com', '+1-555-1001', '123 Main St, City', 'Prefers afternoon appointments', 5, NOW() - INTERVAL '3 days', NOW() - INTERVAL '60 days', NOW() - INTERVAL '3 days'),
  ('cust_002', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Catherine Lee', 'catherine@email.com', '+1-555-1002', '456 Oak Ave, City', 'Regular customer, loyal to Sarah', 12, NOW() - INTERVAL '1 day', NOW() - INTERVAL '180 days', NOW() - INTERVAL '1 day'),
  ('cust_003', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Michelle Rodriguez', 'michelle@email.com', '+1-555-1003', '789 Elm St, City', 'Sensitive skin, patch test required', 3, NOW() - INTERVAL '14 days', NOW() - INTERVAL '45 days', NOW() - INTERVAL '14 days'),
  ('cust_004', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Angela Thompson', 'angela@email.com', '+1-555-1004', '321 Pine Rd, City', 'Wedding coming up in 2 months', 1, NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('cust_005', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Jessica Anderson', 'jessica.a@email.com', '+1-555-1005', '654 Maple Dr, City', 'Prefers evening appointments after work', 8, NOW() - INTERVAL '7 days', NOW() - INTERVAL '120 days', NOW() - INTERVAL '7 days'),
  ('cust_006', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Laura Martinez', 'laura@email.com', '+1-555-1006', '987 Birch Ln, City', 'Monthly regular, combo packages', 6, NOW() - INTERVAL '5 days', NOW() - INTERVAL '90 days', NOW() - INTERVAL '5 days'),
  ('cust_007', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Patricia Taylor', 'patricia@email.com', '+1-555-1007', '147 Cedar St, City', 'First time visitor', 1, NOW(), NOW() - INTERVAL '2 days', NOW());

-- Bookings / Appointments
INSERT INTO bookings (id, tenant_id, customer_id, service_id, staff_id, scheduled_at, booking_status, total_amount, payment_status, notes, created_at, updated_at)
VALUES
  ('booking_001', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'cust_001', 'svc_002', 'staff_001', NOW() + INTERVAL '2 days 10:00', 'confirmed', 45.00, 'paid', 'Regular haircut', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
  ('booking_002', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'cust_002', 'svc_003', 'staff_001', NOW() + INTERVAL '5 days 14:00', 'confirmed', 95.00, 'paid', 'Full head color refresh', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  ('booking_003', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'cust_003', 'svc_005', 'staff_002', NOW() + INTERVAL '3 days 11:00', 'pending', 65.00, 'pending', 'Hydrating facial', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('booking_004', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'cust_004', 'svc_001', 'staff_003', NOW() + INTERVAL '45 days 10:00', 'confirmed', 150.00, 'pending', 'Bridal makeup trial', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  ('booking_005', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'cust_005', 'svc_008', 'staff_004', NOW() + INTERVAL '4 days 18:00', 'confirmed', 80.00, 'paid', 'Swedish massage', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
  ('booking_006', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'cust_006', 'svc_011', 'staff_005', NOW() + INTERVAL '6 days 15:00', 'confirmed', 45.00, 'pending', 'Gel manicure with extensions', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
  ('booking_007', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'cust_002', 'svc_006', 'staff_002', NOW() - INTERVAL '3 days', 'completed', 85.00, 'paid', 'Anti-aging facial', NOW() - INTERVAL '20 days', NOW() - INTERVAL '3 days'),
  ('booking_008', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'cust_007', 'svc_002', 'staff_001', NOW(), 'completed', 45.00, 'paid', 'Welcome haircut for new customer', NOW() - INTERVAL '2 days', NOW()),
  ('booking_009', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'cust_001', 'svc_010', 'staff_005', NOW() - INTERVAL '10 days', 'completed', 25.00, 'paid', 'Basic manicure', NOW() - INTERVAL '15 days', NOW() - INTERVAL '10 days'),
  ('booking_010', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'cust_005', 'svc_012', 'staff_005', NOW() - INTERVAL '7 days', 'completed', 40.00, 'paid', 'Pedicure', NOW() - INTERVAL '14 days', NOW() - INTERVAL '7 days');

-- Beauty Packages
INSERT INTO beauty_packages (id, tenant_id, name, description, category, included_services, service_count, original_price, package_price, discount_percentage, validity_days, can_repeat_service, max_uses_per_service, is_active)
VALUES
  ('pkg_001', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Bride Pamper Package', 'Complete bridal preparation package', 'makeup', ARRAY['svc_001', 'svc_005', 'svc_015'], 3, 300.00, 250.00, 16.7, 90, false, 1, true),
  ('pkg_002', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Hair Care Bundle', '3 sessions of hair services', 'hair_care', ARRAY['svc_002', 'svc_003', 'svc_004'], 3, 200.00, 160.00, 20.0, 180, true, 2, true),
  ('pkg_003', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Wellness Spa Package', 'Facial + Massage + Manicure', 'spa', ARRAY['svc_005', 'svc_008', 'svc_011'], 3, 190.00, 149.99, 21.1, 60, false, 1, true),
  ('pkg_004', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Nails Premium', '4 manicures or pedicures', 'nail_care', ARRAY['svc_010', 'svc_011', 'svc_012'], 4, 160.00, 120.00, 25.0, 120, true, 4, true),
  ('pkg_005', 'c9d49197-317d-4d28-8fc3-fb4b2a717da0', 'Facial Refresh', '5 facial treatments', 'facial', ARRAY['svc_005', 'svc_006', 'svc_007'], 5, 350.00, 275.00, 21.4, 180, true, 5, true);

-- READY TO USE - All tenant IDs already set to: c9d49197-317d-4d28-8fc3-fb4b2a717da0 (test-demo)
