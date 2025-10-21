'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MapPin, Clock, Shield, Heart, Users } from 'lucide-react';
import Link from 'next/link';
import { protocol, rootDomain } from '@/lib/utils';
import BookingDialog from '@/components/booking/BookingDialog';
import BusinessHoursDisplay from '@/components/subdomain/BusinessHoursDisplay';
import { Service } from '@/types/booking';

interface BusinessHours {
  [key: string]: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
}

interface TenantData {
  id: string;
  subdomain: string;
  emoji: string;
  businessName: string;
  businessCategory: string;
  ownerName: string;
  email: string;
  phone: string;
  address?: string;
  businessDescription?: string;
  logo?: string;
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

interface HealthcareTemplateProps {
  tenant: TenantData;
  services?: Service[];
  businessHours?: BusinessHours;
}

export default function HealthcareTemplate({ 
  tenant, 
  services = [], 
  businessHours
}: HealthcareTemplateProps) {
  const [selectedService, setSelectedService] = useState<Service | undefined>();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  
  const primaryColor = tenant.brandColors?.primary || '#0369a1';
  
  const handleBookService = (service?: Service) => {
    setSelectedService(service);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              {tenant.logo ? (
                <img src={tenant.logo} alt={tenant.businessName} className="h-12 w-12 rounded-full" />
              ) : (
                <div className="text-3xl">{tenant.emoji}</div>
              )}
              <div>
                <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {tenant.businessName}
                </h1>
                <p className="text-xs text-gray-600">{tenant.businessCategory}</p>
              </div>
            </div>
            <Button 
              size="lg"
              style={{ backgroundColor: primaryColor }}
              className="text-white"
              onClick={() => handleBookService()}
            >
              Schedule Appointment
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 text-center" style={{ backgroundColor: primaryColor, color: 'white' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Your Health, Our Priority
          </h2>
          <p className="text-lg opacity-90 mb-8">
            {tenant.businessDescription || 'Professional healthcare services with a personal touch.'}
          </p>
          <Button 
            size="lg" 
            className="bg-white text-gray-900 hover:bg-gray-100 font-semibold text-base"
            onClick={() => handleBookService()}
          >
            Book Your Appointment Now
          </Button>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { icon: Shield, label: 'Certified', desc: 'Fully licensed professionals' },
              { icon: Heart, label: 'Patient Care', desc: 'Compassionate service' },
              { icon: Users, label: 'Experienced', desc: 'Years of expertise' }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx}>
                  <Icon className="h-12 w-12 mx-auto mb-4" style={{ color: primaryColor }} />
                  <h3 className="font-bold text-lg mb-2">{item.label}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services */}
      {services.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12" style={{ color: primaryColor }}>
              Our Services
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.slice(0, 8).map((service) => (
                <Card key={service.id} className="border border-blue-100 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-3">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <Badge variant="outline" style={{ borderColor: primaryColor, color: primaryColor }}>
                        {service.category}
                      </Badge>
                    </div>
                    {service.description && (
                      <CardDescription className="text-sm">{service.description}</CardDescription>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center text-sm text-gray-700 py-2 border-t border-b border-gray-100">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Duration
                      </span>
                      <span className="font-semibold">{service.duration} min</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Price</span>
                      <span className="text-xl font-bold" style={{ color: primaryColor }}>
                        PKR {Number(service.price).toLocaleString()}
                      </span>
                    </div>

                    {service.homeVisitAvailable && (
                      <div className="p-3 bg-blue-50 rounded text-sm text-blue-800 border border-blue-200">
                        🏥 Home visit available (PKR {Number(service.homeVisitSurcharge || 0).toLocaleString()})
                      </div>
                    )}

                    <Button 
                      className="w-full text-white"
                      style={{ backgroundColor: primaryColor }}
                      onClick={() => handleBookService(service)}
                    >
                      Schedule Service
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Business Hours */}
      {businessHours && (
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12" style={{ color: primaryColor }}>
              Clinic Hours
            </h2>
            
            <Card className="border-2" style={{ borderColor: primaryColor }}>
              <CardContent className="pt-6">
                <BusinessHoursDisplay businessHours={businessHours} />
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12" style={{ color: primaryColor }}>
            Contact Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tenant.phone && (
              <Card className="border-0">
                <CardContent className="pt-6">
                  <Phone className="h-8 w-8 mx-auto mb-4" style={{ color: primaryColor }} />
                  <h3 className="font-bold text-center mb-3">Emergency & Appointments</h3>
                  <a 
                    href={`tel:${tenant.phone}`} 
                    className="block text-center font-semibold hover:opacity-75"
                    style={{ color: primaryColor }}
                  >
                    {tenant.phone}
                  </a>
                </CardContent>
              </Card>
            )}
            
            {tenant.email && (
              <Card className="border-0">
                <CardContent className="pt-6">
                  <Mail className="h-8 w-8 mx-auto mb-4" style={{ color: primaryColor }} />
                  <h3 className="font-bold text-center mb-3">Email</h3>
                  <a 
                    href={`mailto:${tenant.email}`}
                    className="block text-center font-semibold hover:opacity-75"
                    style={{ color: primaryColor }}
                  >
                    {tenant.email}
                  </a>
                </CardContent>
              </Card>
            )}
            
            {tenant.address && (
              <Card className="border-0">
                <CardContent className="pt-6">
                  <MapPin className="h-8 w-8 mx-auto mb-4" style={{ color: primaryColor }} />
                  <h3 className="font-bold text-center mb-3">Location</h3>
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent(tenant.address)}`}
                    className="block text-center font-semibold hover:opacity-75"
                    style={{ color: primaryColor }}
                  >
                    Get Directions
                  </a>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: primaryColor, color: 'white' }}>
        <div className="max-w-6xl mx-auto text-center">
          <p className="font-semibold mb-2">{tenant.businessName}</p>
          <p className="text-sm opacity-90 mb-4">
            Providing quality healthcare services since 2024
          </p>
          <p className="text-xs opacity-75">
            © 2024 {tenant.businessName}. All rights reserved.
          </p>
          <p className="text-xs opacity-75 mt-2">
            Powered by <Link href={`${protocol}://${rootDomain}`} className="hover:underline">{rootDomain}</Link>
          </p>
        </div>
      </footer>

      {/* Booking Dialog */}
      <BookingDialog
        service={selectedService}
        tenant={tenant}
        isOpen={isBookingOpen}
        onOpenChange={setIsBookingOpen}
      />
    </div>
  );
}
