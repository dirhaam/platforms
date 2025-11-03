'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Booking, BookingStatus, PaymentStatus } from '@/types/booking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BookingDetailsDrawer } from './BookingDetailsDrawer';
import { BookingCalendar } from './BookingCalendar';
import { NewBookingDialog } from './NewBookingDialog';
import { Calendar, List, Search, Plus, Filter, DollarSign, TrendingUp, CreditCard, Users, MoreVertical, Eye, Printer, Edit, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { SalesTransactionDialog } from '@/components/sales/SalesTransactionDialog';
import { SalesTransactionsTable } from '@/components/sales/SalesTransactionsTable';
import { SalesTransactionPanel } from '@/components/sales/SalesTransactionPanel';
import { SalesTransaction, SalesSummary } from '@/types/sales';
import { Invoice } from '@/types/invoice';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import { normalizeInvoiceResponse } from '@/lib/invoice/invoice-utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BookingDashboardProps {
  tenantId: string;
}

export function BookingDashboard({ tenantId }: BookingDashboardProps) {
  const tenantSubdomain = tenantId;
  const [resolvedTenantId, setResolvedTenantId] = useState<string>('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // New Booking states
  const [showNewBookingDialog, setShowNewBookingDialog] = useState(false);
  
  // Quick Sale states
  const [showQuickSaleDialog, setShowQuickSaleDialog] = useState(false);
  const [salesTransactions, setSalesTransactions] = useState<SalesTransaction[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [invoicePreview, setInvoicePreview] = useState<Invoice | null>(null);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [invoiceGenerating, setInvoiceGenerating] = useState(false);
  const [showInvoicePrompt, setShowInvoicePrompt] = useState(false);
  const [selectedSalesTransaction, setSelectedSalesTransaction] = useState<SalesTransaction | null>(null);
  const [showSalesDetailsDialog, setShowSalesDetailsDialog] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'sales'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    if (!tenantSubdomain) {
      setResolvedTenantId('');
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(tenantSubdomain)) {
      setResolvedTenantId(tenantSubdomain);
      return;
    }

    const resolveTenant = async () => {
      try {
        const response = await fetch(`/api/tenants/${tenantSubdomain}`);
        if (!response.ok) {
          throw new Error('Tenant not found');
        }

        const tenant = await response.json();
        setResolvedTenantId(tenant.id);
      } catch (error) {
        console.error('Error resolving tenant for booking dashboard:', error);
        toast.error('Failed to resolve tenant information');
        setResolvedTenantId('');
      }
    };

    resolveTenant();
  }, [tenantSubdomain]);

  // Fetch bookings with related metadata
  useEffect(() => {
    if (!resolvedTenantId) return;
    fetchBookings();
    fetchSalesTransactions();
    fetchSalesSummary();
  }, [resolvedTenantId]);

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
    if (!resolvedTenantId) return;
    setLoading(true);
    try {
      // Fetch all needed data in parallel
      const [bookingsRes, customersRes, servicesRes] = await Promise.all([
        fetch(`/api/bookings?tenantId=${encodeURIComponent(resolvedTenantId)}`, {
          headers: { 'x-tenant-id': resolvedTenantId }
        }),
        fetch(`/api/customers?tenantId=${encodeURIComponent(resolvedTenantId)}`, {
          headers: { 'x-tenant-id': resolvedTenantId }
        }),
        fetch(`/api/services?tenantId=${encodeURIComponent(resolvedTenantId)}`, {
          headers: { 'x-tenant-id': resolvedTenantId }
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
    if (!resolvedTenantId) return;

    setLoadingSales(true);
    try {
      const response = await fetch(`/api/sales/transactions?tenantId=${encodeURIComponent(resolvedTenantId)}`, {
        headers: { 'x-tenant-id': resolvedTenantId }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sales transactions');
      }

      const data = await response.json();
      const transactions: SalesTransaction[] = data.transactions || [];

      setSalesTransactions(transactions);
    } catch (error) {
      console.error('Error fetching sales transactions:', error);
      toast.error('Failed to fetch sales data');
    } finally {
      setLoadingSales(false);
    }
  };

  const fetchSalesSummary = async () => {
    if (!resolvedTenantId) return;

    try {
      const response = await fetch(`/api/sales/summary?tenantId=${encodeURIComponent(resolvedTenantId)}`, {
        headers: { 'x-tenant-id': resolvedTenantId }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sales summary');
      }

      const data = await response.json();
      setSalesSummary(data.summary || null);
    } catch (error) {
      console.error('Error fetching sales summary:', error);
    }
  };

  const createInvoiceAndPreview = useCallback(
    async (transaction: SalesTransaction) => {
      if (!resolvedTenantId || !transaction?.id) return;

      try {
        setInvoiceGenerating(true);
        const response = await fetch(
          `/api/invoices/from-sales/${transaction.id}?tenantId=${encodeURIComponent(resolvedTenantId)}`,
          {
            method: 'POST',
            headers: {
              'x-tenant-id': resolvedTenantId,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create invoice');
        }

        const invoiceData = await response.json();
        const invoice = normalizeInvoiceResponse(invoiceData);
        setInvoicePreview(invoice);
        setShowInvoicePreview(false);
        setShowInvoicePrompt(true);
        toast.success('Invoice siap dicetak');
      } catch (error) {
        console.error('Error creating invoice from sales transaction:', error);
        toast.error(
          error instanceof Error ? error.message : 'Gagal membuat invoice dari transaksi'
        );
      } finally {
        setInvoiceGenerating(false);
      }
    },
    [resolvedTenantId]
  );

  const createBookingInvoiceAndPreview = useCallback(
    async (bookingId: string) => {
      if (!resolvedTenantId) return;

      try {
        setInvoiceGenerating(true);
        const response = await fetch(
          `/api/invoices/from-booking/${bookingId}?tenantId=${encodeURIComponent(resolvedTenantId)}`,
          {
            method: 'POST',
            headers: {
              'x-tenant-id': resolvedTenantId,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create invoice');
        }

        const invoiceData = await response.json();
        const invoice = normalizeInvoiceResponse(invoiceData);
        setInvoicePreview(invoice);
        setShowInvoicePreview(false);
        setShowInvoicePrompt(true);
        toast.success('Invoice siap dicetak');
      } catch (error) {
        console.error('Error creating invoice from booking:', error);
        toast.error(
          error instanceof Error ? error.message : 'Gagal membuat invoice dari booking'
        );
      } finally {
        setInvoiceGenerating(false);
      }
    },
    [resolvedTenantId]
  );

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsDrawer(true);
  };

  const handleBookingUpdate = async (bookingId: string, updates: Partial<Booking>) => {
    if (!resolvedTenantId) return;
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': resolvedTenantId
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

  const handleDeleteSalesTransaction = async (transactionId: string) => {
    if (!resolvedTenantId) return;

    if (!confirm('Yakin ingin menghapus transaksi ini?')) return;

    try {
      const response = await fetch(`/api/sales/transactions/${transactionId}?tenantId=${encodeURIComponent(resolvedTenantId)}`, {
        method: 'DELETE',
        headers: { 'x-tenant-id': resolvedTenantId }
      });

      if (!response.ok) {
        throw new Error('Failed to delete transaction');
      }

      setSalesTransactions(prev => prev.filter(t => t.id !== transactionId));
      await fetchSalesSummary();
      toast.success('Transaction deleted');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete transaction');
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
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowNewBookingDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowQuickSaleDialog(true)}
            disabled={!resolvedTenantId || invoiceGenerating}
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
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Sales Transactions</CardTitle>
              <Button onClick={() => setShowQuickSaleDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                New Sale
              </Button>
            </CardHeader>
            <CardContent>
              {loadingSales ? (
                <p className="text-sm text-gray-600">Loading sales data...</p>
              ) : (
                <SalesTransactionsTable
                  transactions={salesTransactions}
                  emptyMessage="No sales transactions found."
                  renderActions={(transaction) => (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSalesTransaction(transaction);
                        setShowSalesDetailsDialog(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  )}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <SalesTransactionDialog
        open={showQuickSaleDialog}
        onOpenChange={setShowQuickSaleDialog}
        tenantId={resolvedTenantId}
        subdomain={tenantSubdomain}
        allowedTypes={["on_the_spot"]}
        defaultType="on_the_spot"
        onCreated={async (transaction) => {
          toast.success('Quick sale created successfully!');
          void Promise.all([fetchBookings(), fetchSalesTransactions(), fetchSalesSummary()]);
          await createInvoiceAndPreview(transaction);
        }}
      />

      {/* New Booking Dialog */}
      <NewBookingDialog
        open={showNewBookingDialog}
        onOpenChange={setShowNewBookingDialog}
        subdomain={tenantSubdomain}
        onBookingCreated={async () => {
          setShowNewBookingDialog(false);
          toast.success('Booking created successfully!');
          await fetchBookings();
        }}
      />

      {/* Booking Details Drawer */}
      <BookingDetailsDrawer
        booking={selectedBooking}
        tenantId={resolvedTenantId || tenantSubdomain}
        isOpen={showDetailsDrawer}
        onOpenChange={setShowDetailsDrawer}
        onBookingUpdate={handleBookingUpdate}
        onGenerateInvoice={createBookingInvoiceAndPreview}
        isGeneratingInvoice={invoiceGenerating}
      />

      <Dialog open={showInvoicePrompt} onOpenChange={setShowInvoicePrompt}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Invoice berhasil dibuat</DialogTitle>
            <DialogDescription>
              Cetak atau unduh invoice sekarang untuk pelanggan Anda.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowInvoicePrompt(false);
                setInvoicePreview(null);
              }}
            >
              Nanti saja
            </Button>
            <Button
              onClick={() => {
                setShowInvoicePrompt(false);
                setShowInvoicePreview(true);
              }}
              disabled={!invoicePreview}
            >
              Cetak Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sales Transaction Panel - Reusable Component with Tabs */}
      <SalesTransactionPanel
        transaction={selectedSalesTransaction}
        open={showSalesDetailsDialog}
        onOpenChange={setShowSalesDetailsDialog}
        onGenerateInvoice={createInvoiceAndPreview}
        isGeneratingInvoice={invoiceGenerating}
      />

      {invoicePreview && (
        <InvoicePreview
          open={showInvoicePreview}
          onOpenChange={(open) => {
            setShowInvoicePreview(open);
            if (!open) {
              setShowInvoicePrompt(false);
              setInvoicePreview(null);
            }
          }}
          invoice={invoicePreview}
        />
      )}
    </div>
  );
}
