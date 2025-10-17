import { createClient } from '@supabase/supabase-js';
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
import { validateBookingTime, validateBusinessHours } from '@/lib/validation/booking-validation';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

const randomUUID = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

export class BookingService {
  // Create a new booking - THIS METHOD IS WORKING
  static async createBooking(
    tenantId: string, 
    data: CreateBookingRequest
  ): Promise<{ booking?: Booking; error?: string }> {
    try {
      const supabase = getSupabaseClient();
      
      // Validate the service exists and belongs to tenant
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', data.serviceId)
        .eq('tenantId', tenantId)
        .eq('isActive', true)
        .single();
      
      if (serviceError || !serviceData) {
        return { error: 'Service not found or inactive' };
      }
      
      const service = serviceData;
      
      // Validate the customer exists and belongs to tenant
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', data.customerId)
        .eq('tenantId', tenantId)
        .single();
      
      if (customerError || !customerData) {
        return { error: 'Customer not found' };
      }
      
      const customer = customerData;
      
      const scheduledAt = new Date(data.scheduledAt);
      
      // Validate booking time
      const timeValidation = validateBookingTime(scheduledAt);
      if (!timeValidation.valid) {
        return { error: timeValidation.message };
      }
      
      // Get business hours for validation
      const { data: businessHoursData, error: businessHoursError } = await supabase
        .from('businessHours')
        .select('*')
        .eq('tenantId', tenantId)
        .single();
      
      const businessHoursRecord = businessHoursError ? null : businessHoursData;
      
      // Validate against business hours
      const hoursValidation = validateBusinessHours(scheduledAt, businessHoursRecord);
      if (!hoursValidation.valid) {
        return { error: hoursValidation.message };
      }
      
      // Calculate total amount including location-based surcharges
      let totalAmount = service.price;
      
      if (data.isHomeVisit) {
        if (service.homeVisitSurcharge) {
          totalAmount = (Number(totalAmount) + Number(service.homeVisitSurcharge));
        }
      }
      
      // Create the booking
      const { data: newBooking, error: insertError } = await supabase
        .from('bookings')
        .insert({
          id: randomUUID(),
          tenantId,
          customerId: data.customerId,
          serviceId: data.serviceId,
          scheduledAt: scheduledAt.toISOString(),
          duration: service.duration,
          isHomeVisit: data.isHomeVisit || false,
          homeVisitAddress: data.homeVisitAddress,
          homeVisitCoordinates: data.homeVisitCoordinates,
          notes: data.notes,
          totalAmount,
          status: BookingStatus.PENDING,
          remindersSent: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError || !newBooking) {
        return { error: 'Failed to create booking' };
      }
      
      // Get the created booking with customer and service data
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', newBooking.id)
        .single();
      
      if (bookingError || !bookingData) {
        return { error: 'Failed to retrieve created booking' };
      }
      
      // Get customer data
      const { data: customerDataResult, error: customerFetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', bookingData.customerId)
        .single();
      
      if (customerFetchError || !customerDataResult) {
        return { error: 'Failed to retrieve customer data' };
      }
      
      // Get service data
      const { data: serviceDataResult, error: serviceFetchError } = await supabase
        .from('services')
        .select('*')
        .eq('id', bookingData.serviceId)
        .single();
      
      if (serviceFetchError || !serviceDataResult) {
        return { error: 'Failed to retrieve service data' };
      }
      
      const booking = {
        ...bookingData,
        customer: customerDataResult,
        service: serviceDataResult
      };
      
      // Update customer's total bookings count
      const { data: currentCustomer } = await supabase
        .from('customers')
        .select('totalBookings')
        .eq('id', data.customerId)
        .single();
      
      if (currentCustomer) {
        await supabase
          .from('customers')
          .update({
            totalBookings: (currentCustomer.totalBookings || 0) + 1,
            lastBookingAt: new Date().toISOString()
          })
          .eq('id', data.customerId);
      }
      
      return { booking: booking as Booking };
    } catch (error) {
      console.error('Error creating booking:', error);
      return { error: 'Failed to create booking' };
    }
  }
  
  // Placeholder methods - TODO: Convert these properly
  static async updateBooking(tenantId: string, bookingId: string, data: any): Promise<{ booking?: Booking; error?: string }> {
    return { error: 'Update method temporarily disabled during migration' };
  }
  
  static async getBookings(tenantId: string, options: any = {}): Promise<Booking[]> {
    return [];
  }
  
  static async getBooking(tenantId: string, bookingId: string): Promise<Booking | null> {
    return null;
  }
  
  static async deleteBooking(tenantId: string, bookingId: string): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Delete method temporarily disabled during migration' };
  }
  
  static async checkBookingConflicts(): Promise<BookingConflict> {
    return {
      hasConflict: false,
      conflictingBookings: [],
      message: 'Conflict checking temporarily disabled during migration'
    };
  }
  
  static async getAvailability(tenantId: string, request: any): Promise<AvailabilityResponse | null> {
    return null;
  }
}
