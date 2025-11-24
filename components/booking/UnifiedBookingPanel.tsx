'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Booking, BookingStatus, PaymentStatus, Customer, Service } from '@/types/booking';
import { Invoice, InvoiceStatus, PaymentMethod } from '@/types/invoice';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, Clock, MapPin, Phone, Mail, AlertCircle, CheckCircle, 
  ChevronDown, Download, Send, MoreVertical, Edit, RefreshCw,
  FileText, CreditCard, MessageCircle, CheckSquare, XSquare, Clock3
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
  const [loading, setLoading] = useState(false);
  
  // Related data
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [history, setHistory] = useState<BookingHistory[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  
  // UI state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<BookingStatus>(booking.status);
  const [paymentMethod, setPaymentMethod] = useState<string>(booking.paymentMethod || 'cash');
  const [refundAmount, setRefundAmount] = useState(booking.totalAmount);
  const [refundNotes, setRefundNotes] = useState('');
  const [newScheduledDate, setNewScheduledDate] = useState<string>(
    booking.scheduledAt ? new Date(booking.scheduledAt).toISOString().slice(0, 16) : ''
  );

  // Fetch related data
  const fetchRelatedData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Log travel data to verify it's present
      if (booking.isHomeVisit) {
        console.log('[UnifiedBookingPanel] Home visit booking travel data:', {
          travelSurchargeAmount: booking.travelSurchargeAmount,
          travelDistance: booking.travelDistance,
          travelDuration: booking.travelDuration,
          totalAmount: booking.totalAmount
        });
      }

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
            const mappedHistory = historyData.history.map((event: any) => {
              let details = undefined;
              
              // Format metadata into readable details
              if (event.metadata) {
                const meta = event.metadata;
                const detailParts: string[] = [];
                
                if (meta.totalAmount) detailParts.push(`Total: Rp ${(meta.totalAmount || 0).toLocaleString('id-ID')}`);
                if (meta.dpAmount) detailParts.push(`DP: Rp ${(meta.dpAmount || 0).toLocaleString('id-ID')}`);
                if (meta.paymentAmount) detailParts.push(`Amount: Rp ${(meta.paymentAmount || 0).toLocaleString('id-ID')}`);
                if (meta.paymentMethod) detailParts.push(`Method: ${meta.paymentMethod.toUpperCase()}`);
                if (meta.invoiceNumber) detailParts.push(`Invoice: ${meta.invoiceNumber}`);
                
                if (detailParts.length > 0) {
                  details = detailParts.join(' • ');
                }
              }
              
              return {
                timestamp: new Date(event.createdAt),
                action: event.description || event.action,
                actor: event.actor,
                details
              };
            });
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
  }, [tenantId, booking.id]);

  useEffect(() => {
    fetchRelatedData();
  }, [fetchRelatedData]);

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
    return { label: 'Completed', color: 'text-txt-secondary' };
  };

  const handleUpdateStatus = async (status: BookingStatus) => {
    if (!onBookingUpdate) {
      toast.error('Unable to update booking');
      return;
    }
    try {
      setLoading(true);
      const oldStatus = booking.status;
      await onBookingUpdate(booking.id, { status });
      toast.success(`Booking ${status.toLowerCase()}`);
      
      // Log status change to history
      try {
        await fetch(`/api/bookings/${booking.id}/history-log`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': tenantId
          },
          body: JSON.stringify({
            action: 'STATUS_CHANGED',
            description: `Booking status changed from ${oldStatus} to ${status}`,
            oldValues: { status: oldStatus },
            newValues: { status: status }
          })
        });
      } catch (historyError) {
        console.error('Error logging status change:', historyError);
      }
      
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
      
      // Log payment recorded to history
      try {
        await fetch(`/api/bookings/${booking.id}/history-log`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': tenantId
          },
          body: JSON.stringify({
            action: 'PAYMENT_RECORDED',
            description: `Payment recorded - ${paymentMethod} (Rp ${(booking.totalAmount - (booking.paidAmount || 0)).toLocaleString('id-ID')})`,
            metadata: {
              paymentAmount: booking.totalAmount - (booking.paidAmount || 0),
              paymentMethod: paymentMethod
            }
          })
        });
      } catch (historyError) {
        console.error('Error logging payment:', historyError);
      }
      
      setShowPaymentDialog(false);
      await fetchRelatedData();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!onBookingUpdate || !newScheduledDate) {
      toast.error('Please select a new date and time');
      return;
    }

    try {
      setLoading(true);
      const newDate = new Date(newScheduledDate);
      const oldDate = new Date(booking.scheduledAt);
      
      await onBookingUpdate(booking.id, {
        scheduledAt: newDate
      });

      // Log reschedule to history
      try {
        await fetch(`/api/bookings/${booking.id}/history-log`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': tenantId
          },
          body: JSON.stringify({
            action: 'RESCHEDULED',
            description: `Booking rescheduled from ${oldDate.toLocaleDateString('id-ID')} to ${newDate.toLocaleDateString('id-ID')}`,
            oldValues: { scheduledAt: oldDate.toISOString() },
            newValues: { scheduledAt: newDate.toISOString() },
            metadata: {
              oldDate: oldDate.toISOString(),
              newDate: newDate.toISOString()
            }
          })
        });
      } catch (historyError) {
        console.error('Error logging reschedule to history:', historyError);
      }

      toast.success('Booking rescheduled successfully');
      setShowRescheduleDialog(false);
      await fetchRelatedData();
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reschedule booking');
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
        const invoiceData = await response.json();
        toast.success('Invoice generated successfully');
        
        // Log invoice generation to history
        try {
          await fetch(`/api/bookings/${booking.id}/history-log`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-tenant-id': tenantId
            },
            body: JSON.stringify({
              action: 'INVOICE_GENERATED',
              description: `Invoice generated - ${invoiceData.invoice?.invoiceNumber || 'New Invoice'}`,
              metadata: {
                invoiceId: invoiceData.invoice?.id,
                invoiceNumber: invoiceData.invoice?.invoiceNumber,
                totalAmount: booking.totalAmount
              }
            })
          });
        } catch (historyError) {
          console.error('Error logging invoice generation:', historyError);
        }
        
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
        
        // Log invoice sent to history
        try {
          await fetch(`/api/bookings/${booking.id}/history-log`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-tenant-id': tenantId
            },
            body: JSON.stringify({
              action: 'INVOICE_SENT',
              description: 'Invoice sent via WhatsApp',
              metadata: {
                invoiceId,
                method: 'whatsapp'
              }
            })
          });
        } catch (historyError) {
          console.error('Error logging invoice send:', historyError);
        }
        
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
      
      // Log invoice marked as paid to history
      try {
        await fetch(`/api/bookings/${booking.id}/history-log`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': tenantId
          },
          body: JSON.stringify({
            action: 'INVOICE_MARKED_PAID',
            description: 'Invoice marked as paid',
            metadata: {
              invoiceId
            }
          })
        });
      } catch (historyError) {
        console.error('Error logging invoice paid:', historyError);
      }
      
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
    [BookingStatus.PENDING]: 'bg-yellow-100 text-warning',
    [BookingStatus.CONFIRMED]: 'bg-green-100 text-success',
    [BookingStatus.COMPLETED]: 'bg-green-100 text-success',
    [BookingStatus.CANCELLED]: 'bg-red-100 text-danger',
    [BookingStatus.NO_SHOW]: 'bg-gray-100 text-txt-muted'
  };

  const paymentStatusColor = booking.paymentStatus === PaymentStatus.PAID 
    ? 'bg-green-100 text-success' 
    : 'bg-yellow-100 text-warning';

  return (
    <div className="w-full space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-card shadow-card p-4 md:p-6 border-0">
        <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-5">
          {/* Icon Container */}
          <div className="w-12 h-12 rounded bg-primary-light flex items-center justify-center text-primary shrink-0">
            <Calendar className="h-6 w-6" />
          </div>

          <div className="flex-1 w-full space-y-3 md:space-y-4">
            {/* Title Row */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 md:gap-4">
              <div className="min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-txt-primary truncate">{booking.bookingNumber}</h2>
                <p className="text-xs md:text-sm text-txt-secondary mt-1 line-clamp-2">
                  {booking.customer?.name} • {booking.service?.name}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge className={`px-2 md:px-3 py-1 rounded text-xs font-bold uppercase shadow-sm ${statusColor[booking.status]}`}>
                  {booking.status}
                </Badge>
                <Badge className={`px-2 md:px-3 py-1 rounded text-xs font-bold uppercase shadow-sm ${paymentStatusColor}`}>
                  {booking.paymentStatus}
                </Badge>
              </div>
            </div>

            {/* Schedule Row - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 text-xs md:text-sm text-txt-secondary">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span>{new Date(booking.scheduledAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>{new Date(booking.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-txt-primary">Rp {booking.totalAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Recommended Action */}
            <div className="flex items-center justify-between bg-primary-light/50 p-3 rounded-md border border-primary-light/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  Next Action: {recommended.label}
                </span>
              </div>
              {recommended.label !== 'Completed' && (
                <ChevronDown className="h-4 w-4 text-primary" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Information */}
      <div className="bg-white rounded-card shadow-card p-4 md:p-6 border-0">
        <h3 className="text-lg md:text-xl font-semibold text-txt-primary mb-4">Booking Information</h3>
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-txt-secondary text-sm">Customer</Label>
                <p className="font-medium text-txt-primary">{booking.customer?.name}</p>
              </div>
              <div>
                <Label className="text-txt-secondary text-sm">Phone</Label>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-txt-primary">{booking.customer?.phone}</p>
                  <Phone className="h-4 w-4 text-txt-muted" />
                </div>
              </div>
              <div>
                <Label className="text-txt-secondary text-sm">Service</Label>
                <p className="font-medium text-txt-primary">{booking.service?.name}</p>
              </div>
              <div>
                <Label className="text-txt-secondary text-sm">Duration</Label>
                <p className="font-medium text-txt-primary">{booking.service?.duration} minutes</p>
              </div>
              <div>
                <Label className="text-txt-secondary text-sm">Status</Label>
                <Badge className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[booking.status]}`}>
                  {booking.status.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Amount Breakdown */}
            <div className="p-4 bg-gray-50 rounded-md border border-gray-200 space-y-2">
                <h3 className="font-semibold text-sm mb-3">Amount Breakdown</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-txt-secondary">Base Service Amount</span>
                  <span>Rp {(booking.service?.price ?? 0).toLocaleString('id-ID')}</span>
                </div>
                {booking.isHomeVisit && Number(booking.travelSurchargeAmount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-txt-secondary">Travel Surcharge {booking.travelDistance ? `(${booking.travelDistance.toFixed(1)}km)` : ''}</span>
                    <span>Rp {(Number(booking.travelSurchargeAmount ?? 0)).toLocaleString('id-ID')}</span>
                  </div>
                )}
                {Number(booking.taxPercentage ?? 0) > 0 && (
                  <div className="flex justify-between text-sm text-txt-secondary">
                    <span>Tax {Number(booking.taxPercentage).toFixed(2)}%</span>
                    <span>Rp {((Number(booking.service?.price ?? 0) + (booking.isHomeVisit ? booking.travelSurchargeAmount ?? 0 : 0)) * Number(booking.taxPercentage ?? 0) / 100).toLocaleString('id-ID')}</span>
                  </div>
                )}
                {Number(booking.serviceChargeAmount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm text-txt-secondary">
                    <span>Service Charge</span>
                    <span>Rp {Number(booking.serviceChargeAmount ?? 0).toLocaleString('id-ID')}</span>
                  </div>
                )}
                {Number(booking.additionalFeesAmount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm text-txt-secondary">
                    <span>Additional Fees</span>
                    <span>Rp {Number(booking.additionalFeesAmount ?? 0).toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total Amount</span>
                  <span>Rp {booking.totalAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {booking.isHomeVisit && (
                <div className="mt-4 p-3 bg-primary-light/30 rounded-md border border-primary-light">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-primary mt-1" />
                    <div>
                      <p className="text-sm font-medium text-primary">Home Visit</p>
                      <p className="text-sm text-txt-secondary">{booking.homeVisitAddress}</p>
                    </div>
                  </div>
                </div>
              )}

              {booking.notes && (
                <div>
                  <Label className="text-txt-secondary text-sm">Notes</Label>
                  <p className="text-sm text-txt-primary">{booking.notes}</p>
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
                  onClick={() => setShowRescheduleDialog(true)}
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
        </div>
      </div>

      {/* Payment Information */}
      <div className="bg-white rounded-card shadow-card p-4 md:p-6 border-0">
        <h3 className="text-lg md:text-xl font-semibold text-txt-primary mb-4">Payment Information</h3>
        <div className="space-y-4">
              {/* Payment Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-txt-secondary">Status</Label>
                  <Badge className={paymentStatusColor}>
                    {booking.paymentStatus.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-txt-secondary">Total Amount</Label>
                  <p className="font-medium">Rp {booking.totalAmount.toLocaleString('id-ID')}</p>
                </div>
              </div>

              {/* Payment Progress */}
              {booking.paidAmount !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-txt-secondary">Paid Amount:</span>
                    <span className="font-medium">Rp {(booking.paidAmount || 0).toLocaleString('id-ID')}</span>
                  </div>
                  {booking.remainingBalance !== undefined && booking.remainingBalance > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-txt-secondary">Remaining Balance:</span>
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
                        <div className="flex justify-between text-xs text-txt-muted">
                          <span>{paidDate?.toLocaleDateString('id-ID') || 'Invalid Date'}</span>
                          <span>{paidDate?.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) || ''}</span>
                        </div>
                        {payment.paymentReference && (
                          <div className="text-xs text-txt-secondary">
                            Ref: {payment.paymentReference}
                          </div>
                        )}
                        {payment.notes && (
                          <div className="text-xs text-txt-secondary">
                            Notes: {payment.notes}
                          </div>
                        )}
                      </div>
                    );
                    })}

                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-txt-muted text-sm">
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
        </div>
      </div>

      {/* Invoice & Documents */}
      <div className="bg-white rounded-card shadow-card p-4 md:p-6 border-0">
        <h3 className="text-lg md:text-xl font-semibold text-txt-primary mb-4">Invoice & Documents</h3>
        <div className="space-y-4">
              {invoices.length > 0 ? (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-txt-secondary">Rp {invoice.totalAmount.toLocaleString('id-ID')}</p>
                          {invoice.dueDate && (
                            <p className="text-xs text-txt-muted">
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
                  <p className="text-sm text-txt-secondary">No invoices yet</p>
                  {booking.paymentStatus === PaymentStatus.PENDING ? (
                    <p className="text-xs text-txt-muted">Record payment first to generate invoice</p>
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
        </div>
      </div>

      {/* Booking History */}
      <div className="bg-white rounded-card shadow-card p-4 md:p-6 border-0">
        <h3 className="text-lg md:text-xl font-semibold text-txt-primary mb-4">Booking History</h3>
        <div className="space-y-4">
                {history && history.length > 0 ? (
                  history.map((item, index) => {
                    // Get icon based on action
                    const getActionIcon = () => {
                      const actionStr = item.action?.toUpperCase() || '';
                      if (actionStr.includes('CREATED')) return <CheckSquare className="h-5 w-5 text-green-600" />;
                      if (actionStr.includes('STATUS') || actionStr.includes('CONFIRMED') || actionStr.includes('COMPLETED')) return <CheckCircle className="h-5 w-5 text-blue-600" />;
                      if (actionStr.includes('PAYMENT') || actionStr.includes('PAID')) return <CreditCard className="h-5 w-5 text-emerald-600" />;
                      if (actionStr.includes('INVOICE')) return <FileText className="h-5 w-5 text-orange-600" />;
                      if (actionStr.includes('RESCHEDULE') || actionStr.includes('RESCHEDULED')) return <Clock3 className="h-5 w-5 text-purple-600" />;
                      if (actionStr.includes('CANCEL')) return <XSquare className="h-5 w-5 text-red-600" />;
                      if (actionStr.includes('SENT') || actionStr.includes('WHATSAPP')) return <MessageCircle className="h-5 w-5 text-green-600" />;
                      return <Clock className="h-5 w-5 text-gray-400" />;
                    };

                    return (
                      <div key={index} className="flex gap-4 py-4 px-3 border-l-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all">
                        <div className="flex-shrink-0 mt-1">
                          {getActionIcon()}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-txt-primary">{item.action}</p>
                          <p className="text-xs text-txt-muted mt-1 flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {new Date(item.timestamp).toLocaleString('id-ID')}
                            <span className="text-gray-400">•</span>
                            <span>{item.actor}</span>
                          </p>
                          {item.details && (
                            <p className="text-xs text-gray-700 mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                              {item.details}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-txt-muted">
                    <p className="text-sm">Belum ada riwayat booking</p>
                  </div>
                )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button 
          variant="outline"
          onClick={() => handleUpdateStatus(
            booking.status === BookingStatus.PENDING 
              ? BookingStatus.CONFIRMED 
              : BookingStatus.COMPLETED
          )}
          className="flex-1"
        >
          {booking.status === BookingStatus.PENDING ? 'Confirm Booking' : 'Complete Booking'}
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setShowRescheduleDialog(true)}
          disabled={booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED}
          className="flex-1"
        >
          Reschedule
        </Button>
      </div>

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

      {/* Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Booking</DialogTitle>
            <DialogDescription>
              Select a new date and time for this booking
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Current Scheduled Date</Label>
              <p className="text-sm text-txt-secondary mt-1">
                {new Date(booking.scheduledAt).toLocaleString('id-ID')}
              </p>
            </div>
            <div>
              <Label htmlFor="newDate">New Date & Time *</Label>
              <Input 
                id="newDate"
                type="datetime-local" 
                value={newScheduledDate}
                onChange={(e) => setNewScheduledDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleReschedule} disabled={loading || !newScheduledDate}>
                Confirm Reschedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
