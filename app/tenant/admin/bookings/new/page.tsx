'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Customer, Service } from '@/types/booking';

interface NewBooking {
  customerId: string;
  serviceId: string;
  scheduledAt: string;
  scheduledTime: string;
  notes: string;
}

interface NewCustomer {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

export default function BookingNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subdomain = searchParams.get('subdomain');
  
  const [booking, setBooking] = useState<NewBooking>({
    customerId: '',
    serviceId: '',
    scheduledAt: '',
    scheduledTime: '',
    notes: ''
  });

  const [newCustomer, setNewCustomer] = useState<NewCustomer>({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [subdomain]);

  const fetchData = async () => {
    if (!subdomain) return;

    try {
      const [customersRes, servicesRes] = await Promise.all([
        fetch('/api/customers', { headers: { 'x-tenant-id': subdomain } }),
        fetch('/api/services', { headers: { 'x-tenant-id': subdomain } })
      ]);

      if (customersRes.ok) {
        const data = await customersRes.json();
        setCustomers(data.customers || []);
      }

      if (servicesRes.ok) {
        const data = await servicesRes.json();
        setServices(data.services || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!subdomain) return;

    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      alert('Name and phone are required');
      return;
    }

    setCreatingCustomer(true);

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': subdomain
        },
        body: JSON.stringify(newCustomer)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create customer');
      }

      const data = await response.json();
      const createdCustomer = data.customer;

      // Add new customer to list
      setCustomers([...customers, createdCustomer]);

      // Auto-select the new customer
      setBooking({ ...booking, customerId: createdCustomer.id });

      // Reset form and close dialog
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: ''
      });
      setShowCustomerDialog(false);

      // Show success feedback
      alert(`${createdCustomer.name} added successfully!`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create customer');
    } finally {
      setCreatingCustomer(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!subdomain) return;

    if (!booking.customerId || !booking.serviceId || !booking.scheduledAt || !booking.scheduledTime) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const [dateStr, timeStr] = [booking.scheduledAt, booking.scheduledTime];
      const scheduledAt = new Date(`${dateStr}T${timeStr}`).toISOString();

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': subdomain
        },
        body: JSON.stringify({
          customerId: booking.customerId,
          serviceId: booking.serviceId,
          scheduledAt,
          notes: booking.notes
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create booking');
      }

      router.push(`/tenant/admin/bookings?subdomain=${subdomain}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Create New Booking</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="customer">Customer *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCustomerDialog(true)}
                    className="gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Plus className="w-4 h-4" />
                    Add New
                  </Button>
                </div>
                <Select value={booking.customerId} onValueChange={(value) => setBooking({ ...booking, customerId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.length === 0 ? (
                      <div className="p-2 text-sm text-gray-600">No customers available</div>
                    ) : (
                      customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} ({customer.phone})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service">Service *</Label>
                <Select value={booking.serviceId} onValueChange={(value) => setBooking({ ...booking, serviceId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} ({service.duration} min - PKR {service.price})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={booking.scheduledAt}
                  onChange={(e) => setBooking({ ...booking, scheduledAt: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={booking.scheduledTime}
                  onChange={(e) => setBooking({ ...booking, scheduledTime: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional booking notes"
                  value={booking.notes}
                  onChange={(e) => setBooking({ ...booking, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Booking'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Add New Customer Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Create a new customer and they'll be automatically selected for this booking
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCustomer} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newcust-name">Customer Name *</Label>
              <Input
                id="newcust-name"
                placeholder="John Doe"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newcust-email">Email</Label>
              <Input
                id="newcust-email"
                type="email"
                placeholder="john@example.com"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newcust-phone">Phone Number *</Label>
              <Input
                id="newcust-phone"
                placeholder="+92 300 1234567"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newcust-address">Address</Label>
              <Input
                id="newcust-address"
                placeholder="Customer's address"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newcust-notes">Notes</Label>
              <Textarea
                id="newcust-notes"
                placeholder="Additional notes about the customer"
                value={newCustomer.notes}
                onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCustomerDialog(false)}
                disabled={creatingCustomer}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creatingCustomer}
              >
                {creatingCustomer ? 'Creating...' : 'Add & Select'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
