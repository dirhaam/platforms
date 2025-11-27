'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { SalesPaymentMethod, SalesTransaction } from '@/types/sales';
import type { InvoiceSettingsData } from '@/lib/invoice/invoice-settings-service';
import { addToOfflineQueue } from '@/lib/offline/queue';
import { addToStore, getByIndex, CachedData } from '@/lib/offline/db';

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

  // New Customer State
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Load data when dialog opens
  useEffect(() => {
    if (open) {
      loadData();
    } else {
      resetForm();
    }
  }, [open]);

  const loadFromCache = async (): Promise<boolean> => {
    try {
      const cachedCustomers = await getByIndex<CachedData>('cachedData', 'type', 'customers');
      const cachedServices = await getByIndex<CachedData>('cachedData', 'type', 'services');
      
      const customerCache = cachedCustomers.find(c => c.id === `customers_${subdomain || tenantId}`);
      const serviceCache = cachedServices.find(c => c.id === `services_${subdomain || tenantId}`);
      
      if (customerCache?.data) setCustomers(customerCache.data);
      if (serviceCache?.data) setServices(serviceCache.data);
      
      return (customerCache?.data?.length || 0) > 0 || (serviceCache?.data?.length || 0) > 0;
    } catch {
      return false;
    }
  };

  const loadData = async () => {
    setLoading(true);
    
    // If offline, only use cache
    if (!navigator.onLine) {
      const hasCached = await loadFromCache();
      if (!hasCached) {
        toast.error('Offline: No cached data available');
      }
      setLoading(false);
      return;
    }

    try {
      await Promise.all([
        fetchCustomers(),
        fetchServices(),
        fetchInvoiceSettings(),
      ]);
    } catch (error) {
      console.error('Error loading POS data:', error);
      const hasCached = await loadFromCache();
      if (!hasCached) {
        toast.error('Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`/api/customers?tenantId=${tenantId}&limit=100`);
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      const customerList = data.customers || [];
      setCustomers(customerList);
      // Cache for offline
      await addToStore<CachedData>('cachedData', {
        id: `customers_${subdomain || tenantId}`,
        type: 'customers',
        tenantId: subdomain || tenantId,
        data: customerList,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch(`/api/services?tenantId=${tenantId}&limit=100`);
      if (!response.ok) throw new Error('Failed to fetch services');
      const data = await response.json();
      const serviceList = data.services || [];
      setServices(serviceList);
      // Cache for offline
      await addToStore<CachedData>('cachedData', {
        id: `services_${subdomain || tenantId}`,
        type: 'services',
        tenantId: subdomain || tenantId,
        data: serviceList,
        updatedAt: Date.now(),
      });
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
    setShowNewCustomerForm(false);
    setNewCustomer({ name: '', phone: '', email: '' });
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

  // Create Customer Handler
  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast.error('Name and phone are required');
      return;
    }

    setIsCreatingCustomer(true);
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify(newCustomer)
      });

      if (!response.ok) throw new Error('Failed to create customer');

      const data = await response.json();
      const createdCustomer = data.customer;

      setCustomers(prev => [...prev, createdCustomer]);
      setSelectedCustomerId(createdCustomer.id);
      setShowNewCustomerForm(false);
      setNewCustomer({ name: '', phone: '', email: '' });
      toast.success('Customer created successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to create customer');
    } finally {
      setIsCreatingCustomer(false);
    }
  };

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
        const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
        const payload = {
            tenantId: tenantId,
            type: 'on_the_spot',
            customerId: selectedCustomerId,
            customerName: selectedCustomer?.name || '',
            items: cart.map(item => ({
                serviceId: item.serviceId,
                serviceName: item.serviceName,
                quantity: item.quantity,
                unitPrice: item.unitPrice
            })),
            totalAmount: totalAmount,
            paymentAmount: totalPayment,
            payments: payments,
            notes: notes || undefined,
            taxRate: invoiceSettings?.taxServiceCharge?.taxPercentage || 0,
            discountAmount: 0
        };

        console.log('[QuickSalesPOS] Sending payload:', payload);

        // Try online first
        if (navigator.onLine) {
            try {
                const response = await fetch('/api/sales/transactions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-tenant-id': tenantId
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const data = await response.json();
                    toast.success('Sale completed successfully');
                    onOpenChange(false);
                    if (onCreated) onCreated(data.transaction);
                    return;
                }
                
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create sale');
            } catch (err) {
                // If network error, fall through to offline mode
                if (err instanceof TypeError && err.message.includes('fetch')) {
                    console.log('[QuickSalesPOS] Network error, saving offline');
                } else {
                    throw err;
                }
            }
        }

        // Save offline
        const offlineId = await addToOfflineQueue(
            'sale',
            'create',
            payload,
            tenantId,
            subdomain || tenantId
        );

        console.log('[QuickSalesPOS] Saved offline with ID:', offlineId);
        toast.success('Sale saved offline. Will sync when connected.', {
            icon: '📴',
            duration: 4000,
        });
        onOpenChange(false);
    } catch (error) {
        console.error('[QuickSalesPOS] Error:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to process sale');
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 overflow-hidden [&>button]:hidden w-[95vw] bg-body rounded-lg shadow-lg border-0 flex flex-col">
        
        {/* Header */}
        <div className="bg-white dark:bg-[#2b2c40] px-6 py-4 border-b border-gray-200 dark:border-[#4e4f6c] flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-primary-light dark:bg-[#35365f] flex items-center justify-center text-primary dark:text-[#a5a7ff]">
                    <i className='bx bx-basket text-2xl'></i>
                </div>
                <div>
                    <h5 className="text-lg font-semibold text-txt-primary dark:text-[#d5d5e2]">Quick Sale POS</h5>
                    <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Process new transaction</p>
                </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-txt-muted dark:text-[#7e7f96] hover:bg-gray-100 dark:hover:bg-[#4e4f6c] hover:text-txt-primary dark:hover:text-[#d5d5e2] rounded-full transition-colors duration-150 ease-in-out"
            >
              <i className='bx bx-x text-2xl'></i>
            </Button>
        </div>

        {/* Main Content Split */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
            
            {/* LEFT: Product & Customer Selection */}
            <div className="flex-1 lg:w-7/12 flex flex-col border-r border-gray-200 dark:border-[#4e4f6c] bg-white/50 dark:bg-[#232333]/50">
                {/* Toolbar */}
                <div className="p-4 bg-white dark:bg-[#2b2c40] border-b border-gray-200 dark:border-[#4e4f6c] flex gap-4">
                    <div className="relative flex-1">
                        <i className='bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted dark:text-[#7e7f96] text-lg'></i>
                        <Input 
                            placeholder="Search services..." 
                            value={serviceSearchQuery}
                            onChange={(e) => setServiceSearchQuery(e.target.value)}
                            className="pl-10 bg-gray-50 dark:bg-[#2b2c40] border-transparent dark:border-[#4e4f6c] focus:bg-white dark:focus:bg-[#232333] focus:border-primary transition-all duration-150 ease-in-out dark:text-[#d5d5e2] dark:placeholder:text-[#7e7f96]"
                        />
                    </div>
                    <Select value="all">
                        <SelectTrigger className="w-[150px] bg-gray-50 dark:bg-[#2b2c40] border-transparent dark:border-[#4e4f6c] dark:text-[#d5d5e2]">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-[#2b2c40] dark:border-[#4e4f6c]">
                            <SelectItem value="all">All Categories</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Services Grid */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 dark:bg-[#232333]/50 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-txt-muted dark:text-[#7e7f96]">
                            <i className='bx bx-loader-alt bx-spin text-3xl mb-2'></i>
                            <span>Loading services...</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredServices.map(service => (
                                <div 
                                    key={service.id}
                                    onClick={() => addToCart(service)}
                                    className="bg-white dark:bg-[#2b2c40] p-4 rounded-card border border-gray-100 dark:border-[#4e4f6c] shadow-sm hover:shadow-md hover:border-primary/50 dark:hover:border-primary/50 cursor-pointer transition-all duration-200 ease-in-out group flex flex-col justify-between h-[140px]"
                                >
                                    <div>
                                        <h6 className="font-semibold text-txt-primary dark:text-[#d5d5e2] line-clamp-2 group-hover:text-primary dark:group-hover:text-[#a5a7ff] transition-colors duration-150">
                                            {service.name}
                                        </h6>
                                        <p className="text-xs text-txt-muted dark:text-[#7e7f96] mt-1">
                                            {service.duration ? `${service.duration} min` : 'Duration N/A'}
                                        </p>
                                    </div>
                                    <div className="flex justify-between items-end mt-2">
                                        <span className="font-bold text-primary dark:text-[#a5a7ff]">
                                            {service.price.toLocaleString('id-ID')}
                                        </span>
                                        <div className="w-6 h-6 rounded-full bg-primary-light dark:bg-[#35365f] text-primary dark:text-[#a5a7ff] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
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
            <div className="lg:w-5/12 flex flex-col bg-white dark:bg-[#2b2c40] h-full shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] dark:shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.2)] z-10">
                
                {/* Customer Select */}
                <div className="p-4 border-b border-gray-200 dark:border-[#4e4f6c] bg-gray-50/30 dark:bg-[#232333]/30">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-txt-muted dark:text-[#7e7f96] uppercase tracking-wider">Customer</span>
                        {!showNewCustomerForm && (
                            <button 
                                onClick={() => setShowNewCustomerForm(true)}
                                className="text-primary dark:text-[#a5a7ff] text-xs font-medium hover:underline flex items-center gap-1 transition-colors duration-150"
                            >
                                <i className='bx bx-plus'></i> New Customer
                            </button>
                        )}
                    </div>

                    {showNewCustomerForm ? (
                        <div className="space-y-3 bg-white dark:bg-[#2b2c40] p-3 rounded-lg border border-gray-200 dark:border-[#4e4f6c] shadow-sm animate-in fade-in slide-in-from-top-2">
                            <Input 
                                placeholder="Full Name *" 
                                value={newCustomer.name}
                                onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                                className="bg-gray-50 dark:bg-[#232333] h-9 text-sm focus:bg-white dark:focus:bg-[#2b2c40] dark:text-[#d5d5e2] dark:placeholder:text-[#7e7f96] dark:border-[#4e4f6c] transition-all duration-150"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <Input 
                                    placeholder="Phone *" 
                                    value={newCustomer.phone}
                                    onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                                    className="bg-gray-50 dark:bg-[#232333] h-9 text-sm focus:bg-white dark:focus:bg-[#2b2c40] dark:text-[#d5d5e2] dark:placeholder:text-[#7e7f96] dark:border-[#4e4f6c] transition-all duration-150"
                                />
                                <Input 
                                    placeholder="Email" 
                                    value={newCustomer.email}
                                    onChange={e => setNewCustomer({...newCustomer, email: e.target.value})}
                                    className="bg-gray-50 dark:bg-[#232333] h-9 text-sm focus:bg-white dark:focus:bg-[#2b2c40] dark:text-[#d5d5e2] dark:placeholder:text-[#7e7f96] dark:border-[#4e4f6c] transition-all duration-150"
                                />
                            </div>
                            <div className="flex gap-2 mt-2">
                                <Button 
                                    size="sm" 
                                    onClick={handleCreateCustomer} 
                                    disabled={isCreatingCustomer}
                                    className="h-8 bg-primary hover:bg-[#5f61e6] text-white text-xs flex-1 transition-all duration-200 ease-in-out"
                                >
                                    {isCreatingCustomer ? <i className='bx bx-loader-alt bx-spin'></i> : 'Save Customer'}
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => setShowNewCustomerForm(false)}
                                    className="h-8 text-xs dark:border-[#4e4f6c] dark:text-[#b2b2c4] dark:hover:bg-[#4e4f6c] transition-colors duration-150"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="relative">
                            <i className='bx bx-user absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted dark:text-[#7e7f96] z-10'></i>
                            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                <SelectTrigger className="w-full pl-9 bg-white dark:bg-[#2b2c40] border-gray-200 dark:border-[#4e4f6c] focus:ring-primary/20 dark:text-[#d5d5e2]">
                                    <SelectValue placeholder="Select Customer *" />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-[#2b2c40] dark:border-[#4e4f6c]">
                                    <div className="p-2 sticky top-0 bg-white dark:bg-[#2b2c40] border-b dark:border-[#4e4f6c] z-10">
                                        <Input 
                                            placeholder="Search customer..." 
                                            value={customerSearchQuery}
                                            onChange={(e) => setCustomerSearchQuery(e.target.value)}
                                            className="h-8 text-xs dark:bg-[#232333] dark:border-[#4e4f6c] dark:text-[#d5d5e2] dark:placeholder:text-[#7e7f96]"
                                        />
                                    </div>
                                    {filteredCustomers.length === 0 ? (
                                        <div className="p-3 text-sm text-txt-muted dark:text-[#7e7f96] text-center">No customers found</div>
                                    ) : (
                                        filteredCustomers.map(c => (
                                            <SelectItem key={c.id} value={c.id} className="dark:text-[#d5d5e2] dark:focus:bg-[#35365f]">{c.name} - {c.phone}</SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-white dark:bg-[#2b2c40]">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-txt-muted dark:text-[#7e7f96] opacity-60">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-[#35365f] rounded-full flex items-center justify-center mb-3">
                                <i className='bx bx-cart-alt text-3xl text-gray-400 dark:text-[#7e7f96]'></i>
                            </div>
                            <p className="text-sm font-medium">Cart is empty</p>
                            <p className="text-xs text-txt-secondary dark:text-[#7e7f96]">Select services to add to cart</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.serviceId} className="flex items-center justify-between bg-gray-50 dark:bg-[#232333] p-3 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-[#4e4f6c] transition-colors duration-150 group">
                                <div className="flex-1 min-w-0 mr-3">
                                    <div className="font-medium text-sm text-txt-primary dark:text-[#d5d5e2] truncate">{item.serviceName}</div>
                                    <div className="text-xs text-txt-muted dark:text-[#7e7f96]">IDR {item.unitPrice.toLocaleString('id-ID')}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center bg-white dark:bg-[#2b2c40] rounded border border-gray-200 dark:border-[#4e4f6c] shadow-sm">
                                        <button 
                                            onClick={() => updateCartQuantity(item.serviceId, item.quantity - 1)}
                                            className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#4e4f6c] text-txt-secondary dark:text-[#b2b2c4] transition-colors duration-150"
                                        >
                                            <i className='bx bx-minus text-xs'></i>
                                        </button>
                                        <span className="w-8 text-center text-sm font-medium text-txt-primary dark:text-[#d5d5e2]">{item.quantity}</span>
                                        <button 
                                            onClick={() => updateCartQuantity(item.serviceId, item.quantity + 1)}
                                            className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#4e4f6c] text-txt-secondary dark:text-[#b2b2c4] transition-colors duration-150"
                                        >
                                            <i className='bx bx-plus text-xs'></i>
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => removeFromCart(item.serviceId)}
                                        className="w-7 h-7 rounded flex items-center justify-center text-txt-muted dark:text-[#7e7f96] hover:text-danger hover:bg-red-50 dark:hover:bg-[#4d2f3a] transition-colors duration-150 opacity-0 group-hover:opacity-100"
                                    >
                                        <i className='bx bx-trash'></i>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Summary & Payment */}
                <div className="p-5 bg-gray-50/80 dark:bg-[#232333]/80 border-t border-gray-200 dark:border-[#4e4f6c] backdrop-blur-sm">
                    
                    {/* Payment Methods */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-txt-secondary dark:text-[#b2b2c4] uppercase tracking-wider">Payment Method</label>
                            <button onClick={addPaymentEntry} className="text-xs text-primary dark:text-[#a5a7ff] font-medium hover:underline flex items-center gap-1 transition-colors duration-150">
                                <i className='bx bx-plus'></i> Split Payment
                            </button>
                        </div>
                        <div className="space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar pr-1">
                            {payments.map((payment, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <Select 
                                        value={payment.method} 
                                        onValueChange={(v) => updatePaymentEntry(idx, 'method', v)}
                                    >
                                        <SelectTrigger className="w-[110px] bg-white dark:bg-[#2b2c40] h-9 border-gray-200 dark:border-[#4e4f6c] shadow-sm dark:text-[#d5d5e2]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="dark:bg-[#2b2c40] dark:border-[#4e4f6c]">
                                            <SelectItem value={SalesPaymentMethod.CASH} className="dark:text-[#d5d5e2]">Cash</SelectItem>
                                            <SelectItem value={SalesPaymentMethod.CARD} className="dark:text-[#d5d5e2]">Card</SelectItem>
                                            <SelectItem value={SalesPaymentMethod.QRIS} className="dark:text-[#d5d5e2]">QRIS</SelectItem>
                                            <SelectItem value={SalesPaymentMethod.TRANSFER} className="dark:text-[#d5d5e2]">Transfer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <div className="relative flex-1">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-txt-muted dark:text-[#7e7f96] font-medium">IDR</span>
                                        <Input 
                                            type="number"
                                            value={payment.amount || ''}
                                            onChange={(e) => updatePaymentEntry(idx, 'amount', parseFloat(e.target.value) || 0)}
                                            className="pl-9 bg-white dark:bg-[#2b2c40] h-9 border-gray-200 dark:border-[#4e4f6c] shadow-sm focus:border-primary dark:text-[#d5d5e2] transition-all duration-150"
                                            placeholder="Amount"
                                        />
                                    </div>
                                    {payments.length > 1 && (
                                        <button onClick={() => removePaymentEntry(idx)} className="text-txt-muted dark:text-[#7e7f96] hover:text-danger px-1 transition-colors duration-150">
                                            <i className='bx bx-x text-lg'></i>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="space-y-1.5 text-sm text-txt-secondary dark:text-[#b2b2c4] mb-4 pb-4 border-b border-dashed border-gray-300 dark:border-[#4e4f6c]">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="font-medium">{subtotal.toLocaleString('id-ID')}</span>
                        </div>
                        {taxAmount > 0 && (
                            <div className="flex justify-between text-xs">
                                <span>Tax ({invoiceSettings?.taxServiceCharge?.taxPercentage}%)</span>
                                <span>{taxAmount.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        {serviceChargeAmount > 0 && (
                            <div className="flex justify-between text-xs">
                                <span>Service Charge</span>
                                <span>{serviceChargeAmount.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        {additionalFeesAmount > 0 && (
                            <div className="flex justify-between text-xs">
                                <span>Fees</span>
                                <span>{additionalFeesAmount.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-lg text-txt-primary dark:text-[#d5d5e2] pt-2 mt-2 border-t border-gray-200 dark:border-[#4e4f6c]">
                            <span>Total</span>
                            <span className="text-primary dark:text-[#a5a7ff]">IDR {totalAmount.toLocaleString('id-ID')}</span>
                        </div>
                        <div className={`flex justify-between text-xs font-semibold px-2 py-1 rounded ${
                            remainingAmount > 0 ? 'bg-red-50 dark:bg-[#4d2f3a] text-danger dark:text-[#ff8b77]' : 
                            remainingAmount < 0 ? 'bg-yellow-50 dark:bg-[#4d4036] text-warning dark:text-[#ffcd66]' : 
                            'bg-green-50 dark:bg-[#36483f] text-success dark:text-[#aaeb87]'
                        }`}>
                            <span>Remaining</span>
                            <span>{remainingAmount.toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    {/* Action Button */}
                    <Button 
                        onClick={handleSubmit}
                        disabled={submitting || remainingAmount > 100}
                        className="w-full h-11 text-base font-bold bg-primary hover:bg-[#5f61e6] text-white shadow-lg shadow-primary/25 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-xl"
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