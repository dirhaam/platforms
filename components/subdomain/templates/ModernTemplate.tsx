'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MapPin, Star, ArrowRight, Calendar, Users, Zap } from 'lucide-react';
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const primaryColor = tenant.brandColors?.primary || '#0066ff';
  const secondaryColor = tenant.brandColors?.secondary || '#00d4ff';
  
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const todayHours = businessHours?.[currentDay];
  const isOpenToday = todayHours?.isOpen || false;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleBookService = (service?: Service) => {
    setSelectedService(service);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-black to-purple-900/30"
          style={{
            backgroundPosition: `${mousePosition.x}px ${mousePosition.y}px`,
          }}
        ></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-l from-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-black/30 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative">
              {tenant.logo ? (
                <img 
                  src={tenant.logo} 
                  alt={tenant.businessName}
                  className="h-10 w-10 rounded-full object-cover border border-white/20 group-hover:border-blue-400 transition-colors"
                />
              ) : (
                <div className="text-2xl">{tenant.emoji}</div>
              )}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity"></div>
            </div>
            <div>
              <p className="font-bold">{tenant.businessName}</p>
              <p className="text-xs text-gray-400">{tenant.businessCategory}</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {isOpenToday && (
              <div className="flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/30">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-300">Open Now • {todayHours?.openTime}</span>
              </div>
            )}
            <Button 
              onClick={() => handleBookService()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-blue-500/50 transition-all duration-300"
            >
              Reserve Now
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Left Content */}
          <div className="space-y-8">
            <div>
              <div className="inline-block mb-4">
                <Badge 
                  variant="outline"
                  className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/50 text-blue-300"
                >
                  ✨ Premium Experience
                </Badge>
              </div>
              
              <h1 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {tenant.businessName}
                </span>
              </h1>

              <p className="text-xl text-gray-300 mb-8 max-w-xl leading-relaxed">
                {tenant.businessDescription || `Experience premium ${tenant.businessCategory} services with expert professionals and world-class facilities.`}
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 p-3 rounded-lg border border-blue-500/30">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Trusted Clients</p>
                  <p className="font-bold text-lg">1000+</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-purple-500/20 p-3 rounded-lg border border-purple-500/30">
                  <Star className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Rating</p>
                  <p className="font-bold text-lg">4.9/5.0</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-pink-500/20 p-3 rounded-lg border border-pink-500/30">
                  <Zap className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Experience</p>
                  <p className="font-bold text-lg">10+ Years</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                size="lg"
                onClick={() => handleBookService()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-blue-500/50 transition-all duration-300 px-8 text-lg font-semibold"
              >
                Book Appointment
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-2 border-white/20 hover:border-blue-400 hover:bg-blue-400/10 px-8 text-lg font-semibold"
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Services
              </Button>
            </div>
          </div>

          {/* Right Side - Hero Image/Emoji */}
          <div className="relative h-96 md:h-[500px] hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl border border-white/10 backdrop-blur-sm p-8 flex items-center justify-center group hover:border-white/20 transition-all duration-300">
              {tenant.logo ? (
                <img 
                  src={tenant.logo} 
                  alt={tenant.businessName}
                  className="w-full h-full object-cover rounded-2xl shadow-2xl group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="text-9xl group-hover:scale-110 transition-transform duration-300">
                  {tenant.emoji}
                </div>
              )}
            </div>
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      {services.length > 0 && (
        <section id="services" className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-black mb-4">
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Our Services
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Explore our premium selection of professional services
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.slice(0, 6).map((service, index) => (
                <div
                  key={service.id}
                  className="group relative bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 cursor-pointer hover:-translate-y-1"
                  onClick={() => handleBookService(service)}
                >
                  {/* Gradient Background on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 rounded-2xl transition-all duration-300"></div>

                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold group-hover:text-blue-300 transition-colors">
                        {service.name}
                      </h3>
                      <Badge 
                        className="bg-gradient-to-r from-blue-500/30 to-purple-500/30 border border-blue-400/30 text-blue-300"
                      >
                        {service.category}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="text-gray-400 mb-6 line-clamp-2">
                      {service.description || 'Professional service'}
                    </p>

                    {/* Details */}
                    <div className="space-y-3 mb-6 pb-6 border-b border-white/10">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Duration</span>
                        <span className="font-semibold">{service.duration} min</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Price</span>
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                          IDR {Number(service.price).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* CTA */}
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-blue-500/50 transition-all duration-300 group/btn"
                    >
                      Book Now
                      <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>

                    {service.homeVisitAvailable && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-green-300 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/30">
                        <MapPin className="w-4 h-4" />
                        Home visit available
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Get in Touch
              </span>
            </h2>
            <p className="text-xl text-gray-400">Contact us for inquiries and bookings</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {tenant.phone && (
              <div className="group bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 text-center cursor-pointer hover:-translate-y-1">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30 group-hover:border-blue-400/50 transition-all">
                  <Phone className="w-8 h-8 text-blue-300" />
                </div>
                <h3 className="font-bold text-lg mb-2">Phone</h3>
                <p className="text-gray-400 mb-4">{tenant.phone}</p>
                <Button
                  variant="outline"
                  className="w-full border-blue-500/30 text-blue-300 hover:bg-blue-500/10 hover:border-blue-400/50"
                  onClick={() => window.open(`tel:${tenant.phone}`)}
                >
                  Call Now
                </Button>
              </div>
            )}

            {tenant.email && (
              <div className="group bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 text-center cursor-pointer hover:-translate-y-1">
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/30 group-hover:border-purple-400/50 transition-all">
                  <Mail className="w-8 h-8 text-purple-300" />
                </div>
                <h3 className="font-bold text-lg mb-2">Email</h3>
                <p className="text-gray-400 mb-4 truncate">{tenant.email}</p>
                <Button
                  variant="outline"
                  className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400/50"
                  onClick={() => window.open(`mailto:${tenant.email}`)}
                >
                  Send Email
                </Button>
              </div>
            )}

            {tenant.address && (
              <div className="group bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-8 hover:border-pink-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/20 text-center cursor-pointer hover:-translate-y-1">
                <div className="bg-gradient-to-br from-pink-500/20 to-pink-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-pink-500/30 group-hover:border-pink-400/50 transition-all">
                  <MapPin className="w-8 h-8 text-pink-300" />
                </div>
                <h3 className="font-bold text-lg mb-2">Location</h3>
                <p className="text-gray-400 mb-4 text-sm">{tenant.address}</p>
                <Button
                  variant="outline"
                  className="w-full border-pink-500/30 text-pink-300 hover:bg-pink-500/10 hover:border-pink-400/50"
                  onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(tenant.address!)}`)}
                >
                  Get Directions
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Hours Section */}
      {businessHours && (
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-black mb-4">
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Business Hours
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(businessHours).map(([day, hours]) => (
                <div key={day} className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-xl p-4 text-center hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/20">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">{day}</p>
                  <p className={`font-bold text-lg ${hours.isOpen ? 'text-green-300' : 'text-gray-500'}`}>
                    {hours.isOpen ? `${hours.openTime} - ${hours.closeTime}` : 'Closed'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="relative border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
            <div className="text-center md:text-left">
              <p className="text-gray-400 mb-2">© 2024 {tenant.businessName}</p>
              <p className="text-sm text-gray-500">Premium service platform</p>
            </div>
            <div className="flex gap-6">
              <Link href={`${protocol}://${rootDomain}`} className="text-gray-400 hover:text-blue-300 transition-colors text-sm">
                {rootDomain}
              </Link>
              <Link href="/tenant/login" className="text-gray-400 hover:text-blue-300 transition-colors text-sm font-medium">
                Admin Portal
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
