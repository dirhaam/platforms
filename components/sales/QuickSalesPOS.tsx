'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
      const paymentData = [{ method, amount: totalAmount }];
      
      const response = await fetch('/api/sales/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          items: cart.map(item => ({
            serviceId: item.serviceId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          totalAmount,
          payments: paymentData.map(p => ({
            method: p.method,
            amount: p.amount,
            reference: p.reference,
          })),
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
          customerId: selectedCustomerId,
          items: cart.map(item => ({
            serviceId: item.serviceId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          totalAmount,
          payments: payments.map(p => ({
            method: p.method,
            amount: p.amount,
            reference: p.reference,
          })),
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
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 border-b">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-white text-xl">Quick Sales - POS</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="text-white hover:bg-blue-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-1 overflow-hidden gap-0">
            {/* Left: Services Grid */}
            <div className="flex-1 flex flex-col overflow-hidden border-r">
              {/* Customer Selector */}
              <div className="bg-gray-50 border-b p-4 space-y-2">
                <label className="text-sm font-semibold text-gray-700">Customer</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search customer..."
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                    />
                    {customerSearchQuery && filteredCustomers.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                        {filteredCustomers.map(customer => (
                          <button
                            key={customer.id}
                            onClick={() => {
                              setSelectedCustomerId(customer.id);
                              setCustomerSearchQuery('');
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0 text-sm"
                          >
                            <div className="font-medium">{customer.name}</div>
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
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New
                  </Button>
                </div>
                {selectedCustomer && (
                  <div className="text-sm bg-blue-50 p-2 rounded border border-blue-200">
                    <div className="font-medium text-blue-900">{selectedCustomer.name}</div>
                    <div className="text-xs text-blue-700">{selectedCustomer.phone}</div>
                  </div>
                )}
              </div>

              {/* Services Grid */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="bg-gray-50 border-b p-3">
                  <Input
                    placeholder="Search services..."
                    value={serviceSearchQuery}
                    onChange={(e) => setServiceSearchQuery(e.target.value)}
                    className="text-sm"
                    disabled={loading}
                  />
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredServices.map(service => {
                      const cartItem = cart.find(item => item.serviceId === service.id);
                      return (
                        <button
                          key={service.id}
                          onClick={() => addToCart(service)}
                          className="relative bg-white border-2 border-gray-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-md transition-all text-left"
                          disabled={loading || !selectedCustomerId}
                        >
                          <div className="font-semibold text-sm truncate">{service.name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Rp {service.price.toLocaleString('id-ID')}
                          </div>
                          {cartItem && (
                            <Badge className="absolute top-2 right-2 bg-blue-600 text-white text-xs">
                              {cartItem.quantity}
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
            <div className="w-80 flex flex-col border-l bg-gray-50">
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto border-b">
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-sm text-gray-900">Cart ({cart.length})</h3>
                  {cart.length === 0 ? (
                    <p className="text-xs text-gray-500">Add items to cart</p>
                  ) : (
                    <div className="space-y-2">
                      {cart.map(item => (
                        <div key={item.serviceId} className="bg-white p-3 rounded border space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="text-sm font-medium truncate">{item.serviceName}</div>
                              <div className="text-xs text-gray-500">
                                Rp {item.unitPrice.toLocaleString('id-ID')}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.serviceId)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCartQuantity(item.serviceId, item.quantity - 1)}
                              className="h-6 w-6 p-0 text-xs"
                            >
                              −
                            </Button>
                            <span className="flex-1 text-center text-sm font-semibold">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCartQuantity(item.serviceId, item.quantity + 1)}
                              className="h-6 w-6 p-0 text-xs"
                            >
                              +
                            </Button>
                          </div>
                          <div className="text-sm font-semibold text-right">
                            Rp {(item.quantity * item.unitPrice).toLocaleString('id-ID')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Totals */}
              <div className="p-4 bg-white border-b space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>Rp {taxAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {serviceChargeAmount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Service Charge</span>
                    <span>Rp {serviceChargeAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>TOTAL</span>
                  <span className="text-blue-600">Rp {totalAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-sm">Payment</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleQuickPayment(SalesPaymentMethod.CASH)}
                    disabled={!selectedCustomerId || cart.length === 0 || submitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    💵 Cash
                  </Button>
                  <Button
                    onClick={() => handleQuickPayment(SalesPaymentMethod.QRIS)}
                    disabled={!selectedCustomerId || cart.length === 0 || submitting}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    📱 QRIS
                  </Button>
                  <Button
                    onClick={() => handleQuickPayment(SalesPaymentMethod.CARD)}
                    disabled={!selectedCustomerId || cart.length === 0 || submitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    💳 Card
                  </Button>
                  <Button
                    onClick={() => setShowPaymentDialog(true)}
                    disabled={!selectedCustomerId || cart.length === 0}
                    variant="outline"
                  >
                    ⚙️ Custom
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
