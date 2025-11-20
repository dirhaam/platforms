-- Full Home Visit System Migration
-- Adds support for flexible home visit scheduling with staff management

-- 1. Add new columns to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'on_premise' CHECK (service_type IN ('on_premise', 'home_visit', 'both'));
ALTER TABLE services ADD COLUMN IF NOT EXISTS home_visit_full_day_booking BOOLEAN DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS home_visit_min_buffer_minutes INTEGER DEFAULT 30;
ALTER TABLE services ADD COLUMN IF NOT EXISTS daily_quota_per_staff INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS requires_staff_assignment BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN services.service_type IS 'Type of service: on_premise (office/salon), home_visit (customer home), both (flexible)';
COMMENT ON COLUMN services.home_visit_full_day_booking IS 'If true, only 1 booking per day per staff for this service';
COMMENT ON COLUMN services.home_visit_min_buffer_minutes IS 'Minutes buffer between home visit appointments for travel time';
COMMENT ON COLUMN services.daily_quota_per_staff IS 'Maximum bookings per staff member per day (NULL = unlimited)';
COMMENT ON COLUMN services.requires_staff_assignment IS 'If true, booking must be assigned to a staff member';

-- 2. Create staff_services table (many-to-many mapping)
CREATE TABLE IF NOT EXISTS staff_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  can_perform BOOLEAN NOT NULL DEFAULT true,
  is_specialist BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_staff_service UNIQUE(staff_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_services_staff_id ON staff_services(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_services_service_id ON staff_services(service_id);
CREATE INDEX IF NOT EXISTS idx_staff_services_specialist ON staff_services(staff_id, is_specialist) WHERE is_specialist = true;

-- 3. Create staff_schedule table (per-staff working hours override)
CREATE TABLE IF NOT EXISTS staff_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TEXT NOT NULL, -- "08:00"
  end_time TEXT NOT NULL,   -- "18:00"
  is_available BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_staff_day_schedule UNIQUE(staff_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_staff_schedule_staff_id ON staff_schedule(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_schedule_day ON staff_schedule(day_of_week);

-- 4. Create staff_leave table (vacation/sick leave tracking)
CREATE TABLE IF NOT EXISTS staff_leave (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  reason TEXT NOT NULL,
  is_paid BOOLEAN DEFAULT true,
  approver_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_dates CHECK (date_start <= date_end)
);

CREATE INDEX IF NOT EXISTS idx_staff_leave_staff_id ON staff_leave(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_leave_date_range ON staff_leave(date_start, date_end);

-- 5. Update bookings table - add travel time tracking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS travel_time_minutes_before INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS travel_time_minutes_after INTEGER DEFAULT 0;

-- Add comments
COMMENT ON COLUMN bookings.staff_id IS 'The staff member assigned to this booking';
COMMENT ON COLUMN bookings.travel_time_minutes_before IS 'Travel/buffer time needed before this appointment';
COMMENT ON COLUMN bookings.travel_time_minutes_after IS 'Travel/buffer time needed after this appointment';

-- 6. Create indexes for improved query performance
CREATE INDEX IF NOT EXISTS idx_bookings_staff_id_scheduled ON bookings(staff_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_service_date ON bookings(tenant_id, service_id, DATE(scheduled_at));
CREATE INDEX IF NOT EXISTS idx_bookings_staff_date ON bookings(staff_id, DATE(scheduled_at), status);

-- 7. Add trigger to auto-update updated_at on staff_services
CREATE OR REPLACE FUNCTION update_staff_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER staff_services_updated_at BEFORE UPDATE ON staff_services
FOR EACH ROW EXECUTE FUNCTION update_staff_services_updated_at();

-- 8. Add trigger to auto-update updated_at on staff_schedule
CREATE OR REPLACE FUNCTION update_staff_schedule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER staff_schedule_updated_at BEFORE UPDATE ON staff_schedule
FOR EACH ROW EXECUTE FUNCTION update_staff_schedule_updated_at();

-- 9. Add trigger to auto-update updated_at on staff_leave
CREATE OR REPLACE FUNCTION update_staff_leave_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER staff_leave_updated_at BEFORE UPDATE ON staff_leave
FOR EACH ROW EXECUTE FUNCTION update_staff_leave_updated_at();
