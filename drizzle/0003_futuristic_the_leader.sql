-- Add booking_number column as nullable first
ALTER TABLE "bookings" ADD COLUMN "booking_number" text;

-- Generate booking numbers for existing bookings using CTE
WITH booking_numbers AS (
  SELECT 
    id,
    'BK-' || to_char("created_at", 'YYYYMMDD') || '-' || LPAD(row_number() OVER (PARTITION BY DATE("created_at") ORDER BY "created_at")::text, 4, '0') as new_booking_number
  FROM "bookings"
  WHERE "booking_number" IS NULL
)
UPDATE "bookings"
SET "booking_number" = booking_numbers.new_booking_number
FROM booking_numbers
WHERE "bookings".id = booking_numbers.id;

-- Make the column NOT NULL after populating
ALTER TABLE "bookings" ALTER COLUMN "booking_number" SET NOT NULL;

-- Add unique constraint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_booking_number_unique" UNIQUE("booking_number");