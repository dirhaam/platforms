'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MapPin, ChevronRight, Star, Clock } from 'lucide-react';
import Link from 'next/link';
import { protocol, rootDomain } from '@/lib/utils';
import BookingDialog from '@/components/booking/BookingDialog';
import BusinessHoursDisplay from '@/components/subdomain/BusinessHoursDisplay';
import VideoCarousel from '@/components/subdomain/sections/VideoCarousel';
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
  videos?: VideoItem[];
  socialMedia?: SocialMediaLink[];
  galleries?: PhotoGallery[];
  videoOptions?: { videoSize: 'small' | 'medium' | 'large'; autoplay: boolean };
}

export default function ClassicTemplate({
  tenant,
  services = [],
  businessHours,
  videos = [],
  socialMedia = [],
  galleries = [],
  videoOptions,
}: ClassicTemplateProps) {

  const [selectedService, setSelectedService] = useState<Service | undefined>();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);
  const [email, setEmail] = useState('');

  const defaultPrimary = '#1f3447';
  const primaryColor = tenant.brandColors?.primary || defaultPrimary;

  // Sample testimonials
  const testimonials = [
    {
      name: 'Ahmad Wijaya',
      role: 'Regular Client',
      text: 'Layanan berkualitas tinggi dengan staf yang sangat profesional. Selalu puas dengan hasilnya!',
      rating: 5
    },
    {
      name: 'Nur Hasanah',
      role: 'Client',
      text: 'Pengalaman yang luar biasa! Staf mereka sangat berpengalaman dan ramah. Pasti akan kembali lagi!',
      rating: 5
    },
    {
      name: 'Budi Santoso',
      role: 'Client',
      text: 'Rekomendasi terbaik untuk siapa pun yang mencari layanan berkualitas. Sangat memuaskan!',
      rating: 5
    }
  ];

  // Sample FAQ
  const faqItems = [
    {
      question: 'Bagaimana cara memesan janji?',
      answer: 'Klik tombol "Book Appointment" dan pilih layanan, tanggal, dan waktu yang Anda inginkan. Sistem kami akan menampilkan slot yang tersedia.'
    },
    {
      question: 'Bisakah saya mengubah atau membatalkan janji?',
      answer: 'Ya, Anda dapat mengubah atau membatalkan janji hingga 24 jam sebelum waktu yang dijadwalkan melalui email konfirmasi booking.'
    },
    {
      question: 'Apakah ada diskon untuk pelanggan baru?',
      answer: 'Ya, kami menawarkan diskon khusus untuk pelanggan pertama kali. Hubungi kami untuk informasi lebih lanjut!'
    },
    {
      question: 'Apa metode pembayaran yang diterima?',
      answer: 'Kami menerima semua metode pembayaran utama termasuk kartu kredit, transfer bank, dan dompet digital.'
    }
  ];

  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const todayHours = businessHours?.[currentDay];
  const isOpen = todayHours?.isOpen || false;

  return (
    <div className="min-h-screen bg-[#f5efe6] flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-lg my-8 mx-auto overflow-hidden">
        {/* HEADER (putih) */}
        <header className="px-4 sm:px-8 pt-6 pb-6 bg-white">
          <div className="flex items-center justify-between py-0">
            <div className="flex items-center h-10">
              <span className="font-semibold text-lg text-slate-900">
                {tenant.businessName}
              </span>
            </div>
            <Button
              className="rounded-xl text-white px-6 py-2 shadow font-medium h-10 flex items-center"
              style={{ backgroundColor: primaryColor }}
              onClick={() => setIsBookingOpen(true)}
            >Book Now</Button>
          </div>
        </header>
        {/* HERO NAVY + Floating Info */}
        <div className="relative px-0 pb-0">
          <div style={{ backgroundColor: primaryColor }}>
            <div className="px-7 sm:px-12 py-12 sm:py-16 text-white">
              <div className="max-w-xl">
                <p className="text-xs sm:text-sm tracking-[0.18em] uppercase text-sky-200 mb-3"></p>
                <h2 className="text-3xl sm:text-4xl font-bold mb-2 drop-shadow text-white">
                  Welcome to {tenant.businessName}
                </h2>
                {tenant.businessDescription && (
                  <p className="text-base text-blue-100/80 mb-6">
                    {tenant.businessDescription}
                  </p>
                )}
                <div className="flex flex-wrap gap-3 items-center">
                  <Button
                    size="lg"
                    className="bg-white text-[#1f3447] font-semibold border border-[#1f3447] rounded-xl px-5 shadow-sm hover:bg-slate-100"
                    onClick={() => setIsBookingOpen(true)}
                  >
                    Book Appointment
                  </Button>
                  {tenant.phone && (
                    <a
                      href={`tel:${tenant.phone}`}
                      className="inline-flex items-center gap-2 text-sm px-2 py-1 rounded text-blue-100 bg-blue-950/10 font-medium hover:text-cyan-100 transition"
                    >
                      <Phone className="h-4 w-4" />
                      Call us: {tenant.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Floating Today’s Info - crossing navy & card bawah */}
          <div className="w-full flex justify-between items-start gap-6" style={{ position: 'relative', marginTop: '-10rem' }}>
            {/* Videos Section - Left Side, aligned with middle of card */}
            {videos.length > 0 && (
              <div className="ml-10 flex-1" style={{ marginTop: '12rem' }}>
                <VideoCarousel
                  videos={videos}
                  primaryColor={primaryColor}
                  size={videoOptions?.videoSize}
                  autoplay={videoOptions?.autoplay}
                  showTitle={false}
                />
              </div>
            )}
            
            {/* Today's Info Card - Right Side */}
            <Card className="w-72 shadow-lg rounded-2xl border-none bg-white mr-10" style={{ flexShrink: 0 }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                  Today's Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Business Hours
                  </p>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                    <BusinessHoursDisplay
                      businessHours={businessHours ?? null}
                      onlyToday={true}
                      className="flex flex-col gap-1"
                      renderStatus={({ isOpen, label }) => (
                        <span className={`rounded px-2 py-0.5 text-xs font-semibold border ${isOpen ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-red-100 text-red-600 border-red-200"}`}>{label}</span>
                      )}
                    />
                  </div>
                </div>
                <div className="h-px bg-slate-200" />
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Contact
                  </p>
                  <div className="space-y-2 text-sm text-slate-700">
                    {tenant.phone && (
                      <a href={`tel:${tenant.phone}`} className="flex items-center gap-2 hover:text-sky-600">
                        <Phone className="h-4 w-4" />
                        {tenant.phone}
                      </a>
                    )}
                    {tenant.email && (
                      <a href={`mailto:${tenant.email}`} className="flex items-center gap-2 hover:text-sky-600">
                        <Mail className="h-4 w-4" />
                        {tenant.email}
                      </a>
                    )}
                    {tenant.address && (
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(tenant.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:text-sky-600"
                      >
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{tenant.address}</span>
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Body */}
        <div className="px-4 sm:px-8 py-8">
          {/* Our Services */}
          {services.length > 0 && (
            <section>
              <h3 className="text-2xl md:text-3xl font-semibold mb-8" style={{ color: primaryColor }}>
                Our Services
              </h3>
              <div className="space-y-4">
                {services.slice(0, 8).map((service) => (
                  <Card
                    key={service.id}
                    className="rounded-2xl border border-[#e3d9c8] bg-white hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h4 className="text-base sm:text-lg font-semibold text-slate-900">
                              {service.name}
                            </h4>
                          </div>
                          {service.description && (
                            <p className="text-sm text-slate-600 mb-3">
                              {service.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-slate-600">
                            <span>⏱ {service.duration} min</span>
                            <span>
                              💰 IDR {Number(service.price).toLocaleString('id-ID')}
                            </span>
                            {service.homeVisitAvailable && (
                              <span className="text-emerald-600">
                                📍 Home visit available
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start sm:items-center">
                          <Button
                            className="w-full sm:w-auto text-white bg-[#1f3447] hover:bg-[#233b4e] rounded-lg px-5 shadow-sm flex items-center gap-1"
                            onClick={() => {
                              setSelectedService(service);
                              setIsBookingOpen(true);
                            }}
                          >
                            Book
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
          {/* Social Media */}
          {socialMedia.length > 0 && (
            <section className="py-8">
              <SocialMediaSection
                socialMedia={socialMedia}
                displayType="icons"
                title="Follow Us"
                primaryColor={primaryColor}
                orientation="horizontal"
              />
            </section>
          )}
          {/* Photo Galleries */}
          {galleries &&
            galleries.map((gallery) => (
              <section
                key={gallery.id}
                className="py-8 bg-[#f8f2e8] rounded-xl"
              >
                <PhotoGallerySection
                  gallery={gallery}
                  primaryColor={primaryColor}
                />
              </section>
            ))}
          
          {/* Testimonials Section */}
          <section className="py-12 border-t border-slate-200">
            <h3 className="text-2xl md:text-3xl font-semibold mb-8" style={{ color: primaryColor }}>
              Testimonial Klien
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, idx) => (
                <Card key={idx} className="rounded-2xl border border-slate-200 hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-slate-700 leading-relaxed italic">"{testimonial.text}"</p>
                    <div className="pt-2 border-t border-slate-200">
                      <p className="font-semibold text-slate-900">{testimonial.name}</p>
                      <p className="text-xs text-slate-500">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Business Hours Grid */}
          {businessHours && (
            <section className="py-12 border-t border-slate-200">
              <h3 className="text-2xl md:text-3xl font-semibold mb-8" style={{ color: primaryColor }}>
                Jam Operasional
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(businessHours).map(([day, hours]) => (
                  <Card key={day} className="rounded-xl border border-slate-200 hover:shadow-sm transition-all">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs font-bold uppercase text-slate-500 mb-2">
                        {day}
                      </p>
                      <p className={`text-sm font-semibold ${hours.isOpen ? 'text-slate-900' : 'text-slate-400'}`}>
                        {hours.isOpen ? `${hours.openTime} - ${hours.closeTime}` : 'Tutup'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* FAQ Section */}
          <section className="py-12 border-t border-slate-200">
            <h3 className="text-2xl md:text-3xl font-semibold mb-8" style={{ color: primaryColor }}>
              Pertanyaan Umum
            </h3>
            <div className="space-y-4">
              {faqItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                  className="w-full text-left p-5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-900">{item.question}</h4>
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
                    <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                      {item.answer}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Newsletter Section */}
          <section className="py-12 border-t border-slate-200">
            <div className="text-center space-y-6 rounded-xl p-8 bg-slate-50">
              <div>
                <h3 className="text-2xl md:text-3xl font-semibold mb-2" style={{ color: primaryColor }}>
                  Tetap Update
                </h3>
                <p className="text-slate-600">
                  Dapatkan penawaran khusus dan pembaruan langsung ke inbox Anda
                </p>
              </div>
              <div className="flex gap-2 flex-col sm:flex-row max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Masukkan email Anda"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2"
                  style={{ focusRingColor: primaryColor + '30' } as any}
                />
                <Button 
                  onClick={() => {
                    if (email) {
                      setEmail('');
                    }
                  }}
                  style={{ backgroundColor: primaryColor }}
                  className="text-white hover:opacity-90 transition-opacity rounded-lg px-6"
                >
                  Daftar
                </Button>
              </div>
            </div>
          </section>
        </div>
        <footer
          className="mt-8 py-8 px-4 sm:px-8"
          style={{ backgroundColor: primaryColor, color: 'white' }}
        >
          <div className="text-center text-xs sm:text-sm">
            <p>© 2024 {tenant.businessName}. All rights reserved.</p>
            <p className="opacity-85 flex flex-wrap justify-center gap-2 mt-1">
              Powered by{' '}
              <Link
                href={`${protocol}://${rootDomain}`}
                className="hover:underline"
              >
                {rootDomain}
              </Link>
              <span>•</span>
              <Link
                href="/tenant/login"
                className="hover:underline font-medium"
              >
                Business Admin Login
              </Link>
            </p>
          </div>
        </footer>
        <BookingDialog
          service={selectedService}
          tenant={tenant}
          template="classic"
          isOpen={isBookingOpen}
          onOpenChange={setIsBookingOpen}
        />
      </div>
    </div>
  );
}
