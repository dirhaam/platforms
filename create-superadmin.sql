-- SQL script to create a superadmin user with password 'Dirham123!!!'
-- This script creates a superadmin account with full access to all tenants

-- Insert a superadmin user with properly hashed password
INSERT INTO super_admins (
    email,
    name,
    password_hash,
    is_active,
    can_access_all_tenants,
    permissions
) VALUES (
    'superadmin@booqing.com',
    'Super Admin',
    -- This is the bcrypt hash for 'Dirham123!!!' with cost factor 10
    '$2b$10$fbKjIwmPUcCib1EKkzprZevNF7XAlSWKsEdPrFR/ely3HtKgvhapa',
    true,
    true,
    '["read", "write", "delete", "administer", "manage_tenants", "manage_users", "view_reports"]'
);

-- Optional: You can also create an alternative superadmin with a different email
-- INSERT INTO super_admins (
--     email,
--     name,
--     password_hash,
--     is_active,
--     can_access_all_tenants,
--     permissions
-- ) VALUES (
--     'admin@booqing.com',
--     'Main Administrator',
--     -- Bcrypt hash for 'Dirham123!!!'
--     '$2b$10$fbKjIwmPUcCib1EKkzprZevNF7XAlSWKsEdPrFR/ely3HtKgvhapa',
--     true,
--     true,
--     '["read", "write", "delete", "administer", "manage_tenants", "manage_users", "view_reports"]'
-- );

-- Verify the superadmin was created successfully
SELECT 
    id,
    email,
    name,
    is_active,
    can_access_all_tenants,
    permissions,
    created_at
FROM super_admins 
WHERE email = 'superadmin@booqing.com';