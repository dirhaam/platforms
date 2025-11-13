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
import { Plus, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import { HomeVisitAddressSelector } from '@/components/location/HomeVisitAddressSelector';
import { TravelEstimateCard } from '@/components/location/TravelEstimateCard';
import { TimeSlotPicker } from '@/components/booking/TimeSlotPicker';
import { TravelCalculation } from '@/types/location';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Customer, Service, TimeSlot } from '@/types/booking';
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
  scheduledTime: string; // Kept for backward compatibility
  selectedTimeSlot?: TimeSlot; // New: selected time slot from TimeSlotPicker
  isHomeVisit: boolean;
  homeVisitAddress: string;
  homeVisitLat?: number;
  homeVisitLng?: number;
  paymentMethod: string;
  dpAmount: number;
  notes: string;
  // Travel calculation data
  travelCalculation?: TravelCalculation;
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
    selectedTimeSlot: undefined,
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
  const [businessCoordinates, setBusinessCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, subdomain]);

  const fetchData = async () => {
    if (!subdomain) return;

    try {
      // Load with reasonable defaults: 50 customers/services per page (usually enough)
      const [customersRes, servicesRes, settingsRes, blockedDatesRes] = await Promise.all([
        fetch('/api/customers?limit=50', { headers: { 'x-tenant-id': subdomain } }),
        fetch('/api/services?limit=50', { headers: { 'x-tenant-id': subdomain } }),
        fetch(`/api/settings/invoice-config?tenantId=${subdomain}`, { headers: { 'x-tenant-id': subdomain } }),
        fetch(`/api/bookings/blocked-dates?tenantId=${subdomain}`)
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
        console.log('[NewBookingDialog] Invoice settings loaded:', data.settings);
        setInvoiceSettings(data.settings || null);
        // Get business coordinates for travel calculation
        if (data.settings?.branding?.businessLatitude && data.settings?.branding?.businessLongitude) {
          const coords = {
            lat: data.settings.branding.businessLatitude,
            lng: data.settings.branding.businessLongitude
          };
          console.log('[NewBookingDialog] Setting business coordinates for travel:', coords);
          setBusinessCoordinates(coords);
        } else {
          console.warn('[NewBookingDialog] No business coordinates in invoice settings:', {
            businessLatitude: data.settings?.branding?.businessLatitude,
            businessLongitude: data.settings?.branding?.businessLongitude
          });
        }
      } else {
        console.warn('[NewBookingDialog] Failed to fetch invoice settings:', settingsRes.status);
      }

      // Fetch blocked dates
      if (blockedDatesRes.ok) {
        const data = await blockedDatesRes.json();
        console.log('[NewBookingDialog] Blocked dates loaded:', data.blockedDates?.length || 0);
        // Convert to Set of date strings (YYYY-MM-DD) for efficient lookup
        const dateSet = new Set<string>(
          (data.blockedDates || []).map((bd: any) => 
            new Date(bd.date).toISOString().split('T')[0]
          )
        );
        setBlockedDates(dateSet);
      } else {
        console.warn('[NewBookingDialog] Failed to fetch blocked dates:', blockedDatesRes.status);
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

    if (!booking.customerId || !booking.serviceId || !booking.scheduledAt || !booking.selectedTimeSlot) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const scheduledAt = booking.selectedTimeSlot.start.toISOString();
      
      // Log booking data before submit
      console.log('[NewBookingDialog] Submitting booking:', {
        isHomeVisit: booking.isHomeVisit,
        hasTravelCalculation: !!booking.travelCalculation,
        travelCalculation: booking.travelCalculation,
        homeVisitAddress: booking.homeVisitAddress,
        homeVisitLat: booking.homeVisitLat,
        homeVisitLng: booking.homeVisitLng
      });

      const requestBody = {
        customerId: booking.customerId,
        serviceId: booking.serviceId,
        scheduledAt,
        isHomeVisit: booking.isHomeVisit,
        homeVisitAddress: booking.homeVisitAddress,
        homeVisitCoordinates: booking.isHomeVisit && isFinite(Number(booking.homeVisitLat)) && isFinite(Number(booking.homeVisitLng))
          ? { lat: Number(booking.homeVisitLat), lng: Number(booking.homeVisitLng) }
          : undefined,
        travelDistance: booking.travelCalculation?.distance,
        travelDuration: booking.travelCalculation?.duration,
        travelRoute: booking.travelCalculation?.route,
        travelSurchargeAmount: booking.travelCalculation?.surcharge,
        paymentMethod: booking.paymentMethod,
        dpAmount: booking.dpAmount,
        notes: booking.notes
      };

      console.log('[NewBookingDialog] Request body being sent:', requestBody);
      console.log('[NewBookingDialog] Travel fields in request:', {
        travelDistance: requestBody.travelDistance,
        travelDuration: requestBody.travelDuration,
        travelSurchargeAmount: requestBody.travelSurchargeAmount,
        travelRoute: requestBody.travelRoute ? `${requestBody.travelRoute.length} points` : undefined
      });

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': subdomain
        },
        body: JSON.stringify(requestBody)
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
        selectedTimeSlot: undefined,
        isHomeVisit: false,
        homeVisitAddress: '',
        homeVisitLat: undefined,
        homeVisitLng: undefined,
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
        <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] overflow-hidden flex flex-col p-4 sm:p-6">
          <DialogHeader className="mb-6">
            <DialogTitle>Create New Booking</DialogTitle>
            <DialogDescription>
              Fill in the booking details below
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1">
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

              {/* Date Picker */}
              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {booking.scheduledAt ? new Date(booking.scheduledAt + 'T00:00').toLocaleDateString() : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={booking.scheduledAt ? new Date(booking.scheduledAt + 'T00:00') : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const dateStr = date.toISOString().split('T')[0];
                          setBooking({ ...booking, scheduledAt: dateStr, selectedTimeSlot: undefined });
                        }
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (date < today) return true;
                        const dateStr = date.toISOString().split('T')[0];
                        return blockedDates.has(dateStr);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Slot Picker */}
              {booking.scheduledAt && booking.serviceId && (
                <div className="space-y-2">
                  <TimeSlotPicker
                    serviceId={booking.serviceId}
                    selectedDate={new Date(booking.scheduledAt + 'T00:00')}
                    onSlotSelect={(slot) => setBooking({ ...booking, selectedTimeSlot: slot })}
                    selectedSlot={booking.selectedTimeSlot}
                    tenantId={subdomain}
                  />
                </div>
              )}

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
                  <>
                    <HomeVisitAddressSelector
                      address={booking.homeVisitAddress}
                      latitude={booking.homeVisitLat}
                      longitude={booking.homeVisitLng}
                      tenantId={subdomain}
                      onAddressChange={(addr) => setBooking({ ...booking, homeVisitAddress: addr })}
                      onCoordinatesChange={(lat, lng) => setBooking({ ...booking, homeVisitLat: lat, homeVisitLng: lng })}
                    />

                    {/* Travel Estimate Placeholder or Card */}
                    {!booking.homeVisitAddress || booking.homeVisitLat === undefined || booking.homeVisitLat === null || booking.homeVisitLng === undefined || booking.homeVisitLng === null ? (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center text-sm text-blue-700">
                        📍 Masukkan alamat dan koordinat home visit untuk melihat estimasi biaya travel
                      </div>
                    ) : null}

                    {/* Travel Estimate */}
                    {booking.homeVisitAddress && typeof booking.homeVisitLat === 'number' && typeof booking.homeVisitLng === 'number' && businessCoordinates && (
                      <div className="mt-4">
                        <TravelEstimateCard
                          tenantId={subdomain}
                          origin={businessCoordinates}
                          destination={booking.homeVisitAddress}
                          // Also pass coordinates for calculation if address geocoding fails
                          destinationCoordinates={{
                            lat: booking.homeVisitLat,
                            lng: booking.homeVisitLng
                          }}
                          serviceId={booking.serviceId}
                          onCalculationComplete={(calc) => {
                            console.log('[NewBookingDialog] Travel calculation complete:', calc);
                            setBooking({ ...booking, travelCalculation: calc });
                          }}
                          onConfirm={(calc) => {
                            console.log('[NewBookingDialog] Travel calculation confirmed:', calc);
                            setBooking({ ...booking, travelCalculation: calc });
                          }}
                          autoCalculate={true}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Amount Breakdown */}
              {booking.serviceId && services.find(s => s.id === booking.serviceId) && (
                <div className="p-4 bg-gray-50 rounded-lg border space-y-2">
                  <h3 className="font-semibold text-sm mb-3">Amount Breakdown</h3>
                  {(() => {
                    const basePrice = Number(services.find(s => s.id === booking.serviceId)?.price || 0);
                    const travelSurcharge = booking.travelCalculation?.surcharge || 0;
                    const subtotal = basePrice + travelSurcharge;
                    const tax = subtotal * ((invoiceSettings?.taxServiceCharge?.taxPercentage || 0) / 100);
                    
                    return (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Base Service Amount</span>
                          <span>IDR {basePrice.toLocaleString('id-ID')}</span>
                        </div>
                        {booking.isHomeVisit && booking.travelCalculation && travelSurcharge > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Travel Surcharge ({booking.travelCalculation.distance.toFixed(1)}km)</span>
                            <span>IDR {Number(travelSurcharge).toLocaleString('id-ID')}</span>
                          </div>
                        )}
                        {invoiceSettings?.taxServiceCharge?.taxPercentage ? (
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Tax {Number(invoiceSettings.taxServiceCharge.taxPercentage).toFixed(2)}%</span>
                            <span>IDR {tax.toLocaleString('id-ID')}</span>
                          </div>
                        ) : null}
                      </>
                    );
                  })()}
                  {invoiceSettings?.taxServiceCharge?.serviceChargeRequired && invoiceSettings?.taxServiceCharge?.serviceChargeValue ? (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Service Charge</span>
                      <span>
                        {(() => {
                          const basePrice = Number(services.find(s => s.id === booking.serviceId)?.price || 0);
                          const travelSurcharge = booking.travelCalculation?.surcharge || 0;
                          const subtotal = basePrice + travelSurcharge;
                          if (invoiceSettings.taxServiceCharge.serviceChargeType === 'fixed') {
                            return `IDR ${(invoiceSettings.taxServiceCharge.serviceChargeValue || 0).toLocaleString('id-ID')}`;
                          }
                          return `IDR ${(subtotal * ((invoiceSettings.taxServiceCharge.serviceChargeValue || 0) / 100)).toLocaleString('id-ID')}`;
                        })()}
                      </span>
                    </div>
                  ) : null}
                  {invoiceSettings?.additionalFees && invoiceSettings.additionalFees.length > 0 && (
                    <>
                      {invoiceSettings.additionalFees.map(fee => (
                        <div key={fee.id} className="flex justify-between text-sm text-gray-600">
                          <span>{fee.name}</span>
                          <span>
                            {(() => {
                              const basePrice = Number(services.find(s => s.id === booking.serviceId)?.price || 0);
                              const travelSurcharge = booking.travelCalculation?.surcharge || 0;
                              const subtotal = basePrice + travelSurcharge;
                              if (fee.type === 'fixed') {
                                return `IDR ${fee.value.toLocaleString('id-ID')}`;
                              }
                              return `IDR ${(subtotal * (fee.value / 100)).toLocaleString('id-ID')}`;
                            })()}
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
                        
                        // Step 1: Base price
                        const basePrice = Number(service.price);
                        
                        // Step 2: Travel surcharge (distance-based, not from service.homeVisitSurcharge)
                        const travelSurcharge = (booking.isHomeVisit && booking.travelCalculation) ? Number(booking.travelCalculation.surcharge) : 0;
                        
                        // Step 3: Subtotal = base + travel
                        let subtotal = basePrice + travelSurcharge;
                        let total = subtotal;
                        
                        // Step 4: Tax on subtotal
                        if (invoiceSettings?.taxServiceCharge?.taxPercentage) {
                          total += subtotal * (invoiceSettings.taxServiceCharge.taxPercentage / 100);
                        }
                        
                        // Step 5: Service charge on subtotal
                        if (invoiceSettings?.taxServiceCharge?.serviceChargeRequired && invoiceSettings?.taxServiceCharge?.serviceChargeValue) {
                          if (invoiceSettings.taxServiceCharge.serviceChargeType === 'fixed') {
                            total += invoiceSettings.taxServiceCharge.serviceChargeValue;
                          } else {
                            total += subtotal * ((invoiceSettings.taxServiceCharge.serviceChargeValue || 0) / 100);
                          }
                        }
                        
                        // Step 6: Additional fees on subtotal
                        if (invoiceSettings?.additionalFees && invoiceSettings.additionalFees.length > 0) {
                          invoiceSettings.additionalFees.forEach(fee => {
                            if (fee.type === 'fixed') {
                              total += fee.value;
                            } else {
                              total += subtotal * (fee.value / 100);
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
                  disabled={submitting || !booking.customerId || !booking.serviceId || !booking.scheduledAt || !booking.selectedTimeSlot}
                >
                  {submitting ? 'Creating...' : 'Create Booking'}
                </Button>
              </div>
            </form>
          )}
          </div>
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
