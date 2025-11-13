-- Add tenant_videos table
CREATE TABLE IF NOT EXISTS "tenant_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" text NOT NULL,
	"youtube_url" text NOT NULL,
	"thumbnail" text,
	"description" text,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade
);

-- Add tenant_social_media table
CREATE TABLE IF NOT EXISTS "tenant_social_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"platform" text NOT NULL,
	"url" text NOT NULL,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade
);

-- Add tenant_photo_galleries table
CREATE TABLE IF NOT EXISTS "tenant_photo_galleries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"display_type" text NOT NULL DEFAULT 'grid',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade
);

-- Add tenant_gallery_photos table
CREATE TABLE IF NOT EXISTS "tenant_gallery_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gallery_id" uuid NOT NULL,
	"url" text NOT NULL,
	"caption" text,
	"alt" text NOT NULL,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	FOREIGN KEY ("gallery_id") REFERENCES "tenant_photo_galleries"("id") ON DELETE cascade
);

-- Create indexes for better query performance
CREATE INDEX "idx_tenant_videos_tenant_id" ON "tenant_videos"("tenant_id");
CREATE INDEX "idx_tenant_videos_display_order" ON "tenant_videos"("display_order");
CREATE INDEX "idx_tenant_social_media_tenant_id" ON "tenant_social_media"("tenant_id");
CREATE INDEX "idx_tenant_social_media_display_order" ON "tenant_social_media"("display_order");
CREATE INDEX "idx_tenant_photo_galleries_tenant_id" ON "tenant_photo_galleries"("tenant_id");
CREATE INDEX "idx_tenant_gallery_photos_gallery_id" ON "tenant_gallery_photos"("gallery_id");
CREATE INDEX "idx_tenant_gallery_photos_display_order" ON "tenant_gallery_photos"("display_order");
