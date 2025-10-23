'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MapPin, Clock, ChevronRight } from 'lucide-react';
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

interface ClassicTemplateProps {
  tenant: TenantData;
  services?: Service[];
  businessHours?: BusinessHours;
}

export default function ClassicTemplate({ 
  tenant, 
  services = [], 
  businessHours
}: ClassicTemplateProps) {
  const [selectedService, setSelectedService] = useState<Service | undefined>();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  
  const primaryColor = tenant.brandColors?.primary || '#2c3e50';
  
  const handleBookService = (service?: Service) => {
    setSelectedService(service);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            <div className="flex items-center space-x-4">
              {tenant.logo ? (
                <img src={tenant.logo} alt={tenant.businessName} className="h-12 w-12 rounded" />
              ) : (
                <div className="text-4xl">{tenant.emoji}</div>
              )}
              <div>
                <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {tenant.businessName}
                </h1>
                <p className="text-sm text-gray-600">{tenant.businessCategory}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Button variant="ghost" onClick={() => handleBookService()}>
                Book Now
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-gray-300 p-8 hidden lg:block bg-gray-50">
          <div className="space-y-8">
            {/* About */}
            <div>
              <h3 className="text-lg font-bold mb-3" style={{ color: primaryColor }}>About</h3>
              <p className="text-sm text-gray-700">{tenant.businessDescription || 'Welcome to our business'}</p>
            </div>

            {/* Hours */}
            {businessHours && (
              <div>
                <h3 className="text-lg font-bold mb-3" style={{ color: primaryColor }}>Hours</h3>
                <BusinessHoursDisplay businessHours={businessHours} />
              </div>
            )}

            {/* Contact */}
            <div>
              <h3 className="text-lg font-bold mb-3" style={{ color: primaryColor }}>Contact</h3>
              <div className="space-y-3">
                {tenant.phone && (
                  <a href={`tel:${tenant.phone}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600">
                    <Phone className="h-4 w-4" />
                    {tenant.phone}
                  </a>
                )}
                {tenant.email && (
                  <a href={`mailto:${tenant.email}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600">
                    <Mail className="h-4 w-4" />
                    {tenant.email}
                  </a>
                )}
                {tenant.address && (
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(tenant.address)}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600">
                    <MapPin className="h-4 w-4" />
                    {tenant.address}
                  </a>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Hero */}
          <section className="py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: primaryColor, color: 'white' }}>
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Welcome to {tenant.businessName}
              </h2>
              {tenant.businessDescription && (
                <p className="text-lg opacity-90 mb-8">{tenant.businessDescription}</p>
              )}
              <Button 
                size="lg" 
                className="bg-white text-gray-900 hover:bg-gray-100 font-semibold"
                onClick={() => handleBookService()}
              >
                Book Appointment Today
              </Button>
            </div>
          </section>

          {/* Services */}
          {services.length > 0 && (
            <section className="py-16 px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold mb-12 text-center" style={{ color: primaryColor }}>
                  Our Services
                </h2>
                
                <div className="space-y-4">
                  {services.slice(0, 8).map((service) => (
                    <div key={service.id} className="border border-gray-300 rounded-lg p-6 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold">{service.name}</h3>
                            <Badge variant="outline">{service.category}</Badge>
                          </div>
                          {service.description && (
                            <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                          )}
                          <div className="flex gap-6 text-sm text-gray-600">
                            <span>⏱ {service.duration} min</span>
                            <span>💰 IDR {Number(service.price).toLocaleString('id-ID')}</span>
                            {service.homeVisitAvailable && (
                              <span className="text-green-600">📍 Home visit available</span>
                            )}
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleBookService(service)}
                          style={{ backgroundColor: primaryColor }}
                        >
                          Book <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Footer */}
          <footer className="border-t border-gray-300 py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: primaryColor, color: 'white' }}>
            <div className="max-w-4xl mx-auto text-center text-sm">
              <p>© 2024 {tenant.businessName}. All rights reserved.</p>
              <p className="opacity-75 flex flex-wrap justify-center gap-2">
                Powered by <Link href={`${protocol}://${rootDomain}`} className="hover:underline">{rootDomain}</Link>
                <span>•</span>
                <Link href="/tenant/login" className="hover:underline text-blue-300 font-medium">Business Admin Login</Link>
              </p>
            </div>
          </footer>
        </main>
      </div>

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
