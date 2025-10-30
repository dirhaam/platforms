-- Add paid_amount column to invoices table for tracking partial payments
ALTER TABLE "invoices" ADD COLUMN "paid_amount" real DEFAULT 0 NOT NULL;

-- Add index for quick lookups
CREATE INDEX "idx_invoices_paid_amount" ON "invoices"("paid_amount");
