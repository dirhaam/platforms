-- Add Down Payment (DP) support to bookings
-- Track down payment and remaining balance for bookings

-- Add DP-related columns to bookings table
ALTER TABLE "bookings" ADD COLUMN "dp_amount" numeric DEFAULT 0;
ALTER TABLE "bookings" ADD COLUMN "paid_amount" numeric DEFAULT 0;
ALTER TABLE "bookings" ADD COLUMN "payment_method" text;
ALTER TABLE "bookings" ADD COLUMN "payment_reference" text;

-- Create booking_payments table to track payment history
CREATE TABLE "booking_payments" (
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

-- Create indexes for performance
CREATE INDEX "booking_payments_booking_id_idx" ON "booking_payments"("booking_id");
CREATE INDEX "booking_payments_tenant_id_idx" ON "booking_payments"("tenant_id");
CREATE INDEX "booking_payments_paid_at_idx" ON "booking_payments"("paid_at");
