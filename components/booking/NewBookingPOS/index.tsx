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

  // Fetch slots when date changes
  React.useEffect(() => {
    if (currentStep === 'time' && booking.scheduledAt) {
      fetchAvailableSlots();
    }
  }, [booking.scheduledAt, booking.serviceId, currentStep]);

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
                      <i className='bx bx-loader-lines bx-spin text-3xl mb-2'></i>
                      <span className="text-sm">Loading resources...</span>
                    </div>
                  ) : (
                    <>
                      <CustomerSelector
                        customers={customers}
                        selectedCustomerId={booking.customerId}
                        onCustomerSelect={(id) => setBooking({ ...booking, customerId: id })}
                        subdomain={subdomain}
                        onCustomerCreated={(customer) => setCustomers([...customers, customer])}
                      />

                      <ServiceSelector
                        services={services}
                        selectedServiceId={booking.serviceId}
                        onServiceSelect={(id) => setBooking({ ...booking, serviceId: id })}
                      />

                      <ScheduleSection
                        scheduledAt={booking.scheduledAt}
                        selectedTimeSlot={booking.selectedTimeSlot}
                        onOpenDateTimePicker={() => setCurrentStep('date')}
                      />

                      <HomeVisitSection
                        isHomeVisit={booking.isHomeVisit}
                        onHomeVisitChange={(checked) => {
                          setBooking({ ...booking, isHomeVisit: checked });
                          if (checked) {
                            setCurrentStep('homevisit');
                          }
                        }}
                        homeVisitAddress={booking.homeVisitAddress}
                        homeVisitLat={booking.homeVisitLat}
                        homeVisitLng={booking.homeVisitLng}
                        onOpenHomeVisitModal={() => setCurrentStep('homevisit')}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Right Panel - Summary & Actions */}
              <div className="flex-1 lg:flex-none lg:w-7/12 flex flex-col overflow-hidden bg-body">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  <OrderSummary
                    selectedService={selectedService}
                    booking={booking}
                    invoiceSettings={invoiceSettings}
                  />

                  <PaymentMethodSection
                    paymentMethod={booking.paymentMethod}
                    dpAmount={booking.dpAmount}
                    onPaymentMethodChange={(method) => setBooking({ ...booking, paymentMethod: method })}
                    onDpAmountChange={(amount) => setBooking({ ...booking, dpAmount: amount })}
                  />

                  <NotesSection
                    notes={booking.notes}
                    onNotesChange={(notes) => setBooking({ ...booking, notes })}
                    error={error}
                  />
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
                      <><i className='bx bx-loader-lines bx-spin mr-2'></i> Processing</>
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

      {/* Modals */}
      <DateTimeModal
        open={currentStep !== 'main'}
        onOpenChange={(open) => {
          if (!open) {
            setCurrentStep('main');
          }
        }}
        currentStep={currentStep as 'date' | 'time'}
        onStepChange={setCurrentStep}
        selectedDate={booking.scheduledAt}
        onDateSelect={(date) => setBooking({ ...booking, scheduledAt: date, selectedTimeSlot: undefined })}
        selectedTimeSlot={booking.selectedTimeSlot}
        onTimeSlotSelect={(slot) => setBooking({ ...booking, selectedTimeSlot: slot })}
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
        onAddressChange={(addr) => setBooking({ ...booking, homeVisitAddress: addr })}
        latitude={booking.homeVisitLat}
        longitude={booking.homeVisitLng}
        onCoordinatesChange={(lat, lng) => setBooking({ ...booking, homeVisitLat: lat, homeVisitLng: lng })}
        isHomeVisit={booking.isHomeVisit}
        businessCoordinates={businessCoordinates}
        serviceId={booking.serviceId}
        subdomain={subdomain}
        onTravelCalculationChange={(calc) => setBooking({ ...booking, travelCalculation: calc })}
      />
    </>
  );
}
