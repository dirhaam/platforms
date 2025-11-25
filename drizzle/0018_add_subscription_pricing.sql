-- Create subscription_pricing table for plan pricing
CREATE TABLE IF NOT EXISTS "subscription_pricing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan" text NOT NULL,
	"currency" text DEFAULT 'IDR' NOT NULL,
	"monthly_price" numeric(12,2) NOT NULL,
	"annual_price" numeric(12,2),
	"description" text,
	"features_limit" jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_pricing_plan_currency_unique" UNIQUE("plan", "currency")
);

CREATE INDEX IF NOT EXISTS "idx_subscription_pricing_plan" ON "subscription_pricing"("plan");
CREATE INDEX IF NOT EXISTS "idx_subscription_pricing_status" ON "subscription_pricing"("status");

-- Insert default pricing (can be modified)
INSERT INTO "subscription_pricing" (plan, currency, monthly_price, annual_price, description, status)
VALUES 
	('basic', 'IDR', 199000, 2188000, 'Basic plan for small businesses', 'active'),
	('premium', 'IDR', 499000, 5488000, 'Premium plan with advanced features', 'active'),
	('enterprise', 'IDR', 999000, 10989000, 'Enterprise plan with full access', 'active')
ON CONFLICT DO NOTHING;
