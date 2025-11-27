-- Add home_visit_config column to staff table
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS home_visit_config JSONB DEFAULT NULL;

-- Add break_start and break_end columns to staff_schedule table
ALTER TABLE staff_schedule 
ADD COLUMN IF NOT EXISTS break_start TEXT DEFAULT NULL;

ALTER TABLE staff_schedule 
ADD COLUMN IF NOT EXISTS break_end TEXT DEFAULT NULL;

-- Add unique constraint for staff_id + day_of_week if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'staff_schedule_staff_id_day_of_week_key'
  ) THEN
    ALTER TABLE staff_schedule 
    ADD CONSTRAINT staff_schedule_staff_id_day_of_week_key 
    UNIQUE (staff_id, day_of_week);
  END IF;
END $$;

-- Comment for documentation
COMMENT ON COLUMN staff.home_visit_config IS 'JSON config: {canDoHomeVisit: boolean, maxDailyHomeVisits: number, maxTravelDistanceKm: number, preferredAreas: string[]}';
