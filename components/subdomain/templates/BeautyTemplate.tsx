'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MapPin, Sparkles, Star, ChevronRight, Clock } from 'lucide-react';
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
  emoji: string; // masih di tipe, tapi tidak dipakai
  businessName: string;
  businessCategory: string; // masih di tipe, tapi tidak dipakai
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

interface BeautyTemplateProps {
  tenant: TenantData;
  services?: Service[];
  businessHours?: BusinessHours;
  videos?: VideoItem[];
  socialMedia?: SocialMediaLink[];
  galleries?: PhotoGallery[];
  videoOptions?: { videoSize: 'small' | 'medium' | 'large'; autoplay: boolean };
}

export default function BeautyTemplate({
  tenant,
  services = [],
  businessHours,
  videos = [],
  socialMedia = [],
  galleries = [],
  videoOptions
}: BeautyTemplateProps) {
  const [selectedService, setSelectedService] = useState<Service | undefined>();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);
  const [email, setEmail] = useState('');

  // Peach & Cream palette
  const defaultPrimary = '#F7C6A5'; // soft peach
  const primaryColor = tenant.brandColors?.primary || defaultPrimary;

  const handleBookService = (service?: Service) => {
    setSelectedService(service);
    setIsBookingOpen(true);
  };

  // Sample testimonials
  const testimonials = [
    {
      name: 'Siti Rahman',
      role: 'Regular Client',
      text: 'Absolutely love the service! The staff is so professional and the results are amazing. Always leaves me feeling pampered and refreshed.',
      rating: 5
    },
    {
      name: 'Bella Putri',
      role: 'Client',
      text: 'Best beauty experience ever! They really know their craft. Will definitely come back for my next appointment.',
      rating: 5
    },
    {
      name: 'Maya Sari',
      role: 'Client',
      text: 'Excellent attention to detail and such a relaxing atmosphere. Highly recommend to anyone looking for quality beauty services!',
      rating: 5
    }
  ];

  // Sample FAQ
  const faqItems = [
    {
      question: 'How do I book an appointment?',
      answer: 'Click the "Book Now" button and select your preferred service, date, and time. Our system will show available slots based on our schedule.'
    },
    {
      question: 'Can I reschedule or cancel my appointment?',
      answer: 'Yes! You can reschedule or cancel up to 24 hours before your appointment through your booking confirmation email.'
    },
    {
      question: 'Do you use quality products?',
      answer: 'Absolutely! We use only premium, professional-grade beauty products that are safe and effective for all skin types.'
    },
    {
      question: 'Is there a first-time customer discount?',
      answer: 'We offer special discounts for first-time clients. Ask about our welcome package when you book your appointment!'
    }
  ];

  // Sample stats
  const stats = [
    { number: '2000+', label: 'Happy Clients' },
    { number: '4.9', label: 'Rating', sub: '/5.0' },
    { number: '5+', label: 'Years Experience' },
    { number: '50+', label: 'Services' }
  ];

  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const todayHours = businessHours?.[currentDay];
  const isOpen = todayHours?.isOpen || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF1E6] via-[#FFF7F0] to-[#FFF1E6]">

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-[#FDE4D2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              {tenant.logo && (
                <img
                  src={tenant.logo}
                  alt={tenant.businessName}
                  className="h-12 w-12 rounded-full object-cover"
                />
              )}

              <div>
                <h1 className="text-xl font-semibold bg-gradient-to-r from-[#E3A078] to-[#F7C6A5] bg-clip-text text-transparent">
                  {tenant.businessName}
                </h1>
                {todayHours && (
                  <p className="text-xs text-[#8C5B38]">
                    {isOpen ? '✓ Open' : '✗ Closed'} • {isOpen ? `Until ${todayHours.closeTime}` : 'See Hours'}
                  </p>
                )}
              </div>
            </div>

            <Button
              size="lg"
              style={{ backgroundColor: primaryColor }}
              className="text-white shadow-sm"
              onClick={() => handleBookService()}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Book Now
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#E3A078] to-[#F7C6A5] bg-clip-text text-transparent">
            {tenant.businessName}
          </h2>

          {tenant.businessDescription && (
            <p className="text-lg md:text-xl text-[#6B5B4A] mb-8">
              {tenant.businessDescription}
            </p>
          )}

          <Button
            size="lg"
            className="text-white text-lg px-8 py-3 shadow-md"
            style={{ backgroundColor: primaryColor }}
            onClick={() => handleBookService()}
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Book Your Transformation
          </Button>
        </div>
      </section>

      {/* Services Grid */}
      {services.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-[#E3A078] to-[#F7C6A5] bg-clip-text text-transparent">
              Premium Services
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.slice(0, 9).map((service) => (
                <Card
                  key={service.id}
                  className="group hover:shadow-xl transition-all duration-300 overflow-hidden border border-[#FDE4D2] bg-white/80 backdrop-blur flex flex-col h-full rounded-2xl"
                >
                  {/* Top Accent Line */}
                  <div className="h-1 bg-gradient-to-r from-[#F7C6A5] to-[#E3A078]" />

                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-[#4A3B30]">
                      {service.name}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="flex flex-col flex-1 space-y-4">
                    <div className="flex-1 space-y-4">
                      {service.description && (
                        <p className="text-sm text-[#7C6B5A]">
                          {service.description}
                        </p>
                      )}

                      <div className="space-y-2 py-3 border-y border-[#FDE4D2]">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-[#6B5B4A]">Duration</span>
                          <span className="font-semibold text-[#4A3B30]">
                            {service.duration} min
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-[#6B5B4A]">Price</span>
                          <span className="text-xl font-bold bg-gradient-to-r from-[#E3A078] to-[#F7C6A5] bg-clip-text text-transparent">
                            IDR {Number(service.price).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      {service.homeVisitAvailable && (
                        <div className="p-2 rounded-md text-sm font-medium text-[#8C5B38] bg-[#FFF1E6]">
                          ✨ Home visit available (+IDR{' '}
                          {Number(service.homeVisitSurcharge || 0).toLocaleString('id-ID')})
                        </div>
                      )}
                    </div>

                    <Button
                      className="w-full text-white mt-4 shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                      onClick={() => handleBookService(service)}
                    >
                      Book Service
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#FFF7F0]/80">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-[#E3A078] to-[#F7C6A5] bg-clip-text text-transparent">
            Why Choose Us
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '👑', title: 'Premium Quality', desc: 'Best products & techniques' },
              { icon: '✨', title: 'Expert Team', desc: 'Certified professionals' },
              { icon: '⏰', title: 'Quick Booking', desc: 'Reserve instantly online' },
              { icon: '😊', title: 'Satisfaction', desc: '100% satisfaction guaranteed' }
            ].map((item, idx) => (
              <div
                key={idx}
                className="text-center bg-white/70 border border-[#FDE4D2] rounded-2xl px-4 py-6 shadow-sm"
              >
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-semibold mb-1 text-[#4A3B30]">{item.title}</h3>
                <p className="text-sm text-[#7C6B5A]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-[#E3A078] to-[#F7C6A5] bg-clip-text text-transparent">
            Get in Touch
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tenant.phone && (
              <Card className="border-0 bg-gradient-to-br from-[#FFF7F0] to-[#FFF1E6] rounded-2xl shadow-sm">
                <CardContent className="pt-6 text-center">
                  <Phone
                    className="h-8 w-8 mx-auto mb-4"
                    style={{ color: primaryColor }}
                  />
                  <p className="font-semibold mb-2 text-[#4A3B30]">Call Us</p>
                  <a
                    href={`tel:${tenant.phone}`}
                    className="text-sm text-[#8C5B38] hover:underline"
                  >
                    {tenant.phone}
                  </a>
                </CardContent>
              </Card>
            )}

            {tenant.email && (
              <Card className="border-0 bg-gradient-to-br from-[#FFF7F0] to-white rounded-2xl shadow-sm">
                <CardContent className="pt-6 text-center">
                  <Mail
                    className="h-8 w-8 mx-auto mb-4"
                    style={{ color: primaryColor }}
                  />
                  <p className="font-semibold mb-2 text-[#4A3B30]">Email Us</p>
                  <a
                    href={`mailto:${tenant.email}`}
                    className="text-sm text-[#8C5B38] hover:underline"
                  >
                    {tenant.email}
                  </a>
                </CardContent>
              </Card>
            )}

            {tenant.address && (
              <Card className="border-0 bg-gradient-to-br from-white to-[#FFF1E6] rounded-2xl shadow-sm">
                <CardContent className="pt-6 text-center">
                  <MapPin
                    className="h-8 w-8 mx-auto mb-4"
                    style={{ color: primaryColor }}
                  />
                  <p className="font-semibold mb-2 text-[#4A3B30]">Location</p>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(tenant.address)}`}
                    className="text-sm text-[#8C5B38] hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Map
                  </a>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FFF7F0]/80">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-[#E3A078] to-[#F7C6A5] bg-clip-text text-transparent">
            What Our Clients Say
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="border-0 bg-white/80 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-[#6B5B4A] leading-relaxed italic">"{testimonial.text}"</p>
                  <div className="pt-2 border-t border-[#FDE4D2]">
                    <p className="font-semibold text-[#4A3B30]">{testimonial.name}</p>
                    <p className="text-xs text-[#8C5B38]">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Business Hours Grid */}
      {businessHours && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-[#FDE4D2]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-[#E3A078] to-[#F7C6A5] bg-clip-text text-transparent">
              Our Hours
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(businessHours).map(([day, hours]) => (
                <div key={day} className="p-5 rounded-xl bg-gradient-to-br from-[#FFF7F0] to-[#FFF1E6] border border-[#FDE4D2] hover:shadow-md transition-all text-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#8C5B38] mb-2">
                    {day}
                  </p>
                  <p className={`text-sm font-semibold ${hours.isOpen ? 'text-[#4A3B30]' : 'text-gray-400'}`}>
                    {hours.isOpen ? `${hours.openTime} - ${hours.closeTime}` : 'Closed'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FFF7F0]/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-[#E3A078] to-[#F7C6A5] bg-clip-text text-transparent">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                className="w-full text-left p-6 bg-white border border-[#FDE4D2] rounded-2xl hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[#4A3B30] text-lg">{item.question}</h3>
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-transform"
                    style={{ backgroundColor: primaryColor + '20', color: primaryColor, transform: expandedFAQ === idx ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
                
                {expandedFAQ === idx && (
                  <p className="mt-4 text-[#6B5B4A] leading-relaxed">
                    {item.answer}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-[#FDE4D2]">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#E3A078] to-[#F7C6A5] bg-clip-text text-transparent">
              Stay Updated
            </h2>
            <p className="text-[#6B5B4A] text-lg">
              Get special offers, beauty tips, and updates delivered to your inbox
            </p>
          </div>

          <div className="flex gap-2 flex-col sm:flex-row">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-[#FDE4D2] bg-white/70 placeholder-[#8C5B38] focus:outline-none focus:ring-2"
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
              className="text-white hover:opacity-90 transition-opacity rounded-xl px-8"
            >
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      {/* Videos */}
      {videos.length > 0 && (
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

      {/* Social Media */}
      {socialMedia.length > 0 && (
        <SocialMediaSection
          socialMedia={socialMedia}
          displayType="icons"
          title="Follow Us"
          primaryColor={primaryColor}
          orientation="horizontal"
        />
      )}

      {/* Photo Galleries */}
      {galleries &&
        galleries.map((gallery) => (
          <PhotoGallerySection
            key={gallery.id}
            gallery={gallery}
            primaryColor={primaryColor}
          />
        ))}

      {/* Footer */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#E3A078] to-[#F7C6A5] text-white border-t border-[#FDE4D2]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 mb-8">
            {/* Brand Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                {tenant.logo && (
                  <img src={tenant.logo} alt={tenant.businessName} className="h-8 w-8 rounded-full object-cover" />
                )}
                <div>
                  <p className="font-semibold text-white">{tenant.businessName}</p>
                  <p className="text-xs text-white/80">{tenant.businessCategory}</p>
                </div>
              </div>
              {tenant.businessDescription && (
                <p className="text-sm text-white/90 max-w-xs">
                  {tenant.businessDescription}
                </p>
              )}
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-white/90">
                <li><button onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Services</button></li>
                <li><button onClick={() => handleBookService()} className="hover:text-white transition-colors">Book Appointment</button></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#hours" className="hover:text-white transition-colors">Hours</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-white/90">
                {tenant.phone && <li><a href={`tel:${tenant.phone}`} className="hover:text-white transition-colors">{tenant.phone}</a></li>}
                {tenant.email && <li><a href={`mailto:${tenant.email}`} className="hover:text-white transition-colors">{tenant.email}</a></li>}
                {tenant.address && <li className="text-sm">{tenant.address}</li>}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/20 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/80">
            <p>© {new Date().getFullYear()} {tenant.businessName}. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href={`${protocol}://${rootDomain}`} className="hover:text-white">
                {rootDomain}
              </Link>
              <span>•</span>
              <Link href="/tenant/login" className="hover:text-white font-medium">
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
        template="beauty"
        isOpen={isBookingOpen}
        onOpenChange={setIsBookingOpen}
      />
    </div>
  );
}
