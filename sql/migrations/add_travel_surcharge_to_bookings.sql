-- Add travel surcharge column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS travel_surcharge_amount REAL DEFAULT 0;

-- Update existing records to have 0 for travel surcharge if column was just added
UPDATE bookings 
SET travel_surcharge_amount = 0 
WHERE travel_surcharge_amount IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_travel_surcharge ON bookings(travel_surcharge_amount);