'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Customer, Service, TimeSlot } from '@/types/booking';
import type { InvoiceSettingsData } from '@/lib/invoice/invoice-settings-service';
import { TravelCalculation } from '@/types/location';
import { toast } from 'sonner';
import { addToOfflineQueue } from '@/lib/offline/queue';
import { addToStore, getByIndex, CachedData } from '@/lib/offline/db';
import { CustomerSelector } from './CustomerSelector';
import { ServiceSelector } from './ServiceSelector';
import { ScheduleSection } from './ScheduleSection';
import { HomeVisitSection } from './HomeVisitSection';
import { OrderSummary } from './OrderSummary';
import { PaymentMethodSection } from './PaymentMethodSection';
import { NotesSection } from './NotesSection';
import { DateTimeModal } from './DateTimeModal';
import { HomeVisitModal } from './HomeVisitModal';

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

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettingsData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessCoordinates, setBusinessCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [blockedDates, setBlockedDates] = useState<Map<string, string>>(new Map());
  const [currentStep, setCurrentStep] = useState<'main' | 'date' | 'time' | 'homevisit'>('main');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [tenantId, setTenantId] = useState<string>('');
  const [homeVisitSnapshot, setHomeVisitSnapshot] = useState<{
    address: string;
    lat?: number;
    lng?: number;
    travelCalculation?: TravelCalculation;
  } | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, subdomain]);

  const fetchData = async () => {
    if (!subdomain) return;

    // Try to load from cache first (for offline support)
    const loadFromCache = async () => {
      try {
        const cachedCustomers = await getByIndex<CachedData>('cachedData', 'type', 'customers');
        const cachedServices = await getByIndex<CachedData>('cachedData', 'type', 'services');
        
        const customerCache = cachedCustomers.find(c => c.id === `customers_${subdomain}`);
        const serviceCache = cachedServices.find(c => c.id === `services_${subdomain}`);
        
        if (customerCache?.data) setCustomers(customerCache.data);
        if (serviceCache?.data) setServices(serviceCache.data);
        
        return (customerCache?.data?.length ?? 0) > 0 || (serviceCache?.data?.length ?? 0) > 0;
      } catch {
        return false;
      }
    };

    // If offline, only use cache
    if (!navigator.onLine) {
      const hasCached = await loadFromCache();
      if (!hasCached) {
        setError('Offline: No cached data available');
      }
      setLoading(false);
      return;
    }

    try {
      const [customersRes, servicesRes, settingsRes, blockedDatesRes, tenantRes] = await Promise.all([
        fetch('/api/customers?limit=50', { headers: { 'x-tenant-id': subdomain } }),
        fetch('/api/services?limit=50', { headers: { 'x-tenant-id': subdomain } }),
        fetch(`/api/settings/invoice-config?tenantId=${subdomain}`, { headers: { 'x-tenant-id': subdomain } }),
        fetch(`/api/bookings/blocked-dates?tenantId=${subdomain}`),
        fetch(`/api/tenants/${subdomain}`)
      ]);

      if (customersRes.ok) {
        const data = await customersRes.json();
        const customerList = data.customers || [];
        setCustomers(customerList);
        // Cache for offline use
        await addToStore<CachedData>('cachedData', {
          id: `customers_${subdomain}`,
          type: 'customers',
          tenantId: subdomain,
          data: customerList,
          updatedAt: Date.now(),
        });
      }

      if (servicesRes.ok) {
        const data = await servicesRes.json();
        const serviceList = data.services || [];
        setServices(serviceList);
        // Cache for offline use
        await addToStore<CachedData>('cachedData', {
          id: `services_${subdomain}`,
          type: 'services',
          tenantId: subdomain,
          data: serviceList,
          updatedAt: Date.now(),
        });
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

      if (tenantRes.ok) {
        const data = await tenantRes.json();
        setTenantId(data.id || subdomain);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      // Try to load from cache on network error
      const hasCached = await loadFromCache();
      if (!hasCached) {
        setError('Failed to load data. Please check your connection.');
      }
    } finally {
      setLoading(false);
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

      const requestBody: any = {
        customerId: booking.customerId,
        serviceId: booking.serviceId,
        scheduledAt,
        isHomeVisit: booking.isHomeVisit,
        paymentMethod: booking.paymentMethod,
        dpAmount: booking.dpAmount,
        // Include customer and service names for offline display
        customerName: selectedCustomer?.name || '',
        serviceName: selectedService?.name || '',
      };

      // Only add optional fields if they have values
      if (booking.notes) {
        requestBody.notes = booking.notes;
      }

      if (booking.isHomeVisit) {
        if (booking.homeVisitAddress) {
          requestBody.homeVisitAddress = booking.homeVisitAddress;
        }
        if (isFinite(Number(booking.homeVisitLat)) && isFinite(Number(booking.homeVisitLng))) {
          requestBody.homeVisitCoordinates = {
            lat: Number(booking.homeVisitLat),
            lng: Number(booking.homeVisitLng)
          };
        }
        if (booking.travelCalculation) {
          if (isFinite(booking.travelCalculation.distance)) {
            requestBody.travelDistance = booking.travelCalculation.distance;
          }
          if (isFinite(booking.travelCalculation.duration)) {
            requestBody.travelDuration = booking.travelCalculation.duration;
          }
          if (isFinite(booking.travelCalculation.surcharge)) {
            requestBody.travelSurchargeAmount = booking.travelCalculation.surcharge;
          }
        }
      }

      console.log('[NewBookingPOS] Sending request:', requestBody);

      // Try online first
      if (navigator.onLine) {
        try {
          const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-tenant-id': subdomain
            },
            body: JSON.stringify(requestBody)
          });

          const data = await response.json();
          console.log('[NewBookingPOS] Response:', response.status, data);
          
          if (response.ok) {
            resetBookingForm();
            toast.success('Booking created successfully');
            onOpenChange(false);
            onBookingCreated?.();
            return;
          }
          
          // Log validation errors
          if (data.details) {
            console.error('[NewBookingPOS] Validation errors:', data.details);
          }
          throw new Error(data.error || 'Failed to create booking');
        } catch (err) {
          // If network error, fall through to offline mode
          if (err instanceof TypeError && err.message.includes('fetch')) {
            console.log('[NewBookingPOS] Network error, saving offline');
          } else {
            throw err;
          }
        }
      }

      // Save offline
      const offlineId = await addToOfflineQueue(
        'booking',
        'create',
        requestBody,
        tenantId || subdomain,
        subdomain
      );

      console.log('[NewBookingPOS] Saved offline with ID:', offlineId);
      resetBookingForm();
      toast.success('Booking saved offline. Will sync when connected.', {
        icon: '📴',
        duration: 4000,
      });
      onOpenChange(false);
      onBookingCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const resetBookingForm = () => {
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
  };

  const fetchAvailableSlots = async () => {
    if (!booking.serviceId || !booking.scheduledAt || !subdomain) return;
    try {
      // Use simplified home visit endpoint if home visit is selected
      const endpoint = booking.isHomeVisit
        ? `/api/bookings/home-visit-availability?serviceId=${booking.serviceId}&date=${booking.scheduledAt}`
        : `/api/bookings/availability?serviceId=${booking.serviceId}&date=${booking.scheduledAt}`;
      
      const response = await fetch(endpoint, { headers: { 'x-tenant-id': subdomain } });
      if (response.ok) {
        const data = await response.json();
        
        // Handle home visit response format
        if (booking.isHomeVisit && data.slots) {
          const slots = data.slots
            .filter((slot: any) => slot.available)
            .map((slot: any) => ({
              start: new Date(slot.start),
              end: new Date(slot.end),
              available: slot.available,
              time: slot.time
            }));
          setAvailableSlots(slots);
        } else {
          // Standard availability response
          const slots = (data.slots || []).map((slot: any) => ({
            ...slot,
            start: typeof slot.start === 'string' ? new Date(slot.start) : slot.start,
            end: typeof slot.end === 'string' ? new Date(slot.end) : slot.end
          }));
          setAvailableSlots(slots);
        }
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
    }
  };

  // Fetch slots when date or home visit status changes
  React.useEffect(() => {
    if (currentStep === 'time' && booking.scheduledAt) {
      fetchAvailableSlots();
    }
  }, [booking.scheduledAt, booking.serviceId, booking.isHomeVisit, currentStep]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl h-[95vh] p-0 overflow-hidden [&>button]:hidden w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[95vw] bg-body rounded-lg shadow-lg border-0">
          <DialogTitle className="sr-only">New Booking</DialogTitle>
          <DialogDescription className="sr-only">Schedule service for customer</DialogDescription>
          
          <div className="flex flex-col h-full bg-white overflow-hidden rounded-lg">
            {/* Header */}
            <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
              <div className="min-w-0">
                <h4 className="text-lg sm:text-xl font-bold text-txt-primary">New Booking</h4>
                <p className="text-txt-secondary text-xs sm:text-sm hidden sm:block">Create a new appointment</p>
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

            {/* Main Content - Single scroll on mobile/tablet, split on desktop */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col lg:flex-row">
              
              {/* Mobile/Tablet: Single scrollable area - Visible up to lg breakpoint */}
              <div className="flex-1 overflow-y-auto lg:hidden">
                <div className="p-4 space-y-4 pb-24"> {/* Added extra padding bottom for safe scrolling above footer */}
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-txt-muted">
                      <i className='bx bx-loader-lines bx-spin text-3xl mb-2'></i>
                      <span className="text-sm">Loading resources...</span>
                    </div>
                  ) : (
                    <>
                      <CustomerSelector
                        customers={customers}
                        selectedCustomerId={booking.customerId}
                        onCustomerSelect={(id) => setBooking(prev => ({ ...prev, customerId: id }))}
                        subdomain={subdomain}
                        onCustomerCreated={(customer) => setCustomers([...customers, customer])}
                      />

                      <ServiceSelector
                        services={services}
                        selectedServiceId={booking.serviceId}
                        onServiceSelect={(id) => setBooking(prev => ({ ...prev, serviceId: id }))}
                      />

                      <ScheduleSection
                        scheduledAt={booking.scheduledAt}
                        selectedTimeSlot={booking.selectedTimeSlot}
                        onOpenDateTimePicker={() => setCurrentStep('date')}
                      />

                      <HomeVisitSection
                        isHomeVisit={booking.isHomeVisit}
                        onHomeVisitChange={(checked) => {
                          setBooking(prev => ({ ...prev, isHomeVisit: checked }));
                          if (checked) {
                            setHomeVisitSnapshot({
                              address: booking.homeVisitAddress,
                              lat: booking.homeVisitLat,
                              lng: booking.homeVisitLng,
                              travelCalculation: booking.travelCalculation
                            });
                            setCurrentStep('homevisit');
                          }
                        }}
                        homeVisitAddress={booking.homeVisitAddress}
                        homeVisitLat={booking.homeVisitLat}
                        homeVisitLng={booking.homeVisitLng}
                        onOpenHomeVisitModal={() => {
                          setHomeVisitSnapshot({
                            address: booking.homeVisitAddress,
                            lat: booking.homeVisitLat,
                            lng: booking.homeVisitLng,
                            travelCalculation: booking.travelCalculation
                          });
                          setCurrentStep('homevisit');
                        }}
                      />

                      <div className="border-t border-gray-100 pt-4 mt-4">
                        <OrderSummary
                          selectedService={selectedService}
                          booking={booking}
                          invoiceSettings={invoiceSettings}
                        />
                      </div>

                      <PaymentMethodSection
                        paymentMethod={booking.paymentMethod}
                        dpAmount={booking.dpAmount}
                        onPaymentMethodChange={(method) => setBooking(prev => ({ ...prev, paymentMethod: method }))}
                        onDpAmountChange={(amount) => setBooking(prev => ({ ...prev, dpAmount: amount }))}
                      />

                      <NotesSection
                        notes={booking.notes}
                        onNotesChange={(notes) => setBooking(prev => ({ ...prev, notes }))}
                        error={error}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Desktop: Left Panel - Selection Inputs */}
              <div className="hidden lg:flex lg:w-5/12 flex-col overflow-hidden border-r border-gray-100 bg-white">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-txt-muted">
                      <i className='bx bx-loader-lines bx-spin text-3xl mb-2'></i>
                      <span className="text-sm">Loading resources...</span>
                    </div>
                  ) : (
                    <>
                      <CustomerSelector
                        customers={customers}
                        selectedCustomerId={booking.customerId}
                        onCustomerSelect={(id) => setBooking(prev => ({ ...prev, customerId: id }))}
                        subdomain={subdomain}
                        onCustomerCreated={(customer) => setCustomers([...customers, customer])}
                      />

                      <ServiceSelector
                        services={services}
                        selectedServiceId={booking.serviceId}
                        onServiceSelect={(id) => setBooking(prev => ({ ...prev, serviceId: id }))}
                      />

                      <ScheduleSection
                        scheduledAt={booking.scheduledAt}
                        selectedTimeSlot={booking.selectedTimeSlot}
                        onOpenDateTimePicker={() => setCurrentStep('date')}
                      />

                      <HomeVisitSection
                        isHomeVisit={booking.isHomeVisit}
                        onHomeVisitChange={(checked) => {
                          setBooking(prev => ({ ...prev, isHomeVisit: checked }));
                          if (checked) {
                            setHomeVisitSnapshot({
                              address: booking.homeVisitAddress,
                              lat: booking.homeVisitLat,
                              lng: booking.homeVisitLng,
                              travelCalculation: booking.travelCalculation
                            });
                            setCurrentStep('homevisit');
                          }
                        }}
                        homeVisitAddress={booking.homeVisitAddress}
                        homeVisitLat={booking.homeVisitLat}
                        homeVisitLng={booking.homeVisitLng}
                        onOpenHomeVisitModal={() => {
                          setHomeVisitSnapshot({
                            address: booking.homeVisitAddress,
                            lat: booking.homeVisitLat,
                            lng: booking.homeVisitLng,
                            travelCalculation: booking.travelCalculation
                          });
                          setCurrentStep('homevisit');
                        }}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Desktop: Right Panel - Summary & Actions */}
              <div className="hidden lg:flex lg:w-7/12 flex-col overflow-hidden bg-body">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  <OrderSummary
                    selectedService={selectedService}
                    booking={booking}
                    invoiceSettings={invoiceSettings}
                  />

                  <PaymentMethodSection
                    paymentMethod={booking.paymentMethod}
                    dpAmount={booking.dpAmount}
                    onPaymentMethodChange={(method) => setBooking(prev => ({ ...prev, paymentMethod: method }))}
                    onDpAmountChange={(amount) => setBooking(prev => ({ ...prev, dpAmount: amount }))}
                  />

                  <NotesSection
                    notes={booking.notes}
                    onNotesChange={(notes) => setBooking(prev => ({ ...prev, notes }))}
                    error={error}
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions - Sticky bottom on mobile/tablet, normal flex on desktop */}
            <div className="bg-white border-t border-gray-100 p-3 sm:p-4 flex gap-2 sm:gap-3 justify-end shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)] z-10 flex-shrink-0 fixed bottom-0 left-0 right-0 lg:static w-full lg:w-auto">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
                className="text-txt-secondary border-gray-300 hover:bg-gray-50 hover:text-txt-primary text-sm sm:text-base flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit(e as any);
                }}
                disabled={submitting || !booking.customerId || !booking.serviceId || !booking.scheduledAt || !booking.selectedTimeSlot}
                className="bg-primary hover:bg-primary-dark text-white font-semibold shadow-lg shadow-primary/30 min-w-[120px] sm:min-w-[150px] text-sm sm:text-base flex-1 sm:flex-none"
              >
                {submitting ? (
                  <><i className='bx bx-loader-lines bx-spin mr-2'></i> Processing</>
                ) : (
                  <><i className='bx bx-check mr-2'></i> Create Booking</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <DateTimeModal
        open={currentStep === 'date' || currentStep === 'time'}
        onOpenChange={(open) => {
          if (!open) {
            setCurrentStep('main');
          }
        }}
        currentStep={currentStep as 'date' | 'time'}
        onStepChange={setCurrentStep}
        selectedDate={booking.scheduledAt}
        onDateSelect={(date) => setBooking(prev => ({ ...prev, scheduledAt: date, selectedTimeSlot: undefined }))}
        selectedTimeSlot={booking.selectedTimeSlot}
        onTimeSlotSelect={(slot) => setBooking(prev => ({ ...prev, selectedTimeSlot: slot }))}
        availableSlots={availableSlots}
        blockedDates={blockedDates}
        serviceId={booking.serviceId}
        subdomain={subdomain}
      />

      <HomeVisitModal
        open={currentStep === 'homevisit'}
        onOpenChange={(open) => {
          if (!open) {
            setCurrentStep('main');
          }
        }}
        address={booking.homeVisitAddress}
        onAddressChange={(addr) => setBooking(prev => ({ ...prev, homeVisitAddress: addr }))}
        latitude={booking.homeVisitLat}
        longitude={booking.homeVisitLng}
        onCoordinatesChange={(lat, lng) => setBooking(prev => ({ ...prev, homeVisitLat: lat, homeVisitLng: lng }))}
        isHomeVisit={booking.isHomeVisit}
        businessCoordinates={businessCoordinates}
        serviceId={booking.serviceId}
        subdomain={subdomain}
        onTravelCalculationChange={(calc) => setBooking(prev => ({ ...prev, travelCalculation: calc }))}
        onCancel={() => {
          if (homeVisitSnapshot) {
            setBooking(prev => ({
              ...prev,
              homeVisitAddress: homeVisitSnapshot.address,
              homeVisitLat: homeVisitSnapshot.lat,
              homeVisitLng: homeVisitSnapshot.lng,
              travelCalculation: homeVisitSnapshot.travelCalculation
            }));
          }
          setHomeVisitSnapshot(null);
        }}
        onConfirm={() => {
          setHomeVisitSnapshot(null);
        }}
      />
    </>
  );
}
