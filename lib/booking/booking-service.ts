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
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
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
        .eq('tenant_id', tenantId)
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
        .eq('tenant_id', tenantId)
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
  
  static async getBookings(tenantId: string, options: any = {}): Promise<Booking[]> {
    try {
      const supabase = getSupabaseClient();
      
      let query = supabase
        .from('bookings')
        .select('*')
        .eq('tenant_id', tenantId);
      
      if (options.status) {
        query = query.eq('status', options.status);
      }
      
      if (options.customerId) {
        query = query.eq('customerId', options.customerId);
      }
      
      if (options.serviceId) {
        query = query.eq('serviceId', options.serviceId);
      }
      
      if (options.startDate) {
        query = query.gte('scheduledAt', options.startDate.toISOString());
      }
      
      if (options.endDate) {
        query = query.lte('scheduledAt', options.endDate.toISOString());
      }
      
      query = query.order('scheduled_at', { ascending: false });
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      const { data: bookings, error } = await query;
      
      if (error || !bookings) {
        console.error('Error fetching bookings:', error);
        return [];
      }
      
      return bookings as Booking[];
    } catch (error) {
      console.error('Error in getBookings:', error);
      return [];
    }
  }
  
  static async getBooking(tenantId: string, bookingId: string): Promise<Booking | null> {
    try {
      const supabase = getSupabaseClient();
      
      const { data: booking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .eq('tenant_id', tenantId)
        .single();
      
      if (error || !booking) {
        return null;
      }
      
      return booking as Booking;
    } catch (error) {
      console.error('Error in getBooking:', error);
      return null;
    }
  }
  
  static async updateBooking(tenantId: string, bookingId: string, data: UpdateBookingRequest): Promise<{ booking?: Booking; error?: string }> {
    try {
      const supabase = getSupabaseClient();
      
      const booking = await this.getBooking(tenantId, bookingId);
      if (!booking) {
        return { error: 'Booking not found' };
      }
      
      const updateData: any = {
        updatedAt: new Date().toISOString()
      };
      
      if (data.status) {
        updateData.status = data.status;
      }
      
      if (data.notes !== undefined) {
        updateData.notes = data.notes;
      }
      
      if (data.isHomeVisit !== undefined) {
        updateData.isHomeVisit = data.isHomeVisit;
      }
      
      if (data.homeVisitAddress !== undefined) {
        updateData.homeVisitAddress = data.homeVisitAddress;
      }
      
      const { data: updatedBooking, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .eq('tenant_id', tenantId)
        .select()
        .single();
      
      if (error || !updatedBooking) {
        return { error: 'Failed to update booking' };
      }
      
      return { booking: updatedBooking as Booking };
    } catch (error) {
      console.error('Error in updateBooking:', error);
      return { error: 'Internal server error' };
    }
  }
  
  static async deleteBooking(tenantId: string, bookingId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = getSupabaseClient();
      
      const booking = await this.getBooking(tenantId, bookingId);
      if (!booking) {
        return { success: false, error: 'Booking not found' };
      }
      
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)
        .eq('tenant_id', tenantId);
      
      if (error) {
        return { success: false, error: 'Failed to delete booking' };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error in deleteBooking:', error);
      return { success: false, error: 'Internal server error' };
    }
  }
  
  static async checkBookingConflicts(): Promise<BookingConflict> {
    return {
      hasConflict: false,
      conflictingBookings: [],
      message: 'Conflict checking temporarily disabled during migration'
    };
  }
  
  static async getAvailability(tenantId: string, request: AvailabilityRequest): Promise<AvailabilityResponse | null> {
    try {
      const supabase = getSupabaseClient();
      
      const service = await this.getService(tenantId, request.serviceId);
      if (!service) {
        return null;
      }
      
      const bookingDate = new Date(request.date);
      const startOfDay = new Date(bookingDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(bookingDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('serviceId', request.serviceId)
        .eq('status', BookingStatus.CONFIRMED)
        .gte('scheduledAt', startOfDay.toISOString())
        .lte('scheduledAt', endOfDay.toISOString());
      
      if (error) {
        console.error('Error fetching bookings for availability:', error);
        return {
          date: request.date,
          slots: [],
          businessHours: { isOpen: false }
        };
      }
      
      const bookedSlots = (bookings || []).map(b => ({
        start: new Date(b.scheduledAt),
        end: new Date(new Date(b.scheduledAt).getTime() + b.duration * 60000),
        available: false
      }));
      
      const slots: TimeSlot[] = [];
      const slotDuration = request.duration || service.duration;
      const startHour = 8;
      const endHour = 17;
      
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const slotStart = new Date(bookingDate);
          slotStart.setHours(hour, minute, 0, 0);
          const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);
          
          let isAvailable = true;
          for (const booked of bookedSlots) {
            if (slotStart < booked.end && slotEnd > booked.start) {
              isAvailable = false;
              break;
            }
          }
          
          if (isAvailable && slotEnd <= new Date(bookingDate.getTime() + 24 * 3600000)) {
            slots.push({
              start: slotStart,
              end: slotEnd,
              available: true
            });
          }
        }
      }
      
      return {
        date: request.date,
        slots,
        businessHours: { isOpen: true, openTime: '08:00', closeTime: '17:00' }
      };
    } catch (error) {
      console.error('Error in getAvailability:', error);
      return null;
    }
  }
  
  static async getService(tenantId: string, serviceId: string): Promise<Service | null> {
    try {
      const supabase = getSupabaseClient();
      
      const { data: service, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .eq('tenant_id', tenantId)
        .single();
      
      if (error || !service) {
        return null;
      }
      
      return service as Service;
    } catch (error) {
      console.error('Error in getService:', error);
      return null;
    }
  }
}
