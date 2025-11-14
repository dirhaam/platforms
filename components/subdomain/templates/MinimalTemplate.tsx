'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MapPin, Clock, ChevronRight, Star, Users, Award, CheckCircle, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';
import { protocol, rootDomain } from '@/lib/utils';
import BookingDialog from '@/components/booking/BookingDialog';
import VideoSection from '@/components/subdomain/sections/VideoSection';
import SocialMediaSection from '@/components/subdomain/sections/SocialMediaSection';
import PhotoGallerySection from '@/components/subdomain/sections/PhotoGallerySection';
import { Service, VideoItem, SocialMediaLink, PhotoGallery } from '@/types/booking';

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
  videos?: VideoItem[];
  socialMedia?: SocialMediaLink[];
  galleries?: PhotoGallery[];
}

export default function MinimalTemplate({ 
  tenant, 
  services = [], 
  businessHours,
  videos = [],
  socialMedia = [],
  galleries = []
}: MinimalTemplateProps) {
  const [selectedService, setSelectedService] = useState<Service | undefined>();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);
  
  const primaryColor = tenant.brandColors?.primary || '#000000';
  const secondaryColor = tenant.brandColors?.secondary || '#666666';
  
  const handleBookService = (service?: Service) => {
    setSelectedService(service);
    setIsBookingOpen(true);
  };

  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const todayHours = businessHours?.[currentDay];
  const isOpen = todayHours?.isOpen || false;

  // Group services by category
  const servicesByCategory = services.reduce((acc, service) => {
    const cat = service.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(service);
    return acc;
  }, {} as Record<string, typeof services>);

  // Sample FAQ data
  const faqItems = [
    {
      question: 'How do I book an appointment?',
      answer: 'Click the "Book Appointment" button to select your preferred service, date, and time. Our system will show available slots based on current bookings.'
    },
    {
      question: 'Can I cancel or reschedule?',
      answer: 'Yes, you can cancel or reschedule your appointment up to 24 hours before the scheduled time through your booking confirmation email or our website.'
    },
    {
      question: 'Do you offer home visits?',
      answer: `Some of our services include home visit options. Check individual service details during booking for availability in your area.`
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major payment methods including credit cards, debit cards, and digital wallets through our secure payment system.'
    }
  ];

  // Sample testimonials
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Client',
      text: 'Outstanding service! Professional, on-time, and exactly what I needed. Highly recommended!',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Client',
      text: 'Great experience from booking to completion. The team was courteous and efficient.',
      rating: 5
    },
    {
      name: 'Emma Davis',
      role: 'Client',
      text: 'Excellent attention to detail. Worth every penny. Will definitely book again!',
      rating: 5
    }
  ];

  // Sample stats
  const stats = [
    { number: '1000+', label: 'Happy Clients' },
    { number: '4.9', label: 'Average Rating', sub: '/5' },
    { number: '10+', label: 'Years Experience' },
    { number: '500+', label: 'Services Completed' }
  ];

  return (
    <div className="min-h-screen bg-white" style={{ '--primary-color': primaryColor } as React.CSSProperties}>
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            {tenant.logo ? (
              <img src={tenant.logo} alt={tenant.businessName} className="h-9 w-9 rounded object-cover" />
            ) : (
              <div className="text-2xl">{tenant.emoji}</div>
            )}
            <div className="hidden sm:block">
              <p className="font-semibold text-sm text-gray-900">{tenant.businessName}</p>
              <p className="text-xs text-gray-500">{tenant.businessCategory}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {todayHours && (
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200">
                <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs font-medium text-gray-600">
                  {isOpen ? 'Open' : 'Closed'}
                </span>
              </div>
            )}
            <Button 
              onClick={() => handleBookService()}
              size="sm"
              style={{ backgroundColor: primaryColor }}
              className="text-white hover:opacity-90 transition-opacity"
            >
              Book Now
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Main Title */}
            <div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-4" style={{ color: primaryColor }}>
                {tenant.businessName}
              </h1>
              <p className="text-lg font-medium" style={{ color: secondaryColor }}>
                {tenant.businessCategory}
              </p>
            </div>

            {/* Description */}
            {tenant.businessDescription && (
              <p className="text-lg leading-relaxed text-gray-700 max-w-2xl">
                {tenant.businessDescription}
              </p>
            )}

            {/* Key Features */}
            <div className="space-y-3">
              {[
                { icon: CheckCircle, text: 'Professional & Certified' },
                { icon: Clock, text: 'Flexible Scheduling' },
                { icon: Home, text: 'Home Visits Available' }
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <feature.icon className="w-5 h-5" style={{ color: primaryColor }} />
                  <span className="text-gray-700 font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                size="lg"
                onClick={() => handleBookService()}
                style={{ backgroundColor: primaryColor }}
                className="text-white hover:opacity-90 transition-opacity"
              >
                Book Appointment
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
              >
                View Services
              </Button>
            </div>

            {/* Quick Info */}
            {todayHours && (
              <div className="pt-4 space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Today:</span> {isOpen ? `Open • ${todayHours.openTime} - ${todayHours.closeTime}` : 'Closed'}
                </p>
              </div>
            )}
          </div>

          {/* Right - Stats Card */}
          <div className="hidden md:block">
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
              <div className="space-y-8">
                {stats.map((stat, i) => (
                  <div key={i} className="pb-8 border-b border-gray-200 last:pb-0 last:border-0">
                    <p className="text-4xl font-bold" style={{ color: primaryColor }}>
                      {stat.number}
                      {stat.sub && <span className="text-xl font-normal ml-1">{stat.sub}</span>}
                    </p>
                    <p className="text-gray-600 mt-2">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      {services.length > 0 && (
        <section id="services" className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-gray-100 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4" style={{ color: primaryColor }}>
                Our Services
              </h2>
              <p className="text-gray-600 text-lg">Choose from our comprehensive selection of professional services</p>
            </div>

            {/* Services by Category */}
            {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
              <div key={category} className="mb-16">
                <h3 className="text-2xl font-bold mb-8 text-gray-900">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryServices.slice(0, 6).map((service) => (
                    <button
                      key={service.id}
                      onClick={() => handleBookService(service)}
                      className="group p-6 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 text-left"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-gray-900 text-lg group-hover:opacity-75 transition-opacity">
                            {service.name}
                          </h4>
                          {service.homeVisitAvailable && (
                            <Home className="w-4 h-4" style={{ color: primaryColor }} />
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {service.duration} min
                          </span>
                          <span className="font-semibold" style={{ color: primaryColor }}>
                            IDR {Number(service.price).toLocaleString('id-ID')}
                          </span>
                        </div>

                        {service.description && (
                          <p className="text-sm text-gray-600">{service.description}</p>
                        )}

                        <div className="pt-4 flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Book Service
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" style={{ color: primaryColor, opacity: 0.5 }} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4" style={{ color: primaryColor }}>
              Client Testimonials
            </h2>
            <p className="text-gray-600 text-lg">What our clients say about us</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="p-8 rounded-xl bg-gray-50 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed">"{testimonial.text}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold mb-16" style={{ color: primaryColor }}>
            Get In Touch
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Phone */}
            {tenant.phone && (
              <a 
                href={`tel:${tenant.phone}`}
                className="group p-6 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
              >
                <Phone className="w-8 h-8 mb-4" style={{ color: primaryColor }} />
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 font-semibold">Phone</p>
                <p className="font-semibold text-gray-900 group-hover:opacity-75 transition-opacity">
                  {tenant.phone}
                </p>
              </a>
            )}

            {/* Email */}
            {tenant.email && (
              <a 
                href={`mailto:${tenant.email}`}
                className="group p-6 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
              >
                <Mail className="w-8 h-8 mb-4" style={{ color: primaryColor }} />
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 font-semibold">Email</p>
                <p className="font-semibold text-gray-900 group-hover:opacity-75 transition-opacity break-all">
                  {tenant.email}
                </p>
              </a>
            )}

            {/* Address */}
            {tenant.address && (
              <a 
                href={`https://maps.google.com/?q=${encodeURIComponent(tenant.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-6 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
              >
                <MapPin className="w-8 h-8 mb-4" style={{ color: primaryColor }} />
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 font-semibold">Location</p>
                <p className="font-semibold text-gray-900 group-hover:opacity-75 transition-opacity text-sm">
                  {tenant.address}
                </p>
              </a>
            )}

            {/* Hours */}
            {todayHours && (
              <div className="p-6 rounded-xl bg-white border border-gray-200">
                <Clock className="w-8 h-8 mb-4" style={{ color: primaryColor }} />
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 font-semibold">Today</p>
                <p className="font-semibold text-gray-900">
                  {isOpen ? `${todayHours.openTime} - ${todayHours.closeTime}` : 'Closed'}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Business Hours Grid */}
      {businessHours && (
        <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold mb-12" style={{ color: primaryColor }}>
              Business Hours
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(businessHours).map(([day, hours]) => (
                <div key={day} className="p-5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-white hover:shadow-md transition-all">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {day}
                  </p>
                  <p className={`text-sm font-bold ${hours.isOpen ? 'text-gray-900' : 'text-gray-400'}`}>
                    {hours.isOpen ? `${hours.openTime} - ${hours.closeTime}` : 'Closed'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold mb-16" style={{ color: primaryColor }}>
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <button
                key={index}
                onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                className="w-full text-left p-6 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 text-lg">{item.question}</h3>
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-transform"
                    style={{ backgroundColor: primaryColor + '20', color: primaryColor, transform: expandedFAQ === index ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
                
                {expandedFAQ === index && (
                  <p className="mt-4 text-gray-600 leading-relaxed">
                    {item.answer}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4" style={{ color: primaryColor }}>
              Stay Updated
            </h2>
            <p className="text-gray-600 text-lg">
              Get special offers and updates delivered to your inbox
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2"
              style={{ focusRingColor: primaryColor + '30' } as any}
            />
            <Button 
              onClick={() => {
                if (email) {
                  // Handle newsletter signup
                  setEmail('');
                }
              }}
              style={{ backgroundColor: primaryColor }}
              className="text-white hover:opacity-90 transition-opacity"
            >
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      {/* Videos Section */}
      {videos && videos.length > 0 && (
        <VideoSection 
          videos={videos} 
          displayType="grid"
          title="Our Videos"
          primaryColor={primaryColor}
        />
      )}

      {/* Social Media Section */}
      {socialMedia && socialMedia.length > 0 && (
        <SocialMediaSection 
          socialMedia={socialMedia}
          displayType="icons"
          title="Follow Us"
          primaryColor={primaryColor}
          orientation="horizontal"
        />
      )}

      {/* Photo Gallery Section */}
      {galleries && galleries.map((gallery) => (
        <PhotoGallerySection 
          key={gallery.id}
          gallery={gallery}
          primaryColor={primaryColor}
        />
      ))}

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                {tenant.logo ? (
                  <img src={tenant.logo} alt={tenant.businessName} className="h-8 w-8 rounded object-cover" />
                ) : (
                  <div className="text-2xl">{tenant.emoji}</div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{tenant.businessName}</p>
                  <p className="text-sm text-gray-500">{tenant.businessCategory}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 max-w-xs">
                Professional {tenant.businessCategory.toLowerCase()} services with a commitment to excellence.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><button onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-gray-900 transition-colors">Services</button></li>
                <li><button onClick={() => handleBookService()} className="hover:text-gray-900 transition-colors">Book Appointment</button></li>
                <li><a href="#contact" className="hover:text-gray-900 transition-colors">Contact</a></li>
                <li><a href="#hours" className="hover:text-gray-900 transition-colors">Hours</a></li>
              </ul>
            </div>

            {/* Contact Links */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                {tenant.phone && <li><a href={`tel:${tenant.phone}`} className="hover:text-gray-900 transition-colors">{tenant.phone}</a></li>}
                {tenant.email && <li><a href={`mailto:${tenant.email}`} className="hover:text-gray-900 transition-colors">{tenant.email}</a></li>}
                {tenant.address && <li className="text-sm">{tenant.address}</li>}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <p>© {new Date().getFullYear()} {tenant.businessName}. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href={`${protocol}://${rootDomain}`} className="hover:text-gray-700">
                {rootDomain}
              </Link>
              <span>•</span>
              <Link href="/tenant/login" className="hover:text-gray-700 font-medium">
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
        template="minimal"
        isOpen={isBookingOpen}
        onOpenChange={setIsBookingOpen}
      />
    </div>
  );
}
