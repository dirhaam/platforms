import { BookingHistoryService } from '@/lib/booking/booking-history-service';
import { getSupabaseClient, randomUUID, generateBookingNumber, mapToBooking } from './utils';
import { calculateTravelData, calculatePricing, calculatePaymentStatus } from './pricing';
import { 
  validateService, 
  validateCustomer, 
  validateBookingDateTime, 
  validateHomeVisit,
  validateStaffAssignment 
} from './validation';
import { recordInitialPayment } from './payments';
import { updateCustomerBookingStats } from './crud';
import { CreateBookingRequest, Booking, BookingResult, BookingStatus } from './types';

export async function createBooking(
  tenantId: string,
  data: CreateBookingRequest
): Promise<BookingResult> {
  try {
    const supabase = getSupabaseClient();

    // Validate service
    const serviceValidation = await validateService(tenantId, data.serviceId);
    if (!serviceValidation.valid) {
      return { error: serviceValidation.error };
    }
    const service = serviceValidation.data;

    // Validate customer
    const customerValidation = await validateCustomer(tenantId, data.customerId);
    if (!customerValidation.valid) {
      return { error: customerValidation.error };
    }

    const scheduledAt = new Date(data.scheduledAt);

    // Validate booking date/time
    const dateTimeValidation = await validateBookingDateTime(tenantId, scheduledAt);
    if (!dateTimeValidation.valid) {
      return { error: dateTimeValidation.error };
    }

    // Calculate travel data for home visits
    let travelData = { travelSurcharge: 0, travelDistance: 0, travelDuration: 0 };
    
    if (data.isHomeVisit && data.homeVisitAddress) {
      const hasFrontendTravelData = 'travelSurchargeAmount' in data || 'travelDistance' in data || 'travelDuration' in data;
      
      console.log('[createBooking] Travel data check:', { 
        hasFrontendTravelData, 
        travelSurcharge: (data as any).travelSurchargeAmount,
        travelDistance: (data as any).travelDistance,
        travelDuration: (data as any).travelDuration
      });
      
      if (!hasFrontendTravelData) {
        travelData = await calculateTravelData(tenantId, data.serviceId, data.homeVisitAddress);
      } else {
        travelData = {
          travelSurcharge: (data as any).travelSurchargeAmount ?? 0,
          travelDistance: (data as any).travelDistance ?? 0,
          travelDuration: (data as any).travelDuration ?? 0
        };
        console.log('[createBooking] Using frontend-provided travel data:', travelData);
      }
    }

    // Calculate pricing
    const basePrice = Number(service.price);
    const pricing = await calculatePricing(tenantId, basePrice, travelData.travelSurcharge);

    // Calculate payment amounts
    const dpAmount = (data as any).dpAmount || 0;
    const paidAmount = dpAmount > 0 ? dpAmount : 0;
    const paymentStatus = calculatePaymentStatus(paidAmount, pricing.totalAmount);

    // Validate home visit if applicable
    let staffIdToAssign: string | null = data.staffId || null;
    let travelTimeBeforeMinutes = 0;
    let travelTimeAfterMinutes = 0;

    if (data.isHomeVisit) {
      // Enable auto-assign by default for home visits
      const autoAssignStaff = (data as any).autoAssignStaff !== false;
      
      const homeVisitValidation = await validateHomeVisit(
        tenantId, 
        service, 
        scheduledAt, 
        staffIdToAssign,
        { autoAssignStaff }
      );
      
      if (!homeVisitValidation.valid) {
        return { error: homeVisitValidation.error };
      }

      // Use auto-assigned staff if available
      if (homeVisitValidation.autoAssignedStaffId && !staffIdToAssign) {
        staffIdToAssign = homeVisitValidation.autoAssignedStaffId;
        console.log(`[createBooking] Using auto-assigned staff: ${homeVisitValidation.autoAssignedStaffName} (${staffIdToAssign})`);
      }

      travelTimeBeforeMinutes = homeVisitValidation.travelTimeMinutes || 30;
      travelTimeAfterMinutes = homeVisitValidation.travelTimeMinutes || 30;

      // Validate staff assignment if staff is assigned (either manual or auto)
      if (staffIdToAssign) {
        const staffValidation = await validateStaffAssignment(
          tenantId,
          staffIdToAssign,
          data.serviceId,
          scheduledAt,
          service.duration,
          travelTimeBeforeMinutes,
          travelTimeAfterMinutes
        );

        if (!staffValidation.valid) {
          return { error: staffValidation.error };
        }
      }
    }

    // Create the booking
    const bookingId = randomUUID();
    const bookingNumber = generateBookingNumber();
    const now = new Date();

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
        total_amount: pricing.totalAmount,
        tax_percentage: pricing.taxPercentage,
        service_charge_amount: pricing.serviceChargeAmount,
        additional_fees_amount: pricing.additionalFeesAmount,
        travel_surcharge_amount: travelData.travelSurcharge,
        travel_distance: travelData.travelDistance,
        travel_duration: travelData.travelDuration,
        travel_time_minutes_before: travelTimeBeforeMinutes,
        travel_time_minutes_after: travelTimeAfterMinutes,
        status: BookingStatus.PENDING,
        payment_status: paymentStatus,
        reminders_sent: [],
        dp_amount: dpAmount,
        paid_amount: paidAmount,
        payment_method: (data as any).paymentMethod || null,
        payment_reference: (data as any).paymentReference || null,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      })
      .select()
      .single();

    // Record initial DP payment if provided
    if (dpAmount > 0 && (data as any).paymentMethod) {
      await recordInitialPayment(
        bookingId,
        tenantId,
        dpAmount,
        (data as any).paymentMethod,
        (data as any).paymentReference
      );
    }

    if (insertError || !newBooking) {
      console.error('[createBooking] Insert failed:', {
        insertError,
        newBooking,
        paymentMethod: (data as any).paymentMethod,
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
      console.error('[createBooking] Failed to fetch customer:', { customerId: bookingData.customer_id, error: customerFetchError });
      return { error: 'Failed to retrieve customer data' };
    }

    // Get service data
    const { data: serviceDataResult, error: serviceFetchError } = await supabase
      .from('services')
      .select('*')
      .eq('id', bookingData.service_id)
      .single();

    if (serviceFetchError || !serviceDataResult) {
      console.error('[createBooking] Failed to fetch service:', { serviceId: bookingData.service_id, error: serviceFetchError });
      return { error: 'Failed to retrieve service data' };
    }

    const booking = {
      ...bookingData,
      customer: customerDataResult,
      service: serviceDataResult
    };

    // Update customer's total bookings count
    await updateCustomerBookingStats(data.customerId);

    // Log booking created event
    await BookingHistoryService.logBookingCreated(tenantId, bookingId, {
      bookingNumber,
      totalAmount: pricing.totalAmount,
      dpAmount,
      serviceId: data.serviceId,
      paymentMethod: (data as any).paymentMethod
    });

    return { booking: mapToBooking(booking) };
  } catch (error) {
    console.error('Error creating booking:', error);
    return { error: 'Failed to create booking' };
  }
}
