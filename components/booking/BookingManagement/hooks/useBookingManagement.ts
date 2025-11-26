'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Booking, Service, Customer, TimeSlot, PaymentStatus, ReminderTemplate, RefundData, ReminderSettings } from '../types';

interface UseBookingManagementProps {
  tenantId: string;
  services: Service[];
  customers: Customer[];
  onBookingUpdate?: (bookingId: string, updates: Partial<Booking>) => void;
  onBookingDelete?: (bookingId: string) => void;
}

export function useBookingManagement({
  tenantId,
  services,
  customers,
  onBookingUpdate,
  onBookingDelete,
}: UseBookingManagementProps) {
  // Core state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | undefined>();
  const [selectedService, setSelectedService] = useState<Service | undefined>();
  const [selectedBooking, setSelectedBooking] = useState<Booking | undefined>();
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  // UI state
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundData, setRefundData] = useState<RefundData>({ amount: 0, notes: '', refundType: 'full' });
  const [editingBooking, setEditingBooking] = useState<Partial<Booking> | null>(null);
  const [activeTab, setActiveTab] = useState('calendar');
  const [scheduleViewMode, setScheduleViewMode] = useState<'day' | 'week'>('day');
  const [showNewBookingDialog, setShowNewBookingDialog] = useState(false);

  // Reminder state
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [reminderTemplates, setReminderTemplates] = useState<ReminderTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReminderTemplate | null>(null);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings | null>(null);
  const [showReminderSettings, setShowReminderSettings] = useState(false);

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bookings?tenantId=${encodeURIComponent(tenantId)}`, {
        headers: { 'x-tenant-id': tenantId }
      });

      if (response.ok) {
        const bookingsData = await response.json();
        let bookingsList = bookingsData.bookings || [];

        bookingsList = bookingsList.map((booking: Booking) => {
          const customer = customers.find(c => c.id === booking.customerId);
          const service = services.find(s => s.id === booking.serviceId);
          return { ...booking, customer, service };
        });

        setBookings(bookingsList);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, customers, services]);

  const fetchReminderTemplates = useCallback(async () => {
    try {
      const response = await fetch(`/api/reminders?tenantId=${tenantId}&action=templates`);
      if (response.ok) {
        const data = await response.json();
        setReminderTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching reminder templates:', error);
    }
  }, [tenantId]);

  const fetchReminderSettings = useCallback(async () => {
    try {
      const response = await fetch(`/api/reminders?tenantId=${tenantId}&action=settings`);
      if (response.ok) {
        const data = await response.json();
        setReminderSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching reminder settings:', error);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    fetchReminderTemplates();
    fetchReminderSettings();
  }, [fetchReminderTemplates, fetchReminderSettings]);

  // Helper: Check slot availability
  const isSlotAvailable = useCallback((newDateTime: Date, excludeBookingId?: string): boolean => {
    const newStart = new Date(newDateTime);
    const duration = editingBooking?.duration || selectedBooking?.duration || 60;
    const newEnd = new Date(newStart.getTime() + duration * 60000);

    return !bookings.some(booking => {
      if (excludeBookingId && booking.id === excludeBookingId) return false;
      if (booking.status === 'cancelled') return false;

      const bookingStart = new Date(booking.scheduledAt);
      const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60000);

      return newStart < bookingEnd && newEnd > bookingStart;
    });
  }, [bookings, editingBooking?.duration, selectedBooking?.duration]);

  // Helper: Get bookings for date range
  const getBookingsForDateRange = useCallback((startDate: Date, endDate: Date): Booking[] => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.scheduledAt);
      return bookingDate >= startDate && bookingDate <= endDate;
    });
  }, [bookings]);

  const getTodayBookings = useCallback((): Booking[] => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    return getBookingsForDateRange(startOfDay, endOfDay);
  }, [getBookingsForDateRange]);

  const getUpcomingBookings = useCallback((): Booking[] => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return getBookingsForDateRange(today, nextWeek);
  }, [getBookingsForDateRange]);

  const getBookingsGroupedByDay = useCallback((): Map<string, Booking[]> => {
    const grouped = new Map<string, Booking[]>();
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

      const dayBookings = getBookingsForDateRange(startOfDay, endOfDay);
      if (dayBookings.length > 0) {
        const dateKey = startOfDay.toLocaleDateString();
        grouped.set(dateKey, dayBookings.sort((a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
        ));
      }
    }

    return grouped;
  }, [getBookingsForDateRange]);

  const getBookingsGroupedByWeek = useCallback((): Map<string, Booking[]> => {
    const grouped = new Map<string, Booking[]>();
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(monday.getDate() - monday.getDay() + (monday.getDay() === 0 ? -6 : 1));

    for (let week = 0; week < 12; week++) {
      const weekStart = new Date(monday);
      weekStart.setDate(weekStart.getDate() + week * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59);

      const weekBookings = getBookingsForDateRange(weekStart, weekEnd);
      if (weekBookings.length > 0) {
        const weekKey = `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
        grouped.set(weekKey, weekBookings.sort((a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
        ));
      }
    }

    return grouped;
  }, [getBookingsForDateRange]);

  // Handlers
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(undefined);
  }, []);

  const handleSlotSelect = useCallback((slot: TimeSlot) => {
    setSelectedSlot(slot);
  }, []);

  const handleServiceSelect = useCallback((service: Service) => {
    setSelectedService(service);
    setSelectedSlot(undefined);
  }, []);

  const handleBookingClick = useCallback((booking: Booking) => {
    setSelectedBooking(booking);
    setEditingBooking(null);
    setShowBookingDetails(true);
  }, []);

  const handleUpdateStatus = useCallback(async (newStatus: string) => {
    if (!selectedBooking) return;

    setUpdating(true);
    try {
      onBookingUpdate?.(selectedBooking.id, { status: newStatus as any });
      setSelectedBooking({ ...selectedBooking, status: newStatus as any });
      setEditingBooking(null);
      toast.success(`Booking status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update booking status');
    } finally {
      setUpdating(false);
    }
  }, [selectedBooking, onBookingUpdate]);

  const handleUpdatePayment = useCallback(async (newPaymentStatus: PaymentStatus) => {
    if (!selectedBooking) return;

    setUpdating(true);
    try {
      onBookingUpdate?.(selectedBooking.id, { paymentStatus: newPaymentStatus });
      setSelectedBooking({ ...selectedBooking, paymentStatus: newPaymentStatus });
      setEditingBooking(null);
      toast.success(`Payment status updated to ${newPaymentStatus}`);
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to update payment status');
    } finally {
      setUpdating(false);
    }
  }, [selectedBooking, onBookingUpdate]);

  const handleDeleteBooking = useCallback(async () => {
    if (!selectedBooking) return;
    if (!confirm('Are you sure you want to delete this booking?')) return;

    setUpdating(true);
    try {
      onBookingDelete?.(selectedBooking.id);
      setShowBookingDetails(false);
      setSelectedBooking(undefined);
      toast.success('Booking deleted successfully');
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Failed to delete booking');
    } finally {
      setUpdating(false);
    }
  }, [selectedBooking, onBookingDelete]);

  const handleProcessRefund = useCallback(async () => {
    if (!selectedBooking) return;

    if (!refundData.amount || refundData.amount <= 0) {
      alert('Please enter a refund amount');
      return;
    }

    if (refundData.refundType === 'partial' && refundData.amount > selectedBooking.totalAmount) {
      alert('Refund amount cannot exceed total booking amount');
      return;
    }

    if (!confirm(`Process ${refundData.refundType} refund of IDR ${refundData.amount.toLocaleString('id-ID')}?`)) return;

    setUpdating(true);
    try {
      onBookingUpdate?.(selectedBooking.id, {
        paymentStatus: PaymentStatus.REFUNDED,
        notes: `${refundData.refundType} refund: IDR ${refundData.amount.toLocaleString('id-ID')}. Reason: ${refundData.notes || 'N/A'}`
      });

      setSelectedBooking({ ...selectedBooking, paymentStatus: PaymentStatus.REFUNDED });
      setShowRefundForm(false);
      setRefundData({ amount: 0, notes: '', refundType: 'full' });

      toast.success(`Refund of IDR ${refundData.amount.toLocaleString('id-ID')} processed`);
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Failed to process refund');
    } finally {
      setUpdating(false);
    }
  }, [selectedBooking, refundData, onBookingUpdate]);

  const handleEditClick = useCallback(() => {
    if (selectedBooking) {
      setEditingBooking({
        customerId: selectedBooking.customerId,
        serviceId: selectedBooking.serviceId,
        scheduledAt: selectedBooking.scheduledAt,
        duration: selectedBooking.duration,
        totalAmount: selectedBooking.totalAmount,
        notes: selectedBooking.notes
      });
      setIsEditMode(true);
    }
  }, [selectedBooking]);

  const handleCancelEdit = useCallback(() => {
    setIsEditMode(false);
    setEditingBooking(null);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!selectedBooking || !editingBooking) return;

    if (editingBooking.totalAmount && editingBooking.totalAmount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    if (editingBooking.scheduledAt && new Date(editingBooking.scheduledAt).getTime() !== new Date(selectedBooking.scheduledAt).getTime()) {
      if (!isSlotAvailable(new Date(editingBooking.scheduledAt), selectedBooking.id)) {
        alert('This time slot is not available. Please choose another time.');
        return;
      }
    }

    setUpdating(true);
    try {
      onBookingUpdate?.(selectedBooking.id, editingBooking);
      setSelectedBooking({ ...selectedBooking, ...editingBooking });
      setIsEditMode(false);
      setEditingBooking(null);
      toast.success('Booking updated successfully');
    } catch (error) {
      console.error('Error saving edit:', error);
      toast.error('Failed to update booking');
    } finally {
      setUpdating(false);
    }
  }, [selectedBooking, editingBooking, isSlotAvailable, onBookingUpdate]);

  // Reminder handlers
  const handleSendReminder = useCallback(async () => {
    if (!selectedBooking || !selectedTemplate) return;

    setSendingReminder(true);
    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          action: 'send_immediate',
          templateId: selectedTemplate.id,
          booking: selectedBooking,
          customer: selectedBooking.customer,
          service: selectedBooking.service
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success('Reminder sent successfully');
          setShowReminderDialog(false);
          setSelectedTemplate(null);
        } else {
          toast.error(result.error || 'Failed to send reminder');
        }
      } else {
        toast.error('Failed to send reminder');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error('Failed to send reminder');
    } finally {
      setSendingReminder(false);
    }
  }, [selectedBooking, selectedTemplate, tenantId]);

  const handleScheduleReminders = useCallback(async (booking: Booking) => {
    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          action: 'schedule_reminders',
          booking,
          customer: booking.customer,
          service: booking.service
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success(`${result.total} reminders scheduled successfully`);
        } else {
          toast.error('Failed to schedule reminders');
        }
      }
    } catch (error) {
      console.error('Error scheduling reminders:', error);
      toast.error('Failed to schedule reminders');
    }
  }, [tenantId]);

  const handleUpdateReminderSettings = useCallback(async (newSettings: ReminderSettings) => {
    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          action: 'update_settings',
          settings: newSettings
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setReminderSettings(result.settings);
          toast.success('Reminder settings updated successfully');
          setShowReminderSettings(false);
        } else {
          toast.error('Failed to update settings');
        }
      }
    } catch (error) {
      console.error('Error updating reminder settings:', error);
      toast.error('Failed to update settings');
    }
  }, [tenantId]);

  const getTemplatesForBooking = useCallback((booking: Booking): ReminderTemplate[] => {
    const templates: ReminderTemplate[] = [];

    if (booking.status === 'confirmed') {
      templates.push(...reminderTemplates.filter(t => t.type === 'booking_confirmation'));
      templates.push(...reminderTemplates.filter(t => t.type === 'arrival_reminder'));
    }

    if (booking.paymentStatus === 'pending') {
      templates.push(...reminderTemplates.filter(t => t.type === 'payment_reminder'));
    }

    if (booking.status === 'completed') {
      templates.push(...reminderTemplates.filter(t => t.type === 'follow_up'));
    }

    return templates;
  }, [reminderTemplates]);

  return {
    // State
    bookings,
    selectedDate,
    selectedSlot,
    selectedService,
    selectedBooking,
    showBookingDetails,
    isEditMode,
    showRefundForm,
    refundData,
    editingBooking,
    loading,
    updating,
    activeTab,
    scheduleViewMode,
    showNewBookingDialog,
    showReminderDialog,
    reminderTemplates,
    selectedTemplate,
    sendingReminder,
    reminderSettings,
    showReminderSettings,

    // Setters
    setSelectedDate,
    setSelectedSlot,
    setSelectedService,
    setSelectedBooking,
    setShowBookingDetails,
    setIsEditMode,
    setShowRefundForm,
    setRefundData,
    setEditingBooking,
    setActiveTab,
    setScheduleViewMode,
    setShowNewBookingDialog,
    setShowReminderDialog,
    setSelectedTemplate,
    setReminderSettings,
    setShowReminderSettings,

    // Computed
    todayBookings: getTodayBookings(),
    upcomingBookings: getUpcomingBookings(),

    // Methods
    fetchBookings,
    isSlotAvailable,
    getBookingsGroupedByDay,
    getBookingsGroupedByWeek,
    handleDateSelect,
    handleSlotSelect,
    handleServiceSelect,
    handleBookingClick,
    handleUpdateStatus,
    handleUpdatePayment,
    handleDeleteBooking,
    handleProcessRefund,
    handleEditClick,
    handleCancelEdit,
    handleSaveEdit,
    handleSendReminder,
    handleScheduleReminders,
    handleUpdateReminderSettings,
    getTemplatesForBooking,
  };
}
