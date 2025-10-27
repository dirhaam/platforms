-- Add booking_number column as nullable first
ALTER TABLE "bookings" ADD COLUMN "booking_number" text;

-- Generate booking numbers for existing bookings
UPDATE "bookings" 
SET "booking_number" = 'BK-' || to_char("created_at", 'YYYYMMDD') || '-' || LPAD(row_number() OVER (PARTITION BY DATE("created_at") ORDER BY "created_at")::text, 4, '0')
WHERE "booking_number" IS NULL;

-- Make the column NOT NULL after populating
ALTER TABLE "bookings" ALTER COLUMN "booking_number" SET NOT NULL;

-- Add unique constraint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_booking_number_unique" UNIQUE("booking_number");