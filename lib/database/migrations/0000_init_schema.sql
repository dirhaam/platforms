-- Migration untuk membuat schema database awal

-- Tabel untuk menyimpan informasi tenant
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY NOT NULL,
  subdomain VARCHAR(255) NOT NULL UNIQUE,
  emoji VARCHAR(10) DEFAULT '🏢',
  business_name VARCHAR(255) NOT NULL,
  business_category VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address VARCHAR(500),
  business_description VARCHAR(1000),
  logo VARCHAR(500),
  brand_colors JSON,
  whatsapp_enabled BOOLEAN DEFAULT false,
  home_visit_enabled BOOLEAN DEFAULT false,
  analytics_enabled BOOLEAN DEFAULT false,
  custom_templates_enabled BOOLEAN DEFAULT false,
  multi_staff_enabled BOOLEAN DEFAULT false,
  subscription_plan VARCHAR(50) DEFAULT 'basic',
  subscription_status VARCHAR(50) DEFAULT 'active',
  subscription_expires_at TIMESTAMP,
  password_hash VARCHAR(255),
  last_login_at TIMESTAMP,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index untuk pencarian cepat berdasarkan subdomain
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants (subdomain);

-- Tabel untuk menyimpan informasi staff
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) DEFAULT 'staff',
  permissions TEXT[],
  is_active BOOLEAN DEFAULT true,
  password_hash VARCHAR(255),
  last_login_at TIMESTAMP,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index untuk pencarian cepat berdasarkan tenant_id dan email
CREATE INDEX IF NOT EXISTS idx_staff_tenant_id ON staff (tenant_id);
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff (email);

-- Tabel untuk menyimpan informasi customer
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  address VARCHAR(500),
  notes VARCHAR(1000),
  total_bookings INTEGER DEFAULT 0,
  last_booking_at TIMESTAMP,
  whatsapp_number VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index untuk pencarian cepat berdasarkan tenant_id dan phone
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers (tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers (phone);

-- Tabel untuk menyimpan informasi service
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description VARCHAR(1000) NOT NULL,
  duration INTEGER NOT NULL, -- minutes
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  home_visit_available BOOLEAN DEFAULT false,
  home_visit_surcharge DECIMAL(10, 2),
  images TEXT[],
  requirements TEXT[],
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index untuk pencarian cepat berdasarkan tenant_id dan category
CREATE INDEX IF NOT EXISTS idx_services_tenant_id ON services (tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services (category);

-- Tabel untuk menyimpan informasi booking
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  scheduled_at TIMESTAMP NOT NULL,
  duration INTEGER NOT NULL, -- minutes
  is_home_visit BOOLEAN DEFAULT false,
  home_visit_address VARCHAR(500),
  home_visit_coordinates JSON,
  notes VARCHAR(1000),
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  reminders_sent TIMESTAMP[],
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index untuk pencarian cepat berdasarkan tenant_id, customer_id, dan service_id
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_id ON bookings (tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings (customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings (service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON bookings (scheduled_at);

-- Tabel untuk menyimpan informasi business hours
CREATE TABLE IF NOT EXISTS business_hours (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  schedule JSON NOT NULL,
  timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index untuk pencarian cepat berdasarkan tenant_id
CREATE INDEX IF NOT EXISTS idx_business_hours_tenant_id ON business_hours (tenant_id);

-- Tabel untuk menyimpan informasi invoice
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  booking_id TEXT REFERENCES bookings(id) ON DELETE SET NULL,
  invoice_number VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'draft',
  issue_date TIMESTAMP DEFAULT NOW() NOT NULL,
  due_date TIMESTAMP NOT NULL,
  paid_date TIMESTAMP,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_rate DECIMAL(5, 4) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(250),
  notes VARCHAR(1000),
  terms VARCHAR(1000),
  qr_code_data VARCHAR(500),
  qr_code_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index untuk pencarian cepat berdasarkan tenant_id dan invoice_number
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices (tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices (invoice_number);

-- Tabel untuk menyimpan item invoice
CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY NOT NULL,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description VARCHAR(500) NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  service_id TEXT REFERENCES services(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index untuk pencarian cepat berdasarkan invoice_id
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items (invoice_id);

-- Tabel untuk menyimpan informasi service area
CREATE TABLE IF NOT EXISTS service_areas (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description VARCHAR(1000),
  is_active BOOLEAN DEFAULT true,
  boundaries JSON NOT NULL, -- ServiceAreaBoundary type
  base_travel_surcharge DECIMAL(10, 2) NOT NULL,
  per_km_surcharge DECIMAL(10, 2),
  max_travel_distance DECIMAL(8, 2) NOT NULL,
  estimated_travel_time INTEGER NOT NULL, -- base travel time in minutes
  available_services TEXT[], -- service IDs
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index untuk pencarian cepat berdasarkan tenant_id
CREATE INDEX IF NOT EXISTS idx_service_areas_tenant_id ON service_areas (tenant_id);

-- Tabel untuk menyimpan informasi super admin
CREATE TABLE IF NOT EXISTS super_admins (
  id TEXT PRIMARY KEY NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  password_hash VARCHAR(255) NOT NULL,
  last_login_at TIMESTAMP,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  permissions TEXT[] DEFAULT ARRAY['*']::TEXT[], -- Platform-wide permissions
  can_access_all_tenants BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index untuk pencarian cepat berdasarkan email
CREATE INDEX IF NOT EXISTS idx_super_admins_email ON super_admins (email);

-- Tabel untuk menyimpan log audit keamanan
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  action VARCHAR(100) NOT NULL, -- login, logout, create_booking, delete_customer, etc.
  resource VARCHAR(100), -- booking_id, customer_id, etc.
  ip_address VARCHAR(45) NOT NULL, -- IPv6 addresses can be 39 chars + port
  user_agent VARCHAR(500) NOT NULL,
  success BOOLEAN DEFAULT true,
  details VARCHAR(1000), -- JSON string with additional details
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index untuk pencarian cepat berdasarkan tenant_id, user_id, dan timestamp
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_tenant_id ON security_audit_logs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON security_audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_timestamp ON security_audit_logs (timestamp);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_action ON security_audit_logs (action);

-- Tabel untuk menyimpan log aktivitas
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
  type VARCHAR(50) NOT NULL, -- tenant_created, tenant_updated, etc.
  tenant_id TEXT,
  tenant_name VARCHAR(255),
  user_id TEXT,
  user_name VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  details VARCHAR(1000) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'info', -- info, warning, error, success
  metadata TEXT -- JSON string with additional metadata
);

-- Index untuk pencarian cepat berdasarkan timestamp, type, dan tenant_id
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs (timestamp);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs (type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant_id ON activity_logs (tenant_id);

-- Tabel untuk menyimpan informasi tenant subdomains (untuk menggantikan penyimpanan Redis untuk data tenant)
CREATE TABLE IF NOT EXISTS tenant_subdomains (
  id TEXT PRIMARY KEY NOT NULL,
  subdomain VARCHAR(255) NOT NULL UNIQUE,
  tenant_data TEXT NOT NULL, -- JSON string with tenant data
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index untuk pencarian cepat berdasarkan subdomain
CREATE INDEX IF NOT EXISTS idx_tenant_subdomains_subdomain ON tenant_subdomains (subdomain);

-- Tabel untuk menyimpan session (untuk menggantikan penyimpanan Redis untuk session)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  session_data TEXT, -- JSON string with session data
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index untuk pencarian cepat berdasarkan user_id dan tenant_id
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_tenant_id ON sessions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);

-- Tabel untuk menyimpan cache (untuk menggantikan penyimpanan Redis untuk cache)
CREATE TABLE IF NOT EXISTS cache (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL, -- JSON string with cached data
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index untuk pencarian cepat berdasarkan expires_at
CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON cache (expires_at);