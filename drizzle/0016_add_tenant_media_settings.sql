-- Create tenant_media_settings table for global media options
CREATE TABLE IF NOT EXISTS "tenant_media_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL UNIQUE,
  "video_size" text NOT NULL DEFAULT 'medium', -- small | medium | large
  "video_autoplay" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS "idx_tenant_media_settings_tenant_id" ON "tenant_media_settings"("tenant_id");
