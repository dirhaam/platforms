import {
  Booking,
  Service,
  Customer,
  CreateBookingRequest,
  UpdateBookingRequest,
  BookingConflict,
  TimeSlot,
  AvailabilityRequest,
  AvailabilityResponse,
  BookingStatus
} from '@/types/booking';

export type {
  Booking,
  Service,
  Customer,
  CreateBookingRequest,
  UpdateBookingRequest,
  BookingConflict,
  TimeSlot,
  AvailabilityRequest,
  AvailabilityResponse
};

export { BookingStatus };

export interface BookingQueryOptions {
  status?: string;
  customerId?: string;
  serviceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface RecordPaymentParams {
  tenantId: string;
  bookingId: string;
  paymentAmount: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'qris';
  paymentReference?: string;
  notes?: string;
}

export interface PricingCalculation {
  basePrice: number;
  travelSurcharge: number;
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
  serviceChargeAmount: number;
  additionalFeesAmount: number;
  totalAmount: number;
}

export interface TravelData {
  travelSurcharge: number;
  travelDistance: number;
  travelDuration: number;
}

export interface BookingResult {
  booking?: Booking;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}
