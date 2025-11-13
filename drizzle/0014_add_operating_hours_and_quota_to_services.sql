-- Add operating hours and quota fields to services table
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS operating_hours JSONB,
ADD COLUMN IF NOT EXISTS slot_duration_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS hourly_quota INTEGER DEFAULT 10;

-- Set defaults for existing services
UPDATE services 
SET 
  operating_hours = '{"startTime":"08:00","endTime":"17:00"}',
  slot_duration_minutes = 30,
  hourly_quota = 10
WHERE operating_hours IS NULL;
