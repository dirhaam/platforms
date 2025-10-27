-- Add missing pricing fields to sales_transactions table
ALTER TABLE "sales_transactions" ADD COLUMN "transaction_number" text;
ALTER TABLE "sales_transactions" ADD COLUMN "unit_price" real DEFAULT 0 NOT NULL;
ALTER TABLE "sales_transactions" ADD COLUMN "home_visit_surcharge" real DEFAULT 0;
ALTER TABLE "sales_transactions" ADD COLUMN "subtotal" real DEFAULT 0 NOT NULL;
ALTER TABLE "sales_transactions" ADD COLUMN "tax_rate" real DEFAULT 0 NOT NULL;
ALTER TABLE "sales_transactions" ADD COLUMN "tax_amount" real DEFAULT 0 NOT NULL;
ALTER TABLE "sales_transactions" ADD COLUMN "discount_amount" real DEFAULT 0 NOT NULL;
ALTER TABLE "sales_transactions" ADD COLUMN "payment_status" text DEFAULT 'pending' NOT NULL;
ALTER TABLE "sales_transactions" ADD COLUMN "paid_amount" real DEFAULT 0 NOT NULL;
ALTER TABLE "sales_transactions" ADD COLUMN "payment_reference" text;
ALTER TABLE "sales_transactions" ADD COLUMN "paid_at" timestamp with time zone;
ALTER TABLE "sales_transactions" ADD COLUMN "staff_id" uuid;
ALTER TABLE "sales_transactions" ADD COLUMN "scheduled_at" timestamp with time zone;
ALTER TABLE "sales_transactions" ADD COLUMN "completed_at" timestamp with time zone;
ALTER TABLE "sales_transactions" ADD COLUMN "home_visit_coordinates" jsonb;
