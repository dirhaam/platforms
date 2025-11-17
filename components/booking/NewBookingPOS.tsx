'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, MapPin, Calendar as CalendarIcon, Search, X } from 'lucide-react';
import { HomeVisitAddressSelector } from '@/components/location/HomeVisitAddressSelector';
import { TravelEstimateCard } from '@/components/location/TravelEstimateCard';
import { TimeSlotPicker } from '@/components/booking/TimeSlotPicker';
import { BlockingDateCalendar } from '@/components/booking/BlockingDateCalendar';
import { TravelCalculation } from '@/types/location';
import { Checkbox } from '@/components/ui/checkbox';
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
import { toast } from 'sonner';

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
  selectedTimeSlot?: TimeSlot;
  isHomeVisit: boolean;
  homeVisitAddress: string;
  homeVisitLat?: number;
  homeVisitLng?: number;
  paymentMethod: string;
  dpAmount: number;
  notes: string;
  travelCalculation?: TravelCalculation;
}

interface NewCustomer {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

export function NewBookingPOS({
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
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [businessCoordinates, setBusinessCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [blockedDates, setBlockedDates] = useState<Map<string, string>>(new Map());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [currentStep, setCurrentStep] = useState<'main' | 'date' | 'time'>('main');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, subdomain]);

  const fetchData = async () => {
    if (!subdomain) return;

    try {
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
        setInvoiceSettings(data.settings || null);
        if (data.settings?.branding?.businessLatitude && data.settings?.branding?.businessLongitude) {
          setBusinessCoordinates({
            lat: data.settings.branding.businessLatitude,
            lng: data.settings.branding.businessLongitude
          });
        }
      }

      if (blockedDatesRes.ok) {
        const data = await blockedDatesRes.json();
        const dateMap = new Map<string, string>(
          (data.blockedDates || []).map((bd: any) => [
            new Date(bd.date).toISOString().split('T')[0],
            bd.reason || 'No reason provided'
          ])
        );
        setBlockedDates(dateMap);
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
      setShowNewCustomerForm(false);
      toast.success('Customer created successfully');
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
      toast.success('Booking created successfully');
      onOpenChange(false);
      onBookingCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCustomer = useMemo(
    () => customers.find(c => c.id === booking.customerId),
    [booking.customerId, customers]
  );

  const selectedService = useMemo(
    () => services.find(s => s.id === booking.serviceId),
    [booking.serviceId, services]
  );

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const search = customerSearch.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(search) || 
      c.phone.includes(search)
    );
  }, [customers, customerSearch]);

  const fetchAvailableSlots = async () => {
    if (!booking.serviceId || !booking.scheduledAt || !subdomain) return;
    try {
      const response = await fetch(
        `/api/bookings/availability?serviceId=${booking.serviceId}&date=${booking.scheduledAt}`,
        { headers: { 'x-tenant-id': subdomain } }
      );
      if (response.ok) {
        const data = await response.json();
        const slots = (data.slots || []).map((slot: any) => ({
          ...slot,
          start: typeof slot.start === 'string' ? new Date(slot.start) : slot.start,
          end: typeof slot.end === 'string' ? new Date(slot.end) : slot.end
        }));
        setAvailableSlots(slots);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
    }
  };

  const groupSlotsByPeriod = (slots: TimeSlot[]) => {
    const morning = slots.filter(slot => {
      const hour = slot.start.getHours();
      return hour >= 6 && hour < 12;
    });
    const afternoon = slots.filter(slot => {
      const hour = slot.start.getHours();
      return hour >= 12 && hour < 17;
    });
    const evening = slots.filter(slot => {
      const hour = slot.start.getHours();
      return hour >= 17 && hour < 22;
    });
    return { morning, afternoon, evening };
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateTotal = () => {
    if (!selectedService) return 0;
    
    const basePrice = Number(selectedService.price);
    const travelSurcharge = (booking.isHomeVisit && booking.travelCalculation) ? Number(booking.travelCalculation.surcharge) : 0;
    let subtotal = basePrice + travelSurcharge;
    let total = subtotal;
    
    if (invoiceSettings?.taxServiceCharge?.taxPercentage) {
      total += subtotal * (invoiceSettings.taxServiceCharge.taxPercentage / 100);
    }
    
    if (invoiceSettings?.taxServiceCharge?.serviceChargeRequired && invoiceSettings?.taxServiceCharge?.serviceChargeValue) {
      if (invoiceSettings.taxServiceCharge.serviceChargeType === 'fixed') {
        total += invoiceSettings.taxServiceCharge.serviceChargeValue;
      } else {
        total += subtotal * ((invoiceSettings.taxServiceCharge.serviceChargeValue || 0) / 100);
      }
    }
    
    if (invoiceSettings?.additionalFees && invoiceSettings.additionalFees.length > 0) {
      invoiceSettings.additionalFees.forEach(fee => {
        if (fee.type === 'fixed') {
          total += fee.value;
        } else {
          total += subtotal * (fee.value / 100);
        }
      });
    }
    
    return Math.round(total);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[95vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full bg-white">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-4 shadow-sm flex justify-between items-center">
            <div>
              <h1 className="text-gray-900 text-2xl font-bold">New Booking</h1>
              <p className="text-gray-600 text-sm mt-1">Schedule service for customer</p>
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

          {/* Main Content */}
          <div className="flex flex-1 overflow-hidden gap-0">
            {/* Left Panel - Selection (40%) */}
            <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200 bg-gray-50">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                  <p className="text-gray-600 text-center py-8">Loading...</p>
                ) : (
                  <>
                    {/* Customer Selection */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Customer *</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
                          className="text-xs h-7"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          New
                        </Button>
                      </div>

                      {showNewCustomerForm ? (
                        <form onSubmit={handleCreateCustomer} className="space-y-2 p-3 bg-white rounded border">
                          {error && !creatingCustomer && (
                            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                              {error}
                            </div>
                          )}
                          <Input
                            placeholder="Name *"
                            value={newCustomer.name}
                            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                            className="h-8 text-xs"
                            required
                          />
                          <Input
                            placeholder="Phone *"
                            value={newCustomer.phone}
                            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                            className="h-8 text-xs"
                            required
                          />
                          <Input
                            placeholder="Email"
                            type="email"
                            value={newCustomer.email}
                            onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                            className="h-8 text-xs"
                          />
                          <div className="flex gap-2">
                            <Button
                              type="submit"
                              disabled={creatingCustomer || !newCustomer.name.trim() || !newCustomer.phone.trim()}
                              className="h-8 text-xs flex-1 bg-emerald-600 hover:bg-emerald-700"
                            >
                              {creatingCustomer ? 'Creating...' : 'Create'}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowNewCustomerForm(false)}
                              className="h-8 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="relative">
                            <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search customer..."
                              value={customerSearch}
                              onChange={(e) => setCustomerSearch(e.target.value)}
                              className="h-8 text-xs pl-8"
                            />
                          </div>
                          <Select value={booking.customerId} onValueChange={(value) => setBooking({ ...booking, customerId: value })}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredCustomers.length === 0 ? (
                                <div className="p-2 text-xs text-gray-600">No customers found</div>
                              ) : (
                                filteredCustomers.map(customer => (
                                  <SelectItem key={customer.id} value={customer.id}>
                                    {customer.name} • {customer.phone}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </>
                      )}

                      {selectedCustomer && (
                        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-xs">
                          <div className="font-semibold text-emerald-900">{selectedCustomer.name}</div>
                          <div className="text-emerald-700">{selectedCustomer.phone}</div>
                        </div>
                      )}
                    </div>

                    {/* Service Selection */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Service *</Label>
                      <div className="space-y-2">
                        {services.map(service => (
                          <div
                            key={service.id}
                            onClick={() => setBooking({ ...booking, serviceId: service.id })}
                            className={`p-3 rounded border-2 cursor-pointer transition ${
                              booking.serviceId === service.id
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-gray-200 bg-white hover:border-emerald-200'
                            }`}
                          >
                            <div className="font-semibold text-sm text-gray-900">{service.name}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              {service.duration} min • IDR {service.price.toLocaleString('id-ID')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Date & Time Selection */}
                    <div className="space-y-2 p-3 bg-white rounded border">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Date & Time *</Label>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left h-8 text-xs"
                          onClick={() => setCurrentStep('date')}
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {booking.scheduledAt 
                            ? `${new Date(booking.scheduledAt + 'T00:00').toLocaleDateString()} ${booking.selectedTimeSlot ? formatTime(booking.selectedTimeSlot.start) : '(Pick time)'}`
                            : 'Select date & time'}
                        </Button>
                      </div>
                    </div>

                    {/* Home Visit */}
                    <div className="space-y-2 p-3 bg-white rounded border">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="homeVisit"
                          checked={booking.isHomeVisit}
                          onCheckedChange={(checked) => setBooking({ ...booking, isHomeVisit: checked as boolean })}
                        />
                        <Label htmlFor="homeVisit" className="cursor-pointer text-sm font-semibold flex items-center">
                          <MapPin className="inline w-3 h-3 mr-1" />
                          Home Visit
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

                          {booking.homeVisitAddress && typeof booking.homeVisitLat === 'number' && typeof booking.homeVisitLng === 'number' && businessCoordinates && (
                            <div className="mt-2">
                              <TravelEstimateCard
                                tenantId={subdomain}
                                origin={businessCoordinates}
                                destination={booking.homeVisitAddress}
                                destinationCoordinates={{
                                  lat: booking.homeVisitLat,
                                  lng: booking.homeVisitLng
                                }}
                                serviceId={booking.serviceId}
                                onCalculationComplete={(calc) => {
                                  setBooking({ ...booking, travelCalculation: calc });
                                }}
                                onConfirm={(calc) => {
                                  setBooking({ ...booking, travelCalculation: calc });
                                }}
                                autoCalculate={true}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Panel - Summary & Payment (60%) */}
            <div className="flex-[1.5] flex flex-col overflow-hidden bg-white">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Amount Breakdown */}
                {selectedService && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                    <h3 className="font-semibold text-sm">Amount Breakdown</h3>
                    
                    {(() => {
                      const basePrice = Number(selectedService.price);
                      const travelSurcharge = booking.travelCalculation?.surcharge || 0;
                      const subtotal = basePrice + travelSurcharge;
                      const tax = subtotal * ((invoiceSettings?.taxServiceCharge?.taxPercentage || 0) / 100);
                      
                      return (
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Service</span>
                            <span>IDR {basePrice.toLocaleString('id-ID')}</span>
                          </div>
                          
                          {booking.isHomeVisit && travelSurcharge > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Travel ({booking.travelCalculation?.distance.toFixed(1)}km)</span>
                              <span>IDR {Number(travelSurcharge).toLocaleString('id-ID')}</span>
                            </div>
                          )}

                          {tax > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tax ({invoiceSettings?.taxServiceCharge?.taxPercentage.toFixed(1)}%)</span>
                              <span>IDR {tax.toLocaleString('id-ID')}</span>
                            </div>
                          )}

                          {invoiceSettings?.taxServiceCharge?.serviceChargeRequired && invoiceSettings?.taxServiceCharge?.serviceChargeValue && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Service Charge</span>
                              <span>
                                {invoiceSettings.taxServiceCharge.serviceChargeType === 'fixed'
                                  ? `IDR ${(invoiceSettings.taxServiceCharge.serviceChargeValue || 0).toLocaleString('id-ID')}`
                                  : `IDR ${(subtotal * ((invoiceSettings.taxServiceCharge.serviceChargeValue || 0) / 100)).toLocaleString('id-ID')}`}
                              </span>
                            </div>
                          )}

                          {invoiceSettings?.additionalFees && invoiceSettings.additionalFees.length > 0 && (
                            invoiceSettings.additionalFees.map(fee => (
                              <div key={fee.id} className="flex justify-between">
                                <span className="text-gray-600">{fee.name}</span>
                                <span>
                                  {fee.type === 'fixed'
                                    ? `IDR ${fee.value.toLocaleString('id-ID')}`
                                    : `IDR ${(subtotal * (fee.value / 100)).toLocaleString('id-ID')}`}
                                </span>
                              </div>
                            ))
                          )}

                          <div className="border-t pt-2 flex justify-between font-bold text-base text-emerald-700">
                            <span>TOTAL</span>
                            <span>IDR {calculateTotal().toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Payment Information */}
                <div className="space-y-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <h3 className="font-semibold text-sm">Payment</h3>
                  
                  {/* Payment Method Quick Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={booking.paymentMethod === 'cash' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setBooking({ ...booking, paymentMethod: 'cash' })}
                      className={`text-xs ${booking.paymentMethod === 'cash' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                    >
                      💵 Cash
                    </Button>
                    <Button
                      variant={booking.paymentMethod === 'card' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setBooking({ ...booking, paymentMethod: 'card' })}
                      className={`text-xs ${booking.paymentMethod === 'card' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                    >
                      💳 Card
                    </Button>
                    <Button
                      variant={booking.paymentMethod === 'qris' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setBooking({ ...booking, paymentMethod: 'qris' })}
                      className={`text-xs ${booking.paymentMethod === 'qris' ? 'bg-sky-600 hover:bg-sky-700' : ''}`}
                    >
                      📱 QRIS
                    </Button>
                    <Button
                      variant={booking.paymentMethod === 'transfer' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setBooking({ ...booking, paymentMethod: 'transfer' })}
                      className={`text-xs ${booking.paymentMethod === 'transfer' ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                    >
                      🏦 Transfer
                    </Button>
                  </div>

                  {/* Down Payment */}
                  <div className="space-y-1">
                    <Label htmlFor="dpAmount" className="text-xs">Down Payment (Optional)</Label>
                    <Input
                      id="dpAmount"
                      type="number"
                      min="0"
                      placeholder="DP amount (IDR)"
                      value={booking.dpAmount || 0}
                      onChange={(e) => setBooking({ ...booking, dpAmount: parseInt(e.target.value) || 0 })}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <Label htmlFor="notes" className="text-xs font-semibold">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional booking notes"
                    value={booking.notes}
                    onChange={(e) => setBooking({ ...booking, notes: e.target.value })}
                    rows={3}
                    className="text-xs"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
                    {error}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="border-t border-gray-200 p-4 flex gap-2 justify-end bg-gray-50">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                  className="text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }}
                  disabled={submitting || !booking.customerId || !booking.serviceId || !booking.scheduledAt || !booking.selectedTimeSlot}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6"
                >
                  {submitting ? 'Creating...' : 'Create Booking'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Date & Time Step Modal */}
      <Dialog open={currentStep !== 'main'} onOpenChange={(open) => !open && setCurrentStep('main')}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden flex flex-col p-0">
          <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {currentStep === 'date' ? 'Select Date' : 'Select Time'}
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                {currentStep === 'date' ? 'Choose your preferred date' : 'Choose your preferred time'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentStep('main')}
              className="text-gray-600 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {currentStep === 'date' && (
              <div className="space-y-4">
                <BlockingDateCalendar
                  selected={booking.scheduledAt ? new Date(booking.scheduledAt + 'T00:00') : undefined}
                  onSelect={(date) => {
                    if (date) {
                      const dateStr = date.toISOString().split('T')[0];
                      setBooking({ ...booking, scheduledAt: dateStr, selectedTimeSlot: undefined });
                      setAvailableSlots([]);
                      setCurrentStep('time');
                      // Fetch slots for this date
                      setTimeout(() => {
                        const newBooking = { ...booking, scheduledAt: dateStr };
                        if (newBooking.serviceId && subdomain) {
                          fetch(
                            `/api/bookings/availability?serviceId=${newBooking.serviceId}&date=${dateStr}`,
                            { headers: { 'x-tenant-id': subdomain } }
                          ).then(r => r.json()).then(data => {
                            const slots = (data.slots || []).map((slot: any) => ({
                              ...slot,
                              start: typeof slot.start === 'string' ? new Date(slot.start) : slot.start,
                              end: typeof slot.end === 'string' ? new Date(slot.end) : slot.end
                            }));
                            setAvailableSlots(slots);
                          }).catch(err => console.error('Error fetching slots:', err));
                        }
                      }, 0);
                    }
                  }}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                  blockedDates={blockedDates}
                />
              </div>
            )}

            {currentStep === 'time' && booking.scheduledAt && (
              <div className="space-y-4">
                <div className="text-sm font-medium text-gray-700">
                  Selected Date: {new Date(booking.scheduledAt + 'T00:00').toLocaleDateString()}
                </div>
                
                {availableSlots.length === 0 ? (
                  <div className="text-center text-sm text-gray-600 py-8">
                    No available time slots for this date
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const { morning, afternoon, evening } = groupSlotsByPeriod(availableSlots);
                      
                      return (
                        <>
                          {morning.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Morning (6AM - 12PM)</h4>
                              <div className="grid grid-cols-4 gap-2">
                                {morning.map((slot, idx) => (
                                  <Button
                                    key={idx}
                                    variant={booking.selectedTimeSlot?.start.getTime() === slot.start.getTime() ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => {
                                      setBooking({ ...booking, selectedTimeSlot: slot });
                                      setCurrentStep('main');
                                    }}
                                    className={booking.selectedTimeSlot?.start.getTime() === slot.start.getTime() ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                                  >
                                    {formatTime(slot.start)}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}

                          {afternoon.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Afternoon (12PM - 5PM)</h4>
                              <div className="grid grid-cols-4 gap-2">
                                {afternoon.map((slot, idx) => (
                                  <Button
                                    key={idx}
                                    variant={booking.selectedTimeSlot?.start.getTime() === slot.start.getTime() ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => {
                                      setBooking({ ...booking, selectedTimeSlot: slot });
                                      setCurrentStep('main');
                                    }}
                                    className={booking.selectedTimeSlot?.start.getTime() === slot.start.getTime() ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                                  >
                                    {formatTime(slot.start)}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}

                          {evening.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Evening (5PM - 10PM)</h4>
                              <div className="grid grid-cols-4 gap-2">
                                {evening.map((slot, idx) => (
                                  <Button
                                    key={idx}
                                    variant={booking.selectedTimeSlot?.start.getTime() === slot.start.getTime() ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => {
                                      setBooking({ ...booking, selectedTimeSlot: slot });
                                      setCurrentStep('main');
                                    }}
                                    className={booking.selectedTimeSlot?.start.getTime() === slot.start.getTime() ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                                  >
                                    {formatTime(slot.start)}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                <div className="flex gap-2 justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('date')}
                    className="text-sm"
                  >
                    Back to Date
                  </Button>
                  <Button
                    onClick={() => setCurrentStep('main')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
