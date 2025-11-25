-- Create subscription_features table for feature mapping per plan
CREATE TABLE IF NOT EXISTS "subscription_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan" text NOT NULL,
	"feature_code" text NOT NULL,
	"feature_name" text NOT NULL,
	"is_included" boolean DEFAULT true NOT NULL,
	"feature_limit" integer,
	"limit_type" text,
	"priority" text DEFAULT 'standard',
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_features_plan_feature_unique" UNIQUE("plan", "feature_code")
);

CREATE INDEX IF NOT EXISTS "idx_subscription_features_plan" ON "subscription_features"("plan");
CREATE INDEX IF NOT EXISTS "idx_subscription_features_feature" ON "subscription_features"("feature_code");

-- Insert default features mapping
INSERT INTO "subscription_features" (plan, feature_code, feature_name, is_included, feature_limit, priority, description)
VALUES
	-- Basic Plan
	('basic', 'whatsapp', 'WhatsApp Integration', true, 100, 'standard', 'Basic WhatsApp messaging support'),
	('basic', 'home_visit', 'Home Visit', false, NULL, 'standard', 'Home visit feature not included'),
	('basic', 'analytics', 'Analytics', true, NULL, 'standard', 'Basic analytics dashboard'),
	('basic', 'custom_templates', 'Custom Templates', false, NULL, 'standard', 'Custom templates not included'),
	('basic', 'multi_staff', 'Multi Staff', true, 5, 'standard', 'Up to 5 staff members'),
	
	-- Premium Plan
	('premium', 'whatsapp', 'WhatsApp Integration', true, 500, 'priority', 'Priority WhatsApp support'),
	('premium', 'home_visit', 'Home Visit', true, NULL, 'priority', 'Full home visit feature'),
	('premium', 'analytics', 'Analytics', true, NULL, 'priority', 'Advanced analytics'),
	('premium', 'custom_templates', 'Custom Templates', true, 10, 'priority', 'Up to 10 custom templates'),
	('premium', 'multi_staff', 'Multi Staff', true, 25, 'priority', 'Up to 25 staff members'),
	
	-- Enterprise Plan
	('enterprise', 'whatsapp', 'WhatsApp Integration', true, NULL, 'priority', 'Unlimited WhatsApp with dedicated support'),
	('enterprise', 'home_visit', 'Home Visit', true, NULL, 'priority', 'Full home visit with optimization'),
	('enterprise', 'analytics', 'Analytics', true, NULL, 'priority', 'Enterprise analytics & reporting'),
	('enterprise', 'custom_templates', 'Custom Templates', true, NULL, 'priority', 'Unlimited custom templates'),
	('enterprise', 'multi_staff', 'Multi Staff', true, NULL, 'priority', 'Unlimited staff members')
ON CONFLICT DO NOTHING;
