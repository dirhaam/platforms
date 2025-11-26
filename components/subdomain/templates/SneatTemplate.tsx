'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MapPin, Clock, ChevronRight, ChevronDown, Star, Users, Award, CheckCircle, ArrowRight, Home, Calendar, Menu, X } from 'lucide-react';
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

interface SneatTemplateProps {
  tenant: TenantData;
  services?: Service[];
  businessHours?: BusinessHours;
  videos?: VideoItem[];
  socialMedia?: SocialMediaLink[];
  galleries?: PhotoGallery[];
  videoOptions?: { videoSize: 'small' | 'medium' | 'large'; autoplay: boolean };
}

const PRIMARY_COLOR = '#696cff';
const PRIMARY_LIGHT = '#e7e7ff';
const SECONDARY_COLOR = '#8592a3';
const SUCCESS_COLOR = '#71dd37';
const DANGER_COLOR = '#ff3e1d';
const WARNING_COLOR = '#ffab00';
const INFO_COLOR = '#03c3ec';
const BG_BODY = '#f5f5f9';
const TEXT_PRIMARY = '#566a7f';
const TEXT_SECONDARY = '#697a8d';
const TEXT_MUTED = '#a1acb8';

export default function SneatTemplate({
  tenant,
  services = [],
  businessHours,
  videos = [],
  socialMedia = [],
  galleries = [],
  videoOptions
}: SneatTemplateProps) {
  const [selectedService, setSelectedService] = useState<Service | undefined>();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState('');

  const primaryColor = tenant.brandColors?.primary || PRIMARY_COLOR;

  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const todayHours = businessHours?.[currentDay];
  const isOpenToday = todayHours?.isOpen || false;

  const handleBookService = (service?: Service) => {
    setSelectedService(service);
    setIsBookingOpen(true);
    setMobileMenuOpen(false);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const servicesByCategory = services.reduce((acc, service) => {
    const cat = service.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(service);
    return acc;
  }, {} as Record<string, typeof services>);

  const testimonials = [
    { name: 'Sarah M.', role: 'Regular Customer', text: 'Pelayanan sangat profesional dan ramah. Sangat merekomendasikan!', rating: 5 },
    { name: 'Budi H.', role: 'Customer', text: 'Hasil memuaskan, harga terjangkau. Pasti akan kembali lagi!', rating: 5 },
    { name: 'Linda K.', role: 'Customer', text: 'Tempat nyaman, staf profesional. Pengalaman yang menyenangkan!', rating: 5 }
  ];

  const faqItems = [
    { question: 'Bagaimana cara melakukan booking?', answer: 'Klik tombol "Book Now", pilih layanan yang diinginkan, pilih tanggal dan waktu yang tersedia, lalu konfirmasi booking Anda.' },
    { question: 'Apakah bisa reschedule atau cancel?', answer: 'Ya, Anda dapat melakukan reschedule atau cancel booking hingga 24 jam sebelum jadwal yang ditentukan melalui email konfirmasi.' },
    { question: 'Apakah tersedia layanan home visit?', answer: 'Beberapa layanan kami tersedia untuk home visit. Silakan cek detail layanan saat melakukan booking.' },
    { question: 'Metode pembayaran apa saja yang diterima?', answer: 'Kami menerima berbagai metode pembayaran termasuk transfer bank, e-wallet, dan pembayaran langsung di lokasi.' }
  ];

  const stats = [
    { number: '1000+', label: 'Happy Clients', icon: Users },
    { number: '4.9', label: 'Rating', icon: Star },
    { number: '5+', label: 'Years Experience', icon: Award }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG_BODY, fontFamily: "'Public Sans', sans-serif" }}>
      {/* Navbar - Detached Style */}
      <nav className="sticky top-0 z-50 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <div 
          className="max-w-7xl mx-auto bg-white/95 backdrop-blur-sm rounded-lg shadow-[0_0.375rem_1rem_0_rgba(161,172,184,0.15)] px-4 sm:px-6 py-3 flex justify-between items-center"
        >
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            {tenant.logo ? (
              <img src={tenant.logo} alt={tenant.businessName} className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg object-cover" />
            ) : (
              <div 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-lg sm:text-xl"
                style={{ backgroundColor: PRIMARY_LIGHT, color: primaryColor }}
              >
                {tenant.emoji}
              </div>
            )}
            <div className="hidden xs:block">
              <p className="font-semibold text-sm sm:text-base" style={{ color: TEXT_PRIMARY }}>{tenant.businessName}</p>
              <p className="text-xs" style={{ color: TEXT_MUTED }}>{tenant.businessCategory}</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <button onClick={() => scrollToSection('services')} className="text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: TEXT_SECONDARY }}>
              Services
            </button>
            <button onClick={() => scrollToSection('testimonials')} className="text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: TEXT_SECONDARY }}>
              Testimonials
            </button>
            <button onClick={() => scrollToSection('contact')} className="text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: TEXT_SECONDARY }}>
              Contact
            </button>
            {isOpenToday && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md" style={{ backgroundColor: '#e8fadf' }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: SUCCESS_COLOR }}></div>
                <span className="text-xs font-medium" style={{ color: SUCCESS_COLOR }}>Open</span>
              </div>
            )}
            <Button
              onClick={() => handleBookService()}
              className="text-white text-sm rounded-md shadow-md hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primaryColor }}
            >
              Book Now
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {isOpenToday && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ backgroundColor: '#e8fadf' }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: SUCCESS_COLOR }}></div>
                <span className="text-xs font-medium" style={{ color: SUCCESS_COLOR }}>Open</span>
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              style={{ color: TEXT_SECONDARY }}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 max-w-7xl mx-auto bg-white rounded-lg shadow-[0_2px_6px_0_rgba(67,89,113,0.12)] p-4 space-y-3">
            <button onClick={() => scrollToSection('services')} className="block w-full text-left px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium" style={{ color: TEXT_SECONDARY }}>
              Services
            </button>
            <button onClick={() => scrollToSection('testimonials')} className="block w-full text-left px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium" style={{ color: TEXT_SECONDARY }}>
              Testimonials
            </button>
            <button onClick={() => scrollToSection('contact')} className="block w-full text-left px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium" style={{ color: TEXT_SECONDARY }}>
              Contact
            </button>
            <Button
              onClick={() => handleBookService()}
              className="w-full text-white text-sm rounded-md shadow-md"
              style={{ backgroundColor: primaryColor }}
            >
              Book Now
            </Button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="px-3 sm:px-4 lg:px-6 py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-[0_2px_6px_0_rgba(67,89,113,0.12)] overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-0">
              {/* Left Content */}
              <div className="p-6 sm:p-8 lg:p-12 flex flex-col justify-center">
                <Badge 
                  className="w-fit mb-4 text-xs font-bold uppercase px-3 py-1 rounded"
                  style={{ backgroundColor: PRIMARY_LIGHT, color: primaryColor }}
                >
                  ✨ Welcome
                </Badge>
                
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{ color: TEXT_PRIMARY }}>
                  {tenant.businessName}
                </h1>
                
                <p className="text-base sm:text-lg mb-6" style={{ color: TEXT_SECONDARY }}>
                  {tenant.businessDescription || `Layanan ${tenant.businessCategory} profesional dengan kualitas terbaik untuk Anda.`}
                </p>

                {/* Stats Row */}
                <div className="flex flex-wrap gap-4 sm:gap-6 mb-8">
                  {stats.map((stat, i) => (
                    <div key={i} className="flex items-center gap-2 sm:gap-3">
                      <div 
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: PRIMARY_LIGHT }}
                      >
                        <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: primaryColor }} />
                      </div>
                      <div>
                        <p className="text-lg sm:text-xl font-bold" style={{ color: TEXT_PRIMARY }}>{stat.number}</p>
                        <p className="text-xs" style={{ color: TEXT_MUTED }}>{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    onClick={() => handleBookService()}
                    className="text-white rounded-md shadow-md hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Appointment
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => scrollToSection('services')}
                    className="rounded-md"
                    style={{ borderColor: '#d9dee3', color: TEXT_SECONDARY }}
                  >
                    View Services
                  </Button>
                </div>

                {/* Today Hours */}
                {todayHours && (
                  <div className="mt-6 flex items-center gap-2 text-sm" style={{ color: TEXT_MUTED }}>
                    <Clock className="w-4 h-4" />
                    <span>Today: {isOpenToday ? `${todayHours.openTime} - ${todayHours.closeTime}` : 'Closed'}</span>
                  </div>
                )}
              </div>

              {/* Right - Image/Logo */}
              <div 
                className="hidden lg:flex items-center justify-center p-12"
                style={{ background: `linear-gradient(135deg, ${PRIMARY_LIGHT} 0%, #f0f0ff 100%)` }}
              >
                {tenant.logo ? (
                  <img src={tenant.logo} alt={tenant.businessName} className="max-w-xs w-full rounded-lg shadow-lg" />
                ) : (
                  <div className="text-9xl">{tenant.emoji}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      {services.length > 0 && (
        <section id="services" className="px-3 sm:px-4 lg:px-6 py-8 sm:py-12 lg:py-16">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3" style={{ color: TEXT_PRIMARY }}>
                Our Services
              </h2>
              <p className="text-sm sm:text-base max-w-2xl mx-auto" style={{ color: TEXT_SECONDARY }}>
                Pilih layanan yang sesuai dengan kebutuhan Anda
              </p>
            </div>

            {/* Services by Category */}
            {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
              <div key={category} className="mb-8 sm:mb-12">
                <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 px-1" style={{ color: TEXT_PRIMARY }}>
                  {category}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {categoryServices.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => handleBookService(service)}
                      className="bg-white rounded-lg shadow-[0_2px_6px_0_rgba(67,89,113,0.12)] p-5 sm:p-6 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 group"
                    >
                      {/* Service Header */}
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-base sm:text-lg font-semibold group-hover:opacity-80 transition-opacity" style={{ color: TEXT_PRIMARY }}>
                          {service.name}
                        </h4>
                        {service.homeVisitAvailable && (
                          <div 
                            className="p-1.5 rounded"
                            style={{ backgroundColor: '#e8fadf' }}
                          >
                            <Home className="w-4 h-4" style={{ color: SUCCESS_COLOR }} />
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {service.description && (
                        <p className="text-sm mb-4 line-clamp-2" style={{ color: TEXT_MUTED }}>
                          {service.description}
                        </p>
                      )}

                      {/* Details */}
                      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: '#d9dee3' }}>
                        <div className="flex items-center gap-1 text-sm" style={{ color: TEXT_SECONDARY }}>
                          <Clock className="w-4 h-4" />
                          <span>{service.duration} min</span>
                        </div>
                        <p className="text-lg font-bold" style={{ color: primaryColor }}>
                          IDR {Number(service.price).toLocaleString('id-ID')}
                        </p>
                      </div>

                      {/* Book Button */}
                      <Button
                        className="w-full mt-4 text-white rounded-md text-sm"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Book Service
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      <section id="testimonials" className="px-3 sm:px-4 lg:px-6 py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3" style={{ color: TEXT_PRIMARY }}>
              What Our Clients Say
            </h2>
            <p className="text-sm sm:text-base" style={{ color: TEXT_SECONDARY }}>
              Testimoni dari pelanggan setia kami
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((testimonial, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-[0_2px_6px_0_rgba(67,89,113,0.12)] p-5 sm:p-6"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-sm mb-4 leading-relaxed" style={{ color: TEXT_SECONDARY }}>
                  "{testimonial.text}"
                </p>

                {/* Author */}
                <div className="pt-4 border-t" style={{ borderColor: '#d9dee3' }}>
                  <p className="font-semibold text-sm" style={{ color: TEXT_PRIMARY }}>{testimonial.name}</p>
                  <p className="text-xs" style={{ color: TEXT_MUTED }}>{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="px-3 sm:px-4 lg:px-6 py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3" style={{ color: TEXT_PRIMARY }}>
              Contact Us
            </h2>
            <p className="text-sm sm:text-base" style={{ color: TEXT_SECONDARY }}>
              Hubungi kami untuk informasi lebih lanjut
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Phone */}
            {tenant.phone && (
              <a
                href={`tel:${tenant.phone}`}
                className="bg-white rounded-lg shadow-[0_2px_6px_0_rgba(67,89,113,0.12)] p-5 sm:p-6 hover:shadow-lg transition-all group"
              >
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: PRIMARY_LIGHT }}
                >
                  <Phone className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: primaryColor }} />
                </div>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: TEXT_MUTED }}>Phone</p>
                <p className="font-semibold text-sm sm:text-base group-hover:opacity-80 transition-opacity" style={{ color: TEXT_PRIMARY }}>
                  {tenant.phone}
                </p>
              </a>
            )}

            {/* Email */}
            {tenant.email && (
              <a
                href={`mailto:${tenant.email}`}
                className="bg-white rounded-lg shadow-[0_2px_6px_0_rgba(67,89,113,0.12)] p-5 sm:p-6 hover:shadow-lg transition-all group"
              >
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: '#e8fadf' }}
                >
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: SUCCESS_COLOR }} />
                </div>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: TEXT_MUTED }}>Email</p>
                <p className="font-semibold text-sm sm:text-base group-hover:opacity-80 transition-opacity break-all" style={{ color: TEXT_PRIMARY }}>
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
                className="bg-white rounded-lg shadow-[0_2px_6px_0_rgba(67,89,113,0.12)] p-5 sm:p-6 hover:shadow-lg transition-all group"
              >
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: '#fff2d6' }}
                >
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: WARNING_COLOR }} />
                </div>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: TEXT_MUTED }}>Location</p>
                <p className="font-semibold text-sm group-hover:opacity-80 transition-opacity" style={{ color: TEXT_PRIMARY }}>
                  {tenant.address}
                </p>
              </a>
            )}

            {/* Hours Card */}
            {todayHours && (
              <div className="bg-white rounded-lg shadow-[0_2px_6px_0_rgba(67,89,113,0.12)] p-5 sm:p-6">
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: '#d4f4fa' }}
                >
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: INFO_COLOR }} />
                </div>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: TEXT_MUTED }}>Today</p>
                <p className="font-semibold text-sm sm:text-base" style={{ color: isOpenToday ? SUCCESS_COLOR : DANGER_COLOR }}>
                  {isOpenToday ? `${todayHours.openTime} - ${todayHours.closeTime}` : 'Closed'}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Business Hours */}
      {businessHours && (
        <section className="px-3 sm:px-4 lg:px-6 py-8 sm:py-12 lg:py-16">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-[0_2px_6px_0_rgba(67,89,113,0.12)] p-5 sm:p-6 lg:p-8">
              <h3 className="text-lg sm:text-xl font-semibold mb-6" style={{ color: TEXT_PRIMARY }}>
                Business Hours
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
                {Object.entries(businessHours).map(([day, hours]) => (
                  <div
                    key={day}
                    className="text-center p-3 sm:p-4 rounded-lg"
                    style={{ backgroundColor: hours.isOpen ? PRIMARY_LIGHT : '#f5f5f9' }}
                  >
                    <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: TEXT_MUTED }}>
                      {day.slice(0, 3)}
                    </p>
                    <p 
                      className="text-xs sm:text-sm font-semibold"
                      style={{ color: hours.isOpen ? primaryColor : TEXT_MUTED }}
                    >
                      {hours.isOpen ? `${hours.openTime}` : 'Closed'}
                    </p>
                    {hours.isOpen && (
                      <p className="text-xs sm:text-sm font-semibold" style={{ color: primaryColor }}>
                        {hours.closeTime}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="px-3 sm:px-4 lg:px-6 py-8 sm:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3" style={{ color: TEXT_PRIMARY }}>
              FAQ
            </h2>
            <p className="text-sm sm:text-base" style={{ color: TEXT_SECONDARY }}>
              Pertanyaan yang sering diajukan
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-[0_2px_6px_0_rgba(67,89,113,0.12)] overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h4 className="font-semibold text-sm sm:text-base pr-4" style={{ color: TEXT_PRIMARY }}>
                    {item.question}
                  </h4>
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center flex-shrink-0 transition-transform"
                    style={{ 
                      backgroundColor: PRIMARY_LIGHT, 
                      color: primaryColor,
                      transform: expandedFAQ === index ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>
                {expandedFAQ === index && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                    <p className="text-sm leading-relaxed" style={{ color: TEXT_SECONDARY }}>
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="px-3 sm:px-4 lg:px-6 py-8 sm:py-12 lg:py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-[0_2px_6px_0_rgba(67,89,113,0.12)] p-6 sm:p-8 text-center">
            <h3 className="text-xl sm:text-2xl font-bold mb-3" style={{ color: TEXT_PRIMARY }}>
              Stay Updated
            </h3>
            <p className="text-sm mb-6" style={{ color: TEXT_SECONDARY }}>
              Dapatkan info promo dan update terbaru dari kami
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-md border text-sm focus:outline-none focus:ring-2 bg-gray-50"
                style={{ borderColor: '#d9dee3', focusRingColor: primaryColor + '30' } as React.CSSProperties}
              />
              <Button
                onClick={() => { if (email) setEmail(''); }}
                className="text-white rounded-md text-sm"
                style={{ backgroundColor: primaryColor }}
              >
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Videos */}
      {videos && videos.length > 0 && (
        <section className="px-3 sm:px-4 lg:px-6 py-8 sm:py-12">
          <div className="max-w-7xl mx-auto">
            <VideoSection
              videos={videos}
              displayType="grid"
              primaryColor={primaryColor}
              mode="inline"
              showHeader={false}
              size={videoOptions?.videoSize}
              autoplay={videoOptions?.autoplay}
            />
          </div>
        </section>
      )}

      {/* Social Media */}
      {socialMedia && socialMedia.length > 0 && (
        <section className="px-3 sm:px-4 lg:px-6 py-8 sm:py-12">
          <div className="max-w-7xl mx-auto">
            <SocialMediaSection
              socialMedia={socialMedia}
              displayType="icons"
              title="Follow Us"
              primaryColor={primaryColor}
              orientation="horizontal"
            />
          </div>
        </section>
      )}

      {/* Photo Galleries */}
      {galleries && galleries.map((gallery) => (
        <section key={gallery.id} className="px-3 sm:px-4 lg:px-6 py-8 sm:py-12">
          <div className="max-w-7xl mx-auto">
            <PhotoGallerySection
              gallery={gallery}
              primaryColor={primaryColor}
            />
          </div>
        </section>
      ))}

      {/* Footer */}
      <footer className="px-3 sm:px-4 lg:px-6 py-8 sm:py-12 mt-8" style={{ backgroundColor: 'white' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                {tenant.logo ? (
                  <img src={tenant.logo} alt={tenant.businessName} className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: PRIMARY_LIGHT, color: primaryColor }}
                  >
                    {tenant.emoji}
                  </div>
                )}
                <div>
                  <p className="font-semibold" style={{ color: TEXT_PRIMARY }}>{tenant.businessName}</p>
                  <p className="text-xs" style={{ color: TEXT_MUTED }}>{tenant.businessCategory}</p>
                </div>
              </div>
              <p className="text-sm max-w-xs" style={{ color: TEXT_SECONDARY }}>
                Layanan profesional dengan komitmen kualitas terbaik untuk Anda.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-sm mb-4" style={{ color: TEXT_PRIMARY }}>Quick Links</h4>
              <ul className="space-y-2 text-sm" style={{ color: TEXT_SECONDARY }}>
                <li><button onClick={() => scrollToSection('services')} className="hover:opacity-80 transition-opacity">Services</button></li>
                <li><button onClick={() => scrollToSection('testimonials')} className="hover:opacity-80 transition-opacity">Testimonials</button></li>
                <li><button onClick={() => scrollToSection('contact')} className="hover:opacity-80 transition-opacity">Contact</button></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-sm mb-4" style={{ color: TEXT_PRIMARY }}>Contact</h4>
              <ul className="space-y-2 text-sm" style={{ color: TEXT_SECONDARY }}>
                {tenant.phone && <li>{tenant.phone}</li>}
                {tenant.email && <li className="break-all">{tenant.email}</li>}
              </ul>
            </div>

            {/* Book Now */}
            <div>
              <h4 className="font-semibold text-sm mb-4" style={{ color: TEXT_PRIMARY }}>Ready to Book?</h4>
              <Button
                onClick={() => handleBookService()}
                className="text-white rounded-md text-sm"
                style={{ backgroundColor: primaryColor }}
              >
                Book Appointment
              </Button>
            </div>
          </div>

          {/* Bottom Bar */}
          <div 
            className="pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4 text-xs"
            style={{ borderColor: '#d9dee3', color: TEXT_MUTED }}
          >
            <p>© {new Date().getFullYear()} {tenant.businessName}. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href={`${protocol}://${rootDomain}`} className="hover:opacity-80 transition-opacity">
                {rootDomain}
              </Link>
              <span>•</span>
              <Link href="/tenant/login" className="hover:opacity-80 transition-opacity font-medium">
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
        template="sneat"
        isOpen={isBookingOpen}
        onOpenChange={setIsBookingOpen}
      />
    </div>
  );
}
