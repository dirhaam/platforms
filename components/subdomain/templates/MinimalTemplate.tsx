'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MapPin } from 'lucide-react';
import Link from 'next/link';
import { protocol, rootDomain } from '@/lib/utils';
import BookingDialog from '@/components/booking/BookingDialog';
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

interface MinimalTemplateProps {
  tenant: TenantData;
  services?: Service[];
  businessHours?: BusinessHours;
}

export default function MinimalTemplate({ 
  tenant, 
  services = [], 
  businessHours
}: MinimalTemplateProps) {
  const [selectedService, setSelectedService] = useState<Service | undefined>();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  
  const primaryColor = tenant.brandColors?.primary || '#000000';
  
  const handleBookService = (service?: Service) => {
    setSelectedService(service);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-white" style={{ '--primary-color': primaryColor } as React.CSSProperties}>
      {/* Header */}
      <header className="border-b border-gray-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            {tenant.logo ? (
              <img src={tenant.logo} alt={tenant.businessName} className="h-10 w-10 rounded" />
            ) : (
              <div className="text-2xl">{tenant.emoji}</div>
            )}
          </div>
          <Button 
            onClick={() => handleBookService()}
            style={{ color: 'white', backgroundColor: primaryColor }}
          >
            Book
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-light mb-6" style={{ color: primaryColor }}>
            {tenant.businessName}
          </h1>
          <p className="text-lg text-gray-600 mb-2">{tenant.businessCategory}</p>
          {tenant.businessDescription && (
            <p className="text-gray-700 text-lg mb-12 leading-relaxed">
              {tenant.businessDescription}
            </p>
          )}
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg"
              style={{ color: 'white', backgroundColor: primaryColor }}
              onClick={() => handleBookService()}
            >
              Book Appointment
            </Button>
            <Button 
              variant="outline"
              size="lg"
              onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Services
            </Button>
          </div>
        </div>
      </section>

      {/* Services */}
      {services.length > 0 && (
        <section id="services" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-light text-center mb-16" style={{ color: primaryColor }}>
              Services
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {services.slice(0, 6).map((service) => (
                <div key={service.id} className="border-b-2 pb-6" style={{ borderColor: primaryColor }}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold">{service.name}</h3>
                    <Badge variant="outline">{service.category}</Badge>
                  </div>
                  {service.description && (
                    <p className="text-sm text-gray-600 mb-4">{service.description}</p>
                  )}
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-gray-600">
                      {service.duration} min • IDR {Number(service.price).toLocaleString('id-ID')}
                    </div>
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBookService(service)}
                      style={{ color: primaryColor }}
                    >
                      →
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Info Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-light mb-16 text-center" style={{ color: primaryColor }}>
            Get in Touch
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {tenant.phone && (
              <div className="text-center">
                <Phone className="h-6 w-6 mx-auto mb-4" style={{ color: primaryColor }} />
                <p className="text-sm text-gray-600 mb-2">Phone</p>
                <a href={`tel:${tenant.phone}`} className="font-semibold hover:opacity-75">
                  {tenant.phone}
                </a>
              </div>
            )}
            
            {tenant.email && (
              <div className="text-center">
                <Mail className="h-6 w-6 mx-auto mb-4" style={{ color: primaryColor }} />
                <p className="text-sm text-gray-600 mb-2">Email</p>
                <a href={`mailto:${tenant.email}`} className="font-semibold hover:opacity-75">
                  {tenant.email}
                </a>
              </div>
            )}
            
            {tenant.address && (
              <div className="text-center">
                <MapPin className="h-6 w-6 mx-auto mb-4" style={{ color: primaryColor }} />
                <p className="text-sm text-gray-600 mb-2">Location</p>
                <a 
                  href={`https://maps.google.com/?q=${encodeURIComponent(tenant.address)}`}
                  className="font-semibold hover:opacity-75"
                >
                  View Map
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Business Hours */}
      {businessHours && (
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-light text-center mb-12" style={{ color: primaryColor }}>
              Business Hours
            </h2>
            <div className="space-y-3">
              {Object.entries(businessHours).map(([day, hours]) => (
                <div key={day} className="flex justify-between items-center text-sm">
                  <span className="font-semibold capitalize">{day}</span>
                  <span className="text-gray-600">
                    {hours.isOpen ? `${hours.openTime} - ${hours.closeTime}` : 'Closed'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center text-sm text-gray-600">
          <p>© 2024 {tenant.businessName}</p>
          <p className="text-xs flex flex-wrap justify-center gap-2">
            Powered by <Link href={`${protocol}://${rootDomain}`} className="hover:underline">{rootDomain}</Link>
            <span>•</span>
            <Link href="/tenant/login" className="hover:underline text-blue-600 font-medium">Business Admin Login</Link>
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
