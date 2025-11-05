-- Add travel distance and duration fields to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS travel_distance DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS travel_duration INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS travel_surcharge_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_percentage DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS service_charge_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS additional_fees_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS booking_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS dp_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10, 2) DEFAULT 0;
