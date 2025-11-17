-- Add cashier_name column to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cashier_name VARCHAR(255);

-- Add index for potential cashier filtering
CREATE INDEX IF NOT EXISTS idx_invoices_cashier_name ON invoices(tenant_id, cashier_name);
