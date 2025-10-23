-- Add phone column to super_admins table
ALTER TABLE super_admins 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update the SuperAdmin interface and service to handle the phone field