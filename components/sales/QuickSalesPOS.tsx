'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { SalesPaymentMethod, SalesTransaction } from '@/types/sales';
import type { InvoiceSettingsData } from '@/lib/invoice/invoice-settings-service';

interface QuickSalesPOSProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  subdomain?: string;
  onCreated?: (transaction: SalesTransaction) => Promise<void> | void;
}

interface CartItem {
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
}

interface PaymentEntry {
  method: SalesPaymentMethod;
  amount: number;
  reference?: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration?: number;
}

export function QuickSalesPOS({
  open,
  onOpenChange,
  tenantId,
  subdomain,
  onCreated,
}: QuickSalesPOSProps) {
  // State Management
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettingsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [notes, setNotes] = useState('');

  // Load data when dialog opens
  useEffect(() => {
    if (open) {
      loadData();
    } else {
      resetForm();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCustomers(),
        fetchServices(),
        fetchInvoiceSettings(),
      ]);
    } catch (error) {
      console.error('Error loading POS data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`/api/customers?tenantId=${tenantId}&limit=100`);
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch(`/api/services?tenantId=${tenantId}&limit=100`);
      if (!response.ok) throw new Error('Failed to fetch services');
      const data = await response.json();
      setServices(data.services || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchInvoiceSettings = async () => {
    try {
      const response = await fetch(`/api/settings/invoice-config?tenantId=${tenantId}`);
      if (!response.ok) return;
      const data = await response.json();
      setInvoiceSettings(data.settings || null);
    } catch (error) {
      console.error('Error fetching invoice settings:', error);
    }
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setCustomerSearchQuery('');
    setServiceSearchQuery('');
    setCart([]);
    setPayments([]);
    setNotes('');
  };

  // Filtered Data
  const filteredCustomers = useMemo(() => {
    const query = customerSearchQuery.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.phone.includes(query)
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, customerSearchQuery]);

  const filteredServices = useMemo(() => {
    const query = serviceSearchQuery.toLowerCase();
    return services.filter(s =>
      s.name.toLowerCase().includes(query)
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [services, serviceSearchQuery]);

  // Cart Operations
  const addToCart = useCallback((service: Service) => {
    setCart(prev => {
      const existing = prev.find(item => item.serviceId === service.id);
      if (existing) {
        return prev.map(item =>
          item.serviceId === service.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        serviceId: service.id,
        serviceName: service.name,
        quantity: 1,
        unitPrice: service.price,
      }];
    });
  }, []);

  const updateCartQuantity = useCallback((serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.serviceId !== serviceId));
    } else {
      setCart(prev =>
        prev.map(item =>
          item.serviceId === serviceId ? { ...item, quantity } : item
        )
      );
    }
  }, []);

  const removeFromCart = useCallback((serviceId: string) => {
    setCart(prev => prev.filter(item => item.serviceId !== serviceId));
  }, []);

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }, [cart]);

  const taxAmount = useMemo(() => {
    if (!invoiceSettings?.taxServiceCharge?.taxPercentage) return 0;
    return subtotal * (invoiceSettings.taxServiceCharge.taxPercentage / 100);
  }, [subtotal, invoiceSettings]);

  const serviceChargeAmount = useMemo(() => {
    if (!invoiceSettings?.taxServiceCharge?.serviceChargeRequired) return 0;
    const value = invoiceSettings.taxServiceCharge.serviceChargeValue || 0;
    if (invoiceSettings.taxServiceCharge.serviceChargeType === 'fixed') return value;
    return subtotal * (value / 100);
  }, [subtotal, invoiceSettings]);

  const additionalFeesAmount = useMemo(() => {
    if (!invoiceSettings?.additionalFees || invoiceSettings.additionalFees.length === 0) return 0;
    return invoiceSettings.additionalFees.reduce((sum, fee) => {
      if (fee.type === 'fixed') return sum + fee.value;
      return sum + (subtotal * (fee.value / 100));
    }, 0);
  }, [subtotal, invoiceSettings]);

  const totalAmount = useMemo(() => {
    return subtotal + taxAmount + serviceChargeAmount + additionalFeesAmount;
  }, [subtotal, taxAmount, serviceChargeAmount, additionalFeesAmount]);

  const totalPayment = useMemo(() => {
    return payments.reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const remainingAmount = totalAmount - totalPayment;

  // Payment Entry Management Functions
  const addPaymentEntry = useCallback(() => {
    setPayments(prev => [...prev, { method: SalesPaymentMethod.CASH, amount: 0 }]);
  }, []);

  const removePaymentEntry = useCallback((index: number) => {
    setPayments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updatePaymentEntry = useCallback((index: number, field: keyof PaymentEntry, value: any) => {
    setPayments(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  }, []);

  // Default payment entry if none
  useEffect(() => {
    if (payments.length === 0 && cart.length > 0) {
        setPayments([{ method: SalesPaymentMethod.CASH, amount: totalAmount }]);
    } else if (payments.length === 1 && cart.length > 0) {
        // Auto update single payment amount
        setPayments(prev => [{ ...prev[0], amount: totalAmount }]);
    }
  }, [totalAmount]);

  const handleSubmit = async () => {
    if (!selectedCustomerId) {
        toast.error("Please select a customer");
        return;
    }
    if (cart.length === 0) {
        toast.error("Cart is empty");
        return;
    }
    if (Math.abs(remainingAmount) > 100) { // Allowing small floating point diffs
        toast.error("Payment amount must match total");
        return;
    }

    setSubmitting(true);
    try {
        const payload = {
            customerId: selectedCustomerId,
            items: cart.map(item => ({
                serviceId: item.serviceId,
                quantity: item.quantity,
                unitPrice: item.unitPrice
            })),
            payments,
            notes
        };

        const response = await fetch('/api/sales', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-tenant-id': tenantId
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Failed to create sale');
        
        const transaction = await response.json();
        toast.success('Sale completed successfully');
        onOpenChange(false);
        if (onCreated) onCreated(transaction);
    } catch (error) {
        console.error(error);
        toast.error('Failed to process sale');
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 overflow-hidden [&>button]:hidden w-[95vw] bg-body rounded-lg shadow-lg border-0 flex flex-col">
        
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center text-primary">
                    <i className='bx bx-basket text-2xl'></i>
                </div>
                <div>
                    <h4 className="text-lg font-bold text-txt-primary">Quick Sale POS</h4>
                    <p className="text-xs text-txt-secondary">Process new transaction</p>
                </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-txt-muted hover:bg-gray-100 hover:text-txt-primary rounded-full"
            >
              <i className='bx bx-x text-2xl'></i>
            </Button>
        </div>

        {/* Main Content Split */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
            
            {/* LEFT: Product & Customer Selection */}
            <div className="flex-1 lg:w-7/12 flex flex-col border-r border-gray-200 bg-white/50">
                {/* Toolbar */}
                <div className="p-4 bg-white border-b border-gray-100 flex gap-4">
                    <div className="relative flex-1">
                        <i className='bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted text-lg'></i>
                        <Input 
                            placeholder="Search services..." 
                            value={serviceSearchQuery}
                            onChange={(e) => setServiceSearchQuery(e.target.value)}
                            className="pl-10 bg-gray-50 border-transparent focus:bg-white focus:border-primary transition-all"
                        />
                    </div>
                    <Select value="all">
                        <SelectTrigger className="w-[150px] bg-gray-50 border-transparent">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Services Grid */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-txt-muted">
                            <i className='bx bx-loader-alt bx-spin text-3xl mb-2'></i>
                            <span>Loading services...</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredServices.map(service => (
                                <div 
                                    key={service.id}
                                    onClick={() => addToCart(service)}
                                    className="bg-white p-4 rounded-card border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/50 cursor-pointer transition-all group flex flex-col justify-between h-[140px]"
                                >
                                    <div>
                                        <h6 className="font-semibold text-txt-primary line-clamp-2 group-hover:text-primary transition-colors">
                                            {service.name}
                                        </h6>
                                        <p className="text-xs text-txt-muted mt-1">
                                            {service.duration ? `${service.duration} min` : 'Duration N/A'}
                                        </p>
                                    </div>
                                    <div className="flex justify-between items-end mt-2">
                                        <span className="font-bold text-primary">
                                            {service.price.toLocaleString('id-ID')}
                                        </span>
                                        <div className="w-6 h-6 rounded-full bg-primary-light text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <i className='bx bx-plus'></i>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Cart & Payment */}
            <div className="lg:w-5/12 flex flex-col bg-white h-full shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10">
                
                {/* Customer Select */}
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <i className='bx bx-user absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted'></i>
                        <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                            <SelectTrigger className="w-full pl-9 bg-gray-50 border-transparent focus:ring-primary/20">
                                <SelectValue placeholder="Select Customer *" />
                            </SelectTrigger>
                            <SelectContent>
                                <div className="p-2 sticky top-0 bg-white border-b z-10">
                                    <Input 
                                        placeholder="Search customer..." 
                                        value={customerSearchQuery}
                                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                                        className="h-8 text-xs"
                                    />
                                </div>
                                {filteredCustomers.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name} - {c.phone}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-txt-muted opacity-60">
                            <i className='bx bx-cart-alt text-4xl mb-2'></i>
                            <p>Cart is empty</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.serviceId} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-transparent hover:border-gray-200 transition-colors">
                                <div className="flex-1 min-w-0 mr-3">
                                    <div className="font-medium text-sm text-txt-primary truncate">{item.serviceName}</div>
                                    <div className="text-xs text-txt-muted">IDR {item.unitPrice.toLocaleString('id-ID')}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center bg-white rounded border border-gray-200">
                                        <button 
                                            onClick={() => updateCartQuantity(item.serviceId, item.quantity - 1)}
                                            className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 text-txt-secondary"
                                        >
                                            <i className='bx bx-minus text-xs'></i>
                                        </button>
                                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                        <button 
                                            onClick={() => updateCartQuantity(item.serviceId, item.quantity + 1)}
                                            className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 text-txt-secondary"
                                        >
                                            <i className='bx bx-plus text-xs'></i>
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => removeFromCart(item.serviceId)}
                                        className="text-txt-muted hover:text-danger transition-colors"
                                    >
                                        <i className='bx bx-trash'></i>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Summary & Payment */}
                <div className="p-5 bg-gray-50 border-t border-gray-200">
                    
                    {/* Payment Methods */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-semibold text-txt-secondary uppercase">Payment Method</label>
                            <button onClick={addPaymentEntry} className="text-xs text-primary hover:underline flex items-center gap-1">
                                <i className='bx bx-plus'></i> Split Payment
                            </button>
                        </div>
                        <div className="space-y-2">
                            {payments.map((payment, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <Select 
                                        value={payment.method} 
                                        onValueChange={(v) => updatePaymentEntry(idx, 'method', v)}
                                    >
                                        <SelectTrigger className="w-[110px] bg-white h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={SalesPaymentMethod.CASH}>Cash</SelectItem>
                                            <SelectItem value={SalesPaymentMethod.CARD}>Card</SelectItem>
                                            <SelectItem value={SalesPaymentMethod.QRIS}>QRIS</SelectItem>
                                            <SelectItem value={SalesPaymentMethod.TRANSFER}>Transfer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <div className="relative flex-1">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-txt-muted">IDR</span>
                                        <Input 
                                            type="number"
                                            value={payment.amount || ''}
                                            onChange={(e) => updatePaymentEntry(idx, 'amount', parseFloat(e.target.value) || 0)}
                                            className="pl-8 bg-white h-9"
                                            placeholder="Amount"
                                        />
                                    </div>
                                    {payments.length > 1 && (
                                        <button onClick={() => removePaymentEntry(idx)} className="text-txt-muted hover:text-danger px-1">
                                            <i className='bx bx-x'></i>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="space-y-1 text-sm text-txt-secondary mb-4 pb-4 border-b border-dashed border-gray-300">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{subtotal.toLocaleString('id-ID')}</span>
                        </div>
                        {taxAmount > 0 && (
                            <div className="flex justify-between">
                                <span>Tax ({invoiceSettings?.taxServiceCharge?.taxPercentage}%)</span>
                                <span>{taxAmount.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        {serviceChargeAmount > 0 && (
                            <div className="flex justify-between">
                                <span>Service Charge</span>
                                <span>{serviceChargeAmount.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        {additionalFeesAmount > 0 && (
                            <div className="flex justify-between">
                                <span>Fees</span>
                                <span>{additionalFeesAmount.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-lg text-txt-primary pt-2">
                            <span>Total</span>
                            <span>IDR {totalAmount.toLocaleString('id-ID')}</span>
                        </div>
                        <div className={`flex justify-between text-xs font-medium ${remainingAmount > 0 ? 'text-danger' : remainingAmount < 0 ? 'text-warning' : 'text-success'}`}>
                            <span>Remaining</span>
                            <span>{remainingAmount.toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    {/* Action Button */}
                    <Button 
                        onClick={handleSubmit}
                        disabled={submitting || remainingAmount > 100}
                        className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/30"
                    >
                        {submitting ? (
                            <><i className='bx bx-loader-alt bx-spin mr-2'></i> Processing</>
                        ) : (
                            <><i className='bx bx-check-double mr-2'></i> Complete Sale</>
                        )}
                    </Button>
                </div>
            </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
