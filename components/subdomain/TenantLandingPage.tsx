'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MapPin, Clock, Star } from 'lucide-react';
import Link from 'next/link';
import { protocol, rootDomain } from '@/lib/utils';
import BookingDialog from '@/components/booking/BookingDialog';
import BusinessHoursDisplay from '@/components/subdomain/BusinessHoursDisplay';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  homeVisitAvailable: boolean;
  homeVisitSurcharge?: number;
}

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

interface TenantLandingPageProps {
  tenant: TenantData;
  services?: Service[];
  businessHours?: BusinessHours;
  template?: 'modern' | 'classic' | 'minimal';
}

export default function TenantLandingPage({ 
  tenant, 
  services = [], 
  businessHours,
  template = 'modern' 
}: TenantLandingPageProps) {
  const [selectedService, setSelectedService] = useState<Service | undefined>();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  
  const primaryColor = tenant.brandColors?.primary || '#3b82f6';
  const secondaryColor = tenant.brandColors?.secondary || '#1e40af';
  
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
  const todayHours = businessHours?.[currentDay];
  const isOpenToday = todayHours?.isOpen || false;

  const handleBookService = (service?: Service) => {
    setSelectedService(service);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              {tenant.logo ? (
                <img 
                  src={tenant.logo} 
                  alt={tenant.businessName}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="text-3xl">{tenant.emoji}</div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {tenant.businessName}
                </h1>
                <p className="text-sm text-gray-500">{tenant.businessCategory}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {businessHours && (
                <BusinessHoursDisplay 
                  businessHours={businessHours} 
                  compact={true}
                />
              )}
              
              <Link
                href={`${protocol}://${rootDomain}`}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Powered by {rootDomain}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            {tenant.logo ? (
              <img 
                src={tenant.logo} 
                alt={tenant.businessName}
                className="h-24 w-24 mx-auto rounded-full object-cover shadow-lg"
              />
            ) : (
              <div className="text-8xl mb-4">{tenant.emoji}</div>
            )}
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Welcome to {tenant.businessName}
          </h1>
          
          {tenant.businessDescription && (
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {tenant.businessDescription}
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-3"
              style={{ backgroundColor: primaryColor }}
              onClick={() => handleBookService()}
            >
              Book Appointment
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-3"
              onClick={() => {
                const servicesSection = document.getElementById('services-section');
                servicesSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              View Services
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      {services.length > 0 && (
        <section id="services-section" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Services</h2>
              <p className="text-lg text-gray-600">
                Professional services tailored to your needs
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.slice(0, 6).map((service) => (
                <Card key={service.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <Badge variant="secondary">{service.category}</Badge>
                    </div>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Duration:</span>
                        <span className="font-medium">{service.duration} min</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Price:</span>
                        <span className="font-bold text-lg" style={{ color: primaryColor }}>
                          ${service.price}
                        </span>
                      </div>
                      {service.homeVisitAvailable && (
                        <div className="flex items-center space-x-2 text-sm text-green-600">
                          <MapPin className="h-4 w-4" />
                          <span>Home visit available</span>
                          {service.homeVisitSurcharge && (
                            <span className="text-gray-500">
                              (+${service.homeVisitSurcharge})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <Button 
                      className="w-full mt-4" 
                      style={{ backgroundColor: primaryColor }}
                      onClick={() => handleBookService(service)}
                    >
                      Book Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {services.length > 6 && (
              <div className="text-center mt-8">
                <Button variant="outline" size="lg">
                  View All Services ({services.length})
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Contact Information */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Get in Touch</h2>
            <p className="text-lg text-gray-600">
              Ready to book? Contact us today
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tenant.phone && (
              <Card className="text-center">
                <CardContent className="pt-6">
                  <Phone className="h-8 w-8 mx-auto mb-4" style={{ color: primaryColor }} />
                  <h3 className="font-semibold mb-2">Phone</h3>
                  <p className="text-gray-600">{tenant.phone}</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => window.open(`tel:${tenant.phone}`)}
                  >
                    Call Now
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {tenant.email && (
              <Card className="text-center">
                <CardContent className="pt-6">
                  <Mail className="h-8 w-8 mx-auto mb-4" style={{ color: primaryColor }} />
                  <h3 className="font-semibold mb-2">Email</h3>
                  <p className="text-gray-600">{tenant.email}</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => window.open(`mailto:${tenant.email}`)}
                  >
                    Send Email
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {tenant.address && (
              <Card className="text-center">
                <CardContent className="pt-6">
                  <MapPin className="h-8 w-8 mx-auto mb-4" style={{ color: primaryColor }} />
                  <h3 className="font-semibold mb-2">Address</h3>
                  <p className="text-gray-600">{tenant.address}</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => tenant.address && window.open(`https://maps.google.com/?q=${encodeURIComponent(tenant.address)}`)}
                  >
                    Get Directions
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Business Hours */}
      {businessHours && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Business Hours</h2>
              <p className="text-lg text-gray-600">When you can find us</p>
            </div>
            
            <BusinessHoursDisplay 
              businessHours={businessHours}
              className="max-w-2xl mx-auto"
            />
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              {tenant.logo ? (
                <img 
                  src={tenant.logo} 
                  alt={tenant.businessName}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="text-2xl">{tenant.emoji}</div>
              )}
              <span className="text-lg font-semibold">{tenant.businessName}</span>
            </div>
            <p className="text-gray-400 mb-4">
              {tenant.businessDescription || `Professional ${tenant.businessCategory} services`}
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-400">
              <span>© 2024 {tenant.businessName}</span>
              <Link 
                href={`${protocol}://${rootDomain}`}
                className="hover:text-white transition-colors"
              >
                Powered by {rootDomain}
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