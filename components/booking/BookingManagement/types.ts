import { Booking, Service, Customer, TimeSlot } from '@/types/booking';
import { PaymentStatus } from '@/types/booking';
import { ReminderTemplate } from '@/lib/reminder/reminder-service';

export { PaymentStatus };

export interface BookingManagementProps {
  tenantId: string;
  services: Service[];
  customers: Customer[];
  onBookingCreate?: (booking: Partial<Booking>) => void;
  onBookingUpdate?: (bookingId: string, updates: Partial<Booking>) => void;
  onBookingDelete?: (bookingId: string) => void;
  className?: string;
}

export interface RefundData {
  amount: number;
  notes: string;
  refundType: 'full' | 'partial';
}

export interface ReminderSettings {
  enableBookingConfirmation: boolean;
  enablePaymentReminder: boolean;
  enableArrivalReminder: boolean;
  enableRescheduleNotification: boolean;
  enableCancellationNotification: boolean;
  enableFollowUp: boolean;
  paymentReminderTiming: number;
  arrivalReminder1Day: boolean;
  arrivalReminder2Hours: boolean;
  arrivalReminder30Minutes: boolean;
}

export interface BookingManagementState {
  bookings: Booking[];
  selectedDate: Date;
  selectedSlot: TimeSlot | undefined;
  selectedService: Service | undefined;
  selectedBooking: Booking | undefined;
  showBookingDetails: boolean;
  isEditMode: boolean;
  showRefundForm: boolean;
  refundData: RefundData;
  editingBooking: Partial<Booking> | null;
  loading: boolean;
  updating: boolean;
  activeTab: string;
  scheduleViewMode: 'day' | 'week';
  showNewBookingDialog: boolean;
  showReminderDialog: boolean;
  reminderTemplates: ReminderTemplate[];
  selectedTemplate: ReminderTemplate | null;
  sendingReminder: boolean;
  reminderSettings: ReminderSettings | null;
  showReminderSettings: boolean;
}

export type { Booking, Service, Customer, TimeSlot, ReminderTemplate };
