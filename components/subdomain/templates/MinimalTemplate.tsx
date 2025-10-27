'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MapPin, Clock, ChevronRight } from 'lucide-react';
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

  // Get today's hours
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' });
  const todayHours = businessHours?.[currentDay];

  return (
    <div className="min-h-screen bg-white" style={{ '--primary-color': primaryColor } as React.CSSProperties}>
      {/* Minimal Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            {tenant.logo ? (
              <img src={tenant.logo} alt={tenant.businessName} className="h-8 w-8 rounded object-cover" />
            ) : (
              <div className="text-xl">{tenant.emoji}</div>
            )}
            <div className="hidden sm:block">
              <p className="font-semibold text-sm text-gray-900">{tenant.businessName}</p>
              <p className="text-xs text-gray-500">{tenant.businessCategory}</p>
            </div>
          </div>
          <Button 
            onClick={() => handleBookService()}
            size="sm"
            style={{ backgroundColor: primaryColor, color: 'white' }}
            className="hover:opacity-90 transition-opacity"
          >
            Book Now
          </Button>
        </div>
      </header>

      {/* Hero Section - Ultra Minimal */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Title */}
          <div>
            <h1 className="text-4xl sm:text-6xl font-bold leading-tight mb-4" style={{ color: primaryColor }}>
              {tenant.businessName}
            </h1>
            <p className="text-lg text-gray-600">{tenant.businessCategory}</p>
          </div>

          {/* Description */}
          {tenant.businessDescription && (
            <p className="text-lg leading-relaxed text-gray-700 max-w-2xl">
              {tenant.businessDescription}
            </p>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              size="lg"
              onClick={() => handleBookService()}
              style={{ backgroundColor: primaryColor, color: 'white' }}
              className="hover:opacity-90 transition-opacity"
            >
              Book Appointment
            </Button>
            <Button 
              variant="outline"
              size="lg"
              onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
            >
              View Services
            </Button>
          </div>

          {/* Status Bar */}
          {todayHours && (
            <div className="flex items-center gap-2 text-sm pt-4">
              <div className={`w-2 h-2 rounded-full ${todayHours.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-600">
                {todayHours.isOpen 
                  ? `Open today • ${todayHours.openTime} - ${todayHours.closeTime}` 
                  : 'Closed today'}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Services - Clean Grid */}
      {services.length > 0 && (
        <section id="services" className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-12" style={{ color: primaryColor }}>
              Services
            </h2>
            
            <div className="space-y-1">
              {services.slice(0, 8).map((service, index) => (
                <button
                  key={service.id}
                  onClick={() => handleBookService(service)}
                  className="w-full group flex items-center justify-between p-4 sm:p-5 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100 hover:border-gray-200"
                >
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900 mb-1">{service.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{service.duration} min</span>
                      <span>IDR {Number(service.price).toLocaleString('id-ID')}</span>
                      {service.category && <span className="text-xs bg-gray-100 px-2 py-1 rounded">{service.category}</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-colors ml-4 flex-shrink-0" style={{ color: primaryColor, opacity: 0.3 }} />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact - Simple Grid */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12" style={{ color: primaryColor }}>
            Contact
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Phone */}
            {tenant.phone && (
              <a 
                href={`tel:${tenant.phone}`}
                className="group flex items-start gap-4 p-6 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Phone className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: primaryColor }} />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Phone</p>
                  <p className="font-semibold text-gray-900 group-hover:opacity-75 transition-opacity">
                    {tenant.phone}
                  </p>
                </div>
              </a>
            )}
            
            {/* Email */}
            {tenant.email && (
              <a 
                href={`mailto:${tenant.email}`}
                className="group flex items-start gap-4 p-6 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Mail className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: primaryColor }} />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Email</p>
                  <p className="font-semibold text-gray-900 group-hover:opacity-75 transition-opacity">
                    {tenant.email}
                  </p>
                </div>
              </a>
            )}
            
            {/* Address */}
            {tenant.address && (
              <a 
                href={`https://maps.google.com/?q=${encodeURIComponent(tenant.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 p-6 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <MapPin className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: primaryColor }} />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Location</p>
                  <p className="font-semibold text-gray-900 group-hover:opacity-75 transition-opacity text-sm">
                    {tenant.address}
                  </p>
                </div>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Business Hours - Compact */}
      {businessHours && (
        <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gray-50 border-t border-gray-100">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8" style={{ color: primaryColor }}>
              Hours
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(businessHours).map(([day, hours]) => (
                <div key={day} className="p-4 bg-white rounded-lg border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {day}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {hours.isOpen ? `${hours.openTime} - ${hours.closeTime}` : 'Closed'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Minimal Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <p>© {new Date().getFullYear()} {tenant.businessName}</p>
            <div className="flex gap-4">
              <Link href={`${protocol}://${rootDomain}`} className="hover:text-gray-700">
                {rootDomain}
              </Link>
              <span>•</span>
              <Link href="/tenant/login" className="hover:text-gray-700 font-medium">
                Admin
              </Link>
            </div>
          </div>
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
