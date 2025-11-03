-- Add business_address column to invoice_branding_settings
ALTER TABLE invoice_branding_settings
ADD COLUMN IF NOT EXISTS business_address TEXT;
