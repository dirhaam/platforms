-- Add latitude/longitude for business (homebase) location
ALTER TABLE invoice_branding_settings
ADD COLUMN IF NOT EXISTS business_latitude DOUBLE PRECISION;

ALTER TABLE invoice_branding_settings
ADD COLUMN IF NOT EXISTS business_longitude DOUBLE PRECISION;
