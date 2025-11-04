-- Create invoice_travel_surcharge_settings table
CREATE TABLE IF NOT EXISTS invoice_travel_surcharge_settings (
  tenant_id UUID NOT NULL PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  base_travel_surcharge DECIMAL(12, 2) DEFAULT 0,
  per_km_surcharge DECIMAL(12, 2) DEFAULT 5000,
  min_travel_distance DECIMAL(10, 2),
  max_travel_distance DECIMAL(10, 2),
  travel_surcharge_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_invoice_travel_surcharge_tenant_id 
ON invoice_travel_surcharge_settings(tenant_id);

-- Add comment to table
COMMENT ON TABLE invoice_travel_surcharge_settings IS 'Travel surcharge settings for home visit bookings - configured per tenant in Invoice Settings';
COMMENT ON COLUMN invoice_travel_surcharge_settings.base_travel_surcharge IS 'Base surcharge amount in Rp applied to all home visits';
COMMENT ON COLUMN invoice_travel_surcharge_settings.per_km_surcharge IS 'Per kilometer surcharge rate in Rp/km';
COMMENT ON COLUMN invoice_travel_surcharge_settings.min_travel_distance IS 'Minimum travel distance in km before surcharge applies (optional)';
COMMENT ON COLUMN invoice_travel_surcharge_settings.max_travel_distance IS 'Maximum allowed travel distance in km (optional)';
COMMENT ON COLUMN invoice_travel_surcharge_settings.travel_surcharge_required IS 'Whether travel surcharge is automatically applied';
