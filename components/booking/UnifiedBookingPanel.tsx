'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Booking, BookingStatus, PaymentStatus } from '@/types/booking';
import { Invoice, InvoiceStatus } from '@/types/invoice';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'timeline'>('overview');

  // Related data
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [history, setHistory] = useState<BookingHistory[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  // Additional data fetching state
  const [customerDetails, setCustomerDetails] = useState<any>(null);
  const [serviceDetails, setServiceDetails] = useState<any>(null);

  // UI state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
  const [whatsAppTemplate, setWhatsAppTemplate] = useState('confirmation');

  // Form State
  const [paymentMethod, setPaymentMethod] = useState<string>(booking.paymentMethod || 'cash');
  const [refundAmount, setRefundAmount] = useState(booking.totalAmount);
  const [refundNotes, setRefundNotes] = useState('');
  const [newScheduledDate, setNewScheduledDate] = useState<string>(
    booking.scheduledAt ? new Date(booking.scheduledAt).toISOString().slice(0, 16) : ''
  );

  // Derived state for display
  const displayCustomer = booking.customer || customerDetails || {};
  const displayService = booking.service || serviceDetails || {};



  // Fetch related data
  const fetchRelatedData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch customer & service details if missing in booking object
      if (!booking.customer || !booking.service) {
        try {
          const promises = [];
          if (!booking.customer && booking.customerId) {
            promises.push(
              fetch(`/api/customers/${booking.customerId}`, { headers: { 'x-tenant-id': tenantId } })
                .then(r => r.json())
                .then(d => setCustomerDetails(d))
            );
          }
          if (!booking.service && booking.serviceId) {
            promises.push(
              fetch(`/api/services/${booking.serviceId}`, { headers: { 'x-tenant-id': tenantId } })
                .then(r => r.json())
                .then(d => setServiceDetails(d))
            );
          }
          await Promise.all(promises);
        } catch (err) {
          console.error('Error fetching details:', err);
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
          setPaymentHistory(booking.paymentHistory || []);
        }
      } catch (error) {
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
              if (event.metadata) {
                const meta = event.metadata;
                const detailParts: string[] = [];
                if (meta.totalAmount) detailParts.push(`Total: Rp ${(meta.totalAmount || 0).toLocaleString('id-ID')}`);
                if (meta.paymentMethod) detailParts.push(`Method: ${meta.paymentMethod.toUpperCase()}`);
                if (detailParts.length > 0) details = detailParts.join(' • ');
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
        }
      } catch (error) {
        setHistory([]);
      }
    } catch (error) {
      console.error('Error fetching related data:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, booking.id, booking.customer, booking.service, booking.customerId, booking.serviceId]);

  useEffect(() => {
    fetchRelatedData();
  }, [fetchRelatedData]);

  // --- ACTIONS ---

  const handleUpdateStatus = async (status: BookingStatus) => {
    if (!onBookingUpdate) return;
    try {
      setLoading(true);
      await onBookingUpdate(booking.id, { status });
      toast.success(`Booking ${status.toLowerCase()}`);

      // Log status change
      try {
        await fetch(`/api/bookings/${booking.id}/history-log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
          body: JSON.stringify({
            action: 'STATUS_CHANGED',
            description: `Booking status changed to ${status}`,
          })
        });
      } catch (e) { }

      await fetchRelatedData();
    } catch (error) {
      toast.error('Failed to update booking status');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bookings/${booking.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({
          tenantId,
          paymentAmount: booking.totalAmount - (booking.paidAmount || 0),
          paymentMethod: paymentMethod,
          notes: 'Payment recorded'
        })
      });

      if (!response.ok) throw new Error('Failed to record payment');

      toast.success('Payment recorded');
      setShowPaymentDialog(false);
      await fetchRelatedData();
    } catch (error) {
      toast.error('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!onBookingUpdate || !newScheduledDate) return;

    try {
      setLoading(true);
      const newDate = new Date(newScheduledDate);
      await onBookingUpdate(booking.id, { scheduledAt: newDate });
      toast.success('Booking rescheduled successfully');
      setShowRescheduleDialog(false);
      await fetchRelatedData();
    } catch (error) {
      toast.error('Failed to reschedule booking');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (onGenerateInvoice) {
      setLoading(true);
      await onGenerateInvoice(booking.id);
      setLoading(false);
      await fetchRelatedData();
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/from-booking/${booking.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
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
        toast.error('Failed to generate invoice');
      }
    } catch (error) {
      toast.error('Error generating invoice');
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
      } else {
        toast.error('Failed to send invoice');
      }
    } catch (error) {
      toast.error('Error sending invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkInvoicePaid = async (invoiceId: string) => {
    try {
      setLoading(true);
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

      if (response.ok) {
        toast.success('Invoice marked as paid');
        await fetchRelatedData();
      } else {
        toast.error('Failed to update invoice');
      }
    } catch (error) {
      toast.error('Error updating invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoicePDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
        headers: { 'x-tenant-id': tenantId }
      });

      if (!response.ok) throw new Error('Failed to download invoice');

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
      toast.error('Failed to download invoice');
    } finally {
      setLoading(false);
    }
    <Button onClick={() => handleUpdateStatus(BookingStatus.COMPLETED)} className="bg-success hover:bg-green-600 text-white shadow-md shadow-green-500/20">
      Complete
    </Button>
            )
}
<Button variant="outline" onClick={() => setShowRescheduleDialog(true)} className="border-gray-300 text-txt-secondary hover:text-primary hover:border-primary">
  <i className='bx bx-edit-alt text-base mr-2'></i> Reschedule
</Button>
          </div >
        </div >
      </div >

  {/* TABS HEADER */ }
  < div className = "px-6 border-b border-gray-100 flex gap-6 overflow-x-auto" >
  {
    [
    { id: 'overview', label: 'Overview', icon: 'bx bx-file' },
    { id: 'financials', label: 'Financials', icon: 'bx bx-dollar-circle' },
    { id: 'timeline', label: 'History', icon: 'bx bx-history' },
         ].map(tab => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id as any)}
        className={`
                  py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 px-1
                  ${activeTab === tab.id
            ? 'border-primary text-primary'
            : 'border-transparent text-txt-muted hover:text-txt-primary hover:border-gray-200'}
               `}
      >
        <i className={`${tab.icon} text-base`} />
        {tab.label}
      </button>
    ))
  }
      </div >

  {/* CONTENT AREA */ }
  < div className = "flex-1 overflow-y-auto p-6 bg-body/30" >
    { activeTab === 'overview' && renderOverviewTab()}
{ activeTab === 'financials' && renderFinancialsTab() }
{ activeTab === 'timeline' && renderTimelineTab() }
      </div >

  {/* --- DIALOGS (Hidden) --- */ }
  < Dialog open = { showPaymentDialog } onOpenChange = { setShowPaymentDialog } >
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogDescription>Add a payment transaction for this booking.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm">
          <div className="flex justify-between mb-1">
            <span>Total Bill:</span>
            <span className="font-semibold">Rp {booking.totalAmount.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-danger font-bold">
            <span>Remaining:</span>
            <span>Rp {((booking.remainingBalance || booking.totalAmount - (booking.paidAmount || 0))).toLocaleString('id-ID')}</span>
          </div>
        </div>
        <div>
          <Label>Payment Method</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="transfer">Bank Transfer</SelectItem>
              <SelectItem value="qris">QRIS</SelectItem>
              <SelectItem value="card">Credit Card</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
        <Button onClick={handleRecordPayment} className="bg-primary">Confirm Payment</Button>
      </div>
    </DialogContent>
      </Dialog >

      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>Process a refund for this booking.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Refund Amount</Label>
              <Input 
                type="number" 
                value={refundAmount}
                onChange={(e) => setRefundAmount(parseFloat(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea 
                value={refundNotes}
                onChange={(e) => setRefundNotes(e.target.value)}
                placeholder="Reason for refund..."
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>Cancel</Button>
            <Button onClick={handleRefund} className="bg-danger text-white hover:bg-red-600">Process Refund</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
         <DialogContent className="sm:max-w-md">
            <DialogHeader>
               <DialogTitle>Reschedule Booking</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
               <div>
                  <Label>New Date & Time</Label>
                  <Input 
                     type="datetime-local" 
                     value={newScheduledDate} 
                     onChange={(e) => setNewScheduledDate(e.target.value)}
                     className="mt-1"
                  />
               </div>
            </div>
            <div className="flex justify-end gap-2">
               <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>Cancel</Button>
               <Button onClick={handleReschedule} className="bg-primary">Save Changes</Button>
            </div>
         </DialogContent>
      </Dialog>

      <Dialog open={showWhatsAppDialog} onOpenChange={setShowWhatsAppDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send WhatsApp Reminder</DialogTitle>
            <DialogDescription>Select a template to send to the customer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
             <div>
                <Label>Template</Label>
                <Select value={whatsAppTemplate} onValueChange={setWhatsAppTemplate}>
                   <SelectTrigger><SelectValue /></SelectTrigger>
                   <SelectContent>
                      <SelectItem value="confirmation">Booking Confirmation</SelectItem>
                      <SelectItem value="reminder">Upcoming Reminder</SelectItem>
                      <SelectItem value="payment">Payment Reminder</SelectItem>
                      <SelectItem value="completion">Completion Thank You</SelectItem>
                   </SelectContent>
                </Select>
             </div>
             <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm italic text-txt-secondary">
                {whatsAppTemplate === 'confirmation' && "Halo [Name], booking Anda dengan nomor [No] untuk [Service] pada [Date] [Time] telah terkonfirmasi..."}
                {whatsAppTemplate === 'reminder' && "Halo [Name], mengingatkan kembali untuk booking Anda besok [Date] [Time] untuk [Service]..."}
                {whatsAppTemplate === 'payment' && "Halo [Name], mohon selesaikan pembayaran sebesar [Amount] untuk booking [No]..."}
                {whatsAppTemplate === 'completion' && "Halo [Name], terima kasih telah menggunakan layanan kami..."}
             </div>
          </div>
          <div className="flex justify-end gap-2">
             <Button variant="outline" onClick={() => setShowWhatsAppDialog(false)}>Cancel</Button>
             <Button onClick={handleSendWhatsApp} className="bg-green-600 hover:bg-green-700 text-white">
                <i className='bx bxl-whatsapp text-lg mr-2'></i> Send WhatsApp
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
}