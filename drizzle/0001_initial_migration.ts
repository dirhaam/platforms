import { sql } from 'drizzle-orm';
import { pgTable, serial, text, varchar, integer, boolean, decimal, timestamp, json, pgEnum } from 'drizzle-orm/pg-core';

// Migration untuk membuat semua tabel
export async function up() {
  // Membuat enums terlebih dahulu
  await sql`
    CREATE TYPE subscription_plan AS ENUM ('basic', 'premium', 'enterprise');
    CREATE TYPE subscription_status AS ENUM ('active', 'suspended', 'cancelled');
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
    CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded');
    CREATE TYPE message_category AS ENUM ('reminder', 'confirmation', 'follow_up', 'marketing');
    CREATE TYPE role AS ENUM ('admin', 'staff');
    CREATE TYPE whatsapp_status AS ENUM ('connected', 'disconnected', 'connecting');
    CREATE TYPE message_delivery_status AS ENUM ('sent', 'delivered', 'read', 'failed');
    CREATE TYPE message_type AS ENUM ('text', 'image', 'file', 'voice', 'template');
    CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
    CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'credit_card', 'digital_wallet', 'other');
    CREATE TYPE conversation_status AS ENUM ('active', 'archived');
  `;

  // Membuat tabel tenants
  await sql`
    CREATE TABLE tenants (
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
      
      -- Brand colors as JSON
      brand_colors JSON,
      
      -- Feature flags
      whatsapp_enabled BOOLEAN DEFAULT false,
      home_visit_enabled BOOLEAN DEFAULT false,
      analytics_enabled BOOLEAN DEFAULT false,
      custom_templates_enabled BOOLEAN DEFAULT false,
      multi_staff_enabled BOOLEAN DEFAULT false,
      
      -- Subscription info
      subscription_plan subscription_plan DEFAULT 'basic',
      subscription_status subscription_status DEFAULT 'active',
      subscription_expires_at TIMESTAMP,
      
      -- Security fields for owner
      password_hash VARCHAR(255),
      last_login_at TIMESTAMP,
      login_attempts INTEGER DEFAULT 0,
      locked_until TIMESTAMP,
      password_reset_token VARCHAR(255),
      password_reset_expires TIMESTAMP,
      
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `;

  // Membuat tabel services
  await sql`
    CREATE TABLE services (
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
  `;

  // Membuat tabel customers
  await sql`
    CREATE TABLE customers (
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
  `;

  // Membuat tabel bookings
  await sql`
    CREATE TABLE bookings (
      id TEXT PRIMARY KEY NOT NULL,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      status booking_status DEFAULT 'pending',
      scheduled_at TIMESTAMP NOT NULL,
      duration INTEGER NOT NULL, -- minutes
      is_home_visit BOOLEAN DEFAULT false,
      home_visit_address VARCHAR(500),
      home_visit_coordinates JSON,
      notes VARCHAR(1000),
      total_amount DECIMAL(10, 2) NOT NULL,
      payment_status payment_status DEFAULT 'pending',
      reminders_sent TIMESTAMP[],
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `;

  // Membuat tabel staff
  await sql`
    CREATE TABLE staff (
      id TEXT PRIMARY KEY NOT NULL,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      role role DEFAULT 'staff',
      permissions TEXT[],
      is_active BOOLEAN DEFAULT true,
      
      -- Security fields
      password_hash VARCHAR(255),
      last_login_at TIMESTAMP,
      login_attempts INTEGER DEFAULT 0,
      locked_until TIMESTAMP,
      password_reset_token VARCHAR(255),
      password_reset_expires TIMESTAMP,
      
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `;

  // Membuat tabel whatsapp_devices
  await sql`
    CREATE TABLE whatsapp_devices (
      id TEXT PRIMARY KEY NOT NULL,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      device_name VARCHAR(255) NOT NULL,
      phone_number VARCHAR(50) NOT NULL,
      status whatsapp_status DEFAULT 'disconnected',
      last_seen TIMESTAMP,
      qr_code VARCHAR(1000),
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `;

  // Membuat tabel conversations
  await sql`
    CREATE TABLE conversations (
      id TEXT PRIMARY KEY NOT NULL,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      whatsapp_number VARCHAR(50) NOT NULL,
      last_message_at TIMESTAMP DEFAULT NOW() NOT NULL,
      unread_count INTEGER DEFAULT 0,
      assigned_to_id TEXT REFERENCES staff(id) ON DELETE SET NULL,
      status conversation_status DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `;

  // Membuat tabel messages
  await sql`
    CREATE TABLE messages (
      id TEXT PRIMARY KEY NOT NULL,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      type message_type DEFAULT 'text',
      content VARCHAR(1000) NOT NULL,
      media_url VARCHAR(500),
      is_from_customer BOOLEAN DEFAULT true,
      delivery_status message_delivery_status DEFAULT 'sent',
      sent_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `;

  // Membuat tabel message_templates
  await sql`
    CREATE TABLE message_templates (
      id TEXT PRIMARY KEY NOT NULL,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      content VARCHAR(1000) NOT NULL,
      variables TEXT[],
      category message_category DEFAULT 'reminder',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `;

  // Membuat tabel business_hours
  await sql`
    CREATE TABLE business_hours (
      id TEXT PRIMARY KEY NOT NULL,
      tenant_id TEXT NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
      schedule JSON NOT NULL,
      timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `;

  // Membuat tabel invoices
  await sql`
    CREATE TABLE invoices (
      id TEXT PRIMARY KEY NOT NULL,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      booking_id TEXT REFERENCES bookings(id) ON DELETE SET NULL,
      invoice_number VARCHAR(100) NOT NULL UNIQUE,
      status invoice_status DEFAULT 'draft',
      issue_date TIMESTAMP DEFAULT NOW() NOT NULL,
      due_date TIMESTAMP NOT NULL,
      paid_date TIMESTAMP,
      
      -- Financial details
      subtotal DECIMAL(10, 2) NOT NULL,
      tax_rate DECIMAL(5, 4) DEFAULT 0,
      tax_amount DECIMAL(10, 2) DEFAULT 0,
      discount_amount DECIMAL(10, 2) DEFAULT 0,
      total_amount DECIMAL(10, 2) NOT NULL,
      
      -- Payment details
      payment_method payment_method,
      payment_reference VARCHAR(250),
      
      -- Invoice content
      notes VARCHAR(1000),
      terms VARCHAR(1000),
      
      -- QR code for payment
      qr_code_data VARCHAR(500),
      qr_code_url VARCHAR(500),
      
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `;

  // Membuat tabel invoice_items
  await sql`
    CREATE TABLE invoice_items (
      id TEXT PRIMARY KEY NOT NULL,
      invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      description VARCHAR(500) NOT NULL,
      quantity INTEGER DEFAULT 1,
      unit_price DECIMAL(10, 2) NOT NULL,
      total_price DECIMAL(10, 2) NOT NULL,
      service_id TEXT REFERENCES services(id) ON DELETE SET NULL
    );
  `;

  // Membuat tabel service_areas
  await sql`
    CREATE TABLE service_areas (
      id TEXT PRIMARY KEY NOT NULL,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description VARCHAR(1000),
      is_active BOOLEAN DEFAULT true,
      
      -- Geographic boundaries as JSON
      boundaries JSON NOT NULL,
      
      -- Pricing and logistics
      base_travel_surcharge DECIMAL(10, 2) NOT NULL,
      per_km_surcharge DECIMAL(10, 2),
      max_travel_distance DECIMAL(8, 2) NOT NULL,
      estimated_travel_time INTEGER NOT NULL, -- base travel time in minutes
      
      -- Service availability
      available_services TEXT[], -- service IDs
      
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `;

  // Membuat tabel super_admins
  await sql`
    CREATE TABLE super_admins (
      id TEXT PRIMARY KEY NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      
      -- Security fields
      password_hash VARCHAR(255) NOT NULL,
      last_login_at TIMESTAMP,
      login_attempts INTEGER DEFAULT 0,
      locked_until TIMESTAMP,
      password_reset_token VARCHAR(255),
      password_reset_expires TIMESTAMP,
      
      -- Permissions and access
      permissions TEXT[] DEFAULT ARRAY['*']::TEXT[], -- Platform-wide permissions
      can_access_all_tenants BOOLEAN DEFAULT true,
      
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `;

  // Membuat tabel security_audit_logs
  await sql`
    CREATE TABLE security_audit_logs (
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
  `;

  // Membuat indeks untuk performa
  await sql`
    CREATE INDEX idx_conversations_tenant_timestamp ON conversations(tenant_id, timestamp);
    CREATE INDEX idx_security_audit_logs_user_timestamp ON security_audit_logs(user_id, timestamp);
    CREATE INDEX idx_security_audit_logs_action_timestamp ON security_audit_logs(action, timestamp);
  `;
}

export async function down() {
  // Menghapus tabel dalam urutan terbalik untuk menghindari constraint error
  await sql`DROP TABLE security_audit_logs;`;
  await sql`DROP TABLE super_admins;`;
  await sql`DROP TABLE service_areas;`;
  await sql`DROP TABLE invoice_items;`;
  await sql`DROP TABLE invoices;`;
  await sql`DROP TABLE business_hours;`;
  await sql`DROP TABLE message_templates;`;
  await sql`DROP TABLE messages;`;
  await sql`DROP TABLE conversations;`;
  await sql`DROP TABLE whatsapp_devices;`;
  await sql`DROP TABLE staff;`;
  await sql`DROP TABLE bookings;`;
  await sql`DROP TABLE customers;`;
  await sql`DROP TABLE services;`;
  await sql`DROP TABLE tenants;`;

  // Menghapus enums
  await sql`
    DROP TYPE conversation_status;
    DROP TYPE payment_method;
    DROP TYPE invoice_status;
    DROP TYPE message_type;
    DROP TYPE message_delivery_status;
    DROP TYPE whatsapp_status;
    DROP TYPE role;
    DROP TYPE message_category;
    DROP TYPE payment_status;
    DROP TYPE booking_status;
    DROP TYPE subscription_status;
    DROP TYPE subscription_plan;
  `;
}