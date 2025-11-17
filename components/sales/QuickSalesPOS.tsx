'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Trash2, Search } from 'lucide-react';
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

  const totalAmount = useMemo(() => {
    return subtotal + taxAmount + serviceChargeAmount;
  }, [subtotal, taxAmount, serviceChargeAmount]);

  const totalPayment = useMemo(() => {
    return payments.reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const remainingAmount = totalAmount - totalPayment;

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

  const handleCompleteTransaction = useCallback(async () => {
    if (!selectedCustomerId || cart.length === 0 || payments.length === 0) {
      toast.error('Please fill all required fields');
      return;
    }

    if (totalPayment < totalAmount) {
      toast.error('Payment amount is less than total');
      return;
    }

    setSubmitting(true);
    try {
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
          payments: payments.map(p => {
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create transaction');
      }
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
  }, [selectedCustomerId, cart, payments, totalAmount, totalPayment, notes, tenantId, onCreated, onOpenChange]);

  const selectedCustomer = useMemo(
    () => customers.find(c => c.id === selectedCustomerId),
    [selectedCustomerId, customers]
  );

  const canCompleteTransaction = selectedCustomerId && cart.length > 0 && payments.length > 0 && totalPayment >= totalAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[95vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full bg-white">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle className="text-gray-900 text-2xl font-bold">Quick Sales</DialogTitle>
                <DialogDescription className="text-gray-600 text-sm mt-1">Fast checkout for in-store sales</DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="text-gray-600 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-1 overflow-hidden gap-0">
            {/* Left: Services Grid */}
            <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200">
              {/* Customer Selector */}
              <div className="bg-white border-b border-gray-200 p-4 space-y-3">
                <label className="text-sm font-semibold text-gray-900">Select Customer</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name or phone..."
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      className="pl-10 border-gray-300"
                      disabled={loading}
                    />
                    {customerSearchQuery && filteredCustomers.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-md z-10 max-h-48 overflow-y-auto">
                        {filteredCustomers.map(customer => (
                          <button
                            key={customer.id}
                            onClick={() => {
                              setSelectedCustomerId(customer.id);
                              setCustomerSearchQuery('');
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-sm transition"
                          >
                            <div className="font-medium text-gray-900">{customer.name}</div>
                            <div className="text-xs text-gray-500">{customer.phone}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewCustomerDialog(true)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New
                  </Button>
                </div>
                {selectedCustomer && (
                  <div className="text-sm bg-green-50 p-3 rounded-md border border-green-200">
                    <div className="font-semibold text-green-900">{selectedCustomer.name}</div>
                    <div className="text-xs text-green-700">{selectedCustomer.phone}</div>
                  </div>
                )}
              </div>

              {/* Services Grid */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="bg-white border-b border-gray-200 p-3">
                  <Input
                    placeholder="Search services..."
                    value={serviceSearchQuery}
                    onChange={(e) => setServiceSearchQuery(e.target.value)}
                    className="text-sm border-gray-300"
                    disabled={loading}
                  />
                </div>
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredServices.map(service => {
                      const cartItem = cart.find(item => item.serviceId === service.id);
                      return (
                        <button
                          key={service.id}
                          onClick={() => addToCart(service)}
                          className={`relative bg-white border rounded-lg p-4 transition-all text-left ${
                            cartItem
                              ? 'border-emerald-400 shadow-md bg-emerald-50'
                              : 'border-gray-300 hover:border-emerald-400 hover:shadow-md'
                          } ${loading || !selectedCustomerId ? 'opacity-50 cursor-not-allowed' : 'hover:shadow'}`}
                          disabled={loading || !selectedCustomerId}
                        >
                          <div className="font-semibold text-sm truncate text-gray-900">{service.name}</div>
                          <div className="text-xs text-gray-600 mt-2">
                            Rp {service.price.toLocaleString('id-ID')}
                          </div>
                          {cartItem && (
                            <Badge className="absolute top-2 right-2 bg-emerald-600 text-white text-xs font-semibold">
                              {cartItem.quantity}x
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Cart + Payment */}
            <div className="w-80 flex flex-col border-l border-gray-200 bg-white">
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto border-b border-gray-200 bg-gray-50">
                <div className="p-4 space-y-3">
                  <h3 className="font-bold text-sm text-gray-900">Cart ({cart.length} items)</h3>
                  {cart.length === 0 ? (
                    <p className="text-xs text-gray-500 py-8 text-center">Add items to get started</p>
                  ) : (
                    <div className="space-y-2">
                      {cart.map(item => (
                        <div key={item.serviceId} className="bg-white p-3 rounded-md border border-gray-200 space-y-2 hover:border-gray-300 transition">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate">{item.serviceName}</div>
                              <div className="text-xs text-gray-600">
                                Rp {item.unitPrice.toLocaleString('id-ID')}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.serviceId)}
                              className="h-6 w-6 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-1 bg-gray-100 rounded p-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateCartQuantity(item.serviceId, item.quantity - 1)}
                              className="h-6 w-6 p-0 text-xs text-gray-700 hover:bg-white"
                            >
                              −
                            </Button>
                            <span className="flex-1 text-center text-sm font-semibold text-gray-900">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateCartQuantity(item.serviceId, item.quantity + 1)}
                              className="h-6 w-6 p-0 text-xs text-gray-700 hover:bg-white"
                            >
                              +
                            </Button>
                          </div>
                          <div className="text-sm font-bold text-right text-emerald-700">
                            Rp {(item.quantity * item.unitPrice).toLocaleString('id-ID')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Totals */}
              <div className="p-4 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200 space-y-3 text-sm">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span className="font-medium">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Tax</span>
                    <span className="font-medium">Rp {taxAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {serviceChargeAmount > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Service Charge</span>
                    <span className="font-medium">Rp {serviceChargeAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-3 flex justify-between bg-emerald-50 -mx-4 px-4 py-3 rounded-md">
                  <span className="font-bold text-gray-900">TOTAL</span>
                  <span className="font-bold text-lg text-emerald-700">Rp {totalAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-sm text-gray-900">Payment Method</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleQuickPayment(SalesPaymentMethod.CASH)}
                    disabled={!selectedCustomerId || cart.length === 0 || submitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    💵 Cash
                  </Button>
                  <Button
                    onClick={() => handleQuickPayment(SalesPaymentMethod.QRIS)}
                    disabled={!selectedCustomerId || cart.length === 0 || submitting}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-semibold"
                  >
                    📱 QRIS
                  </Button>
                  <Button
                    onClick={() => handleQuickPayment(SalesPaymentMethod.CARD)}
                    disabled={!selectedCustomerId || cart.length === 0 || submitting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                  >
                    💳 Card
                  </Button>
                  <Button
                    onClick={() => setShowPaymentDialog(true)}
                    disabled={!selectedCustomerId || cart.length === 0 || submitting}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
                  >
                    ⚙️ More
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Customer</DialogTitle>
            </DialogHeader>
            <NewCustomerForm
              subdomain={subdomain || ''}
              tenantId={tenantId}
              onSuccess={async (customer) => {
                await fetchCustomers();
                setSelectedCustomerId(customer.id);
                setShowNewCustomerDialog(false);
                toast.success('Customer created');
              }}
              onCancel={() => setShowNewCustomerDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Custom Payment Dialog */}
      {showPaymentDialog && (
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Select Payment Method</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <div className="text-sm text-gray-600">Amount Due</div>
                <div className="text-2xl font-bold text-blue-600">
                  Rp {totalAmount.toLocaleString('id-ID')}
                </div>
              </div>
              <div className="space-y-2">
                {[SalesPaymentMethod.CASH, SalesPaymentMethod.CARD, SalesPaymentMethod.TRANSFER, SalesPaymentMethod.QRIS].map(method => (
                  <Button
                    key={method}
                    onClick={async () => {
                      setShowPaymentDialog(false);
                      await handleQuickPayment(method);
                    }}
                    disabled={submitting}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    {method === SalesPaymentMethod.CASH && '💵'}
                    {method === SalesPaymentMethod.CARD && '💳'}
                    {method === SalesPaymentMethod.TRANSFER && '🔄'}
                    {method === SalesPaymentMethod.QRIS && '📱'}
                    {' '}
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
