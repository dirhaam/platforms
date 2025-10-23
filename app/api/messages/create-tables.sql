-- WhatsApp Conversations Table
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  phone VARCHAR(20) NOT NULL,
  customer_name VARCHAR(255),
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active', -- active, archived, inactive
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, phone)
);

-- WhatsApp Messages Table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'text', -- text, image, video, audio, file, document
  media_url TEXT,
  is_from_me BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'sent', -- sent, delivered, read, failed
  message_id VARCHAR(255), -- WhatsApp message ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp Message Templates Table
CREATE TABLE IF NOT EXISTS whatsapp_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  label VARCHAR(100),
  content TEXT NOT NULL,
  category VARCHAR(50), -- greeting, reminder, confirmation, follow_up, etc
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- Indexes for better query performance
CREATE INDEX idx_whatsapp_conversations_tenant ON whatsapp_conversations(tenant_id);
CREATE INDEX idx_whatsapp_conversations_customer ON whatsapp_conversations(customer_id);
CREATE INDEX idx_whatsapp_conversations_status ON whatsapp_conversations(status);
CREATE INDEX idx_whatsapp_messages_conversation ON whatsapp_messages(conversation_id);
CREATE INDEX idx_whatsapp_messages_tenant ON whatsapp_messages(tenant_id);
CREATE INDEX idx_whatsapp_messages_created_at ON whatsapp_messages(created_at);
CREATE INDEX idx_whatsapp_message_templates_tenant ON whatsapp_message_templates(tenant_id);

-- Enable RLS (Row Level Security)
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_message_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whatsapp_conversations
CREATE POLICY "Tenant can view own conversations" ON whatsapp_conversations
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Tenant can insert own conversations" ON whatsapp_conversations
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Tenant can update own conversations" ON whatsapp_conversations
  FOR UPDATE USING (tenant_id = auth.uid());

-- RLS Policies for whatsapp_messages
CREATE POLICY "Tenant can view own messages" ON whatsapp_messages
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Tenant can insert own messages" ON whatsapp_messages
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Tenant can update own messages" ON whatsapp_messages
  FOR UPDATE USING (tenant_id = auth.uid());

-- RLS Policies for whatsapp_message_templates
CREATE POLICY "Tenant can view own templates" ON whatsapp_message_templates
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Tenant can manage own templates" ON whatsapp_message_templates
  FOR ALL USING (tenant_id = auth.uid());
