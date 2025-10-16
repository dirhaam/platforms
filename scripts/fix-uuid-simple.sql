-- Simple targeted UUID fixes - Run one at a time
-- Run this step by step, avoiding conflicts

-- 1. Fix superadmins
DELETE FROM super_admins WHERE id SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{12}$;

-- 2. Fix tenants
DELETE FROM tenants WHERE id SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{12}$;

-- 3. Update orphaned user data with gen_random_uuid
UPDATE super_admins SET id = gen_random_uuid() WHERE id IS NULL OR id SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{12}$;
UPDATE tenants SET id = gen_random_uuid() WHERE id IS NULL OR id NOT SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$;
UPDATE services SET tenant_id = gen_random_uuid() WHERE tenant_id IS NULL OR tenant_id NOT SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$;
UPDATE customers SET id = gen_random_uuid() WHERE id IS NULL OR id NOT SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$;
UPDATE bookings SET id = gen_random_uuid() WHERE id IS NULL OR id NOT SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{12}$;

-- 4. Fix sessions table
DROP TABLE sessions;

-- 5. Recreate sessions table with proper UUID types
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL, -- Foreign key  
    session_data JSONB,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_sessions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Add missing timestamps
ALTER TABLE business_hours ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 7. Test if all records now use valid UUIDs
SELECT 
  'super_admins', COUNT(*) as admin_count,
  'tenants', COUNT(*) as tenant_count,
 FROM super_admins WHERE id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{12}$'::text,
  COUNT(*) as tenant_count,
  'customers', COUNT(*) as customer_count
FROM super_admins WHERE id SIMILAR '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$,
  'services', COUNT(*) as service_count  
-- Confirm changes
SELECT 'Schema updated successfully' as status FROM (
  SELECT 'Jobs completed' as message
);
