-- Add columns untuk menyimpan tax percentage, service charge, dan additional fees breakdown di sales transactions
ALTER TABLE sales_transactions 
ADD COLUMN IF NOT EXISTS tax_percentage REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS service_charge_amount REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS additional_fees_amount REAL DEFAULT 0;

-- Verify the columns
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'sales_transactions' AND column_name IN ('tax_percentage', 'service_charge_amount', 'additional_fees_amount');
