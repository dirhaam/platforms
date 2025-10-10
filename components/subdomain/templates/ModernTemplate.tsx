'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MapPin, Clock, ArrowRight } from 'lucide-react';
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

interface ModernTemplateProps {
  tenant: TenantData;
  services?: Service[];
  businessHours?: BusinessHours;
}

export default function ModernTemplate({ 
  tenant, 
  services = [], 
  businessHours 
}: ModernTemplateProps) {
  const [selectedService, setSelectedService] = useState<Service | undefined>();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  
  const primaryColor = tenant.brandColors?.primary || '#3b82f6';
  const secondaryColor = tenant.brandColors?.secondary || '#1e40af';
  const accentColor = tenant.brandColors?.accent || '#f59e0b';
  
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
  const todayHours = businessHours?.[currentDay];
  const isOpenToday = todayHours?.isOpen || false;

  const handleBookService = (service?: Service) => {
    setSelectedService(service);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Modern Header with Gradient */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              {tenant.logo ? (
                <img 
                  src={tenant.logo} 
                  alt={tenant.businessName}
                  className="h-12 w-12 rounded-full object-cover border-2 border-white/20"
                />
              ) : (
                <div className="text-4xl bg-white/10 p-2 rounded-full">{tenant.emoji}</div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{tenant.businessName}</h1>
                <p className="text-blue-100">{tenant.businessCategory}</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              {businessHours && (
                <div className="bg-white/10 px-3 py-1 rounded-full">
                  <BusinessHoursDisplay 
                    businessHours={businessHours} 
                    compact={true}
                    className="text-white"
                  />
                </div>
              )}
              
              <Link
                href={`${protocol}://${rootDomain}`}
                className="text-sm text-blue-100 hover:text-white transition-colors"
              >
                Powered by {rootDomain}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Modern Design */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Welcome to{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {tenant.businessName}
                </span>
              </h1>
              
              {tenant.businessDescription && (
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  {tenant.businessDescription}
                </p>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                  onClick={() => handleBookService()}
                >
                  Book Appointment
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-lg px-8 py-4 border-2 hover:bg-gray-50"
                  onClick={() => {
                    const servicesSection = document.getElementById('services-section');
                    servicesSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  View Services
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl p-8 shadow-2xl">
                {tenant.logo ? (
                  <img 
                    src={tenant.logo} 
                    alt={tenant.businessName}
                    className="w-full h-64 object-cover rounded-2xl shadow-lg"
                  />
                ) : (
                  <div className="text-9xl text-center text-blue-600">{tenant.emoji}</div>
                )}
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-20"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-pink-400 to-red-500 rounded-full opacity-20"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section with Modern Cards */}
      {services.length > 0 && (
        <section id="services-section" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Discover our range of professional services designed to meet your needs
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.slice(0, 6).map((service, index) => (
                <Card 
                  key={service.id} 
                  className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2"
                >
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                        {service.name}
                      </CardTitle>
                      <Badge 
                        variant="secondary" 
                        className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                      >
                        {service.category}
                      </Badge>
                    </div>
                    <CardDescription className="text-gray-600 leading-relaxed">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Duration:</span>
                        <span className="font-semibold">{service.duration} min</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Price:</span>
                        <span className="font-bold text-2xl text-blue-600">
                          ${service.price}
                        </span>
                      </div>
                      {service.homeVisitAvailable && (
                        <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg">
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
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                      onClick={() => handleBookService(service)}
                    >
                      Book Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {services.length > 6 && (
              <div className="text-center mt-12">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                >
                  View All Services ({services.length})
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Contact Section with Modern Layout */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Get in Touch</h2>
            <p className="text-xl text-gray-600">
              Ready to book? We're here to help
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tenant.phone && (
              <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all group">
                <CardContent className="pt-8 pb-8">
                  <div className="bg-gradient-to-br from-blue-100 to-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Phone className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Phone</h3>
                  <p className="text-gray-600 mb-4">{tenant.phone}</p>
                  <Button 
                    variant="outline" 
                    className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                    onClick={() => window.open(`tel:${tenant.phone}`)}
                  >
                    Call Now
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {tenant.email && (
              <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all group">
                <CardContent className="pt-8 pb-8">
                  <div className="bg-gradient-to-br from-green-100 to-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Mail className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Email</h3>
                  <p className="text-gray-600 mb-4">{tenant.email}</p>
                  <Button 
                    variant="outline" 
                    className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                    onClick={() => window.open(`mailto:${tenant.email}`)}
                  >
                    Send Email
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {tenant.address && (
              <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all group">
                <CardContent className="pt-8 pb-8">
                  <div className="bg-gradient-to-br from-purple-100 to-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <MapPin className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Address</h3>
                  <p className="text-gray-600 mb-4">{tenant.address}</p>
                  <Button 
                    variant="outline" 
                    className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
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

      {/* Business Hours with Modern Design */}
      {businessHours && (
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Business Hours</h2>
              <p className="text-xl text-gray-600">When you can find us</p>
            </div>
            
            <BusinessHoursDisplay 
              businessHours={businessHours}
              className="border-0 shadow-xl"
            />
          </div>
        </section>
      )}

      {/* Modern Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-6">
              {tenant.logo ? (
                <img 
                  src={tenant.logo} 
                  alt={tenant.businessName}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="text-3xl">{tenant.emoji}</div>
              )}
              <span className="text-2xl font-bold">{tenant.businessName}</span>
            </div>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              {tenant.businessDescription || `Professional ${tenant.businessCategory} services`}
            </p>
            <div className="flex justify-center space-x-8 text-sm text-gray-400">
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