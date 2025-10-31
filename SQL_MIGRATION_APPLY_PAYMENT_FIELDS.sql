-- Run this SQL in Supabase SQL Editor to add payment fields to bookings
-- Copy and paste all of this into the Supabase SQL editor and execute

-- Step 1: Add payment columns to bookings table if they don't exist
ALTER TABLE "bookings" 
ADD COLUMN IF NOT EXISTS "dp_amount" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "paid_amount" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "payment_method" text,
ADD COLUMN IF NOT EXISTS "payment_reference" text;

-- Step 2: Create booking_payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS "booking_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"payment_amount" numeric NOT NULL,
	"payment_method" text NOT NULL,
	"payment_reference" text,
	"notes" text,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booking_payments_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS "booking_payments_booking_id_idx" ON "booking_payments"("booking_id");
CREATE INDEX IF NOT EXISTS "booking_payments_tenant_id_idx" ON "booking_payments"("tenant_id");
CREATE INDEX IF NOT EXISTS "booking_payments_paid_at_idx" ON "booking_payments"("paid_at");

-- Verify: Check if columns were added
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('dp_amount', 'paid_amount', 'payment_method', 'payment_reference');

-- Verify: Check if booking_payments table exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'booking_payments'
) as table_exists;
