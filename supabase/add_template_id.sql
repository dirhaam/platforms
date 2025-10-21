-- Add template_id column to tenants table
-- This stores the landing page template preference for each tenant
-- Supported values: 'modern', 'classic', 'minimal', 'beauty', 'healthcare'

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS template_id TEXT DEFAULT 'modern';

-- Add comment to explain the column
COMMENT ON COLUMN tenants.template_id IS 'Landing page template preference: modern, classic, minimal, beauty, or healthcare';

-- Ensure all existing tenants default to 'modern' template
UPDATE tenants SET template_id = 'modern' WHERE template_id IS NULL;
