'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { NewCustomerForm } from '@/components/forms/NewCustomerForm';
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

  // Dialog State
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

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
    setPayments(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  // Payment Operations
  const handleQuickPayment = useCallback(async (method: SalesPaymentMethod) => {
    if (!selectedCustomerId || cart.length === 0) {
      toast.error('Please select customer and add items');
      return;
    }

    setSubmitting(true);
    try {
      const paymentData: PaymentEntry[] = [{ method, amount: totalAmount }];
      
      const response = await fetch('/api/sales/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify({
          tenantId,
          type: 'on_the_spot',
          customerId: selectedCustomerId,
          items: cart.map(item => ({
            serviceId: item.serviceId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          totalAmount,
          paymentAmount: totalPayment,
          payments: paymentData.map(p => {
            const payment: any = {
              method: p.method,
              amount: p.amount,
            };
            if (p.reference) {
              payment.reference = p.reference;
            }
            return payment;
          }),
          notes,
          source: 'pos',
        }),
      });

      if (!response.ok) throw new Error('Failed to create transaction');
      const data = await response.json();

      toast.success('Transaction completed');
      if (onCreated) await onCreated(data.transaction);

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error completing transaction:', error);
      toast.error('Failed to complete transaction');
    } finally {
      setSubmitting(false);
    }
  }, [selectedCustomerId, cart, totalAmount, notes, tenantId, onCreated, onOpenChange]);

  const selectedCustomer = useMemo(
    () => customers.find(c => c.id === selectedCustomerId),
    [selectedCustomerId, customers]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[95vh] p-0 overflow-hidden [&>button]:hidden w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[95vw] bg-body rounded-lg shadow-lg border-0">
        <DialogTitle className="sr-only">Quick Sales</DialogTitle>
        <DialogDescription className="sr-only">Fast checkout for in-store sales</DialogDescription>
        
        <div className="flex flex-col h-full bg-white overflow-hidden rounded-lg">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <div className="min-w-0">
              <h4 className="text-xl font-bold text-txt-primary">Quick Sales POS</h4>
              <p className="text-txt-secondary text-sm hidden sm:block">Process transactions efficiently</p>
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

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden gap-0">
            
            {/* Left Panel: Catalog & Customer */}
            <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-100 bg-white lg:w-7/12">
              {/* Customer Selector */}
              <div className="bg-white border-b border-gray-100 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-txt-primary uppercase tracking-wide">Customer</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewCustomerDialog(true)}
                    className="text-primary hover:bg-primary-light h-7 px-2 text-xs font-medium"
                  >
                    <i className='bx bx-plus mr-1'></i> New
                  </Button>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="relative group">
                    <i className='bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted text-lg group-focus-within:text-primary transition-colors'></i>
                    <Input
                      placeholder="Search by name or phone..."
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      className="pl-10 h-10 bg-gray-50 border-transparent hover:bg-gray-100 focus:bg-white focus:border-primary focus:ring-primary/20 transition-all text-sm"
                      disabled={loading}
                    />
                    {customerSearchQuery && filteredCustomers.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-nav z-20 max-h-48 overflow-y-auto custom-scrollbar">
                        {filteredCustomers.map(customer => (
                          <button
                            key={customer.id}
                            onClick={() => {
                              setSelectedCustomerId(customer.id);
                              setCustomerSearchQuery('');
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-primary-light/20 border-b border-gray-50 last:border-b-0 transition flex items-center justify-between"
                          >
                            <div>
                              <div className="font-medium text-txt-primary">{customer.name}</div>
                              <div className="text-xs text-txt-secondary">{customer.phone}</div>
                            </div>
                            <i className='bx bx-chevron-right text-txt-muted'></i>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {selectedCustomer && (
                  <div className="flex items-center gap-3 p-3 bg-primary-light/30 border border-primary-light rounded-lg animate-in fade-in slide-in-from-top-1">
                     <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                       <i className='bx bx-user text-xl'></i>
                     </div>
                     <div>
                       <div className="font-bold text-primary text-sm">{selectedCustomer.name}</div>
                       <div className="text-txt-secondary text-xs">{selectedCustomer.phone}</div>
                     </div>
                     <Button
                       variant="ghost"
                       size="icon"
                       onClick={() => setSelectedCustomerId('')}
                       className="ml-auto h-8 w-8 text-txt-muted hover:text-danger hover:bg-red-50"
                     >
                       <i className='bx bx-x text-lg'></i>
                     </Button>
                  </div>
                )}
              </div>

              {/* Services Grid */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-3 border-b border-gray-100 bg-white">
                   <div className="relative">
                      <i className='bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted'></i>
                      <Input
                        placeholder="Search services..."
                        value={serviceSearchQuery}
                        onChange={(e) => setServiceSearchQuery(e.target.value)}
                        className="pl-9 h-9 text-sm bg-white border-gray-200 focus:border-primary focus:ring-primary/20"
                        disabled={loading}
                      />
                   </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 custom-scrollbar">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredServices.map(service => {
                      const cartItem = cart.find(item => item.serviceId === service.id);
                      return (
                        <button
                          key={service.id}
                          onClick={() => addToCart(service)}
                          className={`
                            relative bg-white border rounded-lg p-4 text-left transition-all duration-200 group
                            ${cartItem
                              ? 'border-primary shadow-md ring-1 ring-primary/20'
                              : 'border-gray-200 shadow-sm hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5'}
                            ${(loading || !selectedCustomerId) ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                          `}
                          disabled={loading || !selectedCustomerId}
                        >
                          <div className="font-semibold text-txt-primary text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                             {service.name}
                          </div>
                          <div className="text-xs text-txt-muted flex items-center gap-1">
                            <i className='bx bx-tag-alt'></i>
                            IDR {service.price.toLocaleString('id-ID')}
                          </div>
                          {cartItem && (
                            <div className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm min-w-[1.5rem] text-center">
                              {cartItem.quantity}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Cart & Payment */}
            <div className="flex-none w-full lg:w-5/12 flex flex-col border-l border-gray-200 bg-body">
              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                 <div className="bg-white rounded-card shadow-card border border-gray-100 overflow-hidden flex flex-col h-full">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                       <h5 className="text-sm font-bold text-txt-primary uppercase tracking-wide">Current Order</h5>
                       <Badge className="bg-primary-light text-primary hover:bg-primary-light border-0">
                          {cart.length} Items
                       </Badge>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                       {cart.length === 0 ? (
                         <div className="h-full flex flex-col items-center justify-center text-txt-muted p-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                               <i className='bx bx-cart text-3xl opacity-50'></i>
                            </div>
                            <p className="text-sm">Cart is empty</p>
                            <p className="text-xs mt-1">Select a customer and add services</p>
                         </div>
                       ) : (
                         cart.map(item => (
                           <div key={item.serviceId} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-primary/30 bg-white transition-colors group">
                              <div className="flex-1 min-w-0 mr-3">
                                 <div className="text-sm font-semibold text-txt-primary truncate">{item.serviceName}</div>
                                 <div className="text-xs text-txt-muted">
                                   IDR {item.unitPrice.toLocaleString('id-ID')} / unit
                                 </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                 <div className="flex items-center border border-gray-200 rounded-md bg-gray-50 h-8">
                                    <button 
                                      onClick={() => updateCartQuantity(item.serviceId, item.quantity - 1)}
                                      className="w-8 h-full flex items-center justify-center text-txt-secondary hover:bg-gray-200 hover:text-txt-primary transition-colors"
                                    >
                                      <i className='bx bx-minus text-xs'></i>
                                    </button>
                                    <span className="w-8 text-center text-sm font-semibold text-txt-primary">{item.quantity}</span>
                                    <button 
                                      onClick={() => updateCartQuantity(item.serviceId, item.quantity + 1)}
                                      className="w-8 h-full flex items-center justify-center text-txt-secondary hover:bg-gray-200 hover:text-txt-primary transition-colors"
                                    >
                                      <i className='bx bx-plus text-xs'></i>
                                    </button>
                                 </div>
                                 <div className="text-sm font-bold text-primary min-w-[80px] text-right">
                                    IDR {(item.quantity * item.unitPrice).toLocaleString('id-ID')}
                                 </div>
                                 <button 
                                    onClick={() => removeFromCart(item.serviceId)}
                                    className="text-txt-muted hover:text-danger p-1 rounded-full hover:bg-red-50 transition-colors"
                                 >
                                    <i className='bx bx-trash'></i>
                                 </button>
                              </div>
                           </div>
                         ))
                       )}
                    </div>
                 </div>
              </div>

              {/* Totals & Actions Fixed Bottom */}
              <div className="bg-white border-t border-gray-200 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)] z-10">
                 {/* Financial Summary */}
                 <div className="px-6 py-4 space-y-2 bg-gray-50 border-b border-gray-100">
                    <div className="flex justify-between text-xs text-txt-secondary">
                       <span>Subtotal</span>
                       <span>IDR {subtotal.toLocaleString('id-ID')}</span>
                    </div>
                    {taxAmount > 0 && (
                       <div className="flex justify-between text-xs text-txt-secondary">
                          <span>Tax</span>
                          <span>IDR {taxAmount.toLocaleString('id-ID')}</span>
                       </div>
                    )}
                    {serviceChargeAmount > 0 && (
                       <div className="flex justify-between text-xs text-txt-secondary">
                          <span>Service Charge</span>
                          <span>IDR {serviceChargeAmount.toLocaleString('id-ID')}</span>
                       </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                       <span className="font-bold text-lg text-txt-primary">Total</span>
                       <span className="font-bold text-xl text-primary">IDR {totalAmount.toLocaleString('id-ID')}</span>
                    </div>
                 </div>

                 {/* Payment Methods Grid */}
                 <div className="p-4 grid grid-cols-2 gap-3">
                    <Button
                       onClick={() => handleQuickPayment(SalesPaymentMethod.CASH)}
                       disabled={!selectedCustomerId || cart.length === 0 || submitting}
                       className="h-auto py-3 flex flex-col gap-1 bg-white border border-gray-200 text-txt-secondary hover:bg-primary hover:text-white hover:border-primary shadow-sm transition-all group"
                    >
                       <i className='bx bx-money text-xl group-hover:text-white text-primary'></i>
                       <span className="text-xs font-semibold">Cash</span>
                    </Button>
                    <Button
                       onClick={() => handleQuickPayment(SalesPaymentMethod.QRIS)}
                       disabled={!selectedCustomerId || cart.length === 0 || submitting}
                       className="h-auto py-3 flex flex-col gap-1 bg-white border border-gray-200 text-txt-secondary hover:bg-primary hover:text-white hover:border-primary shadow-sm transition-all group"
                    >
                       <i className='bx bx-qr-scan text-xl group-hover:text-white text-info'></i>
                       <span className="text-xs font-semibold">QRIS</span>
                    </Button>
                    <Button
                       onClick={() => handleQuickPayment(SalesPaymentMethod.CARD)}
                       disabled={!selectedCustomerId || cart.length === 0 || submitting}
                       className="h-auto py-3 flex flex-col gap-1 bg-white border border-gray-200 text-txt-secondary hover:bg-primary hover:text-white hover:border-primary shadow-sm transition-all group"
                    >
                       <i className='bx bx-credit-card text-xl group-hover:text-white text-warning'></i>
                       <span className="text-xs font-semibold">Card</span>
                    </Button>
                    <Button
                       onClick={() => setShowPaymentDialog(true)}
                       disabled={!selectedCustomerId || cart.length === 0 || submitting}
                       className="h-auto py-3 flex flex-col gap-1 bg-white border border-gray-200 text-txt-secondary hover:bg-gray-100 hover:text-txt-primary hover:border-gray-300 shadow-sm transition-all"
                    >
                       <i className='bx bx-dots-horizontal-rounded text-xl'></i>
                       <span className="text-xs font-semibold">More</span>
                    </Button>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* New Customer Dialog */}
      {showNewCustomerDialog && (
        <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
          <DialogContent className="max-w-md bg-white rounded-card shadow-lg border-0 p-0">
            <DialogHeader className="p-4 border-b border-gray-100">
              <DialogTitle className="text-lg font-bold text-txt-primary">Create New Customer</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <NewCustomerForm
                subdomain={subdomain || ''}
                tenantId={tenantId}
                onSuccess={async (customer) => {
                  await fetchCustomers();
                  setSelectedCustomerId(customer.id);
                  setShowNewCustomerDialog(false);
                  toast.success('Customer created successfully');
                }}
                onCancel={() => setShowNewCustomerDialog(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Payment Options Dialog */}
      {showPaymentDialog && (
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-sm bg-white rounded-card shadow-lg border-0 p-0">
            <DialogHeader className="p-4 border-b border-gray-100">
               <DialogTitle className="text-lg font-bold text-txt-primary">Payment Options</DialogTitle>
               <DialogDescription className="text-xs text-txt-muted">Choose a method to complete the transaction</DialogDescription>
            </DialogHeader>
            
            <div className="p-6 space-y-6">
              <div className="bg-primary-light/30 p-4 rounded-lg border border-primary-light text-center">
                <div className="text-xs text-txt-secondary uppercase tracking-wide mb-1">Amount Due</div>
                <div className="text-3xl font-bold text-primary">
                  IDR {totalAmount.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="space-y-2">
                 {/* Split Payment UI Placeholder - if needed later, currently just buttons */}
                 {[
                    { id: SalesPaymentMethod.CASH, label: 'Cash', icon: 'bx-money' },
                    { id: SalesPaymentMethod.CARD, label: 'Debit/Credit Card', icon: 'bx-credit-card' },
                    { id: SalesPaymentMethod.TRANSFER, label: 'Bank Transfer', icon: 'bx-transfer' },
                    { id: SalesPaymentMethod.QRIS, label: 'QRIS Scan', icon: 'bx-qr-scan' }
                 ].map(method => (
                    <button
                       key={method.id}
                       onClick={async () => {
                          setShowPaymentDialog(false);
                          await handleQuickPayment(method.id);
                       }}
                       disabled={submitting}
                       className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary-light/20 transition-all text-left group"
                    >
                       <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-txt-secondary group-hover:bg-primary group-hover:text-white transition-colors">
                          <i className={`bx ${method.icon} text-xl`}></i>
                       </div>
                       <span className="font-semibold text-txt-primary group-hover:text-primary">{method.label}</span>
                       <i className='bx bx-chevron-right ml-auto text-txt-muted'></i>
                    </button>
                 ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}