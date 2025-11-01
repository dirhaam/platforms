-- Add show_business_name column to invoice_branding_settings table
ALTER TABLE invoice_branding_settings 
ADD COLUMN IF NOT EXISTS show_business_name BOOLEAN DEFAULT TRUE;

-- Create index if needed
CREATE INDEX IF NOT EXISTS idx_invoice_branding_show_business_name ON invoice_branding_settings (show_business_name);
