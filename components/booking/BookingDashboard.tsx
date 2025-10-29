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
import { Calendar, List, Search, Plus, Filter, X, DollarSign, TrendingUp, CreditCard, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { SalesTransactionDialog } from '@/components/sales/SalesTransactionDialog';
import {
  SalesTransaction,
  SalesTransactionStatus,
  SalesTransactionSource,
  SalesPaymentMethod,
  SalesSummary,
} from '@/types/sales';

interface BookingDashboardProps {
  tenantId: string;
}

export function BookingDashboard({ tenantId }: BookingDashboardProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Quick Sale states
  const [showQuickSaleDialog, setShowQuickSaleDialog] = useState(false);
  const [salesTransactions, setSalesTransactions] = useState<SalesTransaction[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'sales'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch bookings with related metadata
  useEffect(() => {
    fetchBookings();
    fetchSalesTransactions();
    fetchSalesSummary();
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
      // Fetch all needed data in parallel
      const [bookingsRes, customersRes, servicesRes] = await Promise.all([
        fetch(`/api/bookings?tenantId=${encodeURIComponent(tenantId)}`, {
          headers: { 'x-tenant-id': tenantId }
        }),
        fetch(`/api/customers?tenantId=${encodeURIComponent(tenantId)}`, {
          headers: { 'x-tenant-id': tenantId }
        }),
        fetch(`/api/services?tenantId=${encodeURIComponent(tenantId)}`, {
          headers: { 'x-tenant-id': tenantId }
        })
      ]);

      if (bookingsRes.ok && customersRes.ok && servicesRes.ok) {
        const bookingsData = await bookingsRes.json();
        const customersData = await customersRes.json();
        const servicesData = await servicesRes.json();

        // Create lookup maps for fast access
        const customerMap = new Map(
          (customersData.customers || []).map((c: any) => [c.id, c])
        );
        const serviceMap = new Map(
          (servicesData.services || []).map((s: any) => [s.id, s])
        );

        // Enrich bookings with customer and service data
        const enrichedBookings = (bookingsData.bookings || []).map((booking: any) => ({
          ...booking,
          // Convert string dates to Date objects
          scheduledAt: new Date(booking.scheduledAt),
          createdAt: new Date(booking.createdAt),
          updatedAt: new Date(booking.updatedAt),
          customer: customerMap.get(booking.customerId),
          service: serviceMap.get(booking.serviceId)
        }));

        setBookings(enrichedBookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesTransactions = async () => {
    if (!tenantId) return;

    setLoadingSales(true);
    try {
      const response = await fetch(`/api/sales/transactions?tenantId=${encodeURIComponent(tenantId)}`);

      if (!response.ok) {
        throw new Error('Failed to fetch sales transactions');
      }

      const data = await response.json();
      const transactions: SalesTransaction[] = (data.transactions || []).map((transaction: any) => ({
        ...transaction,
        transactionDate: transaction.transactionDate ? new Date(transaction.transactionDate) : new Date(),
        createdAt: transaction.createdAt ? new Date(transaction.createdAt) : new Date(),
        updatedAt: transaction.updatedAt ? new Date(transaction.updatedAt) : new Date(),
        paidAt: transaction.paidAt ? new Date(transaction.paidAt) : undefined,
        scheduledAt: transaction.scheduledAt ? new Date(transaction.scheduledAt) : undefined,
        completedAt: transaction.completedAt ? new Date(transaction.completedAt) : undefined,
      }));

      setSalesTransactions(transactions);
    } catch (error) {
      console.error('Error fetching sales transactions:', error);
      toast.error('Failed to fetch sales data');
    } finally {
      setLoadingSales(false);
    }
  };

  const fetchSalesSummary = async () => {
    if (!tenantId) return;

    try {
      const response = await fetch(`/api/sales/summary?tenantId=${encodeURIComponent(tenantId)}`);

      if (!response.ok) {
        throw new Error('Failed to fetch sales summary');
      }

      const data = await response.json();
      setSalesSummary(data.summary || null);
    } catch (error) {
      console.error('Error fetching sales summary:', error);
    }
  };

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsDrawer(true);
  };

  const handleBookingUpdate = async (bookingId: string, updates: Partial<Booking>) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
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

  const getSalesStatusBadge = (status: SalesTransactionStatus) => {
    const variants: Record<SalesTransactionStatus, string> = {
      [SalesTransactionStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [SalesTransactionStatus.COMPLETED]: 'bg-green-100 text-green-800',
      [SalesTransactionStatus.CANCELLED]: 'bg-red-100 text-red-800',
      [SalesTransactionStatus.REFUNDED]: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getSalesSourceBadge = (source: SalesTransactionSource) => {
    const variants: Record<SalesTransactionSource, string> = {
      [SalesTransactionSource.ON_THE_SPOT]: 'bg-blue-100 text-blue-800',
      [SalesTransactionSource.FROM_BOOKING]: 'bg-purple-100 text-purple-800',
    };

    const labels: Record<SalesTransactionSource, string> = {
      [SalesTransactionSource.ON_THE_SPOT]: 'On-the-Spot',
      [SalesTransactionSource.FROM_BOOKING]: 'From Booking',
    };

    return (
      <Badge className={variants[source]}>
        {labels[source]}
      </Badge>
    );
  };

  const getSalesPaymentBadge = (method: SalesPaymentMethod) => {
    const variants: Record<SalesPaymentMethod, string> = {
      [SalesPaymentMethod.CASH]: 'bg-green-100 text-green-800',
      [SalesPaymentMethod.CARD]: 'bg-purple-100 text-purple-800',
      [SalesPaymentMethod.TRANSFER]: 'bg-blue-100 text-blue-800',
      [SalesPaymentMethod.QRIS]: 'bg-indigo-100 text-indigo-800',
    };

    return (
      <Badge className={variants[method]}>
        {method.toUpperCase()}
      </Badge>
    );
  };

  const getSalesCustomerName = (transaction: SalesTransaction) => {
    const name = (transaction as any).customerName;
    if (name && typeof name === 'string') return name;
    if (transaction.customer?.name) return transaction.customer.name;
    return 'Unknown';
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
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              const searchParams = new URLSearchParams({ subdomain: tenantId });
              window.location.href = `/tenant/admin/bookings/new?${searchParams.toString()}`;
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowQuickSaleDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Quick Sale
          </Button>
        </div>
      </div>

      {salesSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    IDR {salesSummary.totalRevenue.toLocaleString('id-ID')}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{salesSummary.totalTransactions}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paid Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    IDR {salesSummary.totalPaid.toLocaleString('id-ID')}
                  </p>
                </div>
                <CreditCard className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    IDR {salesSummary.totalPending.toLocaleString('id-ID')}
                  </p>
                </div>
                <Users className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'calendar' | 'list' | 'sales')}>
        <TabsList>
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="list">
            <List className="h-4 w-4 mr-2" />
            List
          </TabsTrigger>
          <TabsTrigger value="sales">
            <DollarSign className="h-4 w-4 mr-2" />
            Sales
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
                    onBookingClick={handleBookingClick}
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
                          {new Date(booking.scheduledAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
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
                          {new Date(booking.scheduledAt).toLocaleString('id-ID')}
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

        {/* Sales View */}
        <TabsContent value="sales" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSales ? (
                <p className="text-sm text-gray-600">Loading sales data...</p>
              ) : salesTransactions.length === 0 ? (
                <p className="text-sm text-gray-600">No sales transactions found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4 font-medium">Transaction #</th>
                        <th className="text-left py-2 px-4 font-medium">Date</th>
                        <th className="text-left py-2 px-4 font-medium">Customer</th>
                        <th className="text-left py-2 px-4 font-medium">Service</th>
                        <th className="text-left py-2 px-4 font-medium">Source</th>
                        <th className="text-left py-2 px-4 font-medium">Amount</th>
                        <th className="text-left py-2 px-4 font-medium">Payment</th>
                        <th className="text-left py-2 px-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesTransactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{transaction.transactionNumber}</td>
                          <td className="py-3 px-4">
                            {transaction.transactionDate
                              ? new Date(transaction.transactionDate).toLocaleString('id-ID')
                              : '-'}
                          </td>
                          <td className="py-3 px-4">
                            {getSalesCustomerName(transaction)}
                          </td>
                          <td className="py-3 px-4">{transaction.serviceName}</td>
                          <td className="py-3 px-4">{getSalesSourceBadge(transaction.source)}</td>
                          <td className="py-3 px-4 font-medium">
                            Rp {transaction.totalAmount.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4">
                            {getSalesPaymentBadge(transaction.paymentMethod)}
                          </td>
                          <td className="py-3 px-4">
                            {getSalesStatusBadge(transaction.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <SalesTransactionDialog
        open={showQuickSaleDialog}
        onOpenChange={setShowQuickSaleDialog}
        tenantId={tenantId}
        subdomain=""
        allowedTypes={["on_the_spot"]}
        defaultType="on_the_spot"
        onCreated={async (_transaction) => {
          toast.success('Quick sale created successfully!');
          await Promise.all([fetchBookings(), fetchSalesTransactions(), fetchSalesSummary()]);
        }}
      />

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
