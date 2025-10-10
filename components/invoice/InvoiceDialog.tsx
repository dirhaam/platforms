'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Invoice, CreateInvoiceRequest, CreateInvoiceItemRequest, UpdateInvoiceRequest, InvoiceStatus, PaymentMethod } from '@/types/invoice';
import { Customer } from '@/types/booking';
import { Plus, Trash2 } from 'lucide-react';

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: Invoice | null;
  onSuccess: () => void;
}

export function InvoiceDialog({ open, onOpenChange, invoice, onSuccess }: InvoiceDialogProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    dueDate: '',
    taxRate: 0,
    discountAmount: 0,
    notes: '',
    terms: '',
    paymentReference: '',
    status: InvoiceStatus.DRAFT,
    paymentMethod: undefined as PaymentMethod | undefined,
    paidDate: ''
  });
  const [items, setItems] = useState<CreateInvoiceItemRequest[]>([
    { description: '', quantity: 1, unitPrice: 0 }
  ]);

  useEffect(() => {
    if (open) {
      fetchCustomers();
      
      if (invoice) {
        // Edit mode - populate form with invoice data
        setFormData({
          customerId: invoice.customerId,
          dueDate: invoice.dueDate.toISOString().split('T')[0],
          taxRate: invoice.taxRate.toNumber(),
          discountAmount: invoice.discountAmount.toNumber(),
          notes: invoice.notes || '',
          terms: invoice.terms || '',
          paymentReference: invoice.paymentReference || '',
          status: invoice.status,
          paymentMethod: invoice.paymentMethod,
          paidDate: invoice.paidDate ? invoice.paidDate.toISOString().split('T')[0] : ''
        });
        
        setItems(invoice.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toNumber(),
          serviceId: item.serviceId
        })));
      } else {
        // Create mode - reset form
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 7);
        
        setFormData({
          customerId: '',
          dueDate: tomorrow.toISOString().split('T')[0],
          taxRate: 0,
          discountAmount: 0,
          notes: '',
          terms: '',
          paymentReference: '',
          status: InvoiceStatus.DRAFT,
          paymentMethod: undefined,
          paidDate: ''
        });
        
        setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
      }
    }
  }, [open, invoice]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerId || items.length === 0) {
      alert('Please select a customer and add at least one item');
      return;
    }

    setLoading(true);
    
    try {
      if (invoice) {
        // Update existing invoice
        const updateData: UpdateInvoiceRequest = {
          status: formData.status,
          dueDate: formData.dueDate,
          paymentMethod: formData.paymentMethod,
          paymentReference: formData.paymentReference,
          notes: formData.notes,
          terms: formData.terms
        };
        
        if (formData.status === InvoiceStatus.PAID && formData.paidDate) {
          updateData.paidDate = formData.paidDate;
        }

        const response = await fetch(`/api/invoices/${invoice.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });

        if (response.ok) {
          onSuccess();
        }
      } else {
        // Create new invoice
        const createData: CreateInvoiceRequest = {
          customerId: formData.customerId,
          dueDate: formData.dueDate,
          items: items.filter(item => item.description && item.unitPrice > 0),
          taxRate: formData.taxRate,
          discountAmount: formData.discountAmount,
          notes: formData.notes,
          terms: formData.terms,
          paymentReference: formData.paymentReference
        };

        const response = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createData)
        });

        if (response.ok) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof CreateInvoiceItemRequest, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * (formData.taxRate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - formData.discountAmount;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {invoice ? 'Edit Invoice' : 'Create New Invoice'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer">Customer *</Label>
              <Select
                value={formData.customerId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
                disabled={!!invoice} // Can't change customer for existing invoice
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Invoice Status (for edit mode) */}
          {invoice && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as InvoiceStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={InvoiceStatus.DRAFT}>Draft</SelectItem>
                    <SelectItem value={InvoiceStatus.SENT}>Sent</SelectItem>
                    <SelectItem value={InvoiceStatus.PAID}>Paid</SelectItem>
                    <SelectItem value={InvoiceStatus.OVERDUE}>Overdue</SelectItem>
                    <SelectItem value={InvoiceStatus.CANCELLED}>Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.status === InvoiceStatus.PAID && (
                <div>
                  <Label htmlFor="paidDate">Paid Date</Label>
                  <Input
                    id="paidDate"
                    type="date"
                    value={formData.paidDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, paidDate: e.target.value }))}
                  />
                </div>
              )}
            </div>
          )}

          {/* Payment Details */}
          {invoice && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={formData.paymentMethod || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value as PaymentMethod }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PaymentMethod.CASH}>Cash</SelectItem>
                    <SelectItem value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</SelectItem>
                    <SelectItem value={PaymentMethod.CREDIT_CARD}>Credit Card</SelectItem>
                    <SelectItem value={PaymentMethod.DIGITAL_WALLET}>Digital Wallet</SelectItem>
                    <SelectItem value={PaymentMethod.OTHER}>Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentReference">Payment Reference</Label>
                <Input
                  id="paymentReference"
                  value={formData.paymentReference}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentReference: e.target.value }))}
                  placeholder="Transaction ID, check number, etc."
                />
              </div>
            </div>
          )}

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Invoice Items</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <Label>Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Item description"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Label>Unit Price</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-1">
                      <Label>Total</Label>
                      <div className="text-sm font-medium py-2">
                        Rp {(item.quantity * item.unitPrice).toFixed(2)}
                      </div>
                    </div>
                    <div className="col-span-1">
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.taxRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="discountAmount">Discount Amount</Label>
                  <Input
                    id="discountAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discountAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountAmount: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              {/* Totals Summary */}
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Rp {calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({formData.taxRate}%):</span>
                    <span>Rp {calculateTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-Rp {formData.discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>Rp {calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes and Terms */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes for the invoice"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Textarea
                id="terms"
                value={formData.terms}
                onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                placeholder="Payment terms and conditions"
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (invoice ? 'Update Invoice' : 'Create Invoice')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}