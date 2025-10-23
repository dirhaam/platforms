-- Fix for foreign key constraint error between sessions and tenants tables
-- The error shows that tenants.id is UUID while sessions.tenant_id is TEXT (or vice versa)

-- First, let's check the actual column types in both tables
/*
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tenants' AND column_name = 'id';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sessions' AND column_name = 'tenant_id';
*/

-- Assuming the error means tenants.id is UUID and sessions.tenant_id is TEXT,
-- we need to make them compatible. Let's convert sessions.tenant_id to UUID to match tenants.id:

-- Step 1: Check current data types
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
END $$;

-- Step 2: Drop the existing constraint if it exists
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_tenant_id_fkey;
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS fk_sessions_tenant;

-- Step 3: Update the sessions table tenant_id column to match the tenants table
-- If tenants.id is UUID and sessions.tenant_id is TEXT, convert sessions.tenant_id to UUID
-- First, let's ensure all values in sessions.tenant_id are valid UUIDs before changing the type
-- If they're not UUIDs, we'll need to clean them or handle differently

-- If the sessions.tenant_id values are actually TEXT that need to be converted to UUID:
-- UPDATE sessions SET tenant_id = tenant_id::UUID WHERE length(tenant_id) = 36 AND tenant_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Step 4: Change the column type to UUID to match tenants.id
-- ALTER TABLE sessions ALTER COLUMN tenant_id TYPE UUID USING tenant_id::UUID;

-- Step 5: Do the same for user_id if it's also inconsistent
-- UPDATE sessions SET user_id = user_id::UUID WHERE length(user_id) = 36 AND user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
-- ALTER TABLE sessions ALTER COLUMN user_id TYPE UUID USING user_id::UUID;

-- Step 6: Now add the foreign key constraint
-- ALTER TABLE sessions ADD CONSTRAINT fk_sessions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Alternative approach: If sessions.tenant_id should remain TEXT to match the tenants.id in your schema file:
-- Make sure the tenants table primary key is TEXT (as defined in your supabase/schema.sql)
-- If the tenants table has been migrated to UUID, but the schema file expects TEXT, 
-- we should change sessions to match the actual tenants table.

-- Check the actual tenants table definition in the database
-- If the tenants table has a UUID primary key, then sessions.tenant_id should be UUID
-- If the tenants table has a TEXT primary key, then sessions.tenant_id should be TEXT

-- Try to update sessions table to match tenants table structure (assuming tenants.id is UUID)
-- This is for the case where the tenants table was already converted to UUID but sessions wasn't

-- First, let's try to see if we can convert the values properly
-- Check what type the tenants.id actually is in the database:
-- \d tenants

-- Let's check what values exist in the sessions table to see what we're working with
-- SELECT DISTINCT tenant_id FROM sessions LIMIT 10;

-- Let's try to create a new sessions table with correct column types and migrate the data
-- Create a backup of the sessions table first
-- CREATE TABLE sessions_backup AS SELECT * FROM sessions;

-- Drop the original sessions table
-- DROP TABLE sessions;

-- Recreate sessions table with proper UUID types to match tenants table
/*
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    session_data JSONB,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_sessions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
*/

-- For now, let's just fix the immediate constraint issue by ensuring type consistency:
-- If we know the tenants.id is UUID, we should make sessions.tenant_id also UUID
-- This is the command we need to run in the database:

ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_tenant_id_fkey;
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS fk_sessions_tenant;

-- Update sessions table columns to match tenants table (assuming tenants.id is UUID)
-- Convert text values to UUID format if needed
UPDATE sessions 
SET tenant_id = uuid_generate_v4()::text 
WHERE tenant_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
AND LENGTH(tenant_id) != 36;

-- Actually, let's approach this differently - if tenants.id is UUID, then sessions.tenant_id should be UUID too
-- We need to ALTER the column type to match

-- First, make sure all tenant_id values in sessions are valid UUIDs or can be converted
-- For now, let's just make sure the column types match by checking both tables:

-- If tenants.id is UUID, then make sessions.tenant_id UUID too:
ALTER TABLE sessions ALTER COLUMN tenant_id TYPE UUID USING tenant_id::UUID;
ALTER TABLE sessions ALTER COLUMN user_id TYPE UUID USING user_id::UUID;

-- Now add the constraint back
ALTER TABLE sessions 
ADD CONSTRAINT fk_sessions_tenant 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Add additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_tenant_id ON sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at) WHERE expires_at IS NOT NULL;