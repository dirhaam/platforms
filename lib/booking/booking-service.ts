import { BlockedDatesService } from '@/lib/bookings/blocked-dates-service';
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
import { BookingHistoryService } from '@/lib/booking/booking-history-service';
import { randomUUID as cryptoRandomUUID } from 'crypto';
import { InvoiceSettingsService } from '@/lib/invoice/invoice-settings-service';
import { LocationService } from '@/lib/location/location-service';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

const randomUUID = () => {
  try {
    // Try Node.js crypto module first (server-side)
    return cryptoRandomUUID();
  } catch (e) {
    try {
      // Fallback to globalThis.crypto (browser or modern Node.js)
      if (typeof globalThis.crypto?.randomUUID === 'function') {
        return globalThis.crypto.randomUUID();
      }
    } catch (e2) {
      // Last resort: generate UUID-like string
      console.warn('[randomUUID] Falling back to generated UUID-like string');
      return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
    }
  }
};

// Map database snake_case fields to camelCase Booking interface
const mapToBooking = (dbData: any): Booking => {
  const dpAmount = dbData.dp_amount || 0;
  const paidAmount = dbData.paid_amount || 0;
  const totalAmount = dbData.total_amount || 0;
  const remainingBalance = totalAmount - paidAmount;

  return {
    id: dbData.id,
    bookingNumber: dbData.booking_number || `BK-${Date.now()}`,
    tenantId: dbData.tenant_id,
    customerId: dbData.customer_id,
    serviceId: dbData.service_id,
    staffId: dbData.staff_id,
    status: dbData.status,
    scheduledAt: new Date(dbData.scheduled_at),
    duration: dbData.duration,
    isHomeVisit: dbData.is_home_visit,
    homeVisitAddress: dbData.home_visit_address,
    homeVisitCoordinates: dbData.home_visit_coordinates,
    notes: dbData.notes,
    totalAmount,
    taxPercentage: dbData.tax_percentage,
    serviceChargeAmount: dbData.service_charge_amount,
    additionalFeesAmount: dbData.additional_fees_amount,
    travelSurchargeAmount: dbData.travel_surcharge_amount,
    travelDistance: dbData.travel_distance,
    travelDuration: dbData.travel_duration,
    travelTimeMinutesBefore: dbData.travel_time_minutes_before,
    travelTimeMinutesAfter: dbData.travel_time_minutes_after,
    paymentStatus: dbData.payment_status,
    remindersSent: dbData.reminders_sent,
    createdAt: new Date(dbData.created_at),
    updatedAt: new Date(dbData.updated_at),
    dpAmount,
    paidAmount,
    paymentReference: dbData.payment_reference,
    paymentMethod: dbData.payment_method,
    remainingBalance
  };
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

      // Step 1: Start with base service price
      const basePrice = Number(service.price);

      // Step 2: Calculate travel surcharge for home visits if address is provided
      // Step 2: Use pre-calculated travel data from frontend, or recalculate if not provided
      const hasFrontendTravelData = 'travelSurchargeAmount' in data || 'travelDistance' in data || 'travelDuration' in data;
      let travelSurcharge = data.travelSurchargeAmount ?? 0;
      let travelDistance = data.travelDistance ?? 0;
      let travelDuration = data.travelDuration ?? 0;

      console.log('[BookingService] Travel data check:', { hasFrontendTravelData, travelSurcharge, travelDistance, travelDuration });

      // Only recalculate if frontend didn't provide travel data
      if (data.isHomeVisit && data.homeVisitAddress && !hasFrontendTravelData) {
        try {
          console.log('[BookingService] No travel data provided, recalculating...');
          // Get tenant's business location for travel calculation
          const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .select('address, business_location')
            .eq('id', tenantId)
            .single();

          if (tenantData && !tenantError) {
            // Use business location if available, otherwise try address
            const businessLocation = tenantData.business_location || tenantData.address;

            if (businessLocation) {
              console.log('[BookingService] Calculating travel from:', { businessLocation, destination: data.homeVisitAddress });
              const travelCalc = await LocationService.calculateTravel({
                origin: businessLocation,
                destination: data.homeVisitAddress,
                tenantId,
                serviceId: data.serviceId
              });

              if (travelCalc) {
                travelSurcharge = travelCalc.surcharge || 0;
                travelDistance = travelCalc.distance || 0;
                travelDuration = travelCalc.duration || 0;
                console.log('[BookingService] Travel recalculated:', { travelSurcharge, travelDistance, travelDuration });
              }
            }
          }
        } catch (error) {
          console.warn('[BookingService] Could not calculate travel surcharge:', error);
          // Continue with booking creation even if travel calculation fails
        }
      } else if (data.isHomeVisit) {
        console.log('[BookingService] Using frontend-provided travel data:', { travelSurcharge, travelDistance, travelDuration });
      }

      // Step 3: Calculate subtotal = base price + travel surcharge
      const subtotal = basePrice + travelSurcharge;

      // Step 4: Fetch invoice settings (tax, service charge, additional fees)
      const settings = await InvoiceSettingsService.getSettings(tenantId);

      // Step 5: Calculate tax on subtotal
      const taxPercentage = settings?.taxServiceCharge?.taxPercentage || 0;
      const taxAmount = subtotal * (taxPercentage / 100);

      // Step 6: Calculate service charge on subtotal
      let serviceChargeAmount = 0;
      if (settings?.taxServiceCharge?.serviceChargeRequired) {
        if (settings.taxServiceCharge.serviceChargeType === 'fixed') {
          serviceChargeAmount = settings.taxServiceCharge.serviceChargeValue || 0;
        } else {
          serviceChargeAmount = subtotal * ((settings.taxServiceCharge.serviceChargeValue || 0) / 100);
        }
      }

      // Step 7: Calculate additional fees on subtotal
      let additionalFeesAmount = 0;
      (settings?.additionalFees || []).forEach(fee => {
        if (fee.type === 'fixed') {
          additionalFeesAmount += fee.value;
        } else {
          additionalFeesAmount += subtotal * (fee.value / 100);
        }
      });

      // Step 8: Calculate total = subtotal + all taxes/fees
      const totalAmount = subtotal + taxAmount + serviceChargeAmount + additionalFeesAmount;

      // Prepare DP payment data
      const dpAmount = data.dpAmount || 0;
      const paidAmount = dpAmount > 0 ? dpAmount : 0;

      // Determine payment_status based on paid amount
      let paymentStatus = 'pending';
      if (paidAmount >= totalAmount) {
        paymentStatus = 'paid';
      } else if (paidAmount > 0) {
        paymentStatus = 'partial';
      }

      // Validate home visit availability and get staff assignment
      let staffIdToAssign: string | null = data.staffId || null;
      let travelTimeBeforeMinutes = 0;
      let travelTimeAfterMinutes = 0;

      // Check if service requires staff assignment or is home visit
      if ((service.requiresStaffAssignment || service.serviceType === 'home_visit' || service.serviceType === 'both') && data.isHomeVisit) {
        // Validate service supports home visits
        if (service.serviceType === 'on_premise') {
          return { error: 'This service does not support home visit bookings' };
        }

        // Apply travel time buffers for home visits
        travelTimeBeforeMinutes = service.homeVisitMinBufferMinutes || 30;
        travelTimeAfterMinutes = service.homeVisitMinBufferMinutes || 30;

        // If staff is pre-assigned, validate they can perform this service
        if (staffIdToAssign) {
          const { data: staffMember } = await supabase
            .from('staff')
            .select('id, is_active')
            .eq('id', staffIdToAssign)
            .eq('tenant_id', tenantId)
            .single();

          if (!staffMember || !staffMember.is_active) {
            return { error: 'Assigned staff member not found or inactive' };
          }

          // Verify staff is assigned to this service
          const { data: staffService } = await supabase
            .from('staff_services')
            .select('id, can_perform')
            .eq('staff_id', staffIdToAssign)
            .eq('service_id', data.serviceId)
            .single();

          if (!staffService || !staffService.can_perform) {
            return { error: 'Selected staff member cannot perform this service' };
          }

          // Check if assigned staff is available considering travel time
          const { StaffAvailabilityService } = await import('@/lib/booking/staff-availability-service');
          const bookingStartWithBuffer = new Date(scheduledAt.getTime() - travelTimeBeforeMinutes * 60000);
          const bookingEndWithBuffer = new Date(scheduledAt.getTime() + (service.duration + travelTimeAfterMinutes) * 60000);

          const isAvailable = await StaffAvailabilityService.isStaffAvailableForSlot(
            tenantId,
            staffIdToAssign,
            scheduledAt,
            bookingStartWithBuffer,
            bookingEndWithBuffer,
            0
          );

          if (!isAvailable) {
            return { error: 'Selected staff member is not available for this time slot (including travel time)' };
          }
        } else if (service.requiresStaffAssignment) {
          // Staff assignment is required but none provided
          return { error: 'This service requires staff assignment. Please assign a staff member.' };
        } else if (data.autoAssignStaff !== false) {
          // Auto-assign staff if requested
          try {
            const { StaffAvailabilityService } = await import('@/lib/booking/staff-availability-service');

            const bookingStartWithBuffer = new Date(scheduledAt.getTime() - travelTimeBeforeMinutes * 60000);
            const bookingEndWithBuffer = new Date(scheduledAt.getTime() + (service.duration + travelTimeAfterMinutes) * 60000);

            const bestStaff = await StaffAvailabilityService.findBestAvailableStaff(
              tenantId,
              data.serviceId,
              scheduledAt,
              bookingStartWithBuffer,
              bookingEndWithBuffer,
              0
            );

            if (bestStaff) {
              staffIdToAssign = bestStaff.id;
              console.log('[BookingService] Auto-assigned staff:', { staffId: staffIdToAssign, staffName: bestStaff.name });
            }
          } catch (error) {
            console.warn('[BookingService] Auto-assignment failed:', error);
            // Continue without auto-assignment if it fails
          }
        }
      }

      // Create the booking
      const bookingId = randomUUID();
      const now = new Date();
      const bookingNumber = `BK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const { data: newBooking, error: insertError } = await supabase
        .from('bookings')
        .insert({
          id: bookingId,
          booking_number: bookingNumber,
          tenant_id: tenantId,
          customer_id: data.customerId,
          service_id: data.serviceId,
          staff_id: staffIdToAssign,
          scheduled_at: scheduledAt.toISOString(),
          duration: service.duration,
          is_home_visit: data.isHomeVisit || false,
          home_visit_address: data.homeVisitAddress,
          home_visit_coordinates: data.homeVisitCoordinates,
          notes: data.notes,
          total_amount: totalAmount,
          tax_percentage: taxPercentage,
          service_charge_amount: serviceChargeAmount,
          additional_fees_amount: additionalFeesAmount,
          travel_surcharge_amount: travelSurcharge,
          travel_distance: travelDistance,
          travel_duration: travelDuration,
          travel_time_minutes_before: travelTimeBeforeMinutes,
          travel_time_minutes_after: travelTimeAfterMinutes,
          status: BookingStatus.PENDING,
          payment_status: paymentStatus,
          reminders_sent: [],
          dp_amount: dpAmount,
          paid_amount: paidAmount,
          payment_method: data.paymentMethod || null,
          payment_reference: data.paymentReference || null,
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        })
        .select()
        .single();

      // Record initial DP payment if provided
      if (dpAmount > 0 && data.paymentMethod) {
        const paymentId = randomUUID();
        const dpPaymentRecord = {
          id: paymentId,
          booking_id: bookingId,
          tenant_id: tenantId,
          payment_amount: Number(dpAmount),
          payment_method: data.paymentMethod,
          payment_reference: data.paymentReference || null,
          notes: 'Down Payment (DP)',
          paid_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log('[BookingService.createBooking] Attempting to record DP payment:', {
          paymentId,
          bookingId,
          tenantId,
          dpAmount,
          paymentMethod: data.paymentMethod,
          payload: dpPaymentRecord
        });

        const { error: paymentError, data: paymentData, status: paymentStatus } = await supabase
          .from('booking_payments')
          .insert([dpPaymentRecord])
          .select()
          .single();

        if (paymentError) {
          console.error('[BookingService.createBooking] ❌ Failed to record DP payment:', {
            error: paymentError.message,
            code: paymentError.code,
            status: paymentStatus,
            details: paymentError.details,
            hint: paymentError.hint,
            bookingId,
            dpAmount,
            payload: dpPaymentRecord
          });
          // Don't fail the booking creation, just log the error
        } else {
          console.log('[BookingService.createBooking] ✅ DP payment recorded successfully:', {
            paymentId,
            paymentData,
            status: paymentStatus
          });
        }
      }

      if (insertError || !newBooking) {
        console.error('[BookingService.createBooking] Insert failed:', {
          insertError,
          newBooking,
          paymentMethod: data.paymentMethod,
          dpAmount,
          paidAmount
        });
        return { error: `Failed to create booking: ${insertError?.message || 'Unknown error'}` };
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
        .eq('id', bookingData.customer_id)
        .single();

      if (customerFetchError || !customerDataResult) {
        console.error('[BookingService.createBooking] Failed to fetch customer:', { customerId: bookingData.customer_id, error: customerFetchError });
        return { error: 'Failed to retrieve customer data' };
      }

      // Get service data
      const { data: serviceDataResult, error: serviceFetchError } = await supabase
        .from('services')
        .select('*')
        .eq('id', bookingData.service_id)
        .single();

      if (serviceFetchError || !serviceDataResult) {
        console.error('[BookingService.createBooking] Failed to fetch service:', { serviceId: bookingData.service_id, error: serviceFetchError });
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
        .select('total_bookings')
        .eq('id', data.customerId)
        .single();

      if (currentCustomer) {
        await supabase
          .from('customers')
          .update({
            total_bookings: (currentCustomer.total_bookings || 0) + 1,
            last_booking_at: new Date().toISOString()
          })
          .eq('id', data.customerId);
      }

      // Log booking created event
      if (bookingId) {
        await BookingHistoryService.logBookingCreated(tenantId, bookingId, {
          bookingNumber,
          totalAmount,
          dpAmount,
          serviceId: data.serviceId,
          paymentMethod: data.paymentMethod
        });
      }

      return { booking: mapToBooking(booking) };
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
        query = query.eq('customer_id', options.customerId);
      }

      if (options.serviceId) {
        query = query.eq('service_id', options.serviceId);
      }

      if (options.startDate) {
        query = query.gte('scheduled_at', options.startDate.toISOString());
      }

      if (options.endDate) {
        query = query.lte('scheduled_at', options.endDate.toISOString());
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

      return bookings.map(mapToBooking);
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

      return mapToBooking(booking);
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
        updated_at: new Date().toISOString()
      };

      // Update all provided fields
      if (data.customerId !== undefined) {
        updateData.customer_id = data.customerId;
      }

      if (data.serviceId !== undefined) {
        updateData.service_id = data.serviceId;
      }

      if (data.status !== undefined) {
        updateData.status = data.status;
      }

      if (data.paymentStatus !== undefined) {
        updateData.payment_status = data.paymentStatus;
      }

      if (data.scheduledAt !== undefined) {
        const scheduledDate = data.scheduledAt instanceof Date ? data.scheduledAt : new Date(data.scheduledAt as string);
        updateData.scheduled_at = scheduledDate.toISOString();
      }

      if (data.duration !== undefined) {
        updateData.duration = data.duration;
      }

      if (data.totalAmount !== undefined) {
        updateData.total_amount = data.totalAmount;
      }

      if (data.notes !== undefined) {
        updateData.notes = data.notes;
      }

      if (data.isHomeVisit !== undefined) {
        updateData.is_home_visit = data.isHomeVisit;
      }

      if (data.homeVisitAddress !== undefined) {
        updateData.home_visit_address = data.homeVisitAddress;
      }

      if (data.homeVisitCoordinates !== undefined) {
        updateData.home_visit_coordinates = data.homeVisitCoordinates;
      }

      // Store payment method in notes if provided
      if ((data as any).paymentMethod !== undefined) {
        const methodNote = `Payment method: ${(data as any).paymentMethod}`;
        updateData.notes = updateData.notes ? `${updateData.notes}\n${methodNote}` : methodNote;
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

      // Log status change if status was updated
      if (data.status !== undefined && booking.status !== data.status) {
        await BookingHistoryService.logStatusChanged(tenantId, bookingId, booking.status, data.status);
      }

      // Log payment status change if updated
      if (data.paymentStatus !== undefined && booking.paymentStatus !== data.paymentStatus) {
        await BookingHistoryService.logEvent({
          bookingId,
          tenantId,
          action: 'PAYMENT_STATUS_CHANGED',
          description: `Payment status changed from ${booking.paymentStatus} to ${data.paymentStatus}`,
          oldValues: { paymentStatus: booking.paymentStatus },
          newValues: { paymentStatus: data.paymentStatus }
        });
      }

      return { booking: mapToBooking(updatedBooking) };
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

  static async getAvailability(
    tenantId: string,
    request: AvailabilityRequest
  ): Promise<AvailabilityResponse | null> {
    try {
      const supabase = getSupabaseClient();

      const service = await this.getService(tenantId, request.serviceId);
      if (!service) {
        return null;
      }

      // Get global business hours for the tenant
      const { data: businessHoursData } = await supabase
        .from('business_hours')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      // FIXED: Proper timezone-aware date parsing
      // Parse YYYY-MM-DD format as LOCAL date, not UTC
      const [year, month, day] = request.date.split('-').map(Number);
      const bookingDate = new Date(year, month - 1, day);
      bookingDate.setHours(0, 0, 0, 0); // Set to midnight local time

      const dayOfWeek = bookingDate.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayKey = dayNames[dayOfWeek];

      const schedule = businessHoursData?.schedule || {};

      // Try exact key, then try with capitalized, then case-insensitive
      let dayHours = schedule[dayKey];
      if (!dayHours) {
        const capitalizedKey = dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
        dayHours = schedule[capitalizedKey];
      }
      if (!dayHours) {
        // Try case-insensitive search
        const matchKey = Object.keys(schedule).find(key => key.toLowerCase() === dayKey.toLowerCase());
        dayHours = matchKey ? schedule[matchKey] : null;
      }

      // Fallback to default if not found
      if (!dayHours) {
        dayHours = { isOpen: true, openTime: '08:00', closeTime: '17:00' };
      }

      // Check if business is open on this day
      if (!dayHours.isOpen) {
        return {
          date: request.date,
          slots: [],
          businessHours: { isOpen: false }
        };
      }

      const operatingHours = {
        startTime: dayHours.openTime,
        endTime: dayHours.closeTime
      };

      const [startHourStr, startMinStr] = operatingHours.startTime.split(':').map(Number);
      const [endHourStr, endMinStr] = operatingHours.endTime.split(':').map(Number);

      const startOfDay = new Date(bookingDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(bookingDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Fetch all confirmed bookings for this service on this date
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('service_id', request.serviceId)
        .eq('status', BookingStatus.CONFIRMED)
        .gte('scheduled_at', startOfDay.toISOString())
        .lte('scheduled_at', endOfDay.toISOString());

      if (error) {
        console.error('Error fetching bookings for availability:', error);
        return {
          date: request.date,
          slots: [],
          businessHours: { isOpen: false }
        };
      }

      // Get slot duration and quota from service
      const slotDurationMinutes = service.slotDurationMinutes || 30;
      const hourlyQuota = service.hourlyQuota || 10;
      const serviceDuration = request.duration || service.duration;
      const slots: TimeSlot[] = [];

      // Get timezone offset from database
      const timezone = businessHoursData?.timezone || 'Asia/Jakarta';

      // Use date-fns-tz to handle timezone conversions accurately
      const { fromZonedTime } = await import('date-fns-tz');

      // Create start/end dates in the target timezone
      const dateStr = request.date; // YYYY-MM-DD
      const startIsoStr = `${dateStr}T${operatingHours.startTime}:00`;
      const endIsoStr = `${dateStr}T${operatingHours.endTime}:00`;

      // Convert to UTC dates for comparison/storage
      const startDate = fromZonedTime(startIsoStr, timezone);
      const endDate = fromZonedTime(endIsoStr, timezone);

      // Count bookings per hour to enforce hourly quota
      const bookingsPerHour = new Map<string, number>();

      (bookings || []).forEach(booking => {
        const bookingTime = new Date(booking.scheduled_at);
        const hourKey = `${bookingTime.getHours()}:00`;
        bookingsPerHour.set(hourKey, (bookingsPerHour.get(hourKey) || 0) + 1);
      });

      let currentTime = new Date(startDate);

      while (currentTime < endDate) {
        const slotStart = new Date(currentTime);
        // FIXED: Slot length should be serviceDuration, not slotDurationMinutes
        const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

        // Check if slot would go past business hours
        if (slotEnd > endDate) {
          break;
        }

        // Get hour slot key for quota check
        const hourKey = `${slotStart.getHours()}:00`;
        const bookingsInThisHour = bookingsPerHour.get(hourKey) || 0;

        // Check if slot is available
        let isAvailable = false;

        // First check: don't exceed hourly quota
        if (bookingsInThisHour < hourlyQuota) {
          // Second check: ensure no time conflicts with existing bookings
          const conflictingBooking = (bookings || []).find(b => {
            const bookingStart = new Date(b.scheduled_at);
            const bookingEnd = new Date(bookingStart.getTime() + b.duration * 60000);
            // Check for overlap: slot conflicts if it overlaps with existing booking
            return slotStart < bookingEnd && slotEnd > bookingStart;
          });

          isAvailable = !conflictingBooking;
        }

        slots.push({
          start: slotStart,
          end: slotEnd,
          available: isAvailable
        });

        // FIXED: Move to next slot using slotDurationMinutes (allows overlapping display)
        // This lets users see available slots at every slotDuration interval
        currentTime = new Date(currentTime.getTime() + slotDurationMinutes * 60000);
      }

      return {
        date: request.date,
        slots,
        businessHours: {
          isOpen: true,
          openTime: operatingHours.startTime,
          closeTime: operatingHours.endTime
        }
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

  // Record additional payment for DP/partial payment
  static async recordPayment(
    tenantId: string,
    bookingId: string,
    paymentAmount: number,
    paymentMethod: 'cash' | 'card' | 'transfer' | 'qris',
    paymentReference?: string,
    notes?: string
  ): Promise<{ booking?: Booking; error?: string }> {
    try {
      const supabase = getSupabaseClient();

      console.log('[recordPayment] Input:', {
        bookingId,
        tenantId,
        paymentAmount,
        paymentMethod,
        paymentReference,
        notes
      });

      // Get current booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .eq('tenant_id', tenantId)
        .single();

      if (bookingError || !booking) {
        console.error('[recordPayment] Booking not found:', bookingError);
        return { error: 'Booking not found' };
      }

      console.log('[recordPayment] Current booking:', {
        paidAmount: booking.paid_amount,
        totalAmount: booking.total_amount,
        paymentStatus: booking.payment_status
      });

      // Record payment in booking_payments table
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('booking_payments')
        .insert({
          id: randomUUID(),
          booking_id: bookingId,
          tenant_id: tenantId,
          payment_amount: Number(paymentAmount),
          payment_method: paymentMethod,
          payment_reference: paymentReference || null,
          notes: notes || 'Payment recorded',
          paid_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (paymentError) {
        console.error('[recordPayment] Failed to record payment in table:', paymentError);
        return { error: 'Failed to record payment' };
      }

      console.log('[recordPayment] Payment recorded:', paymentRecord);

      // Calculate new paid amount
      const currentPaidAmount = Number(booking.paid_amount) || 0;
      const newPaidAmount = currentPaidAmount + Number(paymentAmount);
      const totalAmount = Number(booking.total_amount);

      // Determine new payment status based on paid amount
      let paymentStatus = 'pending';
      if (newPaidAmount >= totalAmount) {
        paymentStatus = 'paid';
      } else if (newPaidAmount > 0) {
        paymentStatus = 'partial';
      }

      console.log('[recordPayment] Calculating:', {
        currentPaidAmount,
        paymentAmount: Number(paymentAmount),
        newPaidAmount,
        totalAmount,
        newPaymentStatus: paymentStatus
      });

      // Update booking with new paid amount and status
      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update({
          paid_amount: newPaidAmount,
          payment_status: paymentStatus,
          payment_method: paymentMethod,
          payment_reference: paymentReference || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (updateError || !updatedBooking) {
        console.error('[recordPayment] Failed to update booking:', updateError);
        return { error: 'Failed to update booking' };
      }

      console.log('[recordPayment] Booking updated:', {
        paidAmount: updatedBooking.paid_amount,
        paymentStatus: updatedBooking.payment_status,
        paymentMethod: updatedBooking.payment_method
      });

      // Log payment recorded event
      if (bookingId) {
        await BookingHistoryService.logPaymentRecorded(tenantId, bookingId, {
          paymentAmount,
          paymentMethod: paymentMethod || 'unknown',
          notes: notes || '',
          isDownPayment: false
        });
      }

      return { booking: mapToBooking(updatedBooking) };
    } catch (error) {
      console.error('Error recording payment:', error);
      return { error: error instanceof Error ? error.message : 'Failed to record payment' };
    }
  }

  /**
   * Enhanced getAvailability with home visit and staff support
   * Handles:
   * - Service type filtering (on_premise vs home_visit vs both)
   * - Staff filtering and assignment
   * - Full day booking limits (1 booking per day)
   * - Daily quota per staff
   * - Travel time blocking between appointments
   * - Staff leave/vacation checking
   */
  static async getAvailabilityWithStaff(
    tenantId: string,
    serviceId: string,
    date: string,
    staffId?: string
  ): Promise<AvailabilityResponse | null> {
    try {
      const { StaffAvailabilityService } = await import('@/lib/booking/staff-availability-service');

      const supabase = getSupabaseClient();

      const service = await this.getService(tenantId, serviceId);
      if (!service) {
        return null;
      }

      // Get business hours
      const { data: businessHoursData } = await supabase
        .from('business_hours')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      // Parse date
      const [year, month, day] = date.split('-').map(Number);
      const bookingDate = new Date(year, month - 1, day);
      bookingDate.setHours(0, 0, 0, 0);

      const dayOfWeek = bookingDate.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayKey = dayNames[dayOfWeek];

      const schedule = businessHoursData?.schedule || {};
      let dayHours = schedule[dayKey] || schedule[dayKey.charAt(0).toUpperCase() + dayKey.slice(1)];

      if (!dayHours) {
        const matchKey = Object.keys(schedule).find(key => key.toLowerCase() === dayKey.toLowerCase());
        dayHours = matchKey ? schedule[matchKey] : null;
      }

      if (!dayHours) {
        dayHours = { isOpen: true, openTime: '08:00', closeTime: '17:00' };
      }

      if (!dayHours.isOpen) {
        return {
          date,
          slots: [],
          businessHours: { isOpen: false }
        };
      }

      // Check if date is blocked
      const isBlocked = await BlockedDatesService.isDateBlocked(tenantId, bookingDate);
      if (isBlocked) {
        return {
          date,
          slots: [],
          businessHours: { isOpen: true, isBlocked: true }
        };
      }

      // Determine which staff to check
      let staffToCheck: string[] = [];

      if (staffId) {
        // Specific staff requested
        const isAvailable = await StaffAvailabilityService.isStaffAvailableOnDate(staffId, bookingDate);
        if (!isAvailable) {
          return { date, slots: [], businessHours: { isOpen: true } };
        }
        staffToCheck = [staffId];
      } else if (service.requiresStaffAssignment || service.serviceType === 'home_visit') {
        // Get qualified staff
        const qualifiedStaff = await StaffAvailabilityService.getStaffForService(tenantId, serviceId);

        // Filter available staff
        const availableStaff: string[] = [];
        for (const staff of qualifiedStaff) {
          const isAvailable = await StaffAvailabilityService.isStaffAvailableOnDate(staff.id, bookingDate);
          if (isAvailable) {
            availableStaff.push(staff.id);
          }
        }

        if (availableStaff.length === 0) {
          return { date, slots: [], businessHours: { isOpen: true } };
        }

        staffToCheck = availableStaff;
      }

      const [startHourStr, startMinStr] = dayHours.openTime.split(':').map(Number);
      const [endHourStr, endMinStr] = dayHours.closeTime.split(':').map(Number);

      const startOfDay = new Date(bookingDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(bookingDate);
      endOfDay.setHours(23, 59, 59, 999);

      const timezone = businessHoursData?.timezone || 'Asia/Jakarta';
      const timezoneOffsets: Record<string, number> = {
        'Asia/Jakarta': 7,
        'Asia/Bangkok': 7,
        'Asia/Ho_Chi_Minh': 7,
        'UTC': 0,
        'America/New_York': -5,
        'America/Chicago': -6,
        'America/Los_Angeles': -8,
        'Europe/London': 0,
        'Europe/Paris': 1,
      };

      const tzOffset = timezoneOffsets[timezone] || 7;

      const startDate = new Date(bookingDate);
      startDate.setHours(startHourStr, startMinStr, 0, 0);
      startDate.setHours(startDate.getHours() - tzOffset);

      const endDate = new Date(bookingDate);
      endDate.setHours(endHourStr, endMinStr, 0, 0);
      endDate.setHours(endDate.getHours() - tzOffset);

      // Get service duration and configuration
      const serviceDuration = service.duration;
      const slotDurationMinutes = service.slotDurationMinutes || 30;
      const isFullDayBooking = service.homeVisitFullDayBooking || false;
      const bufferMinutes = service.homeVisitMinBufferMinutes || 0;
      const dailyQuota = service.dailyQuotaPerStaff;

      const slots: TimeSlot[] = [];

      // If full day booking, only return 1 slot per day per staff
      if (isFullDayBooking) {
        // Check if any staff already has a booking for this day
        let hasBooking = false;

        if (staffId) {
          const bookingCount = await StaffAvailabilityService.getStaffBookingCountOnDate(
            tenantId,
            staffId,
            bookingDate
          );
          hasBooking = bookingCount > 0;
        } else {
          // Check any available staff
          for (const stfId of staffToCheck) {
            const bookingCount = await StaffAvailabilityService.getStaffBookingCountOnDate(
              tenantId,
              stfId,
              bookingDate
            );
            if (bookingCount > 0) {
              hasBooking = true;
              break;
            }
          }
        }

        if (!hasBooking) {
          // Return one slot starting at business open time
          slots.push({
            start: new Date(startDate),
            end: new Date(startDate.getTime() + serviceDuration * 60000),
            available: true
          });
        }

        return {
          date,
          slots,
          businessHours: { isOpen: true, openTime: dayHours.openTime, closeTime: dayHours.closeTime }
        };
      }

      // Multiple bookings per day - generate slots with travel time blocking
      const staffBookings: Map<string, any[]> = new Map();

      // Fetch all confirmed bookings for this service on this date for each staff
      if (staffId) {
        const bookings = await StaffAvailabilityService.getStaffBookingsOnDate(
          tenantId,
          staffId,
          bookingDate
        );
        staffBookings.set(staffId, bookings);
      } else {
        for (const stfId of staffToCheck) {
          const bookings = await StaffAvailabilityService.getStaffBookingsOnDate(
            tenantId,
            stfId,
            bookingDate
          );
          staffBookings.set(stfId, bookings);
        }
      }



      // Generate slots
      let currentTime = new Date(startDate);

      while (currentTime < endDate) {
        const slotStart = new Date(currentTime);
        const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

        // Check if slot would go past business hours
        if (slotEnd > endDate) {
          break;
        }

        // Check availability for the first available staff (or specific staff if provided)
        let isAvailable = false;

        const staffToCheck1 = staffId ? [staffId] : Array.from(staffBookings.keys());

        for (const stfId of staffToCheck1) {
          const bookings = staffBookings.get(stfId) || [];

          // Check daily quota
          if (dailyQuota && bookings.length >= dailyQuota) {
            continue; // This staff reached quota, try next
          }

          // Check time conflicts with travel buffer
          let hasConflict = false;

          for (const booking of bookings) {
            const bookingStart = new Date(booking.scheduled_at);
            const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60000);

            // Apply travel buffer to existing booking
            const bookingStartWithBuffer = new Date(bookingStart.getTime() - bufferMinutes * 60000);
            const bookingEndWithBuffer = new Date(bookingEnd.getTime() + bufferMinutes * 60000);

            // Check overlap
            if (slotStart < bookingEndWithBuffer && slotEnd > bookingStartWithBuffer) {
              hasConflict = true;
              break;
            }
          }

          if (!hasConflict) {
            isAvailable = true;
            break; // Found available slot for this or any staff
          }
        }

        slots.push({
          start: slotStart,
          end: slotEnd,
          available: isAvailable
        });

        // Move to next slot
        currentTime = new Date(currentTime.getTime() + slotDurationMinutes * 60000);
      }

      return {
        date,
        slots,
        businessHours: { isOpen: true, openTime: dayHours.openTime, closeTime: dayHours.closeTime }
      };
    } catch (error) {
      console.error('Error in getAvailabilityWithStaff:', error);
      return null;
    }
  }
}
