'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Booking, BookingStatus, PaymentStatus } from '@/types/booking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookingDetailsDrawer } from './BookingDetailsDrawer';
import { NewBookingPOS } from './NewBookingPOS';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { QuickSalesPOS } from '@/components/sales/QuickSalesPOS';
import { SalesTransactionPanel } from '@/components/sales/SalesTransactionPanel';
import { SalesTransaction, SalesSummary } from '@/types/sales';
import { Invoice } from '@/types/invoice';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import { normalizeInvoiceResponse } from '@/lib/invoice/invoice-utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookingViewsTabs } from './BookingViewsTabs';

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
  const [viewMode, setViewMode] = useState<'calendar' | 'booking' | 'sales' | 'home-visits'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Home Visits states
  const [services, setServices] = useState<any[]>([]);
  const [businessLocation, setBusinessLocation] = useState<string>('');
  const [businessLocationCoords, setBusinessLocationCoords] = useState<{ lat: number; lng: number } | null>(null);

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

  // Apply filters for bookings
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

  // Apply filters for sales
  const filteredSales = React.useMemo(() => {
    let filtered = salesTransactions;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter((t) =>
        (t.customer?.name || '').toLowerCase().includes(q) ||
        (t.serviceName || '').toLowerCase().includes(q) ||
        (t.transactionNumber || '').toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) => String(t.status) === statusFilter);
    }

    if (paymentFilter !== 'all') {
      filtered = filtered.filter((t) => String(t.paymentStatus) === paymentFilter);
    }

    return filtered;
  }, [salesTransactions, searchTerm, statusFilter, paymentFilter]);

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
        // IMPORTANT: Preserve ALL fields from API response (including travel_surcharge_amount, travel_distance, travel_duration)
        const enrichedBookings = (bookingsData.bookings || []).map((booking: any) => ({
          ...booking,
          // Convert string dates to Date objects
          scheduledAt: new Date(booking.scheduledAt),
          createdAt: new Date(booking.createdAt),
          updatedAt: new Date(booking.updatedAt),
          // Add enriched relations
          customer: customerMap.get(booking.customerId),
          service: serviceMap.get(booking.serviceId),
          // Explicitly preserve travel fields (for clarity)
          travelSurchargeAmount: booking.travelSurchargeAmount,
          travelDistance: booking.travelDistance,
          travelDuration: booking.travelDuration
        }));

        setBookings(enrichedBookings);
        setServices(servicesData.services || []);

        // Fetch business location (homebase address) from invoice settings
        try {
          const settingsUrl = new URL('/api/settings/invoice-config', window.location.origin);
          settingsUrl.searchParams.set('tenantId', resolvedTenantId);
          const settingsRes = await fetch(settingsUrl.toString(), {
            headers: { 'x-tenant-id': resolvedTenantId }
          });
          if (settingsRes.ok) {
            const settingsData = await settingsRes.json();
            const addr = settingsData.settings?.branding?.businessAddress || '';
            setBusinessLocation(addr);
            const lat = settingsData.settings?.branding?.businessLatitude;
            const lng = settingsData.settings?.branding?.businessLongitude;
            console.log('[BookingDashboard] Business location loaded:', { addr, lat, lng });
            if (typeof lat === 'number' && typeof lng === 'number') {
              console.log('[BookingDashboard] Setting business location coordinates:', { lat, lng });
              setBusinessLocationCoords({ lat, lng });
            } else {
              console.log('[BookingDashboard] No valid coordinates in invoice settings, will geocode address');
              setBusinessLocationCoords(null);
            }

            // Fallback: use tenant address if invoice-config address is empty
            if (!addr && tenantSubdomain) {
              try {
                const tenantRes = await fetch(`/api/tenants/${encodeURIComponent(tenantSubdomain)}`);
                if (tenantRes.ok) {
                  const tenant = await tenantRes.json();
                  if (tenant?.address) {
                    setBusinessLocation(tenant.address);
                  }
                }
              } catch (e) {
                console.warn('Fallback fetch tenant address failed:', e);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching business location:', error);
        }
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

      console.log('[BookingDashboard] Fetched sales transactions:', {
        count: transactions.length,
        tenantId: resolvedTenantId,
        firstTransaction: transactions[0]
      });

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

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchBookings(), fetchSalesTransactions(), fetchSalesSummary()]);
  }, [resolvedTenantId]);

  return (
    <div className="w-full space-y-6">
      {/* Action Buttons */}
      <div className="flex justify-end gap-3 px-1">
        <Button onClick={() => setShowNewBookingDialog(true)} className="bg-primary hover:bg-primary-dark text-white shadow-md shadow-primary/30">
          <Plus className="h-4 w-4 mr-2" />
          New Booking
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowQuickSaleDialog(true)}
          disabled={!resolvedTenantId || invoiceGenerating}
          className="border-gray-300 text-txt-secondary hover:text-primary hover:border-primary hover:bg-gray-50 transition-all"
        >
          <Plus className="h-4 w-4 mr-2" />
          Quick Sale
        </Button>
      </div>

      {/* Booking Views */}
      <div className="mt-6">
        <BookingViewsTabs
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filteredBookings={filteredBookings}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        onBookingClick={handleBookingClick}
        salesTransactions={filteredSales}
        salesSummary={salesSummary}
        loadingSales={loadingSales}
        onNewSale={() => setShowQuickSaleDialog(true)}
        onViewSalesTransaction={(t) => {
          setSelectedSalesTransaction(t);
          setShowSalesDetailsDialog(true);
        }}
        resolvedTenantId={resolvedTenantId}
        bookings={filteredBookings}
        services={services}
        businessLocation={businessLocation}
        businessCoordinates={businessLocationCoords || undefined}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        paymentFilter={paymentFilter}
        onPaymentChange={setPaymentFilter}
        onRefreshAll={refreshAll}
        />
      </div>

      <QuickSalesPOS
        open={showQuickSaleDialog}
        onOpenChange={setShowQuickSaleDialog}
        tenantId={resolvedTenantId}
        subdomain={tenantSubdomain}
        onCreated={async (transaction) => {
          toast.success('Quick sale created successfully!');
          void Promise.all([fetchBookings(), fetchSalesTransactions(), fetchSalesSummary()]);
          await createInvoiceAndPreview(transaction);
        }}
      />

      {/* New Booking Dialog */}
      <NewBookingPOS
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
