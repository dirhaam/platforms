-- Fix for multi-service transactions - make nullable fields for multi-service support
-- These fields should be nullable when transaction contains multiple services

-- Make service_name nullable
ALTER TABLE "public"."sales_transactions" 
ALTER COLUMN "service_name" DROP NOT NULL;

-- Make duration nullable
ALTER TABLE "public"."sales_transactions" 
ALTER COLUMN "duration" DROP NOT NULL;

-- Make unit_price nullable  
ALTER TABLE "public"."sales_transactions" 
ALTER COLUMN "unit_price" DROP NOT NULL;

-- Verify the changes
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'sales_transactions' 
AND column_name IN ('service_id', 'service_name', 'duration', 'unit_price')
ORDER BY column_name;
