'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Settings, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookingCalendar } from './BookingCalendar';
import { TimeSlotPicker } from './TimeSlotPicker';
import { RecurringBookingManager } from './RecurringBookingManager';
import { BlackoutDatesManager } from './BlackoutDatesManager';
import { Booking, Service, Customer, TimeSlot } from '@/types/booking';

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
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar');

  // Fetch bookings
  useEffect(() => {
    fetchBookings();
  }, [tenantId]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bookings', {
        headers: {
          'x-tenant-id': tenantId
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
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
    // Open booking details or edit modal
    console.log('Booking clicked:', booking);
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
    </div>
  );
}