import { ReminderTemplate, getTemplateById, processTemplate, getAllActiveTemplates } from '@/lib/templates/reminder-templates';
import { Booking, Service, Customer } from '@/types/booking';

// Re-export ReminderTemplate for use in other components
export type { ReminderTemplate };

export interface ReminderSchedule {
  id: string;
  bookingId: string;
  templateId: string;
  scheduledAt: Date;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  phoneNumber: string;
  message: string;
  variables: Record<string, string>;
  tenantId: string;
  retryCount?: number;
  maxRetries?: number;
}

export interface ReminderSettings {
  enableBookingConfirmation: boolean;
  enablePaymentReminder: boolean;
  enableArrivalReminder: boolean;
  enableRescheduleNotification: boolean;
  enableCancellationNotification: boolean;
  enableFollowUp: boolean;
  
  // Timing settings (in minutes/hours before event)
  paymentReminderTiming: number;
  arrivalReminder1Day: boolean;
  arrivalReminder2Hours: boolean;
  arrivalReminder30Minutes: boolean;
  followUpAfterService: boolean;
  followUpReviewRequest: boolean;
  
  // Custom templates
  customTemplates: ReminderTemplate[];
}

export class ReminderService {
  private static instance: ReminderService;
  private schedules: Map<string, ReminderSchedule> = new Map();
  private settings: Map<string, ReminderSettings> = new Map();

  static getInstance(): ReminderService {
    if (!ReminderService.instance) {
      ReminderService.instance = new ReminderService();
    }
    return ReminderService.instance;
  }

  // Get default settings
  private getDefaultSettings(): ReminderSettings {
    return {
      enableBookingConfirmation: true,
      enablePaymentReminder: true,
      enableArrivalReminder: true,
      enableRescheduleNotification: true,
      enableCancellationNotification: true,
      enableFollowUp: true,
      
      paymentReminderTiming: 24, // 24 hours before
      arrivalReminder1Day: true,
      arrivalReminder2Hours: true,
      arrivalReminder30Minutes: true,
      followUpAfterService: true,
      followUpReviewRequest: true,
      
      customTemplates: []
    };
  }

  // Get tenant settings
  getTenantSettings(tenantId: string): ReminderSettings {
    if (!this.settings.has(tenantId)) {
      this.settings.set(tenantId, this.getDefaultSettings());
    }
    return this.settings.get(tenantId)!;
  }

  // Update tenant settings
  updateTenantSettings(tenantId: string, settings: Partial<ReminderSettings>): void {
    const currentSettings = this.getTenantSettings(tenantId);
    this.settings.set(tenantId, { ...currentSettings, ...settings });
  }

  // Extract variables from booking data
  private extractVariables(booking: Booking, customer?: Customer, service?: Service): Record<string, string> {
    const bookingDate = new Date(booking.scheduledAt).toLocaleDateString('id-ID');
    const bookingTime = new Date(booking.scheduledAt).toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const bookingDateTime = new Date(booking.scheduledAt).toLocaleString('id-ID');

    return {
      customerName: customer?.name || 'Pelanggan',
      customerPhone: customer?.phone || '',
      customerEmail: customer?.email || '',
      serviceName: service?.name || 'Layanan',
      serviceDescription: service?.description || '',
      bookingDate,
      bookingTime,
      bookingDateTime,
      location: booking.isHomeVisit ? booking.homeVisitAddress || 'Alamat Pelanggan' : 'Klinik/Kami',
      homeVisitAddress: booking.homeVisitAddress || '',
      totalAmount: booking.totalAmount.toLocaleString('id-ID'),
      duration: `${booking.duration} menit`,
      paymentStatus: booking.paymentStatus,
      paymentMethod: this.extractPaymentMethod(booking.notes),
      bookingId: booking.id,
      status: booking.status,
      notes: booking.notes || '',
      
      // Calculated variables
      daysOverdue: this.calculateDaysOverdue(booking),
      refundMessage: this.generateRefundMessage(booking),
      
      // For reschedule
      oldDateTime: bookingDateTime, // This would be updated when rescheduling
      newDateTime: bookingDateTime, // This would be updated when rescheduling
    };
  }

  private extractPaymentMethod(notes?: string): string {
    if (!notes) return 'Tidak diketahui';
    
    const paymentMatch = notes.match(/Payment method:\s*(\w+)/i);
    return paymentMatch ? paymentMatch[1] : 'Tidak diketahui';
  }

  private calculateDaysOverdue(booking: Booking): string {
    if (booking.paymentStatus === 'paid') return '0';
    
    const bookingDate = new Date(booking.scheduledAt);
    const today = new Date();
    const diffTime = today.getTime() - bookingDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays.toString() : '0';
  }

  private generateRefundMessage(booking: Booking): string {
    if (booking.paymentStatus !== 'paid') {
      return 'Tidak ada refund karena pembayaran belum dilakukan.';
    }
    
    return 'Proses refund akan dilakukan dalam 3-5 hari kerja. Mohon menunggu konfirmasi dari kami.';
  }

  // Schedule reminders for a booking
  async scheduleRemindersForBooking(
    tenantId: string,
    booking: Booking,
    customer?: Customer,
    service?: Service
  ): Promise<ReminderSchedule[]> {
    const settings = this.getTenantSettings(tenantId);
    const variables = this.extractVariables(booking, customer, service);
    const scheduledReminders: ReminderSchedule[] = [];

    // Booking Confirmation (immediate)
    if (settings.enableBookingConfirmation && booking.status === 'confirmed') {
      const template = getTemplateById('booking_confirmation_' + (booking.isHomeVisit ? '2' : '1'));
      if (template) {
        const schedule = this.createReminderSchedule({
          tenantId,
          bookingId: booking.id,
          template,
          scheduledAt: new Date(), // Send immediately
          phoneNumber: customer?.phone || '',
          variables
        });
        scheduledReminders.push(schedule);
      }
    }

    // Payment Reminder
    if (settings.enablePaymentReminder && booking.paymentStatus === 'pending') {
      const template = getTemplateById('payment_reminder_1');
      if (template) {
        const reminderTime = new Date(booking.scheduledAt);
        reminderTime.setHours(reminderTime.getHours() - settings.paymentReminderTiming);
        
        if (reminderTime > new Date()) {
          const schedule = this.createReminderSchedule({
            tenantId,
            bookingId: booking.id,
            template,
            scheduledAt: reminderTime,
            phoneNumber: customer?.phone || '',
            variables
          });
          scheduledReminders.push(schedule);
        }
      }
    }

    // Arrival Reminders
    if (settings.enableArrivalReminder) {
      const bookingTime = new Date(booking.scheduledAt);
      
      // 1 day before
      if (settings.arrivalReminder1Day) {
        const template = getTemplateById('arrival_reminder_1');
        if (template) {
          const reminderTime = new Date(bookingTime);
          reminderTime.setDate(reminderTime.getDate() - 1);
          
          if (reminderTime > new Date()) {
            const schedule = this.createReminderSchedule({
              tenantId,
              bookingId: booking.id,
              template,
              scheduledAt: reminderTime,
              phoneNumber: customer?.phone || '',
              variables
            });
            scheduledReminders.push(schedule);
          }
        }
      }

      // 2 hours before
      if (settings.arrivalReminder2Hours) {
        const template = getTemplateById('arrival_reminder_2');
        if (template) {
          const reminderTime = new Date(bookingTime);
          reminderTime.setHours(reminderTime.getHours() - 2);
          
          if (reminderTime > new Date()) {
            const schedule = this.createReminderSchedule({
              tenantId,
              bookingId: booking.id,
              template,
              scheduledAt: reminderTime,
              phoneNumber: customer?.phone || '',
              variables
            });
            scheduledReminders.push(schedule);
          }
        }
      }

      // 30 minutes before
      if (settings.arrivalReminder30Minutes) {
        const template = getTemplateById('arrival_reminder_3');
        if (template) {
          const reminderTime = new Date(bookingTime);
          reminderTime.setMinutes(reminderTime.getMinutes() - 30);
          
          if (reminderTime > new Date()) {
            const schedule = this.createReminderSchedule({
              tenantId,
              bookingId: booking.id,
              template,
              scheduledAt: reminderTime,
              phoneNumber: customer?.phone || '',
              variables
            });
            scheduledReminders.push(schedule);
          }
        }
      }
    }

    // Follow Up (after service)
    if (settings.enableFollowUp && booking.status === 'completed') {
      const bookingTime = new Date(booking.scheduledAt);
      
      // 2 hours after
      if (settings.followUpAfterService) {
        const template = getTemplateById('follow_up_1');
        if (template) {
          const reminderTime = new Date(bookingTime);
          reminderTime.setHours(reminderTime.getHours() + 2);
          
          const schedule = this.createReminderSchedule({
            tenantId,
            bookingId: booking.id,
            template,
            scheduledAt: reminderTime,
            phoneNumber: customer?.phone || '',
            variables
          });
          scheduledReminders.push(schedule);
        }
      }

      // 24 hours after (review request)
      if (settings.followUpReviewRequest) {
        const template = getTemplateById('follow_up_2');
        if (template) {
          const reminderTime = new Date(bookingTime);
          reminderTime.setHours(reminderTime.getHours() + 24);
          
          const schedule = this.createReminderSchedule({
            tenantId,
            bookingId: booking.id,
            template,
            scheduledAt: reminderTime,
            phoneNumber: customer?.phone || '',
            variables
          });
          scheduledReminders.push(schedule);
        }
      }
    }

    // Store all scheduled reminders
    scheduledReminders.forEach(schedule => {
      this.schedules.set(schedule.id, schedule);
    });

    return scheduledReminders;
  }

  // Create a reminder schedule
  private createReminderSchedule(params: {
    tenantId: string;
    bookingId: string;
    template: ReminderTemplate;
    scheduledAt: Date;
    phoneNumber: string;
    variables: Record<string, string>;
  }): ReminderSchedule {
    const message = processTemplate(params.template.template, params.variables);
    
    return {
      id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      bookingId: params.bookingId,
      templateId: params.template.id,
      scheduledAt: params.scheduledAt,
      status: 'pending',
      phoneNumber: params.phoneNumber,
      message,
      variables: params.variables,
      tenantId: params.tenantId,
      retryCount: 0,
      maxRetries: 3
    };
  }

  // Send immediate reminder (for manual triggers)
  async sendImmediateReminder(
    tenantId: string,
    templateId: string,
    booking: Booking,
    customer?: Customer,
    service?: Service
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const template = getTemplateById(templateId);
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      const variables = this.extractVariables(booking, customer, service);
      const message = processTemplate(template.template, variables);

      // Send via WhatsApp notification API
      const response = await fetch('/api/notifications/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: customer?.phone,
          message,
          tenantId,
          type: template.type,
          bookingId: booking.id,
          customerId: customer?.id
        })
      });

      if (response.ok) {
        return { success: true, message: 'Reminder sent successfully' };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to send reminder' };
      }
    } catch (error) {
      console.error('Error sending immediate reminder:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // Get scheduled reminders for tenant
  getScheduledReminders(tenantId: string): ReminderSchedule[] {
    return Array.from(this.schedules.values())
      .filter(schedule => schedule.tenantId === tenantId)
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  }

  // Get pending reminders
  getPendingReminders(tenantId: string): ReminderSchedule[] {
    return this.getScheduledReminders(tenantId)
      .filter(schedule => schedule.status === 'pending' && schedule.scheduledAt <= new Date());
  }

  // Cancel reminder
  cancelReminder(reminderId: string): boolean {
    const schedule = this.schedules.get(reminderId);
    if (schedule) {
      schedule.status = 'cancelled';
      this.schedules.set(reminderId, schedule);
      return true;
    }
    return false;
  }

  // Get all templates
  getAllTemplates(): ReminderTemplate[] {
    return getAllActiveTemplates();
  }

  // Get templates by type
  getTemplatesByType(type: ReminderTemplate['type']): ReminderTemplate[] {
    return getAllActiveTemplates().filter(template => template.type === type);
  }
}

// Export singleton instance
export const reminderService = ReminderService.getInstance();
