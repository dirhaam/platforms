-- Migration: Simplify Home Visit to Quota-Based (No Staff Assignment)
-- Date: 2024

-- Add new fields for simplified home visit quota system
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS daily_home_visit_quota INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS home_visit_time_slots JSONB DEFAULT '["09:00", "13:00", "16:00"]'::jsonb;

-- Comment for clarity
COMMENT ON COLUMN services.daily_home_visit_quota IS 'Maximum home visit bookings per day (quota-based, no staff)';
COMMENT ON COLUMN services.home_visit_time_slots IS 'Fixed time slots for home visit bookings, e.g. ["09:00", "13:00", "16:00"]';

-- Update existing home visit services to use quota
UPDATE services 
SET daily_home_visit_quota = COALESCE(daily_quota_per_staff, 3),
    home_visit_time_slots = '["09:00", "13:00", "16:00"]'::jsonb
WHERE service_type IN ('home_visit', 'both') 
  AND daily_home_visit_quota IS NULL;
