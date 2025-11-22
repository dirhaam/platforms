'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { HomeVisitAddressSelector } from '@/components/location/HomeVisitAddressSelector';
import { TravelEstimateCard } from '@/components/location/TravelEstimateCard';
import { BlockingDateCalendar } from '@/components/booking/BlockingDateCalendar';
import { TravelCalculation } from '@/types/location';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [customerSearch, setCustomerSearch] = useState('');
  const [currentStep, setCurrentStep] = useState<'main' | 'date' | 'time' | 'homevisit'>('main');
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
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[95vh] p-0 overflow-hidden [&>button]:hidden w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[95vw] bg-body rounded-lg shadow-lg border-0">
        <DialogTitle className="sr-only">New Booking</DialogTitle>
        <DialogDescription className="sr-only">Schedule service for customer</DialogDescription>
        
        <div className="flex flex-col h-full bg-white overflow-hidden rounded-lg">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <div className="min-w-0">
              <h4 className="text-xl font-bold text-txt-primary">New Booking</h4>
              <p className="text-txt-secondary text-sm hidden sm:block">Create a new appointment</p>
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
            
            {/* Left Panel - Selection Inputs */}
            <div className="flex-1 lg:flex-none lg:w-5/12 flex flex-col overflow-hidden border-r border-gray-100 bg-white">
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {loading ? (
                   <div className="flex flex-col items-center justify-center h-full text-txt-muted">
                     <i className='bx bx-loader-alt bx-spin text-3xl mb-2'></i>
                     <span className="text-sm">Loading resources...</span>
                   </div>
                ) : (
                  <>
                    {/* Customer Selection */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-txt-primary uppercase tracking-wide text-xs">Customer</Label>
                        {!showNewCustomerForm && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowNewCustomerForm(true)}
                            className="text-primary hover:bg-primary-light h-7 px-2 text-xs font-medium"
                          >
                            <i className='bx bx-plus mr-1'></i> New
                          </Button>
                        )}
                      </div>

                      {showNewCustomerForm ? (
                        <form onSubmit={handleCreateCustomer} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                          {error && !creatingCustomer && (
                            <div className="text-xs text-danger bg-red-50 p-2 rounded border border-red-100">
                              {error}
                            </div>
                          )}
                          <Input
                            placeholder="Full Name *"
                            value={newCustomer.name}
                            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                            className="bg-white border-gray-200 text-sm h-9 focus:border-primary focus:ring-primary/20"
                            required
                          />
                          <Input
                            placeholder="Phone Number *"
                            value={newCustomer.phone}
                            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                            className="bg-white border-gray-200 text-sm h-9 focus:border-primary focus:ring-primary/20"
                            required
                          />
                          <Input
                            placeholder="Email Address"
                            type="email"
                            value={newCustomer.email}
                            onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                            className="bg-white border-gray-200 text-sm h-9 focus:border-primary focus:ring-primary/20"
                          />
                          <div className="flex gap-2 pt-1">
                            <Button
                              type="submit"
                              disabled={creatingCustomer || !newCustomer.name.trim() || !newCustomer.phone.trim()}
                              className="h-9 flex-1 bg-primary hover:bg-primary-dark text-white shadow-sm"
                            >
                              {creatingCustomer ? <i className='bx bx-loader-alt bx-spin'></i> : 'Save Customer'}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowNewCustomerForm(false)}
                              className="h-9 bg-white text-txt-secondary hover:bg-gray-50"
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div className="relative group">
                          <i className='bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted text-lg group-focus-within:text-primary transition-colors'></i>
                          <Input
                            placeholder="Search by name or phone..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            className="pl-10 h-10 bg-gray-50 border-transparent hover:bg-gray-100 focus:bg-white focus:border-primary focus:ring-primary/20 transition-all text-sm"
                          />
                          
                          {/* Dropdown simulation with Select */}
                           <div className="mt-2">
                              <Select value={booking.customerId} onValueChange={(value) => setBooking({ ...booking, customerId: value })}>
                              <SelectTrigger className="w-full h-10 border-gray-200 text-txt-secondary focus:border-primary focus:ring-primary/20">
                                <SelectValue placeholder="Select a customer" />
                              </SelectTrigger>
                              <SelectContent>
                                {filteredCustomers.length === 0 ? (
                                  <div className="p-3 text-sm text-txt-muted text-center">No customers found</div>
                                ) : (
                                  filteredCustomers.map(customer => (
                                    <SelectItem key={customer.id} value={customer.id}>
                                      <div className="flex flex-col text-left">
                                        <span className="font-medium text-txt-primary">{customer.name}</span>
                                        <span className="text-xs text-txt-muted">{customer.phone}</span>
                                      </div>
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                           </div>
                        </div>
                      )}

                      {selectedCustomer && !showNewCustomerForm && (
                        <div className="flex items-start gap-3 p-3 bg-primary-light/30 border border-primary-light rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <i className='bx bx-user'></i>
                          </div>
                          <div>
                            <div className="font-semibold text-primary text-sm">{selectedCustomer.name}</div>
                            <div className="text-txt-secondary text-xs">{selectedCustomer.phone}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Service Selection */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-txt-primary uppercase tracking-wide text-xs">Service</Label>
                      <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                        {services.map(service => (
                          <div
                            key={service.id}
                            onClick={() => setBooking({ ...booking, serviceId: service.id })}
                            className={`
                              relative p-3 rounded-lg border cursor-pointer transition-all duration-200 flex justify-between items-center group
                              ${booking.serviceId === service.id
                                ? 'border-primary bg-primary-light shadow-sm'
                                : 'border-gray-200 bg-white hover:border-primary/50 hover:bg-gray-50'}
                            `}
                          >
                            <div>
                              <div className={`text-sm font-semibold ${booking.serviceId === service.id ? 'text-primary' : 'text-txt-primary'}`}>
                                {service.name}
                              </div>
                              <div className={`text-xs mt-1 ${booking.serviceId === service.id ? 'text-primary/80' : 'text-txt-muted'}`}>
                                <i className='bx bx-time-five inline-block mr-1'></i>{service.duration} min
                              </div>
                            </div>
                            <div className={`text-sm font-bold ${booking.serviceId === service.id ? 'text-primary' : 'text-txt-primary'}`}>
                              IDR {service.price.toLocaleString('id-ID')}
                            </div>
                            
                            {booking.serviceId === service.id && (
                                <div className="absolute right-2 top-2 w-2 h-2 rounded-full bg-primary"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Date & Time Trigger */}
                    <div className="space-y-3">
                       <Label className="text-sm font-semibold text-txt-primary uppercase tracking-wide text-xs">Schedule</Label>
                       <button
                          type="button"
                          onClick={() => setCurrentStep('date')}
                          className={`
                             w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left
                             ${booking.scheduledAt 
                                ? 'border-primary/50 bg-white text-txt-primary shadow-sm' 
                                : 'border-dashed border-gray-300 bg-gray-50 text-txt-muted hover:bg-white hover:border-primary/30'}
                          `}
                       >
                          <div className="flex items-center gap-3">
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center ${booking.scheduledAt ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-txt-muted'}`}>
                                <i className='bx bx-calendar'></i>
                             </div>
                             <div>
                                <div className="text-sm font-medium">
                                   {booking.scheduledAt 
                                      ? new Date(booking.scheduledAt + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) 
                                      : 'Select Date'}
                                </div>
                                <div className="text-xs text-txt-secondary">
                                   {booking.selectedTimeSlot ? formatTime(booking.selectedTimeSlot.start) : 'Select Time'}
                                </div>
                             </div>
                          </div>
                          <i className='bx bx-chevron-right text-xl text-txt-muted'></i>
                       </button>
                    </div>

                    {/* Home Visit Toggle */}
                    <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="homeVisit"
                          checked={booking.isHomeVisit}
                          onCheckedChange={(checked) => {
                            setBooking({ ...booking, isHomeVisit: checked as boolean });
                            if (checked as boolean) {
                              setCurrentStep('homevisit');
                            }
                          }}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Label htmlFor="homeVisit" className="cursor-pointer text-sm font-medium text-txt-primary select-none flex items-center gap-2">
                          <i className='bx bx-map-pin text-lg text-txt-secondary'></i>
                          Home Visit Service
                        </Label>
                      </div>

                      {booking.isHomeVisit && booking.homeVisitAddress && (
                        <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm animate-in slide-in-from-top-2">
                          <div className="flex gap-2 items-start">
                             <i className='bx bx-check-circle text-success mt-0.5'></i>
                             <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-txt-primary truncate">{booking.homeVisitAddress}</p>
                                <p className="text-xs text-txt-muted font-mono mt-0.5">
                                   {booking.homeVisitLat?.toFixed(4)}, {booking.homeVisitLng?.toFixed(4)}
                                </p>
                             </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentStep('homevisit')}
                            className="w-full mt-2 h-7 text-xs text-primary hover:text-primary-dark hover:bg-primary-light"
                          >
                            Change Location
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Panel - Summary & Actions */}
            <div className="flex-1 lg:flex-none lg:w-7/12 flex flex-col overflow-hidden bg-body">
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                
                {/* Order Summary Card */}
                <div className="bg-white rounded-card shadow-card p-5 border border-gray-100">
                   <h5 className="text-sm font-bold text-txt-primary uppercase tracking-wide mb-4 border-b border-gray-100 pb-2">Order Summary</h5>
                   
                   {!selectedService ? (
                      <div className="text-center py-8 text-txt-muted bg-gray-50 rounded-lg border border-dashed border-gray-200">
                         <i className='bx bx-cart-alt text-3xl mb-2 opacity-50'></i>
                         <p className="text-sm">Select a service to view breakdown</p>
                      </div>
                   ) : (
                      <div className="space-y-3">
                          {(() => {
                            const basePrice = Number(selectedService.price);
                            const travelSurcharge = booking.travelCalculation?.surcharge || 0;
                            const subtotal = basePrice + travelSurcharge;
                            const tax = subtotal * ((invoiceSettings?.taxServiceCharge?.taxPercentage || 0) / 100);
                            
                            return (
                              <div className="text-sm space-y-3">
                                <div className="flex justify-between items-center text-txt-secondary">
                                  <span>Service Fee</span>
                                  <span className="font-medium text-txt-primary">IDR {basePrice.toLocaleString('id-ID')}</span>
                                </div>
                                
                                {booking.isHomeVisit && travelSurcharge > 0 && (
                                  <div className="flex justify-between items-center text-txt-secondary">
                                    <span className="flex items-center gap-1">
                                       <i className='bx bx-trip'></i> Travel ({booking.travelCalculation?.distance.toFixed(1)}km)
                                    </span>
                                    <span className="font-medium text-txt-primary">IDR {Number(travelSurcharge).toLocaleString('id-ID')}</span>
                                  </div>
                                )}

                                {tax > 0 && (
                                  <div className="flex justify-between items-center text-txt-secondary">
                                    <span>Tax ({invoiceSettings?.taxServiceCharge?.taxPercentage.toFixed(1)}%)</span>
                                    <span className="font-medium text-txt-primary">IDR {tax.toLocaleString('id-ID')}</span>
                                  </div>
                                )}

                                {invoiceSettings?.taxServiceCharge?.serviceChargeRequired && invoiceSettings?.taxServiceCharge?.serviceChargeValue && (
                                  <div className="flex justify-between items-center text-txt-secondary">
                                    <span>Service Charge</span>
                                    <span className="font-medium text-txt-primary">
                                      {invoiceSettings.taxServiceCharge.serviceChargeType === 'fixed'
                                        ? `IDR ${(invoiceSettings.taxServiceCharge.serviceChargeValue || 0).toLocaleString('id-ID')}`
                                        : `IDR ${(subtotal * ((invoiceSettings.taxServiceCharge.serviceChargeValue || 0) / 100)).toLocaleString('id-ID')}`}
                                    </span>
                                  </div>
                                )}

                                {invoiceSettings?.additionalFees && invoiceSettings.additionalFees.length > 0 && (
                                  invoiceSettings.additionalFees.map(fee => (
                                    <div key={fee.id} className="flex justify-between items-center text-txt-secondary">
                                      <span>{fee.name}</span>
                                      <span className="font-medium text-txt-primary">
                                        {fee.type === 'fixed'
                                          ? `IDR ${fee.value.toLocaleString('id-ID')}`
                                          : `IDR ${(subtotal * (fee.value / 100)).toLocaleString('id-ID')}`}
                                      </span>
                                    </div>
                                  ))
                                )}

                                <div className="border-t border-dashed border-gray-200 pt-3 mt-2 flex justify-between items-center">
                                  <span className="font-bold text-lg text-txt-primary">Total Amount</span>
                                  <span className="font-bold text-lg text-primary">IDR {calculateTotal().toLocaleString('id-ID')}</span>
                                </div>
                              </div>
                            );
                          })()}
                      </div>
                   )}
                </div>

                {/* Payment Method */}
                <div className="bg-white rounded-card shadow-card p-5 border border-gray-100">
                  <h5 className="text-sm font-bold text-txt-primary uppercase tracking-wide mb-4 border-b border-gray-100 pb-2">Payment Method</h5>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                     {[
                        { id: 'cash', label: 'Cash', icon: 'bx-money' },
                        { id: 'card', label: 'Card', icon: 'bx-credit-card' },
                        { id: 'qris', label: 'QRIS', icon: 'bx-qr-scan' },
                        { id: 'transfer', label: 'Transfer', icon: 'bx-transfer' }
                     ].map(method => (
                        <button
                           key={method.id}
                           type="button"
                           onClick={() => setBooking({ ...booking, paymentMethod: method.id })}
                           className={`
                              flex items-center gap-2 justify-center py-2.5 px-3 rounded-md border text-sm font-medium transition-all
                              ${booking.paymentMethod === method.id 
                                 ? 'bg-primary text-white border-primary shadow-md shadow-primary/30' 
                                 : 'bg-white text-txt-secondary border-gray-200 hover:bg-gray-50 hover:border-primary/50'}
                           `}
                        >
                           <i className={`bx ${method.icon} text-lg`}></i>
                           {method.label}
                        </button>
                     ))}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dpAmount" className="text-xs font-semibold text-txt-secondary">Down Payment (Optional)</Label>
                    <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted text-xs">IDR</span>
                       <Input
                         id="dpAmount"
                         type="number"
                         min="0"
                         placeholder="0"
                         value={booking.dpAmount || ''}
                         onChange={(e) => setBooking({ ...booking, dpAmount: parseInt(e.target.value) || 0 })}
                         className="pl-9 h-9 text-sm bg-gray-50 border-transparent focus:bg-white focus:border-primary focus:ring-primary/20"
                       />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-xs font-semibold text-txt-secondary uppercase">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add special requests or notes here..."
                    value={booking.notes}
                    onChange={(e) => setBooking({ ...booking, notes: e.target.value })}
                    rows={3}
                    className="text-sm bg-white border-gray-200 focus:border-primary focus:ring-primary/20 resize-none shadow-sm"
                  />
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-danger px-4 py-3 rounded-lg flex items-start gap-3">
                     <i className='bx bx-error-circle text-xl mt-0.5'></i>
                     <p className="text-sm">{error}</p>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="bg-white border-t border-gray-100 p-4 flex gap-3 justify-end shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)] z-10">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                  className="text-txt-secondary border-gray-300 hover:bg-gray-50 hover:text-txt-primary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }}
                  disabled={submitting || !booking.customerId || !booking.serviceId || !booking.scheduledAt || !booking.selectedTimeSlot}
                  className="bg-primary hover:bg-primary-dark text-white font-semibold shadow-lg shadow-primary/30 min-w-[150px]"
                >
                  {submitting ? (
                     <><i className='bx bx-loader-alt bx-spin mr-2'></i> Processing</>
                  ) : (
                     <><i className='bx bx-check mr-2'></i> Create Booking</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Date & Time Step Modal */}
      <Dialog open={currentStep !== 'main'} onOpenChange={(open) => !open && setCurrentStep('main')}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden flex flex-col p-0 [&>button]:hidden rounded-card shadow-lg border-0">
          <DialogTitle className="sr-only">{currentStep === 'date' ? 'Select Date' : 'Select Time'}</DialogTitle>
          
          <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h4 className="text-lg font-bold text-txt-primary">
                {currentStep === 'date' ? 'Select Date' : 'Select Time'}
              </h4>
              <p className="text-xs text-txt-secondary mt-0.5">
                {currentStep === 'date' ? 'Choose your preferred appointment date' : 'Available slots for the selected date'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentStep('main')}
              className="text-txt-muted hover:bg-gray-100 hover:text-txt-primary rounded-full"
            >
              <i className='bx bx-x text-2xl'></i>
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-white">
            {currentStep === 'date' && (
              <div className="flex justify-center">
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
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-sm font-medium text-primary bg-primary-light/30 p-3 rounded-md border border-primary-light">
                  <i className='bx bx-calendar-check text-lg'></i>
                  Selected Date: {new Date(booking.scheduledAt + 'T00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                
                {availableSlots.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <i className='bx bx-time-five text-4xl text-txt-muted mb-3'></i>
                    <p className="text-sm text-txt-secondary">No available time slots for this date.</p>
                    <Button variant="link" onClick={() => setCurrentStep('date')} className="text-primary mt-2">Pick another date</Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(() => {
                      const { morning, afternoon, evening } = groupSlotsByPeriod(availableSlots);
                      
                      return (
                        <>
                          {morning.length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold text-txt-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                                 <i className='bx bx-sun'></i> Morning
                              </h4>
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {morning.map((slot, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      setBooking({ ...booking, selectedTimeSlot: slot });
                                      setCurrentStep('main');
                                    }}
                                    className={`
                                       py-2 px-1 rounded-md text-sm font-medium border transition-all
                                       ${booking.selectedTimeSlot?.start.getTime() === slot.start.getTime() 
                                          ? 'bg-primary text-white border-primary shadow-md' 
                                          : 'bg-white text-txt-primary border-gray-200 hover:border-primary hover:text-primary'}
                                    `}
                                  >
                                    {formatTime(slot.start)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {afternoon.length > 0 && (
                            <div>
                               <h4 className="text-xs font-bold text-txt-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                                 <i className='bx bx-sun text-warning'></i> Afternoon
                              </h4>
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {afternoon.map((slot, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      setBooking({ ...booking, selectedTimeSlot: slot });
                                      setCurrentStep('main');
                                    }}
                                    className={`
                                       py-2 px-1 rounded-md text-sm font-medium border transition-all
                                       ${booking.selectedTimeSlot?.start.getTime() === slot.start.getTime() 
                                          ? 'bg-primary text-white border-primary shadow-md' 
                                          : 'bg-white text-txt-primary border-gray-200 hover:border-primary hover:text-primary'}
                                    `}
                                  >
                                    {formatTime(slot.start)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {evening.length > 0 && (
                            <div>
                               <h4 className="text-xs font-bold text-txt-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                                 <i className='bx bx-moon text-primary-dark'></i> Evening
                              </h4>
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {evening.map((slot, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      setBooking({ ...booking, selectedTimeSlot: slot });
                                      setCurrentStep('main');
                                    }}
                                    className={`
                                       py-2 px-1 rounded-md text-sm font-medium border transition-all
                                       ${booking.selectedTimeSlot?.start.getTime() === slot.start.getTime() 
                                          ? 'bg-primary text-white border-primary shadow-md' 
                                          : 'bg-white text-txt-primary border-gray-200 hover:border-primary hover:text-primary'}
                                    `}
                                  >
                                    {formatTime(slot.start)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                <div className="flex gap-3 justify-between pt-6 border-t border-gray-100 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('date')}
                    className="text-txt-secondary"
                  >
                    <i className='bx bx-arrow-back mr-1'></i> Back to Date
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentStep('main')}
                    className="text-txt-muted"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    {/* Home Visit Modal */}
    <Dialog open={currentStep === 'homevisit'} onOpenChange={(open) => !open && setCurrentStep('main')}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden flex flex-col p-0 [&>button]:hidden rounded-card shadow-lg border-0">
        <DialogTitle className="sr-only">Home Visit Address</DialogTitle>
        
        <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h4 className="text-lg font-bold text-txt-primary">Home Visit Address</h4>
            <p className="text-xs text-txt-secondary mt-0.5">Enter customer location for travel calculation</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentStep('main')}
            className="text-txt-muted hover:bg-gray-100 hover:text-txt-primary rounded-full"
          >
             <i className='bx bx-x text-2xl'></i>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          <HomeVisitAddressSelector
            address={booking.homeVisitAddress}
            latitude={booking.homeVisitLat}
            longitude={booking.homeVisitLng}
            tenantId={subdomain}
            onAddressChange={(addr) => setBooking({ ...booking, homeVisitAddress: addr })}
            onCoordinatesChange={(lat, lng) => setBooking({ ...booking, homeVisitLat: lat, homeVisitLng: lng })}
          />

          {booking.homeVisitAddress && typeof booking.homeVisitLat === 'number' && typeof booking.homeVisitLng === 'number' && businessCoordinates && (
            <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="font-bold text-sm text-txt-primary">Travel Estimate</h3>
              <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
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
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 p-4 flex gap-3 justify-end bg-gray-50">
          <Button
            variant="outline"
            onClick={() => setCurrentStep('main')}
            className="text-txt-secondary bg-white border-gray-300"
          >
            Cancel
          </Button>
          <Button
            onClick={() => setCurrentStep('main')}
            disabled={booking.isHomeVisit && !booking.homeVisitAddress}
            className="bg-primary hover:bg-primary-dark text-white shadow-md shadow-primary/30"
          >
            Confirm Location
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
