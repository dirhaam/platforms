'use client';

import React, { useState, useEffect } from 'react';
import { Booking, BookingStatus, PaymentStatus } from '@/types/booking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BookingDetailsDrawer } from './BookingDetailsDrawer';
import { BookingCalendar } from './BookingCalendar';
import { Calendar, List, Search, Plus, Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface BookingDashboardProps {
  tenantId: string;
}

export function BookingDashboard({ tenantId }: BookingDashboardProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch bookings
  useEffect(() => {
    fetchBookings();
  }, [tenantId]);

  // Apply filters
  useEffect(() => {
    let filtered = bookings;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(b =>
        b.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.service?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(b => b.paymentStatus === paymentFilter);
    }

    setFilteredBookings(filtered);
  }, [bookings, searchTerm, statusFilter, paymentFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bookings?tenantId=${encodeURIComponent(tenantId)}`, {
        headers: { 'x-tenant-id': tenantId }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsDrawer(true);
  };

  const handleBookingUpdate = async (bookingId: string, updates: Partial<Booking>) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        // Update local state
        setBookings(prev =>
          prev.map(b => b.id === bookingId ? { ...b, ...updates } : b)
        );
        if (selectedBooking?.id === bookingId) {
          setSelectedBooking({ ...selectedBooking, ...updates });
        }
        toast.success('Booking updated');
      } else {
        throw new Error('Failed to update booking');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
      throw error;
    }
  };

  // Get bookings for selected date
  const bookingsForDate = filteredBookings.filter(b => {
    const bookingDate = new Date(b.scheduledAt).toDateString();
    const selectedDateString = selectedDate.toDateString();
    return bookingDate === selectedDateString;
  });

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Bookings</h2>
          <p className="text-gray-600">Manage your bookings with unified panel</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Booking
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={BookingStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={BookingStatus.CONFIRMED}>Confirmed</SelectItem>
                <SelectItem value={BookingStatus.COMPLETED}>Completed</SelectItem>
                <SelectItem value={BookingStatus.CANCELLED}>Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value={PaymentStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={PaymentStatus.PAID}>Paid</SelectItem>
                <SelectItem value={PaymentStatus.REFUNDED}>Refunded</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => fetchBookings()}>
              <Filter className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'calendar' | 'list')}>
        <TabsList>
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="list">
            <List className="h-4 w-4 mr-2" />
            List
          </TabsTrigger>
        </TabsList>

        {/* Calendar View */}
        <TabsContent value="calendar" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="pt-6">
                  <BookingCalendar
                    bookings={filteredBookings}
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Bookings for selected date */}
            <div className="space-y-3">
              <h3 className="font-semibold">
                {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              {bookingsForDate.length === 0 ? (
                <p className="text-sm text-gray-600">No bookings for this date</p>
              ) : (
                bookingsForDate.map(booking => (
                  <Card
                    key={booking.id}
                    className="cursor-pointer hover:border-blue-500 transition-colors"
                    onClick={() => handleBookingClick(booking)}
                  >
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{booking.customer?.name}</p>
                            <p className="text-sm text-gray-600">{booking.service?.name}</p>
                          </div>
                          <Badge className={
                            booking.status === BookingStatus.CONFIRMED
                              ? 'bg-green-100 text-green-800'
                              : booking.status === BookingStatus.PENDING
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }>
                            {booking.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {booking.scheduledAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 font-medium">Booking</th>
                      <th className="text-left py-2 px-4 font-medium">Customer</th>
                      <th className="text-left py-2 px-4 font-medium">Service</th>
                      <th className="text-left py-2 px-4 font-medium">Date & Time</th>
                      <th className="text-left py-2 px-4 font-medium">Status</th>
                      <th className="text-left py-2 px-4 font-medium">Payment</th>
                      <th className="text-left py-2 px-4 font-medium">Amount</th>
                      <th className="text-left py-2 px-4 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map(booking => (
                      <tr key={booking.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{booking.bookingNumber}</td>
                        <td className="py-3 px-4">{booking.customer?.name}</td>
                        <td className="py-3 px-4">{booking.service?.name}</td>
                        <td className="py-3 px-4">
                          {booking.scheduledAt.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={
                            booking.status === BookingStatus.CONFIRMED
                              ? 'bg-green-100 text-green-800'
                              : booking.status === BookingStatus.PENDING
                              ? 'bg-yellow-100 text-yellow-800'
                              : booking.status === BookingStatus.COMPLETED
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }>
                            {booking.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={
                            booking.paymentStatus === PaymentStatus.PAID
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }>
                            {booking.paymentStatus}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-medium">
                          Rp {booking.totalAmount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBookingClick(booking)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Booking Details Drawer */}
      <BookingDetailsDrawer
        booking={selectedBooking}
        tenantId={tenantId}
        isOpen={showDetailsDrawer}
        onOpenChange={setShowDetailsDrawer}
        onBookingUpdate={handleBookingUpdate}
      />
    </div>
  );
}
