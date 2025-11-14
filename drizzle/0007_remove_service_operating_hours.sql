-- Drop operating_hours column from services table
-- Operating hours are now managed at tenant level via business_hours table
ALTER TABLE services DROP COLUMN IF EXISTS operating_hours;
