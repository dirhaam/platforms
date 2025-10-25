-- Fix: Convert whatsapp_endpoints table to use UUID types matching tenants table

-- Drop the existing table if it exists (careful: this will delete data)
DROP TABLE IF EXISTS whatsapp_endpoints CASCADE;

-- Recreate with correct UUID types
CREATE TABLE whatsapp_endpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    api_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    
    webhook_url TEXT NOT NULL,
    webhook_secret TEXT NOT NULL,
    
    is_active BOOLEAN DEFAULT TRUE,
    health_status TEXT DEFAULT 'unknown',
    last_health_check TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_whatsapp_endpoints_tenant_id ON whatsapp_endpoints(tenant_id);
CREATE INDEX idx_whatsapp_endpoints_is_active ON whatsapp_endpoints(is_active);
CREATE INDEX idx_whatsapp_endpoints_health_status ON whatsapp_endpoints(health_status);

-- Also fix tenant_whatsapp_config if it exists
DROP TABLE IF EXISTS tenant_whatsapp_config CASCADE;

CREATE TABLE tenant_whatsapp_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    
    endpoint_name TEXT NOT NULL,
    
    auto_reconnect BOOLEAN DEFAULT TRUE,
    reconnect_interval INTEGER DEFAULT 30,
    health_check_interval INTEGER DEFAULT 60,
    webhook_retries INTEGER DEFAULT 3,
    message_timeout INTEGER DEFAULT 30,
    
    is_configured BOOLEAN DEFAULT FALSE,
    health_status TEXT DEFAULT 'unknown',
    last_health_check TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_tenant_whatsapp_config_tenant_id ON tenant_whatsapp_config(tenant_id);
CREATE INDEX idx_tenant_whatsapp_config_endpoint_name ON tenant_whatsapp_config(endpoint_name);
CREATE INDEX idx_tenant_whatsapp_config_health_status ON tenant_whatsapp_config(health_status);
