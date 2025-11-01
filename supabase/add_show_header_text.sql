-- Add show_header_text column to invoice_branding_settings table
ALTER TABLE invoice_branding_settings 
ADD COLUMN IF NOT EXISTS show_header_text BOOLEAN DEFAULT TRUE;

-- Create index if needed
CREATE INDEX IF NOT EXISTS idx_invoice_branding_show_header_text ON invoice_branding_settings (show_header_text);
