-- Create subscription_history table for audit trail
CREATE TABLE IF NOT EXISTS "subscription_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"old_plan" text,
	"new_plan" text NOT NULL,
	"old_status" text,
	"new_status" text NOT NULL,
	"old_expires_at" timestamp with time zone,
	"new_expires_at" timestamp with time zone,
	"change_reason" text,
	"changed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS "idx_subscription_history_tenant_id" ON "subscription_history"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_subscription_history_created_at" ON "subscription_history"("created_at");
CREATE INDEX IF NOT EXISTS "idx_subscription_history_tenant_created" ON "subscription_history"("tenant_id", "created_at" DESC);
