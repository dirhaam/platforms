'use client';

import React, { useState, useEffect } from 'react';
import { Booking, BookingStatus, PaymentStatus, Service, Customer } from '@/types/booking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BookingDetailsDrawer } from './BookingDetailsDrawer';
import { BookingCalendar } from './BookingCalendar';
import { Calendar, List, Search, Plus, Filter, X, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface BookingDashboardProps {
  tenantId: string;
}

export function BookingDashboard({ tenantId }: BookingDashboardProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Quick Sale states
  const [showQuickSaleDialog, setShowQuickSaleDialog] = useState(false);
  const [showAddCustomerDialog, setShowAddCustomerDialog] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quickSaleForm, setQuickSaleForm] = useState({
    customerId: '',
    serviceId: '',
    paymentMethod: 'cash',
    notes: ''
  });
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [creatingQuickSale, setCreatingQuickSale] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch bookings, services, and customers
  useEffect(() => {
    fetchBookings();
    fetchServices();
    fetchCustomers();
  }, [tenantId]);

  // Apply filters
  useEffect(() => {
    let filtered = bookings;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(b =>
        b.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.service?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(b => b.paymentStatus === paymentFilter);
    }

    setFilteredBookings(filtered);
  }, [bookings, searchTerm, statusFilter, paymentFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // Fetch all needed data in parallel
      const [bookingsRes, customersRes, servicesRes] = await Promise.all([
        fetch(`/api/bookings?tenantId=${encodeURIComponent(tenantId)}`, {
          headers: { 'x-tenant-id': tenantId }
        }),
        fetch(`/api/customers?tenantId=${encodeURIComponent(tenantId)}`, {
          headers: { 'x-tenant-id': tenantId }
        }),
        fetch(`/api/services?tenantId=${encodeURIComponent(tenantId)}`, {
          headers: { 'x-tenant-id': tenantId }
        })
      ]);

      if (bookingsRes.ok && customersRes.ok && servicesRes.ok) {
        const bookingsData = await bookingsRes.json();
        const customersData = await customersRes.json();
        const servicesData = await servicesRes.json();

        // Create lookup maps for fast access
        const customerMap = new Map(
          (customersData.customers || []).map((c: any) => [c.id, c])
        );
        const serviceMap = new Map(
          (servicesData.services || []).map((s: any) => [s.id, s])
        );

        // Enrich bookings with customer and service data
        const enrichedBookings = (bookingsData.bookings || []).map((booking: any) => ({
          ...booking,
          // Convert string dates to Date objects
          scheduledAt: new Date(booking.scheduledAt),
          createdAt: new Date(booking.createdAt),
          updatedAt: new Date(booking.updatedAt),
          customer: customerMap.get(booking.customerId),
          service: serviceMap.get(booking.serviceId)
        }));

        setBookings(enrichedBookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsDrawer(true);
  };

  const handleBookingUpdate = async (bookingId: string, updates: Partial<Booking>) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        // Update local state
        setBookings(prev =>
          prev.map(b => b.id === bookingId ? { ...b, ...updates } : b)
        );
        if (selectedBooking?.id === bookingId) {
          setSelectedBooking({ ...selectedBooking, ...updates });
        }
        toast.success('Booking updated');
      } else {
        throw new Error('Failed to update booking');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
      throw error;
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch(`/api/services?tenantId=${encodeURIComponent(tenantId)}`, {
        headers: { 'x-tenant-id': tenantId }
      });
      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`/api/customers?tenantId=${encodeURIComponent(tenantId)}`, {
        headers: { 'x-tenant-id': tenantId }
      });
      if (response.ok) {
        const data = await response.json();
        const customerList = data.customers || [];
        console.log('[fetchCustomers] Loaded customers:', {
          total: customerList.length,
          customers: customerList.map((c: any) => ({ 
            id: c.id, 
            name: c.name, 
            phone: c.phone,
            totalBookings: c.totalBookings 
          }))
        });
        setCustomers(customerList);
      } else {
        console.error('[fetchCustomers] Failed:', response.status);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleCreateQuickSale = async () => {
    if (!quickSaleForm.customerId || !quickSaleForm.serviceId) {
      toast.error('Please select customer and service');
      return;
    }

    // Validate that selected service exists
    const selectedService = services.find(s => s.id === quickSaleForm.serviceId);
    if (!selectedService) {
      console.warn('Service not found in local cache:', quickSaleForm.serviceId);
      console.warn('Available services:', services.map(s => ({ id: s.id, name: s.name })));
      toast.error('Selected service not found. Please refresh the page and try again.');
      return;
    }
    
    // Log detailed service info
    console.log('Selected service details:', {
      serviceId: selectedService.id,
      name: selectedService.name,
      price: selectedService.price,
      tenantId,
      allServiceIds: services.map(s => s.id)
    });

    // Validate that selected customer exists
    const selectedCustomer = customers.find(c => c.id === quickSaleForm.customerId);
    if (!selectedCustomer) {
      console.warn('Customer not found in local cache:', quickSaleForm.customerId);
      console.warn('Available customers:', customers.map(c => ({ id: c.id, name: c.name })));
      toast.error('Selected customer not found. Please refresh the page and try again.');
      return;
    }

    try {
      setCreatingQuickSale(true);
      console.log('Creating quick sale with:', {
        tenantId,
        customerId: quickSaleForm.customerId,
        serviceId: quickSaleForm.serviceId,
        paymentMethod: quickSaleForm.paymentMethod
      });
      const response = await fetch('/api/sales/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify({
          tenantId,
          type: 'on_the_spot',
          customerId: quickSaleForm.customerId,
          serviceId: quickSaleForm.serviceId,
          paymentMethod: quickSaleForm.paymentMethod,
          notes: quickSaleForm.notes
        })
      });

      if (response.ok) {
        toast.success('Quick sale created successfully!');
        setShowQuickSaleDialog(false);
        setQuickSaleForm({
          customerId: '',
          serviceId: '',
          paymentMethod: 'cash',
          notes: ''
        });
        // Refresh bookings/sales data
        await Promise.all([fetchBookings(), fetchCustomers()]);
      } else {
        let errorMsg = `Failed to create quick sale (${response.status})`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
          console.error('API Error:', errorMsg);
          console.error('Full error response:', errorData);
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
          errorMsg = `Server error (${response.status}): ${response.statusText}`;
        }
        console.warn('Service validation might have missed something. Services:', services);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error creating quick sale:', error);
      const msg = error instanceof Error ? error.message : 'Failed to create quick sale';
      toast.error(msg);
    } finally {
      setCreatingQuickSale(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerForm.name || !newCustomerForm.phone) {
      toast.error('Name and phone are required');
      return;
    }

    try {
      setCreatingCustomer(true);
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify({
          name: newCustomerForm.name,
          phone: newCustomerForm.phone,
          email: newCustomerForm.email || undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Customer created successfully!');
        setNewCustomerForm({ name: '', phone: '', email: '' });
        setShowAddCustomerDialog(false);
        
        // Add new customer to list and auto-select it
        const newCustomer = data.customer || data;
        console.log('[handleCreateCustomer] Customer created:', {
          id: newCustomer.id,
          name: newCustomer.name,
          phone: newCustomer.phone,
          totalBookings: newCustomer.totalBookings
        });
        
        const updatedCustomersList = [...customers, newCustomer];
        console.log('[handleCreateCustomer] Updated customers list:', {
          total: updatedCustomersList.length,
          newCustomersList: updatedCustomersList.map((c: any) => ({ id: c.id, name: c.name }))
        });
        
        setCustomers(updatedCustomersList);
        setQuickSaleForm({ ...quickSaleForm, customerId: newCustomer.id });
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create customer');
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error('Failed to create customer');
    } finally {
      setCreatingCustomer(false);
    }
  };

  // Get bookings for selected date
  const bookingsForDate = filteredBookings.filter(b => {
    const bookingDate = new Date(b.scheduledAt).toDateString();
    const selectedDateString = selectedDate.toDateString();
    return bookingDate === selectedDateString;
  });

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Bookings</h2>
          <p className="text-gray-600">Manage your bookings with unified panel</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              const searchParams = new URLSearchParams({ subdomain: tenantId });
              window.location.href = `/tenant/admin/bookings/new?${searchParams.toString()}`;
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowQuickSaleDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Quick Sale
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={BookingStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={BookingStatus.CONFIRMED}>Confirmed</SelectItem>
                <SelectItem value={BookingStatus.COMPLETED}>Completed</SelectItem>
                <SelectItem value={BookingStatus.CANCELLED}>Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value={PaymentStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={PaymentStatus.PAID}>Paid</SelectItem>
                <SelectItem value={PaymentStatus.REFUNDED}>Refunded</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => fetchBookings()}>
              <Filter className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'calendar' | 'list')}>
        <TabsList>
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="list">
            <List className="h-4 w-4 mr-2" />
            List
          </TabsTrigger>
        </TabsList>

        {/* Calendar View */}
        <TabsContent value="calendar" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="pt-6">
                  <BookingCalendar
                    bookings={filteredBookings}
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    onBookingClick={handleBookingClick}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Bookings for selected date */}
            <div className="space-y-3">
              <h3 className="font-semibold">
                {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              {bookingsForDate.length === 0 ? (
                <p className="text-sm text-gray-600">No bookings for this date</p>
              ) : (
                bookingsForDate.map(booking => (
                  <Card
                    key={booking.id}
                    className="cursor-pointer hover:border-blue-500 transition-colors"
                    onClick={() => handleBookingClick(booking)}
                  >
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{booking.customer?.name}</p>
                            <p className="text-sm text-gray-600">{booking.service?.name}</p>
                          </div>
                          <Badge className={
                            booking.status === BookingStatus.CONFIRMED
                              ? 'bg-green-100 text-green-800'
                              : booking.status === BookingStatus.PENDING
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }>
                            {booking.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(booking.scheduledAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 font-medium">Booking</th>
                      <th className="text-left py-2 px-4 font-medium">Customer</th>
                      <th className="text-left py-2 px-4 font-medium">Service</th>
                      <th className="text-left py-2 px-4 font-medium">Date & Time</th>
                      <th className="text-left py-2 px-4 font-medium">Status</th>
                      <th className="text-left py-2 px-4 font-medium">Payment</th>
                      <th className="text-left py-2 px-4 font-medium">Amount</th>
                      <th className="text-left py-2 px-4 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map(booking => (
                      <tr key={booking.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{booking.bookingNumber}</td>
                        <td className="py-3 px-4">{booking.customer?.name}</td>
                        <td className="py-3 px-4">{booking.service?.name}</td>
                        <td className="py-3 px-4">
                          {new Date(booking.scheduledAt).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={
                            booking.status === BookingStatus.CONFIRMED
                              ? 'bg-green-100 text-green-800'
                              : booking.status === BookingStatus.PENDING
                              ? 'bg-yellow-100 text-yellow-800'
                              : booking.status === BookingStatus.COMPLETED
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }>
                            {booking.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={
                            booking.paymentStatus === PaymentStatus.PAID
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }>
                            {booking.paymentStatus}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-medium">
                          Rp {booking.totalAmount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBookingClick(booking)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Sale Dialog */}
      <Dialog open={showQuickSaleDialog} onOpenChange={setShowQuickSaleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Quick Sale</DialogTitle>
            <DialogDescription>
              Create an on-the-spot sale for a walk-in customer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Customer Selection */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="customer">Customer *</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAddCustomerDialog(true)}
                  className="h-6 px-2 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add New
                </Button>
              </div>
              <Select
                value={quickSaleForm.customerId}
                onValueChange={(value) =>
                  setQuickSaleForm({ ...quickSaleForm, customerId: value })
                }
              >
                <SelectTrigger id="customer">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} ({customer.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Service Selection */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="service">Service *</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => fetchServices()}
                  className="h-6 px-2 text-xs"
                  disabled={loading}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              </div>
              <Select
                value={quickSaleForm.serviceId}
                onValueChange={(value) =>
                  setQuickSaleForm({ ...quickSaleForm, serviceId: value })
                }
              >
                <SelectTrigger id="service">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {services.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">
                      No services available. Click Refresh to reload.
                    </div>
                  ) : (
                    services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - Rp {service.price.toLocaleString('id-ID')}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method */}
            <div>
              <Label htmlFor="payment">Payment Method</Label>
              <Select
                value={quickSaleForm.paymentMethod}
                onValueChange={(value) =>
                  setQuickSaleForm({ ...quickSaleForm, paymentMethod: value })
                }
              >
                <SelectTrigger id="payment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="transfer">Bank Transfer</SelectItem>
                  <SelectItem value="qris">QRIS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes..."
                value={quickSaleForm.notes}
                onChange={(e) =>
                  setQuickSaleForm({ ...quickSaleForm, notes: e.target.value })
                }
                className="h-20"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowQuickSaleDialog(false)}
                disabled={creatingQuickSale}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateQuickSale}
                disabled={creatingQuickSale}
              >
                {creatingQuickSale ? 'Creating...' : 'Create Sale'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New Customer Dialog */}
      <Dialog open={showAddCustomerDialog} onOpenChange={setShowAddCustomerDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Create a new customer to use for this quick sale
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="newCustomerName">Full Name *</Label>
              <Input
                id="newCustomerName"
                placeholder="Customer name"
                value={newCustomerForm.name}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, name: e.target.value })
                }
                disabled={creatingCustomer}
              />
            </div>

            <div>
              <Label htmlFor="newCustomerPhone">Phone Number *</Label>
              <Input
                id="newCustomerPhone"
                placeholder="0812xxxxxxx"
                value={newCustomerForm.phone}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })
                }
                disabled={creatingCustomer}
              />
            </div>

            <div>
              <Label htmlFor="newCustomerEmail">Email (Optional)</Label>
              <Input
                id="newCustomerEmail"
                placeholder="customer@email.com"
                type="email"
                value={newCustomerForm.email}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, email: e.target.value })
                }
                disabled={creatingCustomer}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddCustomerDialog(false)}
                disabled={creatingCustomer}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCustomer}
                disabled={creatingCustomer}
              >
                {creatingCustomer ? 'Creating...' : 'Add Customer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Details Drawer */}
      <BookingDetailsDrawer
        booking={selectedBooking}
        tenantId={tenantId}
        isOpen={showDetailsDrawer}
        onOpenChange={setShowDetailsDrawer}
        onBookingUpdate={handleBookingUpdate}
      />
    </div>
  );
}
