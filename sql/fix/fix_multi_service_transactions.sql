-- Fix for multi-service transaction creation
-- Make service_id nullable to support transactions with multiple services
-- These transactions reference services through sales_transaction_items instead

-- Drop existing NOT NULL constraint by altering the column
ALTER TABLE "public"."sales_transactions" 
ALTER COLUMN "service_id" DROP NOT NULL;

-- Drop and recreate the foreign key to allow NULL values
ALTER TABLE "public"."sales_transactions" 
DROP CONSTRAINT "sales_transactions_service_id_services_id_fk";

ALTER TABLE "public"."sales_transactions" 
ADD CONSTRAINT "sales_transactions_service_id_services_id_fk" 
FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;

-- Verify the change
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'sales_transactions' AND column_name = 'service_id';
