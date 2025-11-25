-- Contact Links feature
-- Table for storing individual links

CREATE TABLE IF NOT EXISTS contact_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT, -- icon name or emoji
  icon_type TEXT DEFAULT 'emoji', -- 'emoji', 'lucide', 'custom'
  background_color TEXT,
  text_color TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_contact_links_tenant_id ON contact_links(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contact_links_display_order ON contact_links(tenant_id, display_order);

-- Contact page settings
CREATE TABLE IF NOT EXISTS contact_page_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  page_title TEXT,
  page_description TEXT,
  profile_image TEXT,
  background_type TEXT DEFAULT 'solid', -- 'solid', 'gradient', 'image'
  background_value TEXT DEFAULT '#000000', -- hex color, gradient string, or image url
  button_style TEXT DEFAULT 'rounded', -- 'rounded', 'pill', 'square'
  button_shadow BOOLEAN DEFAULT true,
  font_family TEXT DEFAULT 'default',
  show_social_icons BOOLEAN DEFAULT true,
  show_logo BOOLEAN DEFAULT true,
  custom_css TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE contact_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_page_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for contact_links
CREATE POLICY "contact_links_tenant_isolation" ON contact_links
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "contact_links_public_read" ON contact_links
  FOR SELECT USING (is_active = true);

-- RLS policies for contact_page_settings
CREATE POLICY "contact_page_settings_tenant_isolation" ON contact_page_settings
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "contact_page_settings_public_read" ON contact_page_settings
  FOR SELECT USING (true);
