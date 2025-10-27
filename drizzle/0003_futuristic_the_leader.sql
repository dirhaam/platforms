ALTER TABLE "bookings" ADD COLUMN "booking_number" text NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_booking_number_unique" UNIQUE("booking_number");