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
import { AddressInput } from '@/components/location/AddressInput';
import { PricingCalculator } from '@/components/booking/PricingCalculator';
import { Address } from '@/types/location';
import { Service } from '@/types/booking';

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
  notes: string;
}

export default function BookingDialog({ 
  service, 
  tenant, 
  trigger,
  isOpen,
  onOpenChange 
}: BookingDialogProps) {
  const [step, setStep] = useState<'service' | 'details' | 'confirmation'>('service');
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
  });
  const [calculatedPrice, setCalculatedPrice] = useState<number>(selectedService ? Number(selectedService.price) : 0);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  const handleInputChange = (field: keyof BookingFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateTotal = () => {
    return calculatedPrice;
  };

  const handleSubmit = async () => {
    // Here you would typically send the booking data to your API
    console.log('Booking submitted:', {
      service: selectedService,
      customer: formData,
      tenant: tenant.id,
    });
    
    // For now, just move to confirmation step
    setStep('confirmation');
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
      homeVisitCoordinates: undefined,
      notes: '',
    });
    setCalculatedPrice(selectedService ? Number(selectedService.price) : 0);
    setSelectedAddress(null);
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
                      <span className="font-bold text-lg">${Number(selectedService.price)}</span>
                    </div>
                    {selectedService.homeVisitAvailable && (
                      <div className="col-span-2 flex items-center space-x-2 text-green-600">
                        <MapPin className="h-4 w-4" />
                        <span>Home visit available (+${selectedService.homeVisitSurcharge ? Number(selectedService.homeVisitSurcharge) : 0})</span>
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
                    <p className="font-bold">${calculateTotal()}</p>
                    {formData.isHomeVisit && selectedService.homeVisitSurcharge && (
                      <p className="text-xs text-gray-500">
                        Includes home visit (+${Number(selectedService.homeVisitSurcharge)})
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

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
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="customerPhone">Phone Number *</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="customerEmail">Email Address</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                    placeholder="Enter your email address"
                  />
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
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="homeVisit"
                    checked={formData.isHomeVisit}
                    onCheckedChange={(checked: boolean) => handleInputChange('isHomeVisit', checked)}
                  />
                  <Label htmlFor="homeVisit" className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Request home visit (+${selectedService.homeVisitSurcharge ? Number(selectedService.homeVisitSurcharge) : 0})
                  </Label>
                </div>
                
                {formData.isHomeVisit && (
                  <div>
                    <AddressInput
                      label="Home Address"
                      placeholder="Enter your complete address"
                      value={formData.homeVisitAddress}
                      onAddressSelect={(address: Address) => {
                        setFormData(prev => ({
                          ...prev,
                          homeVisitAddress: address.fullAddress,
                          homeVisitCoordinates: address.coordinates
                        }));
                        setSelectedAddress(address);
                      }}
                      onAddressChange={(address: string) => {
                        setFormData(prev => ({
                          ...prev,
                          homeVisitAddress: address,
                          homeVisitCoordinates: undefined
                        }));
                        setSelectedAddress(null);
                      }}
                      tenantId={tenant.id}
                      required={formData.isHomeVisit}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Pricing Calculator */}
            {selectedService && (
              <PricingCalculator
                service={selectedService}
                isHomeVisit={formData.isHomeVisit}
                homeVisitAddress={selectedAddress || undefined}
                tenantId={tenant.id}
                businessLocation={tenant.address}
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
                disabled={!formData.customerName || !formData.customerPhone || !formData.preferredDate || !formData.preferredTime}
              >
                Submit Booking Request
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
                  <span>${calculateTotal()}</span>
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