import { Edit2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Booking, Service, Customer, PaymentStatus, RefundData } from '../types';

interface BookingDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBooking: Booking | undefined;
  isEditMode: boolean;
  editingBooking: Partial<Booking> | null;
  showRefundForm: boolean;
  refundData: RefundData;
  updating: boolean;
  services: Service[];
  customers: Customer[];
  onEditClick: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onUpdateStatus: (status: string) => void;
  onUpdatePayment: (status: PaymentStatus) => void;
  onDeleteBooking: () => void;
  onProcessRefund: () => void;
  setEditingBooking: (booking: Partial<Booking> | null) => void;
  setShowRefundForm: (show: boolean) => void;
  setRefundData: (data: RefundData) => void;
}

export function BookingDetailsDialog({
  open,
  onOpenChange,
  selectedBooking,
  isEditMode,
  editingBooking,
  showRefundForm,
  refundData,
  updating,
  services,
  customers,
  onEditClick,
  onCancelEdit,
  onSaveEdit,
  onUpdateStatus,
  onUpdatePayment,
  onDeleteBooking,
  onProcessRefund,
  setEditingBooking,
  setShowRefundForm,
  setRefundData,
}: BookingDetailsDialogProps) {
  if (!selectedBooking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
          <DialogDescription>View and manage booking information</DialogDescription>
        </DialogHeader>

        {!isEditMode ? (
          <div className="space-y-6 overflow-y-auto pr-4">
            {/* Customer Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Customer</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 font-medium">{selectedBooking.customer?.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <span className="ml-2">{selectedBooking.customer?.phone}</span>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-2">{selectedBooking.customer?.email || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Booking Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Booking Details</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Service:</span>
                  <span className="ml-2 font-medium">{selectedBooking.service?.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Date & Time:</span>
                  <span className="ml-2">{new Date(selectedBooking.scheduledAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <span className="ml-2">{selectedBooking.duration} minutes</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="ml-2 font-medium">IDR {selectedBooking.totalAmount.toLocaleString('id-ID')}</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <Badge className={`ml-2 ${
                    selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    selectedBooking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    selectedBooking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedBooking.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-600">Payment Status:</span>
                  <span className="ml-2 capitalize">{selectedBooking.paymentStatus}</span>
                </div>
                {selectedBooking.notes && (
                  <div>
                    <span className="text-gray-600">Notes:</span>
                    <span className="ml-2">{selectedBooking.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status Management */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Status Management</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600">Booking Status</label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {['pending', 'confirmed', 'completed', 'cancelled'].map(status => (
                      <Button
                        key={status}
                        size="sm"
                        variant={selectedBooking.status === status ? 'default' : 'outline'}
                        onClick={() => onUpdateStatus(status)}
                        disabled={updating || selectedBooking.status === status}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Payment Status</label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {[PaymentStatus.PENDING, PaymentStatus.PAID, PaymentStatus.REFUNDED].map(status => (
                      <Button
                        key={status}
                        size="sm"
                        variant={selectedBooking.paymentStatus === status ? 'default' : 'outline'}
                        onClick={() => onUpdatePayment(status)}
                        disabled={updating || selectedBooking.paymentStatus === status}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Refund Section */}
                {selectedBooking.paymentStatus === 'paid' && (
                  <div className="border-t pt-3 mt-3">
                    {!showRefundForm ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRefundData({ amount: selectedBooking.totalAmount, notes: '', refundType: 'full' });
                          setShowRefundForm(true);
                        }}
                        disabled={updating}
                        className="text-orange-600 hover:text-orange-700"
                      >
                        Process Refund
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <label className="text-sm font-medium">Refund Type</label>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={refundData.refundType === 'full' ? 'default' : 'outline'}
                              onClick={() => setRefundData({ ...refundData, refundType: 'full', amount: selectedBooking.totalAmount })}
                            >
                              Full
                            </Button>
                            <Button
                              size="sm"
                              variant={refundData.refundType === 'partial' ? 'default' : 'outline'}
                              onClick={() => setRefundData({ ...refundData, refundType: 'partial' })}
                            >
                              Partial
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="refundAmount" className="text-sm">Refund Amount (IDR)</Label>
                          <Input
                            id="refundAmount"
                            type="number"
                            min="0"
                            value={refundData.amount || ''}
                            onChange={(e) => setRefundData({ ...refundData, amount: parseFloat(e.target.value) || 0 })}
                            disabled={updating || refundData.refundType === 'full'}
                          />
                        </div>

                        <div>
                          <Label htmlFor="refundReason" className="text-sm">Reason</Label>
                          <Textarea
                            id="refundReason"
                            placeholder="Enter reason..."
                            value={refundData.notes}
                            onChange={(e) => setRefundData({ ...refundData, notes: e.target.value })}
                            disabled={updating}
                            rows={2}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setShowRefundForm(false)} disabled={updating}>
                            Cancel
                          </Button>
                          <Button size="sm" onClick={onProcessRefund} disabled={updating} className="bg-orange-600 hover:bg-orange-700">
                            Confirm Refund
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-between border-t pt-6">
              <Button variant="destructive" onClick={onDeleteBooking} disabled={updating}>
                Delete Booking
              </Button>
              <div className="flex gap-3">
                <Button onClick={onEditClick} disabled={updating}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Booking
                </Button>
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={updating}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        ) : editingBooking && (
          <div className="space-y-6 overflow-y-auto pr-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="customer">Customer</Label>
                <Select
                  value={editingBooking.customerId || ''}
                  onValueChange={(customerId) => setEditingBooking({ ...editingBooking, customerId })}
                >
                  <SelectTrigger id="customer">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} ({customer.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="service">Service</Label>
                <Select
                  value={editingBooking.serviceId || ''}
                  onValueChange={(serviceId) => {
                    const service = services.find(s => s.id === serviceId);
                    setEditingBooking({
                      ...editingBooking,
                      serviceId,
                      duration: service?.duration || editingBooking.duration
                    });
                  }}
                >
                  <SelectTrigger id="service">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} ({service.duration} min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="datetime">Date & Time</Label>
                <Input
                  id="datetime"
                  type="datetime-local"
                  value={editingBooking.scheduledAt ? (() => {
                    try {
                      const date = editingBooking.scheduledAt instanceof Date 
                        ? editingBooking.scheduledAt 
                        : new Date(editingBooking.scheduledAt as string);
                      return date.toISOString().slice(0, 16);
                    } catch { return ''; }
                  })() : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      setEditingBooking({ ...editingBooking, scheduledAt: new Date(e.target.value) });
                    }
                  }}
                  disabled={updating}
                />
              </div>

              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  step="15"
                  value={editingBooking.duration || ''}
                  onChange={(e) => setEditingBooking({ ...editingBooking, duration: parseInt(e.target.value) || 0 })}
                  disabled={updating}
                />
              </div>

              <div>
                <Label htmlFor="amount">Total Amount (IDR)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  value={editingBooking.totalAmount || ''}
                  onChange={(e) => setEditingBooking({ ...editingBooking, totalAmount: parseFloat(e.target.value) || 0 })}
                  disabled={updating}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes..."
                  value={editingBooking.notes || ''}
                  onChange={(e) => setEditingBooking({ ...editingBooking, notes: e.target.value })}
                  disabled={updating}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end border-t pt-6">
              <Button variant="outline" onClick={onCancelEdit} disabled={updating}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={onSaveEdit} disabled={updating}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
