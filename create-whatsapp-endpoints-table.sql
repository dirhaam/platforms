-- Create WhatsApp Endpoints table for persistent storage

CREATE TABLE IF NOT EXISTS whatsapp_endpoints (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    api_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    
    webhook_url TEXT NOT NULL,
    webhook_secret TEXT NOT NULL,
    
    is_active BOOLEAN DEFAULT TRUE,
    health_status TEXT DEFAULT 'unknown', -- healthy, unhealthy, unknown
    last_health_check TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_endpoints_tenant_id ON whatsapp_endpoints(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_endpoints_is_active ON whatsapp_endpoints(is_active);
CREATE INDEX IF NOT EXISTS idx_whatsapp_endpoints_health_status ON whatsapp_endpoints(health_status);

-- Create WhatsApp Configurations table for settings
CREATE TABLE IF NOT EXISTS whatsapp_configurations (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    
    auto_reconnect BOOLEAN DEFAULT TRUE,
    reconnect_interval INTEGER DEFAULT 30, -- seconds
    health_check_interval INTEGER DEFAULT 60, -- seconds
    webhook_retries INTEGER DEFAULT 3,
    message_timeout INTEGER DEFAULT 30, -- seconds
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_configurations_tenant_id ON whatsapp_configurations(tenant_id);
