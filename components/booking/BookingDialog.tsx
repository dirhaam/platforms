'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, MapPin, User, Phone, Mail, MessageSquare } from 'lucide-react';
import { HomeVisitAddressSelector } from '@/components/location/HomeVisitAddressSelector';
import { PricingCalculator } from '@/components/booking/PricingCalculator';
import { Address } from '@/types/location';
import { Service } from '@/types/booking';
import type { InvoiceSettingsData } from '@/lib/invoice/invoice-settings-service';

interface TenantData {
  id: string;
  subdomain: string;
  businessName: string;
  phone: string;
  email: string;
  address?: string;
}

interface BookingDialogProps {
  service?: Service;
  tenant: TenantData;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface BookingFormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  preferredDate: string;
  preferredTime: string;
  isHomeVisit: boolean;
  homeVisitAddress: string;
  homeVisitCoordinates?: { lat: number; lng: number };
  homeVisitLat?: number;
  homeVisitLng?: number;
  notes: string;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'qris';
  dpAmount?: number;
}

export default function BookingDialog({ 
  service, 
  tenant, 
  trigger,
  isOpen,
  onOpenChange 
}: BookingDialogProps) {
  // Guard against missing tenant
  if (!tenant || !tenant.id) {
    console.error('BookingDialog: Missing tenant data', { tenant });
    return null;
  }

  // Determine initial step based on whether service is passed
  const hasInitialService = !!service && service.id;
  const initialStep: 'service' | 'details' | 'confirmation' = hasInitialService ? 'details' : 'service';
  
  const [step, setStep] = useState<'service' | 'details' | 'confirmation'>(initialStep);
  const [selectedService, setSelectedService] = useState<Service | undefined>(service);
  const [formData, setFormData] = useState<BookingFormData>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    preferredDate: '',
    preferredTime: '',
    isHomeVisit: false,
    homeVisitAddress: '',
    homeVisitCoordinates: undefined,
    notes: '',
    paymentMethod: 'cash',
    dpAmount: 0,
  });
  const [calculatedPrice, setCalculatedPrice] = useState<number>(selectedService ? Number(selectedService.price) : 0);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [businessCoordinates, setBusinessCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch invoice settings on mount
  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`/api/settings/invoice-config?tenantId=${tenant.id}`);
        if (!response.ok) {
          console.warn('[BookingDialog] Failed to fetch invoice settings:', response.status);
          return;
        }
        const data = await response.json();
        console.log('[BookingDialog] Invoice settings loaded:', data.settings);
        setInvoiceSettings(data.settings || null);
        // Get business coordinates for travel calculation
        if (data.settings?.branding?.businessLatitude && data.settings?.branding?.businessLongitude) {
          setBusinessCoordinates({
            lat: data.settings.branding.businessLatitude,
            lng: data.settings.branding.businessLongitude
          });
        }
      } catch (error) {
        console.warn('[BookingDialog] Error fetching invoice settings:', error);
      }
    };
    
    if (tenant?.id) {
      console.log('[BookingDialog] Fetching invoice settings for tenant:', tenant.id);
      fetchSettings();
    }
  }, [tenant?.id]);

  // Sync selectedService with props when service changes
  React.useEffect(() => {
    if (service && service.id) {
      // First set the service from props
      setSelectedService(service);
      setCalculatedPrice(Number(service.price));
      console.log('[BookingDialog] Service updated from props:', { 
        id: service.id, 
        name: service.name,
        homeVisitAvailable: service.homeVisitAvailable,
        homeVisitSurcharge: service.homeVisitSurcharge
      });

      // Then fetch latest service details from API to ensure we have current settings
      const fetchLatestService = async () => {
        try {
          const response = await fetch(`/api/services/${service.id}`, {
            headers: { 'x-tenant-id': tenant.id }
          });
          if (response.ok) {
            const data = await response.json();
            const updatedService = data.service || data;
            setSelectedService(updatedService);
            console.log('[BookingDialog] Service refreshed from API:', { 
              id: updatedService.id, 
              homeVisitAvailable: updatedService.homeVisitAvailable,
              homeVisitSurcharge: updatedService.homeVisitSurcharge
            });
          }
        } catch (error) {
          console.warn('[BookingDialog] Failed to refresh service details:', error);
        }
      };

      fetchLatestService();
    }
  }, [service?.id, tenant.id]);

  // Sync step based on whether service is selected and dialog is open
  React.useEffect(() => {
    if (isOpen) {
      if (selectedService && selectedService.id) {
        // If dialog is open and service is selected, go to details
        setStep('details');
        console.log('[BookingDialog] Dialog opened with service, jumping to details step');
      } else {
        // If dialog is open but no service, stay at service selection
        setStep('service');
        console.log('[BookingDialog] Dialog opened without service, showing service selection');
      }
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof BookingFormData, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateTotal = () => {
    if (!selectedService) return 0;
    
    let subtotal = Number(selectedService.price);
    // Travel surcharge is calculated by PricingCalculator based on distance
    // Not added here - it's included in PricingCalculator
    
    let total = subtotal;
    
    // Add tax
    if (invoiceSettings?.taxServiceCharge?.taxPercentage) {
      total += subtotal * (invoiceSettings.taxServiceCharge.taxPercentage / 100);
    }
    
    // Add service charge
    if (invoiceSettings?.taxServiceCharge?.serviceChargeRequired && invoiceSettings?.taxServiceCharge?.serviceChargeValue) {
      if (invoiceSettings.taxServiceCharge.serviceChargeType === 'fixed') {
        total += invoiceSettings.taxServiceCharge.serviceChargeValue;
      } else {
        total += subtotal * (invoiceSettings.taxServiceCharge.serviceChargeValue / 100);
      }
    }
    
    // Add additional fees
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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.customerName.trim()) errors.customerName = 'Name is required';
    if (!formData.customerPhone.trim()) errors.customerPhone = 'Phone is required';
    if (formData.customerPhone.trim().length < 10) errors.customerPhone = 'Phone must be at least 10 digits';
    if (formData.customerEmail && !formData.customerEmail.includes('@')) {
      errors.customerEmail = 'Invalid email format';
    }
    if (!formData.preferredDate) errors.preferredDate = 'Date is required';
    if (!formData.preferredTime) errors.preferredTime = 'Time is required';
    if (formData.isHomeVisit && !formData.homeVisitAddress.trim()) {
      errors.homeVisitAddress = 'Address is required for home visit';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      setValidationErrors({});
      
      if (!validateForm()) {
        return;
      }

      if (!selectedService) {
        setError('Please select a service');
        return;
      }

      if (!tenant.subdomain) {
        setError('Tenant subdomain is missing');
        return;
      }

      setIsLoading(true);

      // Combine date and time to create ISO datetime
      const [year, month, day] = formData.preferredDate.split('-');
      const [hour, minute] = formData.preferredTime.split(':');
      const scheduledAt = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute)
      );

      // Step 1: Find or create customer
      let customerId: string;
      try {
        const customerPayload = {
          name: formData.customerName.trim(),
          phone: formData.customerPhone.trim(),
          ...(formData.customerEmail ? { email: formData.customerEmail.trim() } : {}),
          ...(formData.homeVisitAddress ? { address: formData.homeVisitAddress.trim() } : {}),
        };

        console.log('[BookingDialog] Customer payload:', customerPayload);

        const findRes = await fetch(
          `/api/customers/find-or-create?subdomain=${tenant.subdomain}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customerPayload),
          }
        );

        if (!findRes.ok) {
          const errData = await findRes.json();
          console.error('[BookingDialog] Customer API error:', { status: findRes.status, error: errData });
          throw new Error(errData.error || `Failed to create/find customer (${findRes.status})`);
        }

        const findData = await findRes.json();
        console.log('[BookingDialog] Customer found/created:', findData);
        
        if (!findData.customer || !findData.customer.id) {
          throw new Error('Invalid customer response from API');
        }

        customerId = findData.customer.id;
        console.log('[BookingDialog] Using customer ID:', customerId);
      } catch (err) {
        setError(`Customer creation failed: ${err instanceof Error ? err.message : String(err)}`);
        setIsLoading(false);
        return;
      }

      // Step 2: Create booking
      const totalAmount = formData.isHomeVisit 
        ? Number(selectedService.price) + Number(selectedService.homeVisitSurcharge || 0)
        : Number(selectedService.price);

      const bookingPayload = {
        customerId,
        serviceId: selectedService.id,
        scheduledAt: scheduledAt.toISOString(),
        isHomeVisit: formData.isHomeVisit,
        paymentMethod: formData.paymentMethod || 'cash',
        dpAmount: formData.dpAmount || 0,
        ...(formData.isHomeVisit && formData.homeVisitAddress ? { homeVisitAddress: formData.homeVisitAddress.trim() } : {}),
        ...(formData.isHomeVisit && isFinite(Number(formData.homeVisitLat)) && isFinite(Number(formData.homeVisitLng))
          ? { homeVisitCoordinates: { lat: Number(formData.homeVisitLat), lng: Number(formData.homeVisitLng) } }
          : {}),
        ...(formData.notes ? { notes: formData.notes.trim() } : {}),
      };

      console.log('[BookingDialog] Booking payload:', bookingPayload);

      const bookingRes = await fetch(
        `/api/bookings?subdomain=${tenant.subdomain}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingPayload),
        }
      );

      if (!bookingRes.ok) {
        const errData = await bookingRes.json();
        console.error('[BookingDialog] Booking API error:', { 
          status: bookingRes.status, 
          error: errData.error,
          details: errData.details || []
        });
        
        // Show validation errors with details
        if (errData.details && Array.isArray(errData.details)) {
          const detailsText = errData.details.map((d: any) => `${d.path?.join('.') || 'field'}: ${d.message}`).join(', ');
          throw new Error(`${errData.error} - ${detailsText}`);
        }
        throw new Error(errData.error || `Failed to create booking (${bookingRes.status})`);
      }

      const { booking } = await bookingRes.json();
      console.log('Booking created successfully:', booking);
      
      setStep('confirmation');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Booking error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep('service');
    setFormData({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      preferredDate: '',
      preferredTime: '',
      isHomeVisit: false,
      homeVisitAddress: '',
      homeVisitLat: undefined,
      homeVisitLng: undefined,
      homeVisitCoordinates: undefined,
      notes: '',
      paymentMethod: 'cash',
      dpAmount: 0,
    });
    setCalculatedPrice(selectedService ? Number(selectedService.price) : 0);
  };

  const defaultTrigger = (
    <Button className="w-full">
      Book Appointment
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'service' && 'Select Service'}
            {step === 'details' && 'Booking Details'}
            {step === 'confirmation' && 'Booking Confirmation'}
          </DialogTitle>
          <DialogDescription>
            {step === 'service' && 'Choose the service you would like to book'}
            {step === 'details' && 'Please provide your details and preferences'}
            {step === 'confirmation' && 'Your booking request has been submitted'}
          </DialogDescription>
        </DialogHeader>

        {step === 'service' && (
          <div className="space-y-4">
            {selectedService ? (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{selectedService.name}</CardTitle>
                    <Badge variant="secondary">{selectedService.category}</Badge>
                  </div>
                  <CardDescription>{selectedService.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{selectedService.duration} minutes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-lg">IDR {Number(selectedService.price).toLocaleString('id-ID')}</span>
                    </div>
                    {selectedService.homeVisitAvailable && (
                      <div className="col-span-2 flex items-center space-x-2 text-green-600">
                        <MapPin className="h-4 w-4" />
                        <span>Home visit available (+IDR {selectedService.homeVisitSurcharge ? Number(selectedService.homeVisitSurcharge).toLocaleString('id-ID') : '0'})</span>
                      </div>
                    )}
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => setStep('details')}
                  >
                    Continue with this service
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Please select a service from the main page first</p>
                <Button variant="outline" onClick={() => onOpenChange?.(false)}>
                  Go back to services
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 'details' && selectedService && (
          <div className="space-y-6">
            {/* Service Summary */}
            <Card className="bg-gray-50">
              <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{selectedService.name}</h3>
                    <p className="text-sm text-gray-600">{selectedService.duration} minutes</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">IDR {Number(calculateTotal()).toLocaleString('id-ID')}</p>
                    {formData.isHomeVisit && invoiceSettings?.travelSurcharge && (
                      <p className="text-xs text-gray-500">
                        Travel surcharge will be calculated based on distance
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <User className="h-5 w-5 mr-2" />
                Your Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Full Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    placeholder="Enter your full name"
                    className={validationErrors.customerName ? 'border-red-500' : ''}
                    required
                  />
                  {validationErrors.customerName && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.customerName}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="customerPhone">Phone Number *</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    className={validationErrors.customerPhone ? 'border-red-500' : ''}
                    value={formData.customerPhone}
                    onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                    placeholder="Enter your phone number"
                    required
                  />
                  {validationErrors.customerPhone && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.customerPhone}</p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="customerEmail">Email Address</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                    placeholder="Enter your email address"
                    className={validationErrors.customerEmail ? 'border-red-500' : ''}
                  />
                  {validationErrors.customerEmail && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.customerEmail}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Appointment Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Appointment Preferences
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preferredDate">Preferred Date *</Label>
                  <Input
                    id="preferredDate"
                    type="date"
                    value={formData.preferredDate}
                    onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="preferredTime">Preferred Time *</Label>
                  <Input
                    id="preferredTime"
                    type="time"
                    value={formData.preferredTime}
                    onChange={(e) => handleInputChange('preferredTime', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Home Visit Option */}
            {selectedService.homeVisitAvailable && (
              <div className="space-y-4 border rounded-lg p-4 bg-blue-50">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="homeVisit"
                    checked={formData.isHomeVisit}
                    onCheckedChange={(checked: boolean) => handleInputChange('isHomeVisit', checked)}
                  />
                  <Label htmlFor="homeVisit" className="cursor-pointer">
                    <MapPin className="inline w-4 h-4 mr-2" />
                    Request home visit
                  </Label>
                </div>
                
                {formData.isHomeVisit && (
                  <HomeVisitAddressSelector
                    address={formData.homeVisitAddress}
                    latitude={formData.homeVisitLat}
                    longitude={formData.homeVisitLng}
                    tenantId={tenant.id}
                    onAddressChange={(addr) => setFormData(prev => ({ ...prev, homeVisitAddress: addr }))}
                    onCoordinatesChange={(lat, lng) => setFormData(prev => ({ ...prev, homeVisitLat: lat, homeVisitLng: lng }))}
                  />
                )}
              </div>
            )}

            {/* Pricing Calculator */}
            {selectedService && (
              <PricingCalculator
                service={selectedService}
                isHomeVisit={formData.isHomeVisit}
                homeVisitAddress={formData.homeVisitAddress}
                homeVisitCoordinates={formData.homeVisitLat && formData.homeVisitLng ? { lat: formData.homeVisitLat, lng: formData.homeVisitLng } : undefined}
                tenantId={tenant.id}
                businessLocation={tenant.address}
                businessCoordinates={businessCoordinates || undefined}
                onPriceCalculated={(totalPrice) => setCalculatedPrice(totalPrice)}
              />
            )}

            {/* Additional Notes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Additional Notes
              </h3>
              
              <Textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any special requests or additional information..."
                rows={3}
              />
            </div>

            {/* Amount Breakdown */}
            {selectedService && (
              <div className="p-4 bg-gray-50 rounded-lg border space-y-2">
                <h3 className="font-semibold text-sm mb-3">Amount Breakdown</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Service Amount</span>
                  <span>IDR {Number(selectedService.price).toLocaleString('id-ID')}</span>
                </div>
                {/* Travel Surcharge is calculated by PricingCalculator when address + coordinates are set */}
                {invoiceSettings?.taxServiceCharge?.taxPercentage ? (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax {Number(invoiceSettings.taxServiceCharge.taxPercentage).toFixed(2)}%</span>
                    <span>IDR {(Number(selectedService.price) * (invoiceSettings.taxServiceCharge.taxPercentage / 100)).toLocaleString('id-ID')}</span>
                  </div>
                ) : null}
                {invoiceSettings?.taxServiceCharge?.serviceChargeRequired && invoiceSettings?.taxServiceCharge?.serviceChargeValue ? (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Service Charge</span>
                    <span>
                      {invoiceSettings.taxServiceCharge.serviceChargeType === 'fixed'
                        ? `IDR ${(invoiceSettings.taxServiceCharge.serviceChargeValue || 0).toLocaleString('id-ID')}`
                        : `IDR ${(Number(selectedService.price) * ((invoiceSettings.taxServiceCharge.serviceChargeValue || 0) / 100)).toLocaleString('id-ID')}`}
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
                            : `IDR ${(Number(selectedService.price) * (fee.value / 100)).toLocaleString('id-ID')}`}
                        </span>
                      </div>
                    ))}
                  </>
                )}
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total Amount</span>
                  <span>IDR {Number(calculateTotal()).toLocaleString('id-ID')}</span>
                </div>
              </div>
            )}

            {/* Payment Information */}
            <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold">Payment Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <select
                    id="paymentMethod"
                    value={formData.paymentMethod || 'cash'}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cash">💵 Cash</option>
                    <option value="card">💳 Credit/Debit Card</option>
                    <option value="transfer">🏦 Bank Transfer</option>
                    <option value="qris">📱 QRIS</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">How would you like to pay?</p>
                </div>

                <div>
                  <Label htmlFor="dpAmount">Down Payment (DP) - Optional</Label>
                  <div className="flex gap-2">
                    <Input
                      id="dpAmount"
                      type="number"
                      min="0"
                      max={Number(calculateTotal())}
                      value={formData.dpAmount || 0}
                      onChange={(e) => handleInputChange('dpAmount', parseInt(e.target.value) || 0)}
                      placeholder="Enter DP amount (IDR)"
                    />
                    <div className="flex items-center justify-center px-3 py-2 bg-gray-100 rounded-md border border-gray-300 text-sm font-semibold text-gray-700 whitespace-nowrap">
                      / {Number(calculateTotal()).toLocaleString('id-ID')}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Leave empty or 0 for no down payment</p>
                </div>
              </div>

              {formData.dpAmount && formData.dpAmount > 0 && (
                <div className="bg-white p-3 rounded border border-blue-300">
                  <div className="flex justify-between text-sm">
                    <span>Total Service Amount:</span>
                    <span className="font-semibold">IDR {Number(calculateTotal()).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>Down Payment:</span>
                    <span className="font-semibold text-blue-600">IDR {Number(formData.dpAmount).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1 pt-1 border-t border-gray-200">
                    <span>Remaining Balance:</span>
                    <span className="font-semibold text-orange-600">IDR {Number(calculateTotal() - (formData.dpAmount || 0)).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setStep('service')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleSubmit}
                className="flex-1"
                disabled={!formData.customerName || !formData.customerPhone || !formData.preferredDate || !formData.preferredTime || isLoading}
              >
                {isLoading ? 'Creating Booking...' : 'Submit Booking Request'}
              </Button>
            </div>
          </div>
        )}

        {step === 'confirmation' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-green-600 mb-2">
                Booking Request Submitted!
              </h3>
              <p className="text-gray-600 mb-4">
                Thank you for your booking request. We'll contact you shortly to confirm your appointment.
              </p>
            </div>

            {/* Booking Summary */}
            <Card className="text-left">
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Service:</span>
                  <span className="font-semibold">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date & Time:</span>
                  <span className="font-semibold">
                    {formData.preferredDate} at {formData.preferredTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-semibold">{selectedService?.duration} minutes</span>
                </div>
                {formData.isHomeVisit && (
                  <div className="flex justify-between">
                    <span>Location:</span>
                    <span className="font-semibold">Home Visit</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>IDR {Number(calculateTotal()).toLocaleString('id-ID')}</span>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                <strong>We'll contact you at:</strong>
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>{formData.customerPhone}</span>
                </div>
                {formData.customerEmail && (
                  <div className="flex items-center justify-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>{formData.customerEmail}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={resetForm}
                className="flex-1"
              >
                Book Another Service
              </Button>
              <Button 
                onClick={() => onOpenChange?.(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}