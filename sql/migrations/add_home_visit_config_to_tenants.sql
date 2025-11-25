-- Migration: Add home_visit_config to tenants table
-- This stores global home visit settings at tenant level

-- Add home_visit_config column to tenants
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS home_visit_config JSONB DEFAULT '{
  "enabled": true,
  "dailyQuota": 3,
  "timeSlots": ["09:00", "13:00", "16:00"],
  "requireAddress": true,
  "calculateTravelSurcharge": true
}'::jsonb;

-- Comment for clarity
COMMENT ON COLUMN tenants.home_visit_config IS 'Global home visit settings: enabled, dailyQuota, timeSlots, requireAddress, calculateTravelSurcharge';

-- Also add the service-level fields if they don't exist
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS daily_home_visit_quota INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS home_visit_time_slots JSONB DEFAULT '["09:00", "13:00", "16:00"]'::jsonb;
