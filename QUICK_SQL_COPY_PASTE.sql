-- ============================================================================
-- COPY ALL THIS AND PASTE INTO SUPABASE SQL EDITOR, THEN RUN
-- ============================================================================

-- TABLE 1: Sales Transaction Items (Multiple Services)
CREATE TABLE "sales_transaction_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sales_transaction_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"service_name" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" real NOT NULL,
	"total_price" real NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "sales_transaction_items" ADD CONSTRAINT "sales_transaction_items_sales_transaction_id_fk" 
	FOREIGN KEY ("sales_transaction_id") REFERENCES "public"."sales_transactions"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "sales_transaction_items" ADD CONSTRAINT "sales_transaction_items_service_id_fk" 
	FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;

-- TABLE 2: Sales Transaction Payments (Payment History)
CREATE TABLE "sales_transaction_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sales_transaction_id" uuid NOT NULL,
	"payment_amount" real NOT NULL,
	"payment_method" text NOT NULL,
	"payment_reference" text,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "sales_transaction_payments" ADD CONSTRAINT "sales_transaction_payments_sales_transaction_id_fk" 
	FOREIGN KEY ("sales_transaction_id") REFERENCES "public"."sales_transactions"("id") ON DELETE cascade ON UPDATE no action;

-- ADD COLUMNS to sales_transactions
ALTER TABLE "sales_transactions" ADD COLUMN "payment_amount" real DEFAULT 0 NOT NULL;
ALTER TABLE "sales_transactions" ADD COLUMN "invoice_id" uuid;

ALTER TABLE "sales_transactions" ADD CONSTRAINT "sales_transactions_invoice_id_fk" 
	FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;

-- INDEXES for Performance
CREATE INDEX "idx_sales_transaction_items_transaction_id" ON "sales_transaction_items"("sales_transaction_id");
CREATE INDEX "idx_sales_transaction_payments_transaction_id" ON "sales_transaction_payments"("sales_transaction_id");
CREATE INDEX "idx_sales_transactions_invoice_id" ON "sales_transactions"("invoice_id");

-- ============================================================================
-- TABLE 3: Booking Payments (Down Payment & Payment History)
-- ============================================================================

ALTER TABLE "bookings" ADD COLUMN "dp_amount" numeric DEFAULT 0;
ALTER TABLE "bookings" ADD COLUMN "paid_amount" numeric DEFAULT 0;
ALTER TABLE "bookings" ADD COLUMN "payment_method" text;
ALTER TABLE "bookings" ADD COLUMN "payment_reference" text;

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

CREATE INDEX "booking_payments_booking_id_idx" ON "booking_payments"("booking_id");
CREATE INDEX "booking_payments_tenant_id_idx" ON "booking_payments"("tenant_id");
CREATE INDEX "booking_payments_paid_at_idx" ON "booking_payments"("paid_at");

-- ============================================================================
-- DONE! All tables and columns created successfully.
-- Refresh your app and test the split payment features!
-- ============================================================================
