'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Settings, Plus, Edit2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BookingCalendar } from './BookingCalendar';
import { TimeSlotPicker } from './TimeSlotPicker';
import { RecurringBookingManager } from './RecurringBookingManager';
import { BlackoutDatesManager } from './BlackoutDatesManager';
import { Booking, Service, Customer, TimeSlot, PaymentStatus } from '@/types/booking';

interface BookingManagementProps {
  tenantId: string;
  services: Service[];
  customers: Customer[];
  onBookingCreate?: (booking: Partial<Booking>) => void;
  onBookingUpdate?: (bookingId: string, updates: Partial<Booking>) => void;
  onBookingDelete?: (bookingId: string) => void;
  className?: string;
}

export function BookingManagement({
  tenantId,
  services,
  customers,
  onBookingCreate,
  onBookingUpdate,
  onBookingDelete,
  className = ''
}: BookingManagementProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | undefined>();
  const [selectedService, setSelectedService] = useState<Service | undefined>();
  const [selectedBooking, setSelectedBooking] = useState<Booking | undefined>();
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundData, setRefundData] = useState({ amount: 0, notes: '', refundType: 'full' });
  const [editingBooking, setEditingBooking] = useState<Partial<Booking> | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar');

  // Fetch bookings
  useEffect(() => {
    fetchBookings();
  }, [tenantId]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // Add tenantId as both header and query param for maximum compatibility
      const response = await fetch(`/api/bookings?tenantId=${encodeURIComponent(tenantId)}`, {
        headers: {
          'x-tenant-id': tenantId
        }
      });

      if (response.ok) {
        let bookingsData = await response.json();
        let bookings = bookingsData.bookings || [];
        
        // Fetch customer and service details for each booking
        bookings = await Promise.all(
          bookings.map(async (booking: Booking) => {
            try {
              // Find customer from customers array
              const customer = customers.find(c => c.id === booking.customerId);
              // Find service from services array
              const service = services.find(s => s.id === booking.serviceId);
              
              return {
                ...booking,
                customer,
                service
              };
            } catch (err) {
              console.error('Error enriching booking:', err);
              return booking;
            }
          })
        );
        
        setBookings(bookings);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(undefined);
  };

  // Handle slot selection
  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  // Handle booking click
  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setEditingBooking(null);
    setShowBookingDetails(true);
  };

  // Handle update booking status
  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedBooking) return;
    
    setUpdating(true);
    try {
      onBookingUpdate?.(selectedBooking.id, {
        status: newStatus as any
      });
      
      // Update local state
      setSelectedBooking({ ...selectedBooking, status: newStatus as any });
      setEditingBooking(null);
      
      toast.success(`Booking status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update booking status');
    } finally {
      setUpdating(false);
    }
  };

  // Check if time slot is available
  const isSlotAvailable = (newDateTime: Date, excludeBookingId?: string): boolean => {
    const newStart = new Date(newDateTime);
    const newEnd = new Date(newStart.getTime() + (editingBooking?.duration || selectedBooking?.duration || 60) * 60000);

    return !bookings.some(booking => {
      // Skip current booking being edited
      if (excludeBookingId && booking.id === excludeBookingId) return false;
      
      // Skip cancelled bookings
      if (booking.status === 'cancelled') return false;

      const bookingStart = new Date(booking.scheduledAt);
      const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60000);

      // Check for time conflict
      return newStart < bookingEnd && newEnd > bookingStart;
    });
  };

  // Handle reschedule
  const handleReschedule = async (newDateTime: Date) => {
    if (!selectedBooking) return;
    
    if (!isSlotAvailable(newDateTime, selectedBooking.id)) {
      alert('This time slot is not available. Please choose another time.');
      return;
    }
    
    setUpdating(true);
    try {
      onBookingUpdate?.(selectedBooking.id, {
        scheduledAt: newDateTime
      });
      
      // Update local state
      setSelectedBooking({ ...selectedBooking, scheduledAt: newDateTime });
      setEditingBooking(null);
      
      // Send WhatsApp notification if booking is confirmed
      if (selectedBooking.status === 'confirmed' && selectedBooking.customer?.phone) {
        await fetch('/api/notifications/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: selectedBooking.customer.phone,
            message: `Your booking for ${selectedBooking.service?.name} has been rescheduled to ${new Date(newDateTime).toLocaleString()}`
          })
        }).catch(err => console.error('Failed to send WhatsApp notification:', err));
      }
    } catch (error) {
      console.error('Error rescheduling:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Handle update payment status
  const handleUpdatePayment = async (newPaymentStatus: PaymentStatus) => {
    if (!selectedBooking) return;
    
    setUpdating(true);
    try {
      onBookingUpdate?.(selectedBooking.id, {
        paymentStatus: newPaymentStatus
      });
      
      // Update local state
      setSelectedBooking({ ...selectedBooking, paymentStatus: newPaymentStatus });
      setEditingBooking(null);
      
      toast.success(`Payment status updated to ${newPaymentStatus}`);
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to update payment status');
    } finally {
      setUpdating(false);
    }
  };

  // Handle delete booking
  const handleDeleteBooking = async () => {
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
  };

  // Handle process refund
  const handleProcessRefund = async () => {
    if (!selectedBooking) return;
    
    if (!refundData.amount || refundData.amount <= 0) {
      alert('Please enter a refund amount');
      return;
    }

    if (refundData.refundType === 'partial' && refundData.amount > selectedBooking.totalAmount) {
      alert('Refund amount cannot exceed total booking amount');
      return;
    }

    if (!confirm(`Process ${refundData.refundType} refund of PKR ${refundData.amount}?`)) return;

    setUpdating(true);
    try {
      onBookingUpdate?.(selectedBooking.id, {
        paymentStatus: PaymentStatus.REFUNDED,
        notes: `${refundData.refundType} refund: PKR ${refundData.amount}. Reason: ${refundData.notes || 'N/A'}`
      });

      setSelectedBooking({
        ...selectedBooking,
        paymentStatus: PaymentStatus.REFUNDED
      });

      setShowRefundForm(false);
      setRefundData({ amount: 0, notes: '', refundType: 'full' });
      
      toast.success(`${refundData.refundType.charAt(0).toUpperCase() + refundData.refundType.slice(1)} refund of PKR ${refundData.amount} processed`);
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Failed to process refund');
    } finally {
      setUpdating(false);
    }
  };

  // Handle edit mode
  const handleEditClick = () => {
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
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingBooking(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedBooking || !editingBooking) return;
    
    // Validate amount is greater than 0
    if (editingBooking.totalAmount && editingBooking.totalAmount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }
    
    // Check if datetime changed and validate availability
    if (editingBooking.scheduledAt && new Date(editingBooking.scheduledAt).getTime() !== new Date(selectedBooking.scheduledAt).getTime()) {
      if (!isSlotAvailable(new Date(editingBooking.scheduledAt), selectedBooking.id)) {
        alert('This time slot is not available. Please choose another time.');
        return;
      }
    }
    
    setUpdating(true);
    try {
      onBookingUpdate?.(selectedBooking.id, editingBooking);
      
      // Update local state
      setSelectedBooking({
        ...selectedBooking,
        ...editingBooking
      });
      
      setIsEditMode(false);
      setEditingBooking(null);
      
      toast.success('Booking updated successfully');
      
      // Send WhatsApp notification if datetime changed and booking is confirmed
      if (editingBooking.scheduledAt && new Date(editingBooking.scheduledAt).getTime() !== new Date(selectedBooking.scheduledAt).getTime()) {
        if (selectedBooking.status === 'confirmed' && selectedBooking.customer?.phone) {
          await fetch('/api/notifications/whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phoneNumber: selectedBooking.customer.phone,
              message: `Your booking for ${selectedBooking.service?.name} has been rescheduled to ${new Date(editingBooking.scheduledAt).toLocaleString()}`
            })
          }).catch(err => {
            console.error('Failed to send WhatsApp notification:', err);
            toast.error('Booking updated but WhatsApp notification failed');
          });
          
          toast.success('WhatsApp notification sent to customer');
        }
      }
    } catch (error) {
      console.error('Error saving edit:', error);
      toast.error('Failed to update booking');
    } finally {
      setUpdating(false);
    }
  };

  // Handle service selection
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedSlot(undefined);
  };

  // Get bookings for selected date range
  const getBookingsForDateRange = (startDate: Date, endDate: Date): Booking[] => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.scheduledAt);
      return bookingDate >= startDate && bookingDate <= endDate;
    });
  };

  // Get today's bookings
  const getTodayBookings = (): Booking[] => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    return getBookingsForDateRange(startOfDay, endOfDay);
  };

  // Get upcoming bookings (next 7 days)
  const getUpcomingBookings = (): Booking[] => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return getBookingsForDateRange(today, nextWeek);
  };

  const todayBookings = getTodayBookings();
  const upcomingBookings = getUpcomingBookings();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{todayBookings.length}</div>
                <div className="text-sm text-gray-600">Today's Bookings</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{upcomingBookings.length}</div>
                <div className="text-sm text-gray-600">This Week</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{customers.length}</div>
                <div className="text-sm text-gray-600">Total Customers</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{services.length}</div>
                <div className="text-sm text-gray-600">Active Services</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="recurring">Recurring</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar View */}
            <div className="lg:col-span-2">
              <BookingCalendar
                bookings={bookings}
                onDateSelect={handleDateSelect}
                onBookingClick={handleBookingClick}
                selectedDate={selectedDate}
              />
            </div>

            {/* Time Slot Picker */}
            <div>
              {selectedService ? (
                <TimeSlotPicker
                  serviceId={selectedService.id}
                  selectedDate={selectedDate}
                  onSlotSelect={handleSlotSelect}
                  selectedSlot={selectedSlot}
                  tenantId={tenantId}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Select Service</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {services.map(service => (
                        <Button
                          key={service.id}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleServiceSelect(service)}
                        >
                          <div className="text-left">
                            <div className="font-medium">{service.name}</div>
                            <div className="text-sm text-gray-500">
                              {service.duration} min • ${service.price.toString()}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          {selectedSlot && selectedService && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Ready to book</div>
                    <div className="text-sm text-gray-600">
                      {selectedService.name} on {selectedDate.toLocaleDateString()} 
                      at {selectedSlot.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <Button onClick={() => {
                    // Handle booking creation
                    console.log('Create booking:', {
                      serviceId: selectedService.id,
                      scheduledAt: selectedSlot.start,
                      duration: selectedService.duration
                    });
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Booking
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayBookings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No bookings scheduled for today
                  </div>
                ) : (
                  todayBookings.map(booking => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{booking.customer?.name}</div>
                        <div className="text-sm text-gray-600">
                          {booking.service?.name} • {booking.duration} min
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(booking.scheduledAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`
                          px-2 py-1 text-xs rounded-full
                          ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
                          ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                        `}>
                          {booking.status}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBookingClick(booking)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recurring" className="space-y-6">
          <RecurringBookingManager
            onPatternChange={(pattern) => {
              console.log('Recurring pattern changed:', pattern);
            }}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <BlackoutDatesManager
            blackoutDates={[]}
            onAdd={(blackout) => {
              console.log('Add blackout date:', blackout);
            }}
            onRemove={(id) => {
              console.log('Remove blackout date:', id);
            }}
            onUpdate={(id, updates) => {
              console.log('Update blackout date:', id, updates);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Booking Details Dialog */}
      <Dialog open={showBookingDetails} onOpenChange={setShowBookingDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              View and manage booking information
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && !isEditMode && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Customer</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">{selectedBooking.customer?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <span className="ml-2">{selectedBooking.customer?.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2">{selectedBooking.customer?.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Booking Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Booking Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Service:</span>
                    <span className="ml-2 font-medium">{selectedBooking.service?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Date & Time:</span>
                    <span className="ml-2">{new Date(selectedBooking.scheduledAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <span className="ml-2">{selectedBooking.duration} minutes</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="ml-2 font-medium">PKR {selectedBooking.totalAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-2 capitalize">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        selectedBooking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedBooking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedBooking.status}
                      </span>
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Payment Status:</span>
                    <span className="ml-2 capitalize">{selectedBooking.paymentStatus}</span>
                  </div>
                  {selectedBooking.notes && (
                    <div>
                      <span className="text-gray-600">Notes:</span>
                      <span className="ml-2">{selectedBooking.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Payment Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="ml-2 font-medium">PKR {selectedBooking.totalAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Payment Status:</span>
                    <span className="ml-2 capitalize">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        selectedBooking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                        selectedBooking.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedBooking.paymentStatus}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Management */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Status Management</h3>
                <div className="space-y-3">
                  {/* Booking Status */}
                  <div>
                    <label className="text-sm text-gray-600">Booking Status</label>
                    <div className="flex gap-2 mt-2">
                      {['pending', 'confirmed', 'completed', 'cancelled'].map(status => (
                        <Button
                          key={status}
                          size="sm"
                          variant={selectedBooking.status === status ? 'default' : 'outline'}
                          onClick={() => handleUpdateStatus(status)}
                          disabled={updating || selectedBooking.status === status}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div>
                    <label className="text-sm text-gray-600">Payment Status</label>
                    <div className="flex gap-2 mt-2">
                      {[PaymentStatus.PENDING, PaymentStatus.PAID, PaymentStatus.REFUNDED].map(status => (
                        <Button
                          key={status}
                          size="sm"
                          variant={selectedBooking.paymentStatus === status ? 'default' : 'outline'}
                          onClick={() => handleUpdatePayment(status)}
                          disabled={updating || selectedBooking.paymentStatus === status}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Refund Section */}
                  {selectedBooking.paymentStatus === 'paid' && (
                    <div className="border-t pt-3 mt-3">
                      {!showRefundForm ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRefundData({ amount: selectedBooking.totalAmount, notes: '', refundType: 'full' });
                            setShowRefundForm(true);
                          }}
                          disabled={updating}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          Process Refund
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <label className="text-sm font-medium">Refund Type</label>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={refundData.refundType === 'full' ? 'default' : 'outline'}
                                onClick={() => setRefundData({ ...refundData, refundType: 'full', amount: selectedBooking.totalAmount })}
                              >
                                Full
                              </Button>
                              <Button
                                size="sm"
                                variant={refundData.refundType === 'partial' ? 'default' : 'outline'}
                                onClick={() => setRefundData({ ...refundData, refundType: 'partial' })}
                              >
                                Partial
                              </Button>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="refundAmount" className="text-sm">Refund Amount (PKR)</Label>
                            <Input
                              id="refundAmount"
                              type="number"
                              min="0"
                              step="100"
                              value={refundData.amount || ''}
                              onChange={(e) => setRefundData({ ...refundData, amount: parseFloat(e.target.value) || 0 })}
                              disabled={updating || refundData.refundType === 'full'}
                            />
                          </div>

                          <div>
                            <Label htmlFor="refundReason" className="text-sm">Reason for Refund</Label>
                            <Textarea
                              id="refundReason"
                              placeholder="Enter reason for refund..."
                              value={refundData.notes}
                              onChange={(e) => setRefundData({ ...refundData, notes: e.target.value })}
                              disabled={updating}
                              className="resize-none"
                              rows={2}
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowRefundForm(false)}
                              disabled={updating}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleProcessRefund}
                              disabled={updating}
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              Confirm Refund
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-between border-t pt-6">
                <Button
                  variant="destructive"
                  onClick={handleDeleteBooking}
                  disabled={updating}
                >
                  Delete Booking
                </Button>
                <div className="flex gap-3">
                  <Button
                    onClick={handleEditClick}
                    disabled={updating}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Booking
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowBookingDetails(false)}
                    disabled={updating}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Form */}
          {selectedBooking && isEditMode && editingBooking && (
            <div className="space-y-6">
              <div className="space-y-4">
                {/* Customer Selection */}
                <div>
                  <Label htmlFor="customer">Customer</Label>
                  <Select
                    value={editingBooking.customerId || ''}
                    onValueChange={(customerId) => setEditingBooking({ ...editingBooking, customerId })}
                  >
                    <SelectTrigger id="customer">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} ({customer.phone})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Service Selection */}
                <div>
                  <Label htmlFor="service">Service</Label>
                  <Select
                    value={editingBooking.serviceId || ''}
                    onValueChange={(serviceId) => {
                      const service = services.find(s => s.id === serviceId);
                      setEditingBooking({
                        ...editingBooking,
                        serviceId,
                        duration: service?.duration || editingBooking.duration
                      });
                    }}
                  >
                    <SelectTrigger id="service">
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(service => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} ({service.duration} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date & Time */}
                <div>
                  <Label htmlFor="datetime">Date & Time</Label>
                  <Input
                    id="datetime"
                    type="datetime-local"
                    value={editingBooking.scheduledAt ? (() => {
                      try {
                        const date = editingBooking.scheduledAt instanceof Date ? editingBooking.scheduledAt : new Date(editingBooking.scheduledAt as string);
                        return date.toISOString().slice(0, 16);
                      } catch (e) {
                        return '';
                      }
                    })() : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        setEditingBooking({ ...editingBooking, scheduledAt: new Date(e.target.value) });
                      }
                    }}
                    disabled={updating}
                  />
                </div>

                {/* Duration */}
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="15"
                    step="15"
                    value={editingBooking.duration || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, duration: parseInt(e.target.value) || 0 })}
                    disabled={updating}
                  />
                </div>

                {/* Total Amount */}
                <div>
                  <Label htmlFor="amount">Total Amount (PKR)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="100"
                    value={editingBooking.totalAmount || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, totalAmount: parseFloat(e.target.value) || 0 })}
                    disabled={updating}
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <Label htmlFor="paymentMethod">Payment Method (Optional)</Label>
                  <Select
                    value={(editingBooking as any).paymentMethod || ''}
                    onValueChange={(method) => setEditingBooking({ ...editingBooking, paymentMethod: method as any })}
                  >
                    <SelectTrigger id="paymentMethod">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="transfer">Bank Transfer</SelectItem>
                      <SelectItem value="qris">QRIS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about this booking..."
                    value={editingBooking.notes || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, notes: e.target.value })}
                    disabled={updating}
                    className="resize-none"
                    rows={3}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end border-t pt-6">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={updating}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={updating}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}