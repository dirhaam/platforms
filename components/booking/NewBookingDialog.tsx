'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, MapPin } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Customer, Service } from '@/types/booking';
import type { InvoiceSettingsData } from '@/lib/invoice/invoice-settings-service';

interface NewBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subdomain: string;
  onBookingCreated?: () => void;
}

interface NewBooking {
  customerId: string;
  serviceId: string;
  scheduledAt: string;
  scheduledTime: string;
  isHomeVisit: boolean;
  homeVisitAddress: string;
  paymentMethod: string;
  dpAmount: number;
  notes: string;
}

interface NewCustomer {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

export function NewBookingDialog({
  open,
  onOpenChange,
  subdomain,
  onBookingCreated
}: NewBookingDialogProps) {
  const [booking, setBooking] = useState<NewBooking>({
    customerId: '',
    serviceId: '',
    scheduledAt: '',
    scheduledTime: '',
    isHomeVisit: false,
    homeVisitAddress: '',
    paymentMethod: 'cash',
    dpAmount: 0,
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
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettingsData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, subdomain]);

  const fetchData = async () => {
    if (!subdomain) return;

    try {
      const [customersRes, servicesRes, settingsRes] = await Promise.all([
        fetch('/api/customers', { headers: { 'x-tenant-id': subdomain } }),
        fetch('/api/services', { headers: { 'x-tenant-id': subdomain } }),
        fetch(`/api/settings/invoice-config?tenantId=${subdomain}`, { headers: { 'x-tenant-id': subdomain } })
      ]);

      if (customersRes.ok) {
        const data = await customersRes.json();
        setCustomers(data.customers || []);
      }

      if (servicesRes.ok) {
        const data = await servicesRes.json();
        setServices(data.services || []);
      }

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setInvoiceSettings(data.settings || null);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load customers and services');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!subdomain) return;

    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      setError('Name and phone are required');
      return;
    }

    setCreatingCustomer(true);
    setError(null);

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

      setCustomers([...customers, createdCustomer]);
      setBooking({ ...booking, customerId: createdCustomer.id });
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: ''
      });
      setShowCustomerDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create customer');
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
      const scheduledAt = new Date(`${booking.scheduledAt}T${booking.scheduledTime}`).toISOString();

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
          isHomeVisit: booking.isHomeVisit,
          homeVisitAddress: booking.homeVisitAddress,
          paymentMethod: booking.paymentMethod,
          dpAmount: booking.dpAmount,
          notes: booking.notes
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create booking');
      }

      setBooking({
        customerId: '',
        serviceId: '',
        scheduledAt: '',
        scheduledTime: '',
        isHomeVisit: false,
        homeVisitAddress: '',
        paymentMethod: 'cash',
        dpAmount: 0,
        notes: ''
      });
      onOpenChange(false);
      onBookingCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Main Booking Dialog */}
      <Dialog open={open && !showCustomerDialog} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="mb-6">
            <DialogTitle>Create New Booking</DialogTitle>
            <DialogDescription>
              Fill in the booking details below
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <p className="text-gray-600 text-center py-8">Loading...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Customer Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="customer">Customer *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomerDialog(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    New Customer
                  </Button>
                </div>
                <Select value={booking.customerId} onValueChange={(value) => setBooking({ ...booking, customerId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.length === 0 ? (
                      <div className="p-2 text-sm text-gray-600">No customers available. Create one first.</div>
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

              {/* Service Selection */}
              <div className="space-y-2">
                <Label htmlFor="service">Service *</Label>
                <Select value={booking.serviceId} onValueChange={(value) => setBooking({ ...booking, serviceId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.length === 0 ? (
                      <div className="p-2 text-sm text-gray-600">No services available</div>
                    ) : (
                      services.map(service => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} ({service.duration} min - IDR {service.price.toLocaleString('id-ID')})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

              {/* Home Visit */}
              <div className="space-y-3 border rounded-lg p-4 bg-blue-50">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="homeVisit"
                    checked={booking.isHomeVisit}
                    onCheckedChange={(checked) => setBooking({ ...booking, isHomeVisit: checked as boolean })}
                  />
                  <Label htmlFor="homeVisit" className="cursor-pointer">
                    <MapPin className="inline w-4 h-4 mr-2" />
                    Home Visit Service
                  </Label>
                </div>
                {booking.isHomeVisit && (
                  <div className="space-y-2">
                    <Label htmlFor="homeAddress">Home Visit Address</Label>
                    <Input
                      id="homeAddress"
                      placeholder="Enter customer's home address"
                      value={booking.homeVisitAddress}
                      onChange={(e) => setBooking({ ...booking, homeVisitAddress: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* Amount Breakdown */}
              {booking.serviceId && services.find(s => s.id === booking.serviceId) && (
                <div className="p-4 bg-gray-50 rounded-lg border space-y-2">
                  <h3 className="font-semibold text-sm mb-3">Amount Breakdown</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Base Service Amount</span>
                    <span>IDR {Number(services.find(s => s.id === booking.serviceId)?.price || 0).toLocaleString('id-ID')}</span>
                  </div>
                  {booking.isHomeVisit && services.find(s => s.id === booking.serviceId)?.homeVisitSurcharge && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Home Visit Surcharge</span>
                      <span>IDR {Number(services.find(s => s.id === booking.serviceId)?.homeVisitSurcharge || 0).toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {invoiceSettings?.taxServiceCharge?.taxPercentage ? (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Tax {Number(invoiceSettings.taxServiceCharge.taxPercentage).toFixed(2)}%</span>
                      <span>IDR {((Number(services.find(s => s.id === booking.serviceId)?.price || 0) + (booking.isHomeVisit ? Number(services.find(s => s.id === booking.serviceId)?.homeVisitSurcharge || 0) : 0)) * (invoiceSettings.taxServiceCharge.taxPercentage / 100)).toLocaleString('id-ID')}</span>
                    </div>
                  ) : null}
                  {invoiceSettings?.taxServiceCharge?.serviceChargeRequired && invoiceSettings?.taxServiceCharge?.serviceChargeValue ? (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Service Charge</span>
                      <span>
                        {invoiceSettings.taxServiceCharge.serviceChargeType === 'fixed'
                          ? `IDR ${(invoiceSettings.taxServiceCharge.serviceChargeValue || 0).toLocaleString('id-ID')}`
                          : `IDR ${((Number(services.find(s => s.id === booking.serviceId)?.price || 0) + (booking.isHomeVisit ? Number(services.find(s => s.id === booking.serviceId)?.homeVisitSurcharge || 0) : 0)) * ((invoiceSettings.taxServiceCharge.serviceChargeValue || 0) / 100)).toLocaleString('id-ID')}`}
                      </span>
                    </div>
                  ) : null}
                  {invoiceSettings?.additionalFees && invoiceSettings.additionalFees.length > 0 && (
                    <>
                      {invoiceSettings.additionalFees.map(fee => (
                        <div key={fee.id} className="flex justify-between text-sm text-gray-600">
                          <span>{fee.name}</span>
                          <span>
                            {fee.type === 'fixed'
                              ? `IDR ${fee.value.toLocaleString('id-ID')}`
                              : `IDR ${((Number(services.find(s => s.id === booking.serviceId)?.price || 0) + (booking.isHomeVisit ? Number(services.find(s => s.id === booking.serviceId)?.homeVisitSurcharge || 0) : 0)) * (fee.value / 100)).toLocaleString('id-ID')}`}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total Amount</span>
                    <span>
                      IDR {(() => {
                        const service = services.find(s => s.id === booking.serviceId);
                        if (!service) return 0;
                        let total = Number(service.price);
                        if (booking.isHomeVisit && service.homeVisitSurcharge) {
                          total += Number(service.homeVisitSurcharge);
                        }
                        if (invoiceSettings?.taxServiceCharge?.taxPercentage) {
                          total += total * (invoiceSettings.taxServiceCharge.taxPercentage / 100);
                        }
                        if (invoiceSettings?.taxServiceCharge?.serviceChargeRequired) {
                          if (invoiceSettings.taxServiceCharge.serviceChargeType === 'fixed') {
                            total += invoiceSettings.taxServiceCharge.serviceChargeValue || 0;
                          } else {
                            total += total * ((invoiceSettings.taxServiceCharge.serviceChargeValue || 0) / 100);
                          }
                        }
                        if (invoiceSettings?.additionalFees) {
                          invoiceSettings.additionalFees.forEach(fee => {
                            if (fee.type === 'fixed') {
                              total += fee.value;
                            } else {
                              total += total * (fee.value / 100);
                            }
                          });
                        }
                        return Math.round(total).toLocaleString('id-ID');
                      })()}
                    </span>
                  </div>
                </div>
              )}

              {/* Payment Information */}
              <div className="space-y-4 bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-sm font-semibold">Payment Information</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paymentMethod">Payment Method *</Label>
                    <Select value={booking.paymentMethod} onValueChange={(value) => setBooking({ ...booking, paymentMethod: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">💵 Cash</SelectItem>
                        <SelectItem value="card">💳 Card</SelectItem>
                        <SelectItem value="transfer">🏦 Transfer</SelectItem>
                        <SelectItem value="qris">📱 QRIS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dpAmount">Down Payment (DP) - Optional</Label>
                    <Input
                      id="dpAmount"
                      type="number"
                      min="0"
                      placeholder="Enter DP amount (IDR)"
                      value={booking.dpAmount || 0}
                      onChange={(e) => setBooking({ ...booking, dpAmount: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional booking notes"
                  value={booking.notes}
                  onChange={(e) => setBooking({ ...booking, notes: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !booking.customerId || !booking.serviceId || !booking.scheduledAt || !booking.scheduledTime}
                >
                  {submitting ? 'Creating...' : 'Create Booking'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Add New Customer Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="w-[95vw] max-w-md p-4 sm:p-6">
          <DialogHeader className="mb-6">
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Create a new customer and they'll be automatically selected
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCustomer} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {error}
              </div>
            )}

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
              <Label htmlFor="newcust-phone">Phone Number *</Label>
              <Input
                id="newcust-phone"
                placeholder="+62 812 1234567"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
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

            <div className="flex gap-2 justify-end pt-2">
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
                disabled={creatingCustomer || !newCustomer.name.trim() || !newCustomer.phone.trim()}
              >
                {creatingCustomer ? 'Creating...' : 'Add & Select'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
