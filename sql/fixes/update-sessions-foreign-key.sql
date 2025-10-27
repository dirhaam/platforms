-- Updated script to fix foreign key constraint between sessions and tenants tables
-- This version handles various possible scenarios for type conversion

-- First, determine the actual column types in your database
SELECT 
    'tenants' as table_name,
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'tenants' AND column_name = 'id'
UNION
SELECT 
    'sessions' as table_name,
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'sessions' AND column_name = 'tenant_id';

-- Scenario 1: If tenants.id is UUID and sessions.tenant_id is TEXT
-- We need to convert sessions.tenant_id from TEXT to UUID
DO $$
DECLARE
    tenants_id_type TEXT;
    sessions_tenant_id_type TEXT;
BEGIN
    SELECT data_type INTO tenants_id_type
    FROM information_schema.columns 
    WHERE table_name = 'tenants' AND column_name = 'id';
    
    SELECT data_type INTO sessions_tenant_id_type
    FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'tenant_id';
    
    RAISE NOTICE 'tenants.id type: %, sessions.tenant_id type: %', tenants_id_type, sessions_tenant_id_type;
    
    -- If tenants.id is UUID and sessions.tenant_id is text, convert sessions.tenant_id
    IF tenants_id_type = 'uuid' AND sessions_tenant_id_type = 'text' THEN
        RAISE NOTICE 'Converting sessions.tenant_id from text to uuid...';
        
        -- Drop existing foreign key constraint
        ALTER TABLE sessions DROP CONSTRAINT IF EXISTS fk_sessions_tenant;
        
        -- Convert the tenant_id column from text to uuid
        ALTER TABLE sessions 
        ALTER COLUMN tenant_id TYPE UUID 
        USING CASE 
            WHEN tenant_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
            THEN tenant_id::UUID 
            ELSE NULL 
        END;
        
        -- If there are any NULL values after conversion, that means invalid UUIDs were found
        -- In that case, we might need to handle those separately or use a default UUID
        
        -- Handle user_id similarly if needed
        ALTER TABLE sessions 
        ALTER COLUMN user_id TYPE UUID 
        USING CASE 
            WHEN user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
            THEN user_id::UUID 
            ELSE NULL 
        END;
        
        -- Add the foreign key constraint back
        ALTER TABLE sessions 
        ADD CONSTRAINT fk_sessions_tenant 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Successfully converted sessions.tenant_id to uuid and added foreign key constraint.';
    END IF;
    
    -- Scenario 2: If tenants.id is TEXT and sessions.tenant_id is UUID
    -- We need to convert sessions.tenant_id from UUID to TEXT
    IF tenants_id_type = 'text' AND sessions_tenant_id_type = 'uuid' THEN
        RAISE NOTICE 'Converting sessions.tenant_id from uuid to text...';
        
        -- Drop existing foreign key constraint
        ALTER TABLE sessions DROP CONSTRAINT IF EXISTS fk_sessions_tenant;
        
        -- Convert the tenant_id column from uuid to text
        ALTER TABLE sessions 
        ALTER COLUMN tenant_id TYPE TEXT 
        USING tenant_id::TEXT;
        
        -- Handle user_id similarly if needed
        ALTER TABLE sessions 
        ALTER COLUMN user_id TYPE TEXT 
        USING user_id::TEXT;
        
        -- Add the foreign key constraint back
        ALTER TABLE sessions 
        ADD CONSTRAINT fk_sessions_tenant 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Successfully converted sessions.tenant_id to text and added foreign key constraint.';
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_tenant_id ON sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at) WHERE expires_at IS NOT NULL;

-- Verify the constraint was created
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    confrelid::regclass AS referenced_table,
    conrelid::regclass AS referencing_table
FROM pg_constraint
WHERE conrelid = 'sessions'::regclass
AND contype = 'f'
AND conname = 'fk_sessions_tenant';

SELECT 'Schema fix completed!' AS status;