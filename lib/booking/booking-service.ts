/**
 * BookingService - Re-export from refactored module
 * 
 * This file has been refactored into smaller, focused modules:
 * - lib/booking/booking-service/index.ts - Main orchestrator
 * - lib/booking/booking-service/types.ts - Type definitions
 * - lib/booking/booking-service/utils.ts - Helper functions
 * - lib/booking/booking-service/pricing.ts - Price calculations
 * - lib/booking/booking-service/validation.ts - Input validation
 * - lib/booking/booking-service/availability.ts - Availability checking
 * - lib/booking/booking-service/payments.ts - Payment recording
 * - lib/booking/booking-service/crud.ts - CRUD operations
 * - lib/booking/booking-service/create.ts - Booking creation
 * 
 * Original: 1334 lines → 9 files @ ~100-200 lines each
 */

export { BookingService } from './booking-service/index';
export * from './booking-service/types';
