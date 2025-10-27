-- Corrected script to fix foreign key constraint error between sessions and tenants tables

-- First, let's check the actual data types in both tables
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tenants' AND column_name = 'id';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sessions' AND column_name = 'tenant_id';

-- Let's also see sample data to understand what we're working with
SELECT id FROM tenants LIMIT 3;
SELECT tenant_id FROM sessions LIMIT 3;

-- Step 1: Drop existing constraints
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_tenant_id_fkey;
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS fk_sessions_tenant;

-- Step 2: If we need to convert between UUID and TEXT, let's handle it properly
-- Check if the current sessions.tenant_id data is TEXT that needs to be converted to UUID
-- First, let's identify what type of values we have in sessions.tenant_id

-- If sessions.tenant_id is TEXT and needs to be converted to UUID:
-- Convert TEXT tenant_id values to UUID format (assuming they are valid UUID strings)
-- For PostgreSQL, you can cast text to UUID directly if they are valid UUID formats

-- Example of how to convert:
-- UPDATE sessions SET tenant_id = tenant_id::UUID 
-- WHERE tenant_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Step 3: Actually convert the column type to match tenants table
-- First, let's safely update any potentially problematic values in sessions table
-- Make sure all tenant_id values are valid UUIDs in string format before casting

-- If tenants.id is UUID, then convert sessions.tenant_id to UUID
-- We'll do this by casting from TEXT to UUID
ALTER TABLE sessions 
ALTER COLUMN tenant_id TYPE UUID 
USING CASE 
    WHEN tenant_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
    THEN tenant_id::UUID 
    ELSE uuid_generate_v4() 
END;

-- Similarly convert user_id if needed
ALTER TABLE sessions 
ALTER COLUMN user_id TYPE UUID 
USING CASE 
    WHEN user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
    THEN user_id::UUID 
    ELSE uuid_generate_v4() 
END;

-- Step 4: Now add the foreign key constraint back
ALTER TABLE sessions 
ADD CONSTRAINT fk_sessions_tenant 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Step 5: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_sessions_tenant_id ON sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at) WHERE expires_at IS NOT NULL;

-- Verification: Check that the foreign key constraint was created successfully
SELECT conname, contype, confrelid::regclass, conrelid::regclass
FROM pg_constraint
WHERE conrelid = 'sessions'::regclass
AND contype = 'f';

SELECT 'Foreign key constraint successfully created!' as status;