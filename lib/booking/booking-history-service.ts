import { getSupabaseClient } from '@/lib/supabase/client';

export interface BookingHistoryEvent {
  id: string;
  bookingId: string;
  tenantId: string;
  action: string;
  description?: string;
  actor: string;
  actorType: 'system' | 'user' | 'admin';
  oldValues?: any;
  newValues?: any;
  metadata?: any;
  createdAt: Date;
}

export interface CreateHistoryEventRequest {
  bookingId: string;
  tenantId: string;
  action: string;
  description?: string;
  actor?: string;
  actorType?: 'system' | 'user' | 'admin';
  oldValues?: any;
  newValues?: any;
  metadata?: any;
}

export class BookingHistoryService {
  /**
   * Log a booking history event
   */
  static async logEvent(data: CreateHistoryEventRequest): Promise<BookingHistoryEvent | null> {
    try {
      const supabase = getSupabaseClient();
      
      console.log('[BookingHistoryService.logEvent] 📝 Logging event:', {
        bookingId: data.bookingId,
        action: data.action,
        actor: data.actor || 'System'
      });

      const { data: event, error } = await supabase
        .from('booking_history')
        .insert({
          booking_id: data.bookingId,
          tenant_id: data.tenantId,
          action: data.action,
          description: data.description,
          actor: data.actor || 'System',
          actor_type: data.actorType || 'system',
          old_values: data.oldValues,
          new_values: data.newValues,
          metadata: data.metadata
        })
        .select()
        .single();

      if (error) {
        console.error('[BookingHistoryService.logEvent] ❌ Error logging event:', {
          action: data.action,
          error: error.message,
          code: error.code
        });
        return null;
      }

      console.log('[BookingHistoryService.logEvent] ✅ Event logged:', {
        eventId: event?.id,
        action: data.action
      });

      return this.mapHistoryEvent(event);
    } catch (error) {
      console.error('[BookingHistoryService.logEvent] ❌ Exception:', error);
      return null;
    }
  }

  /**
   * Get booking history
   */
  static async getBookingHistory(
    tenantId: string,
    bookingId: string,
    limit: number = 50
  ): Promise<BookingHistoryEvent[]> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('booking_history')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[BookingHistoryService.getBookingHistory] ❌ Error fetching history:', {
          bookingId,
          error: error.message
        });
        return [];
      }

      if (!data || data.length === 0) {
        console.log('[BookingHistoryService.getBookingHistory] ℹ️  No history found for booking:', { bookingId });
        return [];
      }

      console.log('[BookingHistoryService.getBookingHistory] ✅ History fetched:', {
        bookingId,
        eventCount: data.length
      });

      return data.map(event => this.mapHistoryEvent(event));
    } catch (error) {
      console.error('[BookingHistoryService.getBookingHistory] ❌ Exception:', error);
      return [];
    }
  }

  /**
   * Map database record to BookingHistoryEvent
   */
  private static mapHistoryEvent(data: any): BookingHistoryEvent {
    return {
      id: data.id,
      bookingId: data.booking_id,
      tenantId: data.tenant_id,
      action: data.action,
      description: data.description,
      actor: data.actor,
      actorType: data.actor_type as 'system' | 'user' | 'admin',
      oldValues: data.old_values,
      newValues: data.new_values,
      metadata: data.metadata,
      createdAt: new Date(data.created_at)
    };
  }

  /**
   * Helper: Log booking created
   */
  static async logBookingCreated(tenantId: string, bookingId: string, bookingData: any): Promise<void> {
    await this.logEvent({
      bookingId,
      tenantId,
      action: 'BOOKING_CREATED',
      description: `Booking created - ${bookingData.bookingNumber || bookingId}`,
      metadata: {
        totalAmount: bookingData.totalAmount,
        dpAmount: bookingData.dpAmount,
        serviceId: bookingData.serviceId
      }
    });
  }

  /**
   * Helper: Log status change
   */
  static async logStatusChanged(
    tenantId: string,
    bookingId: string,
    oldStatus: string,
    newStatus: string
  ): Promise<void> {
    await this.logEvent({
      bookingId,
      tenantId,
      action: 'STATUS_CHANGED',
      description: `Status changed from ${oldStatus} to ${newStatus}`,
      oldValues: { status: oldStatus },
      newValues: { status: newStatus }
    });
  }

  /**
   * Helper: Log payment recorded
   */
  static async logPaymentRecorded(
    tenantId: string,
    bookingId: string,
    paymentData: any
  ): Promise<void> {
    await this.logEvent({
      bookingId,
      tenantId,
      action: 'PAYMENT_RECORDED',
      description: `Payment recorded - ${paymentData.paymentMethod} ${paymentData.paymentAmount}`,
      metadata: {
        paymentAmount: paymentData.paymentAmount,
        paymentMethod: paymentData.paymentMethod,
        notes: paymentData.notes,
        isDownPayment: paymentData.isDownPayment
      }
    });
  }

  /**
   * Helper: Log invoice generated
   */
  static async logInvoiceGenerated(
    tenantId: string,
    bookingId: string,
    invoiceData: any
  ): Promise<void> {
    await this.logEvent({
      bookingId,
      tenantId,
      action: 'INVOICE_GENERATED',
      description: `Invoice generated - ${invoiceData.invoiceNumber}`,
      metadata: {
        invoiceId: invoiceData.invoiceId,
        invoiceNumber: invoiceData.invoiceNumber,
        totalAmount: invoiceData.totalAmount
      }
    });
  }

  /**
   * Helper: Log invoice sent
   */
  static async logInvoiceSent(
    tenantId: string,
    bookingId: string,
    invoiceData: any
  ): Promise<void> {
    await this.logEvent({
      bookingId,
      tenantId,
      action: 'INVOICE_SENT',
      description: `Invoice sent - ${invoiceData.invoiceNumber}`,
      metadata: {
        invoiceId: invoiceData.invoiceId,
        invoiceNumber: invoiceData.invoiceNumber,
        method: invoiceData.method || 'email'
      }
    });
  }
}
