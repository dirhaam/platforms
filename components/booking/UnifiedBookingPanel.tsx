'use client';

import React, { useState, useEffect } from 'react';
import { Booking, BookingStatus, PaymentStatus, Customer, Service } from '@/types/booking';
import { Invoice, InvoiceStatus, PaymentMethod } from '@/types/invoice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, Clock, MapPin, Phone, Mail, AlertCircle, CheckCircle, 
  ChevronDown, Download, Send, MoreVertical, Edit, RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';

interface UnifiedBookingPanelProps {
  booking: Booking;
  tenantId: string;
  onBookingUpdate?: (bookingId: string, updates: Partial<Booking>) => Promise<void>;
  onClose?: () => void;
  onGenerateInvoice?: (bookingId: string) => Promise<void>;
  isGeneratingInvoice?: boolean;
}

interface BookingHistory {
  timestamp: Date;
  action: string;
  actor: string;
  details?: string;
}

export function UnifiedBookingPanel({
  booking,
  tenantId,
  onBookingUpdate,
  onClose,
  onGenerateInvoice,
  isGeneratingInvoice,
}: UnifiedBookingPanelProps) {
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(false);
  
  // Related data
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [history, setHistory] = useState<BookingHistory[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  
  // UI state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<BookingStatus>(booking.status);
  const [paymentMethod, setPaymentMethod] = useState<string>(booking.paymentMethod || 'cash');
  const [refundAmount, setRefundAmount] = useState(booking.totalAmount);
  const [refundNotes, setRefundNotes] = useState('');

  // Fetch related data
  useEffect(() => {
    fetchRelatedData();
  }, [booking.id]);

  const fetchRelatedData = async () => {
    try {
      setLoading(true);

      // Fetch customer & service details if not already present
      if (!booking.customer || !booking.service) {
        try {
          const [customerRes, serviceRes] = await Promise.all([
            fetch(`/api/customers/${booking.customerId}`, {
              headers: { 'x-tenant-id': tenantId }
            }),
            fetch(`/api/services/${booking.serviceId}`, {
              headers: { 'x-tenant-id': tenantId }
            })
          ]);

          if (customerRes.ok) {
            const customerData = await customerRes.json();
            // Note: This just fetches for display, but booking object won't update
            // BookingDashboard should handle enrichment before passing
          }
          if (serviceRes.ok) {
            const serviceData = await serviceRes.json();
            // Note: This just fetches for display
          }
        } catch (error) {
          console.error('Error fetching customer/service details:', error);
        }
      }
      
      // Fetch invoices
      const invoicesUrl = new URL('/api/invoices', window.location.origin);
      invoicesUrl.searchParams.set('tenantId', tenantId);
      const invoicesRes = await fetch(invoicesUrl.toString());
      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        const relatedInvoices = invoicesData.invoices?.filter(
          (inv: Invoice) => inv.bookingId === booking.id
        ) || [];
        setInvoices(relatedInvoices);
      }

      // Fetch payment history
      try {
        const paymentRes = await fetch(`/api/bookings/${booking.id}/payments?tenantId=${encodeURIComponent(tenantId)}`, {
          headers: { 'x-tenant-id': tenantId }
        });
        if (paymentRes.ok) {
          const paymentData = await paymentRes.json();
          console.log('[BookingDetailsDrawer] Payment data:', paymentData);
          
          // Map snake_case to camelCase
          const mappedPayments = (paymentData.payments || []).map((p: any) => ({
            id: p.id,
            bookingId: p.booking_id,
            tenantId: p.tenant_id,
            paymentAmount: p.payment_amount,
            paymentMethod: p.payment_method,
            paymentReference: p.payment_reference,
            notes: p.notes,
            paidAt: p.paid_at,
            createdAt: p.created_at,
            updatedAt: p.updated_at
          }));
          
          setPaymentHistory(mappedPayments);
        } else {
          console.warn('[BookingDetailsDrawer] Payment fetch failed:', paymentRes.status);
          setPaymentHistory(booking.paymentHistory || []);
        }
      } catch (error) {
        console.error('Error fetching payment history:', error);
        setPaymentHistory(booking.paymentHistory || []);
      }

      // Fetch real booking history
      try {
        const historyUrl = new URL(`/api/bookings/${booking.id}/history`, window.location.origin);
        historyUrl.searchParams.set('tenantId', tenantId);
        const historyRes = await fetch(historyUrl.toString(), {
          headers: { 'x-tenant-id': tenantId }
        });
        
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          if (historyData.history && Array.isArray(historyData.history)) {
            const mappedHistory = historyData.history.map((event: any) => ({
              timestamp: new Date(event.createdAt),
              action: event.description || event.action,
              actor: event.actor,
              details: event.metadata ? JSON.stringify(event.metadata) : undefined
            }));
            setHistory(mappedHistory);
          }
        } else {
          console.warn('[BookingDetailsDrawer] History fetch failed:', historyRes.status);
          setHistory([]);
        }
      } catch (error) {
        console.error('Error fetching booking history:', error);
        setHistory([]);
      }
    } catch (error) {
      console.error('Error fetching related data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendedAction = () => {
    if (booking.status === BookingStatus.PENDING) {
      return { label: 'Confirm Booking', color: 'text-yellow-600' };
    }
    if (booking.status === BookingStatus.CONFIRMED && booking.paymentStatus === PaymentStatus.PENDING) {
      return { label: 'Record Payment', color: 'text-blue-600' };
    }
    if (booking.paymentStatus === PaymentStatus.PAID && invoices.length === 0) {
      return { label: 'Generate Invoice', color: 'text-green-600' };
    }
    if (invoices.length > 0 && invoices[0].status === InvoiceStatus.DRAFT) {
      return { label: 'Send Invoice', color: 'text-purple-600' };
    }
    return { label: 'Completed', color: 'text-gray-600' };
  };

  const handleUpdateStatus = async (status: BookingStatus) => {
    if (!onBookingUpdate) {
      toast.error('Unable to update booking');
      return;
    }
    try {
      setLoading(true);
      await onBookingUpdate(booking.id, { status });
      toast.success(`Booking ${status.toLowerCase()}`);
      setShowStatusDialog(false);
      await fetchRelatedData();
    } catch (error) {
      console.error('Error updating booking status:', error);
      const msg = error instanceof Error ? error.message : 'Failed to update booking status';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    try {
      setLoading(true);
      
      // Use the payment endpoint to record payment properly
      const response = await fetch(`/api/bookings/${booking.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify({
          tenantId,
          paymentAmount: booking.totalAmount - (booking.paidAmount || 0),
          paymentMethod: paymentMethod,
          paymentReference: '',
          notes: 'Payment recorded'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to record payment');
      }

      toast.success('Payment recorded');
      setShowPaymentDialog(false);
      await fetchRelatedData();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (onGenerateInvoice) {
      try {
        setLoading(true);
        await onGenerateInvoice(booking.id);
        await fetchRelatedData();
      } catch (error) {
        console.error('Error forwarding invoice generation:', error);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/invoices/from-booking/${booking.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify({
          tenantId,
          bookingId: booking.id,
          customerId: booking.customerId,
          totalAmount: booking.totalAmount
        })
      });

      if (response.ok) {
        toast.success('Invoice generated successfully');
        await fetchRelatedData();
      } else {
        let errorMsg = `Failed to generate invoice (${response.status})`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          errorMsg = response.statusText || errorMsg;
        }
        console.error('API Error:', errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      const msg = error instanceof Error ? error.message : 'Failed to generate invoice';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoiceWhatsApp = async (invoiceId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${invoiceId}/whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify({
          customerId: booking.customerId,
          invoiceId
        })
      });

      if (response.ok) {
        toast.success('Invoice sent via WhatsApp');
        await fetchRelatedData();
      } else {
        const errorData = await response.json();
        const errorMsg = errorData.error || `Failed to send invoice (${response.status})`;
        console.error('API Error:', errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkInvoicePaid = async (invoiceId: string) => {
    if (!onBookingUpdate) return;
    try {
      setLoading(true);
      // Update invoice status via API
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify({
          status: InvoiceStatus.PAID
        })
      });

      if (!response.ok) {
        throw new Error('Failed to mark invoice as paid');
      }

      toast.success('Invoice marked as paid');
      await fetchRelatedData();
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to mark invoice as paid');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoicePDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
        headers: {
          'x-tenant-id': tenantId
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Invoice downloaded');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to download invoice');
    } finally {
      setLoading(false);
    }
  };

  const recommended = getRecommendedAction();
  const statusColor = {
    [BookingStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [BookingStatus.CONFIRMED]: 'bg-blue-100 text-blue-800',
    [BookingStatus.COMPLETED]: 'bg-green-100 text-green-800',
    [BookingStatus.CANCELLED]: 'bg-red-100 text-red-800',
    [BookingStatus.NO_SHOW]: 'bg-gray-100 text-gray-800'
  };

  const paymentStatusColor = booking.paymentStatus === PaymentStatus.PAID 
    ? 'bg-green-100 text-green-800' 
    : 'bg-orange-100 text-orange-800';

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Title Row */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">{booking.bookingNumber}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {booking.customer?.name} • {booking.service?.name}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge className={statusColor[booking.status]}>
                  {booking.status.toUpperCase()}
                </Badge>
                <Badge className={paymentStatusColor}>
                  {booking.paymentStatus.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Schedule Row */}
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(booking.scheduledAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {new Date(booking.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Rp {booking.totalAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Recommended Action */}
            <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <span className={`text-sm font-medium ${recommended.color}`}>
                  Next Action: {recommended.label}
                </span>
              </div>
              {recommended.label !== 'Completed' && (
                <ChevronDown className="h-4 w-4 text-blue-600" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="invoice">Invoice</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Summary Tab */}
            <TabsContent value="summary" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Customer</Label>
                  <p className="font-medium">{booking.customer?.name}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Phone</Label>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{booking.customer?.phone}</p>
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600">Service</Label>
                  <p className="font-medium">{booking.service?.name}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Duration</Label>
                  <p className="font-medium">{booking.service?.duration} minutes</p>
                </div>
                <div>
                  <Label className="text-gray-600">Amount</Label>
                  <p className="font-medium">Rp {booking.totalAmount.toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Status</Label>
                  <Badge className={statusColor[booking.status]}>
                    {booking.status.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {booking.isHomeVisit && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-blue-600 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Home Visit</p>
                      <p className="text-sm text-blue-700">{booking.homeVisitAddress}</p>
                    </div>
                  </div>
                </div>
              )}

              {booking.notes && (
                <div>
                  <Label className="text-gray-600">Notes</Label>
                  <p className="text-sm">{booking.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline"
                  onClick={() => handleUpdateStatus(
                    booking.status === BookingStatus.PENDING 
                      ? BookingStatus.CONFIRMED 
                      : BookingStatus.COMPLETED
                  )}
                >
                  {booking.status === BookingStatus.PENDING ? 'Confirm' : 'Complete'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toast.info('Reschedule feature coming soon')}
                  disabled={booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED}
                >
                  Reschedule
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => toast.info('More options coming soon')}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Payment Tab */}
            <TabsContent value="payment" className="space-y-4 mt-4">
              {/* Payment Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Status</Label>
                  <Badge className={paymentStatusColor}>
                    {booking.paymentStatus.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-gray-600">Total Amount</Label>
                  <p className="font-medium">Rp {booking.totalAmount.toLocaleString('id-ID')}</p>
                </div>
              </div>

              {/* Payment Progress */}
              {booking.paidAmount !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Paid Amount:</span>
                    <span className="font-medium">Rp {(booking.paidAmount || 0).toLocaleString('id-ID')}</span>
                  </div>
                  {booking.remainingBalance !== undefined && booking.remainingBalance > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Remaining Balance:</span>
                      <span className="font-medium text-orange-600">Rp {booking.remainingBalance.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${((booking.paidAmount || 0) / booking.totalAmount) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Payment History */}
              {paymentHistory.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Payment History</h3>
                  <div className="border rounded-lg divide-y">
                    {paymentHistory.map((payment, index) => {
                      const methodLabels: Record<string, string> = {
                        'cash': '💵 Cash',
                        'card': '💳 Card',
                        'transfer': '🏦 Transfer',
                        'qris': '📱 QRIS'
                      };
                      const methodLabel = methodLabels[payment.paymentMethod] || '❓ Unknown';
                      const paidDate = payment.paidAt ? new Date(payment.paidAt) : null;
                      
                      return (
                      <div key={index} className="p-3 space-y-1">
                        <div className="flex justify-between">
                          <span className="font-medium text-sm">{methodLabel}</span>
                          <span className="font-semibold">Rp {(payment.paymentAmount || 0).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{paidDate?.toLocaleDateString('id-ID') || 'Invalid Date'}</span>
                          <span>{paidDate?.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) || ''}</span>
                        </div>
                        {payment.paymentReference && (
                          <div className="text-xs text-gray-600">
                            Ref: {payment.paymentReference}
                          </div>
                        )}
                        {payment.notes && (
                          <div className="text-xs text-gray-600">
                            Notes: {payment.notes}
                          </div>
                        )}
                      </div>
                    );
                    })}

                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No payment history
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                {booking.paymentStatus !== PaymentStatus.PAID && (
                  <>
                    <Button onClick={() => setShowPaymentDialog(true)}>
                      {booking.paymentStatus === PaymentStatus.PENDING ? 'Mark as Paid' : 'Record Additional Payment'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowRefundDialog(true)}>
                      Process Refund
                    </Button>
                  </>
                )}
                {booking.paymentStatus === PaymentStatus.PAID && (
                  <p className="text-sm text-green-600 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Payment received
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Invoice Tab */}
            <TabsContent value="invoice" className="space-y-4 mt-4">
              {invoices.length > 0 ? (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-gray-600">Rp {invoice.totalAmount.toLocaleString('id-ID')}</p>
                          {invoice.dueDate && (
                            <p className="text-xs text-gray-500">
                              Due: {new Date(invoice.dueDate).toLocaleDateString('id-ID')}
                            </p>
                          )}
                        </div>
                        <Badge className={
                          invoice.status === InvoiceStatus.PAID 
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === InvoiceStatus.SENT
                            ? 'bg-blue-100 text-blue-800'
                            : invoice.status === InvoiceStatus.DRAFT
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                        }>
                          {invoice.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {invoice.status === InvoiceStatus.DRAFT && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSendInvoiceWhatsApp(invoice.id)}
                            disabled={loading}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Send
                          </Button>
                        )}
                        {invoice.status !== InvoiceStatus.PAID && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleMarkInvoicePaid(invoice.id)}
                            disabled={loading}
                          >
                            Mark Paid
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownloadInvoicePDF(invoice.id, invoice.invoiceNumber)}
                          disabled={loading}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          PDF
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleSendInvoiceWhatsApp(invoice.id)}
                          disabled={loading}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          WhatsApp
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center space-y-3">
                  <p className="text-sm text-gray-600">No invoices yet</p>
                  {booking.paymentStatus === PaymentStatus.PENDING ? (
                    <p className="text-xs text-gray-500">Record payment first to generate invoice</p>
                  ) : booking.paymentStatus === PaymentStatus.PAID ? (
                    <Button 
                      onClick={handleGenerateInvoice}
                      disabled={loading || isGeneratingInvoice}
                    >
                      {loading || isGeneratingInvoice ? 'Generating...' : 'Generate Invoice'}
                    </Button>
                  ) : null}
                </div>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4 mt-4">
              <div className="space-y-3">
                {history.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b last:border-b-0">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                      {index < history.length - 1 && (
                        <div className="h-12 w-0.5 bg-gray-300 my-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-medium text-sm">{item.action}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(item.timestamp).toLocaleString('id-ID')} by {item.actor}
                      </p>
                      {item.details && (
                        <p className="text-xs text-gray-600 mt-1">{item.details}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{booking.paymentStatus === PaymentStatus.PENDING ? 'Mark as Paid' : 'Record Additional Payment'}</DialogTitle>
            <DialogDescription>
              {booking.paymentStatus === PaymentStatus.PENDING 
                ? 'Confirm that payment has been received' 
                : 'Record the additional payment received'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Payment Summary */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Amount:</span>
                <span className="font-semibold">Rp {booking.totalAmount.toLocaleString('id-ID')}</span>
              </div>
              {(booking.paidAmount || 0) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Already Paid:</span>
                  <span className="font-semibold">Rp {(booking.paidAmount || 0).toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-sm">
                <span className="font-semibold">Remaining to Receive:</span>
                <span className="font-bold text-lg text-blue-600">
                  Rp {(booking.totalAmount - (booking.paidAmount || 0)).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">💵 Cash</SelectItem>
                  <SelectItem value="card">💳 Card</SelectItem>
                  <SelectItem value="transfer">🏦 Bank Transfer</SelectItem>
                  <SelectItem value="qris">📱 QRIS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleRecordPayment} className="flex-1">
                Confirm Payment Received
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Process a refund for this booking
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Refund Amount</Label>
              <Input 
                type="number" 
                value={refundAmount}
                onChange={(e) => setRefundAmount(parseFloat(e.target.value))}
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea 
                value={refundNotes}
                onChange={(e) => setRefundNotes(e.target.value)}
                placeholder="Reason for refund"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
                Cancel
              </Button>
              <Button>
                Process Refund
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
