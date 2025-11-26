import { BookingHistoryService } from '@/lib/booking/booking-history-service';
import { getSupabaseClient, randomUUID, mapToBooking } from './utils';
import { calculatePaymentStatus } from './pricing';
import { Booking, RecordPaymentParams, BookingResult } from './types';

export async function recordInitialPayment(
  bookingId: string,
  tenantId: string,
  dpAmount: number,
  paymentMethod: string,
  paymentReference?: string
): Promise<void> {
  if (dpAmount <= 0 || !paymentMethod) return;

  const supabase = getSupabaseClient();
  const paymentId = randomUUID();
  
  const dpPaymentRecord = {
    id: paymentId,
    booking_id: bookingId,
    tenant_id: tenantId,
    payment_amount: Number(dpAmount),
    payment_method: paymentMethod,
    payment_reference: paymentReference || null,
    notes: 'Down Payment (DP)',
    paid_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  console.log('[recordInitialPayment] Attempting to record DP payment:', {
    paymentId,
    bookingId,
    tenantId,
    dpAmount,
    paymentMethod
  });

  const { error: paymentError, data: paymentData, status: paymentStatus } = await supabase
    .from('booking_payments')
    .insert([dpPaymentRecord])
    .select()
    .single();

  if (paymentError) {
    console.error('[recordInitialPayment] Failed to record DP payment:', {
      error: paymentError.message,
      code: paymentError.code,
      status: paymentStatus,
      details: paymentError.details,
      hint: paymentError.hint
    });
  } else {
    console.log('[recordInitialPayment] DP payment recorded successfully:', {
      paymentId,
      paymentData,
      status: paymentStatus
    });
  }
}

export async function recordPayment(params: RecordPaymentParams): Promise<BookingResult> {
  const { tenantId, bookingId, paymentAmount, paymentMethod, paymentReference, notes } = params;

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

    // Determine new payment status
    const paymentStatus = calculatePaymentStatus(newPaidAmount, totalAmount);

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
    await BookingHistoryService.logPaymentRecorded(tenantId, bookingId, {
      paymentAmount,
      paymentMethod: paymentMethod || 'unknown',
      notes: notes || '',
      isDownPayment: false
    });

    return { booking: mapToBooking(updatedBooking) };
  } catch (error) {
    console.error('Error recording payment:', error);
    return { error: error instanceof Error ? error.message : 'Failed to record payment' };
  }
}
