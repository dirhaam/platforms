// Re-export types
export * from './types';

// Import all functions
import { createBooking } from './create';
import { getBookings, getBooking, updateBooking, deleteBooking, getService } from './crud';
import { getAvailability, getAvailabilityWithStaff } from './availability';
import { recordPayment } from './payments';
import { 
  Booking, 
  CreateBookingRequest, 
  UpdateBookingRequest, 
  AvailabilityRequest, 
  AvailabilityResponse,
  Service,
  BookingQueryOptions,
  BookingResult,
  DeleteResult
} from './types';

/**
 * BookingService - Main service class for booking operations
 * 
 * Refactored from monolithic file into modular components:
 * - create.ts: Booking creation with validation
 * - crud.ts: CRUD operations (get, update, delete)
 * - availability.ts: Availability checking
 * - payments.ts: Payment recording
 * - pricing.ts: Price calculations
 * - validation.ts: Input validation
 * - utils.ts: Helper functions
 * - types.ts: Type definitions
 */
export class BookingService {
  static async createBooking(
    tenantId: string,
    data: CreateBookingRequest
  ): Promise<BookingResult> {
    return createBooking(tenantId, data);
  }

  static async getBookings(tenantId: string, options: BookingQueryOptions = {}): Promise<Booking[]> {
    return getBookings(tenantId, options);
  }

  static async getBooking(tenantId: string, bookingId: string): Promise<Booking | null> {
    return getBooking(tenantId, bookingId);
  }

  static async updateBooking(
    tenantId: string,
    bookingId: string,
    data: UpdateBookingRequest
  ): Promise<BookingResult> {
    return updateBooking(tenantId, bookingId, data);
  }

  static async deleteBooking(
    tenantId: string,
    bookingId: string
  ): Promise<DeleteResult> {
    return deleteBooking(tenantId, bookingId);
  }

  static async getAvailability(
    tenantId: string,
    request: AvailabilityRequest
  ): Promise<AvailabilityResponse | null> {
    return getAvailability(tenantId, request);
  }

  static async getService(tenantId: string, serviceId: string): Promise<Service | null> {
    return getService(tenantId, serviceId);
  }

  static async recordPayment(
    tenantId: string,
    bookingId: string,
    paymentAmount: number,
    paymentMethod: 'cash' | 'card' | 'transfer' | 'qris',
    paymentReference?: string,
    notes?: string
  ): Promise<BookingResult> {
    return recordPayment({
      tenantId,
      bookingId,
      paymentAmount,
      paymentMethod,
      paymentReference,
      notes
    });
  }

  static async getAvailabilityWithStaff(
    tenantId: string,
    serviceId: string,
    date: string,
    staffId?: string
  ): Promise<AvailabilityResponse | null> {
    return getAvailabilityWithStaff(tenantId, serviceId, date, staffId);
  }
}

// Also export individual functions for direct use
export {
  createBooking,
  getBookings,
  getBooking,
  updateBooking,
  deleteBooking,
  getService,
  getAvailability,
  getAvailabilityWithStaff,
  recordPayment
};
