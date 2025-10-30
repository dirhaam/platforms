-- Verify and fix invoice schema for payment tracking

-- 1. Check if paid_amount column exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'invoices' AND column_name = 'paid_amount'
) as paid_amount_exists;

-- 2. Add paid_amount column if missing
-- This is safe to run multiple times - it will only add if missing
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "paid_amount" real DEFAULT 0 NOT NULL;

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS "idx_invoices_paid_amount" ON "invoices"("paid_amount");

-- 4. Verify the column now exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'invoices' AND column_name = 'paid_amount';

-- 5. Optional: Update invoices that have payment history but paid_amount is 0
-- This will calculate paid_amount from sales_transaction_payments if invoice is from a transaction
-- (You can run this separately if needed)
