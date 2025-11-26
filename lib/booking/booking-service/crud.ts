import { BookingHistoryService } from '@/lib/booking/booking-history-service';
import { getSupabaseClient, mapToBooking } from './utils';
import { Booking, BookingQueryOptions, UpdateBookingRequest, BookingResult, DeleteResult, Service } from './types';

export async function getBookings(tenantId: string, options: BookingQueryOptions = {}): Promise<Booking[]> {
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

export async function getBooking(tenantId: string, bookingId: string): Promise<Booking | null> {
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

export async function updateBooking(
  tenantId: string,
  bookingId: string,
  data: UpdateBookingRequest
): Promise<BookingResult> {
  try {
    const supabase = getSupabaseClient();

    const booking = await getBooking(tenantId, bookingId);
    if (!booking) {
      return { error: 'Booking not found' };
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

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

export async function deleteBooking(tenantId: string, bookingId: string): Promise<DeleteResult> {
  try {
    const supabase = getSupabaseClient();

    const booking = await getBooking(tenantId, bookingId);
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

export async function getService(tenantId: string, serviceId: string): Promise<Service | null> {
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

export async function updateCustomerBookingStats(customerId: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
    const { data: currentCustomer } = await supabase
      .from('customers')
      .select('total_bookings')
      .eq('id', customerId)
      .single();

    if (currentCustomer) {
      await supabase
        .from('customers')
        .update({
          total_bookings: (currentCustomer.total_bookings || 0) + 1,
          last_booking_at: new Date().toISOString()
        })
        .eq('id', customerId);
    }
  } catch (error) {
    console.error('Error updating customer booking stats:', error);
  }
}
