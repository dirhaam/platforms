'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MapPin, Clock, Shield, Heart, Users, Star, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { protocol, rootDomain } from '@/lib/utils';
import BookingDialog from '@/components/booking/BookingDialog';
import BusinessHoursDisplay from '@/components/subdomain/BusinessHoursDisplay';
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

interface HealthcareTemplateProps {
  tenant: TenantData;
  services?: Service[];
  businessHours?: BusinessHours;
  videos?: VideoItem[];
  socialMedia?: SocialMediaLink[];
  galleries?: PhotoGallery[];
  videoOptions?: { videoSize: 'small'|'medium'|'large'; autoplay: boolean };
}

export default function HealthcareTemplate({ 
  tenant, 
  services = [], 
  businessHours,
  videos = [],
  socialMedia = [],
  galleries = [],
  videoOptions
}: HealthcareTemplateProps) {
  const [selectedService, setSelectedService] = useState<Service | undefined>();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);
  const [email, setEmail] = useState('');
  
  const primaryColor = tenant.brandColors?.primary || '#0369a1';
  
  const handleBookService = (service?: Service) => {
    setSelectedService(service);
    setIsBookingOpen(true);
  };

  // Sample testimonials
  const testimonials = [
    {
      name: 'Dr. Patient Testimonial',
      role: 'Patient',
      text: 'Excellent medical care with very professional and knowledgeable staff. They made me feel comfortable and addressed all my concerns.',
      rating: 5
    },
    {
      name: 'Maria Santoso',
      role: 'Patient',
      text: 'Great experience! The doctors are highly skilled and the clinic is very clean. I highly recommend this healthcare provider!',
      rating: 5
    },
    {
      name: 'Budi Setiawan',
      role: 'Patient',
      text: 'Outstanding patient care from start to finish. The staff is caring and the treatment was effective. Will definitely come back!',
      rating: 5
    }
  ];

  // Sample FAQ
  const faqItems = [
    {
      question: 'How do I schedule an appointment?',
      answer: 'Click the "Schedule Appointment" button and select your preferred service, date, and time. You can also call us directly at the phone number provided.'
    },
    {
      question: 'What insurance does your clinic accept?',
      answer: 'We accept most major health insurance plans. Please contact us to confirm if your specific insurance is accepted.'
    },
    {
      question: 'Do you accept walk-in patients?',
      answer: 'While walk-ins are welcome, scheduling an appointment ensures shorter wait times and availability of your preferred doctor.'
    },
    {
      question: 'What are your emergency procedures?',
      answer: 'For medical emergencies, please call our emergency line or visit the nearest emergency room. We are available for urgent care during business hours.'
    }
  ];

  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const todayHours = businessHours?.[currentDay];
  const isOpen = todayHours?.isOpen || false;

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
                        IDR {Number(service.price).toLocaleString('id-ID')}
                      </span>
                    </div>

                    {service.homeVisitAvailable && (
                      <div className="p-3 bg-blue-50 rounded text-sm text-blue-800 border border-blue-200">
                        🏥 Home visit available (IDR {Number(service.homeVisitSurcharge || 0).toLocaleString('id-ID')})
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

      {/* Testimonials Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12" style={{ color: primaryColor }}>
            Patient Testimonials
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="border border-blue-100 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 leading-relaxed italic">"{testimonial.text}"</p>
                  <div className="pt-2 border-t border-blue-100">
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-xs text-gray-500">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12" style={{ color: primaryColor }}>
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                className="w-full text-left p-5 bg-white border border-blue-100 rounded-lg hover:border-blue-200 transition-all"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{item.question}</h3>
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-transform"
                    style={{ 
                      backgroundColor: primaryColor + '20',
                      color: primaryColor,
                      transform: expandedFAQ === idx ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
                
                {expandedFAQ === idx && (
                  <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                    {item.answer}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div>
            <h2 className="text-4xl font-bold mb-4" style={{ color: primaryColor }}>
              Stay Informed
            </h2>
            <p className="text-gray-600 text-lg">
              Subscribe to our newsletter for health tips and updates
            </p>
          </div>

          <div className="flex gap-2 flex-col sm:flex-row">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg border border-blue-200 focus:outline-none focus:ring-2"
              style={{ focusRingColor: primaryColor + '30' } as any}
            />
            <Button 
              onClick={() => {
                if (email) {
                  setEmail('');
                }
              }}
              style={{ backgroundColor: primaryColor }}
              className="text-white hover:opacity-90 transition-opacity rounded-lg"
            >
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      {/* Videos Inline (no section/header) */}
      {videos && videos.length > 0 && (
        <VideoSection 
          videos={videos} 
          displayType="grid"
          primaryColor={primaryColor}
          mode="inline"
          showHeader={false}
          size={videoOptions?.videoSize}
          autoplay={videoOptions?.autoplay}
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
      <footer className="py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: primaryColor, color: 'white' }}>
        <div className="max-w-6xl mx-auto text-center">
          <p className="font-semibold mb-2">{tenant.businessName}</p>
          <p className="text-sm opacity-90 mb-4">
            Providing quality healthcare services since 2024
          </p>
          <p className="text-xs opacity-75">
            © 2024 {tenant.businessName}. All rights reserved.
          </p>
          <p className="text-xs opacity-75 mt-2 flex flex-wrap justify-center gap-2">
            Powered by <Link href={`${protocol}://${rootDomain}`} className="hover:underline">{rootDomain}</Link>
            <span>•</span>
            <Link href="/tenant/login" className="hover:underline text-blue-500 font-medium">Business Admin Login</Link>
          </p>
        </div>
      </footer>

      {/* Booking Dialog */}
      <BookingDialog
        service={selectedService}
        tenant={tenant}
        template="healthcare"
        isOpen={isBookingOpen}
        onOpenChange={setIsBookingOpen}
      />
    </div>
  );
}
