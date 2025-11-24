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
  
  // UI state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
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
  }, [tenantId, booking.id]);

  useEffect(() => {
    fetchRelatedData();
  }, [fetchRelatedData]);

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
      } catch (e) {}
      
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
    // Fallback internal logic if needed...
  };

  // Helper styles
  const statusColor = {
    [BookingStatus.PENDING]: 'bg-yellow-100 text-warning',
    [BookingStatus.CONFIRMED]: 'bg-primary-light text-primary',
    [BookingStatus.COMPLETED]: 'bg-green-100 text-success',
    [BookingStatus.CANCELLED]: 'bg-red-100 text-danger',
    [BookingStatus.NO_SHOW]: 'bg-gray-100 text-txt-muted'
  };

  const paymentStatusColor = booking.paymentStatus === PaymentStatus.PAID 
    ? 'bg-green-100 text-success' 
    : 'bg-yellow-100 text-warning';

  // --- TAB CONTENT RENDERERS ---

  const renderOverviewTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
      {/* Left Column: Details */}
      <div className="space-y-6">
        {/* Customer Card */}
        <div className="bg-gray-50/50 rounded-lg p-4 border border-gray-100">
          <h4 className="text-xs font-bold text-txt-muted uppercase tracking-wider mb-3">Customer Details</h4>
          <div className="flex items-start gap-3">
             <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-txt-secondary">
                <i className='bx bx-user text-xl'></i>
             </div>
             <div>
                <p className="font-semibold text-txt-primary">{booking.customer?.name}</p>
                <div className="flex items-center gap-2 text-sm text-txt-secondary mt-0.5">
                   <i className='bx bx-phone text-xs'></i>
                   {booking.customer?.phone}
                </div>
                {booking.isHomeVisit && (
                  <div className="flex items-start gap-2 text-sm text-txt-secondary mt-2 bg-white p-2 rounded border border-gray-200">
                     <i className='bx bx-map text-xs mt-0.5 shrink-0'></i>
                     <span>{booking.homeVisitAddress}</span>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Service Card */}
        <div className="bg-gray-50/50 rounded-lg p-4 border border-gray-100">
          <h4 className="text-xs font-bold text-txt-muted uppercase tracking-wider mb-3">Service Details</h4>
          <div className="flex items-start gap-3">
             <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center text-primary">
                <i className='bx bx-time-five text-xl'></i>
             </div>
             <div>
                <p className="font-semibold text-txt-primary">{booking.service?.name}</p>
                <div className="flex items-center gap-2 text-sm text-txt-secondary mt-0.5">
                   <span>Duration: {booking.service?.duration} mins</span>
                </div>
                {booking.notes && (
                  <div className="mt-2 text-sm bg-yellow-50 text-warning-dark border border-yellow-100 p-2 rounded">
                    <span className="font-medium">Note:</span> {booking.notes}
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Right Column: Financial Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-0 overflow-hidden h-fit">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
           <h4 className="font-semibold text-txt-primary flex items-center gap-2">
              <i className='bx bx-dollar text-base'></i>
              Payment Breakdown
           </h4>
        </div>
        <div className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-txt-secondary">Base Price</span>
              <span>Rp {(booking.service?.price ?? 0).toLocaleString('id-ID')}</span>
            </div>
            {booking.isHomeVisit && Number(booking.travelSurchargeAmount ?? 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-txt-secondary">Travel Surcharge</span>
                <span>Rp {(Number(booking.travelSurchargeAmount ?? 0)).toLocaleString('id-ID')}</span>
              </div>
            )}
            {Number(booking.taxPercentage ?? 0) > 0 && (
              <div className="flex justify-between text-sm text-txt-secondary">
                <span>Tax {Number(booking.taxPercentage).toFixed(0)}%</span>
                <span>Rp {((Number(booking.service?.price ?? 0) + (booking.isHomeVisit ? booking.travelSurchargeAmount ?? 0 : 0)) * Number(booking.taxPercentage ?? 0) / 100).toLocaleString('id-ID')}</span>
              </div>
            )}
            {/* Divider */}
            <div className="h-px bg-gray-100 my-2"></div>
            
            <div className="flex justify-between font-bold text-lg text-txt-primary">
              <span>Total</span>
              <span>Rp {booking.totalAmount.toLocaleString('id-ID')}</span>
            </div>
            
            <div className="mt-4 pt-3 border-t border-dashed border-gray-300">
               <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-txt-secondary">Payment Status</span>
                  <Badge className={paymentStatusColor}>{booking.paymentStatus}</Badge>
               </div>
               {booking.paymentStatus !== PaymentStatus.PAID && (
                  <div className="mt-3">
                     <Button className="w-full bg-primary hover:bg-primary-dark" onClick={() => setShowPaymentDialog(true)}>
                        Record Payment
                     </Button>
                  </div>
               )}
            </div>
        </div>
      </div>
    </div>
  );

  const renderFinancialsTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
      {/* Payments Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-txt-primary flex items-center gap-2">
           <i className='bx bx-credit-card text-base text-primary'></i>
           Payment History
        </h4>
        
        {/* Progress Bar */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
           <div className="flex justify-between text-sm mb-2">
              <span className="text-txt-secondary">Paid: Rp {(booking.paidAmount || 0).toLocaleString('id-ID')}</span>
              <span className="font-semibold text-txt-primary">Total: Rp {booking.totalAmount.toLocaleString('id-ID')}</span>
           </div>
           <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div 
                 className="bg-success h-full transition-all duration-500" 
                 style={{ width: `${Math.min(100, ((booking.paidAmount || 0) / booking.totalAmount) * 100)}%` }}
              ></div>
           </div>
           {(booking.remainingBalance || 0) > 0 && (
              <p className="text-xs text-danger mt-2 text-right">
                 Remaining: Rp {booking.remainingBalance?.toLocaleString('id-ID')}
              </p>
           )}
        </div>

        {/* Transaction List */}
        <div className="space-y-2">
           {paymentHistory.length > 0 ? (
              paymentHistory.map((payment, idx) => (
                 <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                    <div>
                       <p className="font-medium text-sm text-txt-primary">
                          {payment.paymentMethod === 'cash' ? '💵 Cash' : 
                           payment.paymentMethod === 'transfer' ? '🏦 Transfer' : 
                           payment.paymentMethod === 'qris' ? '📱 QRIS' : '💳 Card'}
                       </p>
                       <p className="text-xs text-txt-muted">{new Date(payment.paidAt || payment.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="font-bold text-success text-sm">+ Rp {Number(payment.paymentAmount).toLocaleString('id-ID')}</span>
                 </div>
              ))
           ) : (
              <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                 <p className="text-sm text-txt-muted">No payments recorded yet</p>
              </div>
           )}
        </div>
        
        {booking.paymentStatus !== PaymentStatus.PAID && (
           <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary-light" onClick={() => setShowPaymentDialog(true)}>
              <i className='bx bx-credit-card text-base mr-2'></i>
              Add Payment
           </Button>
        )}
      </div>

      {/* Invoices Section */}
      <div className="space-y-4">
         <h4 className="text-sm font-bold text-txt-primary flex items-center gap-2">
           <i className='bx bx-file text-base text-primary'></i>
           Invoices
        </h4>
        
        {invoices.length > 0 ? (
           <div className="space-y-3">
              {invoices.map(inv => (
                 <div key={inv.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                       <div>
                          <p className="font-bold text-primary">{inv.invoiceNumber}</p>
                          <p className="text-xs text-txt-secondary">Due: {new Date(inv.dueDate || Date.now()).toLocaleDateString()}</p>
                       </div>
                       <Badge variant={inv.status === InvoiceStatus.PAID ? 'default' : 'outline'} className={
                          inv.status === InvoiceStatus.PAID ? 'bg-green-100 text-success border-0' : 'text-txt-secondary'
                       }>{inv.status}</Badge>
                    </div>
                    <div className="flex gap-2 mt-3">
                       <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                          <i className='bx bx-download text-xs mr-1'></i> PDF
                       </Button>
                       <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                          <i className='bx bx-send text-xs mr-1'></i> WhatsApp
                       </Button>
                    </div>
                 </div>
              ))}
           </div>
        ) : (
           <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
              <i className='bx bx-file text-3xl text-txt-muted mx-auto mb-2'></i>
              <p className="text-sm text-txt-secondary mb-3">No invoice generated</p>
              <Button size="sm" onClick={handleGenerateInvoice} disabled={loading || isGeneratingInvoice}>
                 Generate Invoice
              </Button>
           </div>
        )}
      </div>
    </div>
  );

  const renderTimelineTab = () => (
    <div className="animate-in fade-in duration-300 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
       <div className="relative border-l-2 border-gray-100 ml-3 space-y-6 py-2">
          {history.length > 0 ? history.map((item, idx) => {
             let iconClass = "bx bx-time";
             let colorClass = "bg-gray-100 text-gray-500";
             
             if (item.action.includes('CREATED')) { iconClass = "bx bx-check-square"; colorClass = "bg-green-100 text-success"; }
             else if (item.action.includes('STATUS')) { iconClass = "bx bx-check-circle"; colorClass = "bg-primary-light text-primary"; }
             else if (item.action.includes('PAYMENT')) { iconClass = "bx bx-dollar"; colorClass = "bg-blue-100 text-info"; }
             else if (item.action.includes('CANCEL')) { iconClass = "bx bx-x-circle"; colorClass = "bg-red-100 text-danger"; }

             return (
                <div key={idx} className="relative pl-8">
                   <div className={`absolute -left-[9px] top-0 w-5 h-5 rounded-full border-2 border-white ${colorClass} flex items-center justify-center`}>
                      <i className={`${iconClass} text-xs`} />
                   </div>
                   <div>
                      <p className="text-sm font-semibold text-txt-primary">{item.action}</p>
                      <p className="text-xs text-txt-muted mt-0.5">
                         {item.timestamp.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })} • {item.actor}
                      </p>
                      {item.details && (
                         <div className="mt-2 text-xs bg-gray-50 border border-gray-100 p-2 rounded text-txt-secondary">
                            {item.details}
                         </div>
                      )}
                   </div>
                </div>
             );
          }) : (
             <p className="text-sm text-txt-muted pl-8">No history available</p>
          )}
       </div>
    </div>
  );

  return (
    <div className="bg-white rounded-card shadow-card flex flex-col h-full overflow-hidden border-0">
      {/* HEADER SECTION - Always Visible */}
      <div className="p-6 border-b border-gray-100 bg-white z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl shadow-sm
               ${booking.status === BookingStatus.CONFIRMED ? 'bg-primary-light text-primary' : 
                 booking.status === BookingStatus.COMPLETED ? 'bg-green-100 text-success' : 'bg-gray-100 text-gray-400'}
            `}>
               <i className='bx bx-calendar text-2xl'></i>
            </div>
            <div>
               <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-txt-primary">{booking.bookingNumber}</h2>
                  <Badge className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase shadow-sm ${statusColor[booking.status]}`}>
                     {booking.status}
                  </Badge>
               </div>
               <p className="text-sm text-txt-secondary mt-1 flex items-center gap-2">
                  <i className='bx bx-time text-sm'></i>
                  {new Date(booking.scheduledAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
               </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {booking.status === BookingStatus.PENDING && (
               <Button onClick={() => handleUpdateStatus(BookingStatus.CONFIRMED)} className="bg-primary hover:bg-primary-dark shadow-md shadow-primary/20">
                  Confirm
               </Button>
            )}
            {booking.status === BookingStatus.CONFIRMED && (
               <Button onClick={() => handleUpdateStatus(BookingStatus.COMPLETED)} className="bg-success hover:bg-green-600 text-white shadow-md shadow-green-500/20">
                  Complete
               </Button>
            )}
            <Button variant="outline" onClick={() => setShowRescheduleDialog(true)} className="border-gray-300 text-txt-secondary hover:text-primary hover:border-primary">
               <i className='bx bx-edit-alt text-base mr-2'></i> Reschedule
            </Button>
          </div>
        </div>
      </div>

      {/* TABS HEADER */}
      <div className="px-6 border-b border-gray-100 flex gap-6 overflow-x-auto">
         {[
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
         ))}
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-6 bg-body/30">
         {activeTab === 'overview' && renderOverviewTab()}
         {activeTab === 'financials' && renderFinancialsTab()}
         {activeTab === 'timeline' && renderTimelineTab()}
      </div>

      {/* --- DIALOGS (Hidden) --- */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
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
    </div>
  );
}