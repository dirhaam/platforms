'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Invoice, InvoiceStatus, InvoiceFilters } from '@/types/invoice';
import { BookingStatus } from '@/types/booking';
import { SalesTransactionStatus } from '@/types/sales';
import { InvoiceDialog } from '@/components/invoice/InvoiceDialog';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Send, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';

interface InvoiceManagementProps {
  tenantId: string;
}

type BookingListItem = {
  id: string;
  bookingNumber: string;
  status: BookingStatus;
  scheduledAt: Date | null;
  totalAmount: number;
  customer?: { name?: string | null } | null;
};

type SalesListItem = {
  id: string;
  transactionNumber: string;
  status: SalesTransactionStatus;
  serviceName: string;
  totalAmount: number;
  transactionDate: Date | null;
  customer?: { name?: string | null } | null;
};

export function InvoiceManagement({ tenantId }: InvoiceManagementProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [filters, setFilters] = useState<InvoiceFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [invoiceToSend, setInvoiceToSend] = useState<Invoice | null>(null);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingDialogTab, setBookingDialogTab] = useState<'bookings' | 'sales'>('bookings');
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [bookingSearch, setBookingSearch] = useState('');
  const [creatingFromBookingId, setCreatingFromBookingId] = useState<string | null>(null);
  const [salesTransactions, setSalesTransactions] = useState<SalesListItem[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [salesSearch, setSalesSearch] = useState('');
  const [creatingFromSalesId, setCreatingFromSalesId] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, [filters, currentPage]);

  useEffect(() => {
    if (!showBookingDialog) {
      return;
    }

    if (bookingDialogTab === 'bookings') {
      fetchLatestBookings();
    } else if (bookingDialogTab === 'sales') {
      fetchSalesTransactions();
    }
  }, [showBookingDialog, bookingDialogTab]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (tenantId) {
        params.append('tenantId', tenantId);
      }
      
      if (filters.status?.length) {
        params.append('status', filters.status.join(','));
      }
      if (filters.customerId) {
        params.append('customerId', filters.customerId);
      }
      if (filters.dateFrom) {
        params.append('dateFrom', filters.dateFrom);
      }
      if (filters.dateTo) {
        params.append('dateTo', filters.dateTo);
      }
      if (filters.amountMin !== undefined) {
        params.append('amountMin', filters.amountMin.toString());
      }
      if (filters.amountMax !== undefined) {
        params.append('amountMax', filters.amountMax.toString());
      }
      
      params.append('page', currentPage.toString());
      params.append('limit', '20');

      const response = await fetch(`/api/invoices?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestBookings = async () => {
    try {
      setBookingsLoading(true);
      setBookingsError(null);

      const url = new URL('/api/bookings', window.location.origin);
      if (tenantId) {
        url.searchParams.set('tenantId', tenantId);
      }
      url.searchParams.set('status', BookingStatus.CONFIRMED);
      url.searchParams.set('limit', '50');

      const response = await fetch(url.toString(), {
        headers: tenantId ? { 'x-tenant-id': tenantId } : undefined,
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Gagal mengambil data booking');
      }

      const data = await response.json();
      const normalized = (data.bookings || []).map((booking: any) => {
        const scheduledAtRaw = booking.scheduledAt ?? booking.scheduled_at ?? null;
        return {
          id: booking.id,
          bookingNumber: booking.bookingNumber ?? booking.booking_number ?? '',
          status: booking.status as BookingStatus,
          scheduledAt: scheduledAtRaw ? new Date(scheduledAtRaw) : null,
          totalAmount: Number(booking.totalAmount ?? booking.total_amount ?? 0),
          customer: booking.customer ?? null,
        } satisfies BookingListItem;
      });

      setBookings(normalized);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengambil data booking';
      setBookingsError(message);
    } finally {
      setBookingsLoading(false);
    }
  };

  const fetchSalesTransactions = async () => {
    try {
      setSalesLoading(true);
      setSalesError(null);

      const url = new URL('/api/sales/transactions', window.location.origin);
      if (tenantId) {
        url.searchParams.set('tenantId', tenantId);
      }
      url.searchParams.set('limit', '50');

      const response = await fetch(url.toString(), {
        headers: tenantId ? { 'x-tenant-id': tenantId } : undefined,
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Gagal mengambil data penjualan');
      }

      const data = await response.json();
      const normalized = (data.transactions || []).map((transaction: any) => {
        const transactionDateRaw =
          transaction.transactionDate ?? transaction.transaction_date ?? transaction.createdAt ?? transaction.created_at ?? null;
        return {
          id: transaction.id,
          transactionNumber: transaction.transactionNumber ?? transaction.transaction_number ?? '',
          status: transaction.status as SalesTransactionStatus,
          serviceName: transaction.serviceName ?? transaction.service_name ?? '',
          totalAmount: Number(transaction.totalAmount ?? transaction.total_amount ?? 0),
          transactionDate: transactionDateRaw ? new Date(transactionDateRaw) : null,
          customer: transaction.customer ?? null,
        } satisfies SalesListItem;
      });

      setSalesTransactions(normalized);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengambil data penjualan';
      setSalesError(message);
    } finally {
      setSalesLoading(false);
    }
  };

  const handleCreateInvoice = () => {
    setSelectedInvoice(null);
    setShowCreateDialog(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowCreateDialog(true);
  };

  const handlePreviewInvoice = async (invoice: Invoice) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${invoice.id}`);
      if (response.ok) {
        const fullInvoice = await response.json();
        setSelectedInvoice(fullInvoice);
        setShowPreviewDialog(true);
      } else {
        toast.error('Gagal memuat detail invoice');
      }
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      toast.error('Gagal memuat detail invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      const pdfUrl = new URL(`/api/invoices/${invoice.id}/pdf`, window.location.origin);
      const tenantIdentifier = invoice.tenantId || tenantId;
      if (tenantIdentifier) {
        pdfUrl.searchParams.set('tenantId', tenantIdentifier);
      }

      const response = await fetch(pdfUrl.toString());
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoice.invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      const deleteUrl = new URL(`/api/invoices/${invoice.id}`, window.location.origin);
      if (tenantId) {
        deleteUrl.searchParams.set('tenantId', tenantId);
      }

      const response = await fetch(deleteUrl.toString(), {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchInvoices();
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  const resetSendDialogState = () => {
    setInvoiceToSend(null);
    setWhatsappPhone('');
    setWhatsappMessage('');
    setSendingWhatsApp(false);
  };

  const handleSendDialogOpenChange = (open: boolean) => {
    setShowSendDialog(open);
    if (!open) {
      resetSendDialogState();
    }
  };

  const handleBookingDialogOpenChange = (open: boolean) => {
    setShowBookingDialog(open);
    if (!open) {
      setBookingSearch('');
      setBookingsError(null);
      setSalesSearch('');
      setSalesError(null);
      setBookingDialogTab('bookings');
    }
  };

  const handleOpenSendDialog = (invoice: Invoice) => {
    const customerName = invoice.customer?.name || '';
    const dueDate = invoice.dueDate ? invoice.dueDate.toLocaleDateString() : '';
    const totalAmount = invoice.totalAmount.toLocaleString('id-ID', {
      style: 'currency',
      currency: 'IDR',
    });

    setInvoiceToSend(invoice);
    setWhatsappPhone(invoice.customer?.whatsappNumber || invoice.customer?.phone || '');
    setWhatsappMessage(
      [`Halo ${customerName}`.trim(),
      `Berikut kami kirimkan invoice ${invoice.invoiceNumber} dengan total ${totalAmount}.`,
      dueDate ? `Jatuh tempo pada ${dueDate}.` : '',
      'Terima kasih.'
      ].filter(Boolean).join(' ')
    );
    setShowSendDialog(true);
  };

  const handleSendInvoiceWhatsApp = async () => {
    if (!invoiceToSend) {
      return;
    }

    if (!whatsappPhone.trim()) {
      toast.error('Nomor WhatsApp wajib diisi');
      return;
    }

    setSendingWhatsApp(true);

    try {
      const sendUrl = new URL(`/api/invoices/${invoiceToSend.id}/whatsapp`, window.location.origin);
      if (tenantId) {
        sendUrl.searchParams.set('tenantId', tenantId);
      }

      const response = await fetch(sendUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: whatsappPhone.trim(),
          message: whatsappMessage.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Gagal mengirim invoice via WhatsApp');
      }

      toast.success('Invoice berhasil dikirim via WhatsApp');
      setShowSendDialog(false);
      resetSendDialogState();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengirim invoice via WhatsApp';
      toast.error(message);
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (!bookingSearch.trim()) {
      return true;
    }

    const term = bookingSearch.trim().toLowerCase();
    const bookingNumber = booking.bookingNumber?.toLowerCase() || '';
    const customerName = (booking.customer?.name ?? '').toLowerCase();
    return (
      bookingNumber.includes(term) ||
      booking.id.toLowerCase().includes(term) ||
      customerName.includes(term)
    );
  });

  const handleCreateInvoiceFromBooking = async (booking: BookingListItem) => {
    try {
      setCreatingFromBookingId(booking.id);
      const url = new URL(`/api/invoices/from-booking/${booking.id}`, window.location.origin);
      if (tenantId) {
        url.searchParams.set('tenantId', tenantId);
      }

      const response = await fetch(url.toString(), {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Gagal membuat invoice dari booking');
      }

      toast.success('Invoice berhasil dibuat dari booking');
      setShowBookingDialog(false);
      fetchInvoices();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal membuat invoice dari booking';
      toast.error(message);
    } finally {
      setCreatingFromBookingId(null);
    }
  };

  const filteredSalesTransactions = salesTransactions.filter((transaction) => {
    if (!salesSearch.trim()) {
      return true;
    }

    const term = salesSearch.trim().toLowerCase();
    const transactionNumber = (transaction.transactionNumber ?? '').toLowerCase();
    const customerName = (transaction.customer?.name ?? '').toLowerCase();
    const serviceName = (transaction.serviceName ?? '').toLowerCase();

    return (
      transactionNumber.includes(term) ||
      transaction.id.toLowerCase().includes(term) ||
      customerName.includes(term) ||
      serviceName.includes(term)
    );
  });

  const handleCreateInvoiceFromSales = async (transaction: SalesListItem) => {
    try {
      setCreatingFromSalesId(transaction.id);
      const url = new URL(`/api/invoices/from-sales/${transaction.id}`, window.location.origin);
      if (tenantId) {
        url.searchParams.set('tenantId', tenantId);
      }

      const response = await fetch(url.toString(), {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Gagal membuat invoice dari penjualan');
      }

      toast.success('Invoice berhasil dibuat dari transaksi penjualan');
      setShowBookingDialog(false);
      fetchInvoices();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal membuat invoice dari penjualan';
      toast.error(message);
    } finally {
      setCreatingFromSalesId(null);
    }
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    const variants = {
      [InvoiceStatus.DRAFT]: 'secondary',
      [InvoiceStatus.SENT]: 'default',
      [InvoiceStatus.PAID]: 'success',
      [InvoiceStatus.OVERDUE]: 'destructive',
      [InvoiceStatus.CANCELLED]: 'outline'
    } as const;

    return (
      <Badge variant={variants[status]}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold">Invoice Management</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setShowBookingDialog(true)}>
            <CalendarClock className="h-4 w-4 mr-2" />
            Create from Booking
          </Button>
          <Button onClick={handleCreateInvoice}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select
              value={filters.status?.[0] ?? 'all'}
              onValueChange={(value) =>
                setFilters(prev => ({
                  ...prev,
                  status: value === 'all' ? undefined : [value as InvoiceStatus]
                }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={InvoiceStatus.DRAFT}>Draft</SelectItem>
                <SelectItem value={InvoiceStatus.SENT}>Sent</SelectItem>
                <SelectItem value={InvoiceStatus.PAID}>Paid</SelectItem>
                <SelectItem value={InvoiceStatus.OVERDUE}>Overdue</SelectItem>
                <SelectItem value={InvoiceStatus.CANCELLED}>Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="From date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="w-[150px]"
              />
              <Input
                type="date"
                placeholder="To date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="w-[150px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading invoices...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No invoices found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.customer?.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm">
                          Due: {invoice.dueDate.toLocaleDateString()}
                        </p>
                        <p className="text-sm font-medium">
                          Rp {invoice.totalAmount.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        {getStatusBadge(invoice.status)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreviewInvoice(invoice)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenSendDialog(invoice)}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadPDF(invoice)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditInvoice(invoice)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteInvoice(invoice)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Invoice Dialog */}
      <InvoiceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        invoice={selectedInvoice}
        onSuccess={() => {
          fetchInvoices();
          setShowCreateDialog(false);
        }}
        tenantId={tenantId}
      />

      {/* Create Invoice from Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={handleBookingDialogOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Generate Invoice from Booking</DialogTitle>
            <DialogDescription>
              Gunakan data Booking atau Sales yang sudah tercatat untuk membuat invoice secara otomatis.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={bookingDialogTab}
            onValueChange={(value) => setBookingDialogTab(value as 'bookings' | 'sales')}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bookings">Booking</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
            </TabsList>

            <TabsContent value="bookings" className="space-y-4">
              <Input
                placeholder="Cari nomor booking atau nama pelanggan..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
              />

              {bookingsLoading ? (
                <div className="py-10 text-center text-muted-foreground">Memuat daftar booking...</div>
              ) : bookingsError ? (
                <div className="py-10 text-center text-red-500 text-sm">{bookingsError}</div>
              ) : filteredBookings.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-sm">
                  Tidak ada booking yang dapat digunakan.
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-3">
                  {filteredBookings.map((booking) => {
                    const scheduledAt = booking.scheduledAt
                      ? (booking.scheduledAt instanceof Date
                          ? booking.scheduledAt
                          : new Date(booking.scheduledAt))
                      : null;

                    const formattedScheduledAt = scheduledAt
                      ? scheduledAt.toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })
                      : '-';

                    const totalAmountLabel = Number(booking.totalAmount || 0).toLocaleString('id-ID', {
                      style: 'currency',
                      currency: 'IDR'
                    });

                    return (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between rounded-lg border p-4 shadow-sm"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">
                            Booking #{booking.bookingNumber || booking.id.slice(0, 8)}
                          </p>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Tanggal: {formattedScheduledAt}</p>
                            <p>Total: {totalAmountLabel}</p>
                            <p>Status: {booking.status}</p>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleCreateInvoiceFromBooking(booking)}
                          disabled={creatingFromBookingId === booking.id}
                        >
                          {creatingFromBookingId === booking.id ? 'Memproses...' : 'Gunakan Booking'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sales" className="space-y-4">
              <Input
                placeholder="Cari nomor transaksi atau nama pelanggan..."
                value={salesSearch}
                onChange={(e) => setSalesSearch(e.target.value)}
              />

              {salesLoading ? (
                <div className="py-10 text-center text-muted-foreground">Memuat transaksi penjualan...</div>
              ) : salesError ? (
                <div className="py-10 text-center text-red-500 text-sm">{salesError}</div>
              ) : filteredSalesTransactions.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-sm">
                  Tidak ada transaksi penjualan yang dapat digunakan.
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-3">
                  {filteredSalesTransactions.map((transaction) => {
                    const transactionDate = transaction.transactionDate
                      ? (transaction.transactionDate instanceof Date
                          ? transaction.transactionDate
                          : new Date(transaction.transactionDate))
                      : null;

                    const formattedTransactionDate = transactionDate
                      ? transactionDate.toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })
                      : '-';

                    const totalAmountLabel = Number(transaction.totalAmount || 0).toLocaleString('id-ID', {
                      style: 'currency',
                      currency: 'IDR'
                    });

                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between rounded-lg border p-4 shadow-sm"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">
                            Transaksi #{transaction.transactionNumber || transaction.id.slice(0, 8)}
                          </p>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Tanggal: {formattedTransactionDate}</p>
                            <p>Service: {transaction.serviceName || '-'}</p>
                            <p>Total: {totalAmountLabel}</p>
                            <p>Status: {transaction.status}</p>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleCreateInvoiceFromSales(transaction)}
                          disabled={creatingFromSalesId === transaction.id}
                        >
                          {creatingFromSalesId === transaction.id ? 'Memproses...' : 'Gunakan Transaksi'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Send via WhatsApp Dialog */}
      <Dialog open={showSendDialog} onOpenChange={handleSendDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kirim Invoice via WhatsApp</DialogTitle>
            <DialogDescription>
              Masukkan nomor WhatsApp tujuan dan pesan yang akan dikirim bersama file invoice.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsappPhone">Nomor WhatsApp</Label>
              <Input
                id="whatsappPhone"
                placeholder="Misal: 6281234567890"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappMessage">Pesan</Label>
              <Textarea
                id="whatsappMessage"
                rows={4}
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                placeholder="Pesan yang akan dikirim bersama invoice"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleSendDialogOpenChange(false)} disabled={sendingWhatsApp}>
                Batal
              </Button>
              <Button onClick={handleSendInvoiceWhatsApp} disabled={sendingWhatsApp}>
                {sendingWhatsApp ? 'Mengirim...' : 'Kirim WhatsApp'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      {selectedInvoice && (
        <InvoicePreview
          open={showPreviewDialog}
          onOpenChange={setShowPreviewDialog}
          invoice={selectedInvoice}
        />
      )}
    </div>
  );
}