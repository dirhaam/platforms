-- Drop old tables that stored credentials (if they exist)
-- DROP TABLE IF EXISTS whatsapp_endpoints CASCADE;
-- DROP TABLE IF EXISTS whatsapp_configurations CASCADE;

-- NEW SECURE APPROACH: Store only endpoint name reference, not credentials

-- Tenant WhatsApp Configuration (secure - no credentials)
CREATE TABLE IF NOT EXISTS tenant_whatsapp_config (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Reference to endpoint name defined in ENV (e.g., "Primary", "Backup")
    endpoint_name TEXT NOT NULL,
    
    -- Configuration settings (no credentials)
    auto_reconnect BOOLEAN DEFAULT TRUE,
    reconnect_interval INTEGER DEFAULT 30, -- seconds
    health_check_interval INTEGER DEFAULT 60, -- seconds
    webhook_retries INTEGER DEFAULT 3,
    message_timeout INTEGER DEFAULT 30, -- seconds
    
    -- Metadata
    is_configured BOOLEAN DEFAULT FALSE, -- Set to true after superadmin assigns endpoint
    health_status TEXT DEFAULT 'unknown', -- healthy, unhealthy, unknown
    last_health_check TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tenant_whatsapp_config_tenant_id ON tenant_whatsapp_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_whatsapp_config_endpoint_name ON tenant_whatsapp_config(endpoint_name);
CREATE INDEX IF NOT EXISTS idx_tenant_whatsapp_config_health_status ON tenant_whatsapp_config(health_status);

-- WhatsApp Devices table (keep as is)
-- CREATE TABLE IF NOT EXISTS whatsapp_devices (
--     id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
--     tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
--     device_name TEXT NOT NULL,
--     phone_number TEXT NOT NULL,
--     status TEXT NOT NULL DEFAULT 'disconnected',
--     last_seen TIMESTAMP WITH TIME ZONE,
--     qr_code TEXT,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Migration note:
-- 1. Credentials (apiUrl, apiKey) are ONLY in ENV variables
-- 2. Database stores only endpoint_name reference
-- 3. Backend resolves endpoint_name to credentials from ENV
-- 4. Frontend never sees actual credentials
-- 5. Much more secure than storing passwords in database!
