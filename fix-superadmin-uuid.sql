-- Fix superadmin UUID and ensure proper authentication
-- Run this SQL manually in Supabase SQL Editor

-- 1. Delete the problematic superadmin record
DELETE FROM super_admins WHERE id = 'sa_94ba830505f44f3e9f67234d23a485e0';

-- 2. Check if superadmin already exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM super_admins WHERE email = 'superadmin@booqing.my.id') THEN
        -- Update existing record
        UPDATE super_admins 
        SET password_hash = '$2b$10$yxLNNmJqQEVW6mRcC8uQLulNK/smTVEe4TDm5IT.EqUd13bq4CVRS',
            updated_at = NOW()
        WHERE email = 'superadmin@booqing.my.id';
    ELSE
        -- Insert new record
        INSERT INTO super_admins (
          id, 
          email, 
          name, 
          is_active, 
          password_hash, 
          last_login_at, 
          login_attempts, 
          locked_until, 
          password_reset_token, 
          password_reset_expires, 
          permissions, 
          can_access_all_tenants, 
          created_at, 
          updated_at
        ) VALUES (
          gen_random_uuid(),  -- Generate proper UUID
          'superadmin@booqing.my.id',
          'Super Admin',
          true,
          '$2b$10$yxLNNmJqQEVW6mRcC8uQLulNK/smTVEe4TDm5IT.EqUd13bq4CVRS',
          NULL,
          0,
          NULL,
          NULL,
          NULL,
          '["*"]',
          true,
          NOW(),
          NOW()
        );
    END IF;
END $$;

-- 3. Verify superadmin record
SELECT id, email, name, is_active FROM super_admins WHERE email = 'superadmin@booqing.my.id';
