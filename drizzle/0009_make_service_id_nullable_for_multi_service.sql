-- Make service_id nullable to support multi-service transactions
-- Multi-service transactions don't have a single service_id, they reference items through sales_transaction_items

-- First, update any NULL values to a valid UUID or handle them
-- Since we're allowing NULL for multi-service transactions, we can safely alter the constraint

ALTER TABLE "sales_transactions" 
ALTER COLUMN "service_id" DROP NOT NULL;

-- Update the foreign key constraint to allow NULL
ALTER TABLE "sales_transactions" 
DROP CONSTRAINT "sales_transactions_service_id_services_id_fk";

ALTER TABLE "sales_transactions" 
ADD CONSTRAINT "sales_transactions_service_id_services_id_fk" 
FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
