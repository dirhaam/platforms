-- Enable Row Level Security (RLS) on all public tables
-- This prevents unauthorized direct database access via PostgREST

-- 1. Enable RLS on invoice-related tables
ALTER TABLE invoice_branding_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_travel_surcharge_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_tax_service_charge ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_additional_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on sales transaction tables
ALTER TABLE sales_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_transaction_payments ENABLE ROW LEVEL SECURITY;

-- 3. Enable RLS on booking-related tables
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_payments ENABLE ROW LEVEL SECURITY;

-- 4. Enable RLS on core business tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- 5. Enable RLS on scheduling tables
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE blackout_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;

-- 6. Enable RLS on messaging tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- 7. Enable RLS on WhatsApp integration tables
ALTER TABLE whatsapp_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_whatsapp_config ENABLE ROW LEVEL SECURITY;

-- 8. Enable RLS on media/gallery tables
ALTER TABLE tenant_photo_galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_media_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_videos ENABLE ROW LEVEL SECURITY;

-- 9. Enable RLS on settings tables
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_social_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subdomains ENABLE ROW LEVEL SECURITY;

-- 10. Enable RLS on session/audit tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 11. Enable RLS on cache table
ALTER TABLE cache ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES (Tenant-based isolation)
-- ============================================================================
-- These policies ensure users can only access data for their tenant

-- Helper function to get current tenant_id from session context
-- IMPORTANT: Application must set app.current_tenant_id before querying
CREATE OR REPLACE FUNCTION get_current_tenant_id() RETURNS TEXT AS $$
  SELECT current_setting('app.current_tenant_id', true);
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- INVOICE TABLES POLICIES
-- ============================================================================

-- invoices: Only access records for current tenant
CREATE POLICY "invoices_tenant_isolation" ON invoices
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "invoices_insert_policy" ON invoices
  WITH CHECK (tenant_id = get_current_tenant_id());

-- invoice_items: Access through invoice tenant
CREATE POLICY "invoice_items_tenant_isolation" ON invoice_items
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE tenant_id = get_current_tenant_id()
    )
  );

-- invoice_branding_settings: Tenant-specific settings
CREATE POLICY "invoice_branding_settings_isolation" ON invoice_branding_settings
  USING (tenant_id = get_current_tenant_id());

-- invoice_tax_service_charge: Tenant-specific settings
CREATE POLICY "invoice_tax_service_charge_isolation" ON invoice_tax_service_charge
  USING (tenant_id = get_current_tenant_id());

-- invoice_travel_surcharge_settings: Tenant-specific settings
CREATE POLICY "invoice_travel_surcharge_settings_isolation" ON invoice_travel_surcharge_settings
  USING (tenant_id = get_current_tenant_id());

-- invoice_additional_fees: Tenant-specific settings
CREATE POLICY "invoice_additional_fees_isolation" ON invoice_additional_fees
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- SALES TRANSACTION POLICIES
-- ============================================================================

CREATE POLICY "sales_transactions_tenant_isolation" ON sales_transactions
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "sales_transaction_items_isolation" ON sales_transaction_items
  USING (
    transaction_id IN (
      SELECT id FROM sales_transactions WHERE tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY "sales_transaction_payments_isolation" ON sales_transaction_payments
  USING (
    transaction_id IN (
      SELECT id FROM sales_transactions WHERE tenant_id = get_current_tenant_id()
    )
  );

-- ============================================================================
-- BOOKING POLICIES
-- ============================================================================

CREATE POLICY "bookings_tenant_isolation" ON bookings
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "booking_payments_isolation" ON booking_payments
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE tenant_id = get_current_tenant_id()
    )
  );

-- ============================================================================
-- CORE BUSINESS POLICIES
-- ============================================================================

CREATE POLICY "tenants_own_data" ON tenants
  USING (id::text = get_current_tenant_id());

CREATE POLICY "services_tenant_isolation" ON services
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "customers_tenant_isolation" ON customers
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "staff_tenant_isolation" ON staff
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- SCHEDULING POLICIES
-- ============================================================================

CREATE POLICY "business_hours_tenant_isolation" ON business_hours
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "blackout_dates_tenant_isolation" ON blackout_dates
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "blocked_dates_tenant_isolation" ON blocked_dates
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- MESSAGING POLICIES
-- ============================================================================

CREATE POLICY "conversations_tenant_isolation" ON conversations
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "messages_isolation" ON messages
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY "message_templates_tenant_isolation" ON message_templates
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- WHATSAPP POLICIES
-- ============================================================================

CREATE POLICY "whatsapp_endpoints_tenant_isolation" ON whatsapp_endpoints
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "whatsapp_devices_tenant_isolation" ON whatsapp_devices
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "tenant_whatsapp_config_isolation" ON tenant_whatsapp_config
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- MEDIA/GALLERY POLICIES
-- ============================================================================

CREATE POLICY "tenant_photo_galleries_isolation" ON tenant_photo_galleries
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "tenant_gallery_photos_isolation" ON tenant_gallery_photos
  USING (
    gallery_id IN (
      SELECT id FROM tenant_photo_galleries WHERE tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY "tenant_media_settings_isolation" ON tenant_media_settings
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "tenant_videos_isolation" ON tenant_videos
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- SETTINGS POLICIES
-- ============================================================================

CREATE POLICY "service_areas_tenant_isolation" ON service_areas
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "tenant_social_media_isolation" ON tenant_social_media
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "tenant_subdomains_isolation" ON tenant_subdomains
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- SESSION/AUDIT POLICIES
-- ============================================================================

CREATE POLICY "sessions_user_isolation" ON sessions
  USING (user_id = auth.uid());

CREATE POLICY "security_audit_logs_tenant_isolation" ON security_audit_logs
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "activity_logs_tenant_isolation" ON activity_logs
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- CACHE POLICIES (Allow public read, but control by tenant context)
-- ============================================================================

CREATE POLICY "cache_allow_read" ON cache
  FOR SELECT USING (true);

CREATE POLICY "cache_restrict_write" ON cache
  FOR INSERT WITH CHECK (
    -- Only allow cache writes from service role
    current_setting('role', true) = 'service_role'
  );
