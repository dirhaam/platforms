-- Create sales_transaction_items table for multiple services support
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

--> statement-breakpoint
-- Add constraints for sales_transaction_items
ALTER TABLE "sales_transaction_items" ADD CONSTRAINT "sales_transaction_items_sales_transaction_id_fk" 
	FOREIGN KEY ("sales_transaction_id") REFERENCES "public"."sales_transactions"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "sales_transaction_items" ADD CONSTRAINT "sales_transaction_items_service_id_fk" 
	FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
-- Add payment_amount field to sales_transactions for split payment tracking
ALTER TABLE "sales_transactions" ADD COLUMN "payment_amount" real DEFAULT 0 NOT NULL;

--> statement-breakpoint
-- Add invoice_id field to track generated invoices
ALTER TABLE "sales_transactions" ADD COLUMN "invoice_id" uuid;

--> statement-breakpoint
-- Add constraint for invoice relationship
ALTER TABLE "sales_transactions" ADD CONSTRAINT "sales_transactions_invoice_id_fk" 
	FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;

--> statement-breakpoint
-- Create sales_transaction_payments table for tracking multiple payments over time
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

--> statement-breakpoint
-- Add constraint for sales_transaction_payments
ALTER TABLE "sales_transaction_payments" ADD CONSTRAINT "sales_transaction_payments_sales_transaction_id_fk" 
	FOREIGN KEY ("sales_transaction_id") REFERENCES "public"."sales_transactions"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
-- Create indexes for better query performance
CREATE INDEX "idx_sales_transaction_items_transaction_id" ON "sales_transaction_items"("sales_transaction_id");
CREATE INDEX "idx_sales_transaction_payments_transaction_id" ON "sales_transaction_payments"("sales_transaction_id");
CREATE INDEX "idx_sales_transactions_invoice_id" ON "sales_transactions"("invoice_id");
