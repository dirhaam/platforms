'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Phone, Mail, MapPin, Clock, Shield, Heart, Users,
  Star, ChevronRight, ChevronLeft, Filter as FilterIcon, MessageCircle, ChevronDown
} from 'lucide-react';
import BookingDialog from '@/components/booking/BookingDialog';
import BusinessHoursDisplay from '@/components/subdomain/BusinessHoursDisplay';
import SocialMediaSection from '@/components/subdomain/sections/SocialMediaSection';
import PhotoGallerySection from '@/components/subdomain/sections/PhotoGallerySection';
import type { Service, VideoItem, SocialMediaLink, PhotoGallery } from '@/types/booking';

// ---- VideoCarouselGrid --- //
function extractYoutubeId(url: string): string {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  );
  return match ? match[1] : url;
}

function buildYoutubeSrc(item: VideoItem, autoplay?: boolean) {
  const id = extractYoutubeId(item.youtubeUrl);
  const base = `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
  if (!autoplay) return base;
  return `${base}&autoplay=1&mute=1&playsinline=1`;
}

function HeroVideo({ video, autoplay }: { video: VideoItem; autoplay?: boolean }) {
  return (
    <iframe
      className="w-full h-full rounded-2xl overflow-hidden shadow"
      src={buildYoutubeSrc(video, autoplay)}
      title={video.title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}

function VideoCarouselGrid({ videos = [] }: { videos?: VideoItem[] }) {
  const [page, setPage] = useState(0);
  const perPage = 3;
  if (!videos || videos.length === 0) return null;
  const totalPages = Math.ceil(videos.length / perPage);
  const slides = [];
  for (let i = 0; i < videos.length; i += perPage) {
    slides.push(videos.slice(i, i + perPage));
  }

  // 1–3 video = grid statis, tanpa paginasi
  if (videos.length <= 3) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 py-6">
        {videos.map((video, i) => (
          <HeroVideo key={i} video={video} />
        ))}
      </div>
    );
  }

  // Carousel: 3 video per page + paginasi
  return (
    <div className="py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {slides[page].map((video, i) => (
          <HeroVideo key={i} video={video} />
        ))}
      </div>
      <div className="flex justify-center items-center gap-2 mt-6">
        <button className="p-2 rounded hover:bg-gray-100" disabled={page === 0} onClick={() => setPage(page-1)}>
          <ChevronLeft />
        </button>
        {Array(totalPages).fill(0).map((_, i) => (
          <button
            key={i}
            className={`w-2.5 h-2.5 rounded-full ${i === page ? 'bg-[#1f3447]' : 'bg-gray-300'}`}
            onClick={() => setPage(i)}
          />
        ))}
        <button className="p-2 rounded hover:bg-gray-100" disabled={page === totalPages-1} onClick={() => setPage(page+1)}>
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}
// ---- End VideoCarouselGrid --- //

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
  whatsappNumber?: string;
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

// --- Helper functions omitted for length (getRawEnv, getProtocol, dsb) ---

export default function HealthcareTemplateV2({ tenant, services = [], businessHours, videos = [], socialMedia = [], galleries = [], videoOptions }: HealthcareTemplateProps) {
  const [selectedService, setSelectedService] = useState<Service | undefined>();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [query, setQuery] = useState('');
  const primaryColor = tenant.brandColors?.primary || '#0ea5e9';
  const secondaryColor = tenant.brandColors?.secondary || '#0369a1';
  const accentColor = tenant.brandColors?.accent || '#22c55e';
  const videoSize = videoOptions?.videoSize || 'medium';
  const autoplay = videoOptions?.autoplay ?? false;

  // Category logic (tanpa emoji/kategori front)
  const categories = useMemo(() => {
    const cats = Array.from(new Set((services || []).map((s) => s.category).filter(Boolean))) as string[];
    return ['All', ...cats];
  }, [services]);
  const [activeCat, setActiveCat] = useState<string>('All');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);
  const [email, setEmail] = useState('');
  
  useEffect(() => {
    if (!categories.includes(activeCat)) setActiveCat('All');
  }, [categories, activeCat]);

  // Sample testimonials
  const testimonials = [
    {
      name: 'Dr. Robert Patient',
      role: 'Patient',
      text: 'Exceptional healthcare with dedicated professional staff. Very satisfied with my treatment and care.',
      rating: 5
    },
    {
      name: 'Linda Kusuma',
      role: 'Patient',
      text: 'Best medical experience I could ask for! Highly professional doctors and clean facilities. Highly recommended!',
      rating: 5
    },
    {
      name: 'Wijaya Setia',
      role: 'Patient',
      text: 'Outstanding healthcare service. The doctors really care about patient well-being. Will visit again!',
      rating: 5
    }
  ];

  // Sample FAQ
  const faqItems = [
    {
      question: 'How do I schedule an appointment?',
      answer: 'You can schedule an appointment by clicking the Schedule button next to your preferred service. Select your date and time, and we will confirm your booking immediately.'
    },
    {
      question: 'What should I bring to my appointment?',
      answer: 'Please bring a valid ID and your medical insurance card if applicable. Having your medical history available is also helpful.'
    },
    {
      question: 'Is this clinic accepting new patients?',
      answer: 'Yes, we are always welcoming new patients. Please contact us or use our online booking system to schedule your first appointment.'
    },
    {
      question: 'Do you offer telemedicine consultations?',
      answer: 'Yes, we offer telemedicine services for certain types of consultations. Please check service availability or contact us for details.'
    }
  ];

  const filterBy = (cat: string, q: string) => (s: Service) => {
    const inCat = cat === 'All' || s.category === cat;
    const ql = q.toLowerCase();
    const inQuery = !q || s.name?.toLowerCase().includes(ql) || s.description?.toLowerCase().includes(ql);
    return inCat && inQuery;
  };

  const formatPrice = (amount: number | string) => {
    try {
      const n = Number(amount || 0);
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
    } catch {
      return `IDR ${Number(amount || 0).toLocaleString()}`;
    }
  };

  const handleBookService = (service?: Service) => {
    setSelectedService(service);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/90 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <Link href="/" className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400 rounded-md">
              {/* Hapus emoji dan kategori */}
              {tenant.logo && (
                <div className="relative h-10 w-10 overflow-hidden rounded-full ring-1 ring-black/10">
                  <Image src={tenant.logo} alt={`${tenant.businessName} logo`} fill sizes="40px" className="object-cover" />
                </div>
              )}
              <div>
                <p className="text-base font-bold leading-tight" style={{ color: primaryColor }}>{tenant.businessName}</p>
              </div>
            </Link>
            <div className="hidden sm:flex items-center gap-3">
              {tenant.phone && (
                <a
                  href={`tel:${tenant.phone}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <Phone className="w-4 h-4" /> {tenant.phone}
                </a>
              )}
              <Button
                size="sm"
                onClick={() => handleBookService()}
                className="text-white shadow-sm hover:shadow"
                style={{ backgroundColor: primaryColor }}
              >
                Book now
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative"
        aria-label="Intro"
        style={{ background: `linear-gradient(180deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center py-14 lg:py-20">
            <div className="text-white">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
                Your Health, Our Priority
              </h1>
              <p className="mt-4 text-white/90 text-base sm:text-lg max-w-prose">
                {tenant.businessDescription || 'Professional healthcare services with a personal touch.'}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button size="lg" onClick={() => handleBookService()} className="bg-white text-gray-900 hover:bg-gray-100">
                  Book an appointment
                </Button>
                {tenant.whatsappNumber && (
                  <a
                    href={`https://wa.me/${tenant.whatsappNumber.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-black/10 text-white hover:bg-black/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                  >
                    <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
                  </a>
                )}
              </div>
              <div className="mt-6 flex items-center gap-4 text-white/80">
                <div className="flex items-center gap-1"><Star className="w-4 h-4" /> 4.9/5</div>
                <span aria-hidden>•</span>
                <div>Trusted by thousands of patients</div>
              </div>
            </div>
            <div
              className={
                `relative rounded-2xl overflow-hidden ring-1 ring-white/20 shadow-xl bg-black ` +
                (videoSize === 'small'
                  ? 'lg:h-64 h-40'
                  : videoSize === 'large'
                  ? 'lg:h-[26rem] h-72'
                  : 'lg:h-80 h-56')
              }
            >
              {videos && videos.length > 0 ? (
                <HeroVideo video={videos[0] as VideoItem} autoplay={autoplay} />
              ) : (
                <Image
                  src={tenant.logo || '/placeholder.svg'}
                  alt={`${tenant.businessName} cover`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      {services.length > 0 && (
        <section className="py-12 sm:py-16 bg-gray-50" aria-label="Services">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: secondaryColor }}>Our Services</h2>
                <p className="text-gray-600 mt-1">Browse categories or search to find what you need.</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search services..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full sm:w-72"
                />
                <Button variant="outline" className="hidden sm:inline-flex"><FilterIcon className="w-4 h-4 mr-1" />Filter</Button>
              </div>
            </div>
            <Tabs value={activeCat} defaultValue="All" onValueChange={(v) => setActiveCat(v)} className="mt-6">
              <TabsList className="flex flex-wrap gap-2 bg-white">
                {categories.map((c) => (
                  <TabsTrigger key={c} value={c} className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
                    {c}
                  </TabsTrigger>
                ))}
              </TabsList>
              {categories.map((cat) => {
                const visible = (services || []).filter(filterBy(cat, query));
                return (
                  <TabsContent key={cat} value={cat} className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
                      {visible.map((service) => (
                        <Card
                          key={service.id}
                          className="border border-gray-200 hover:shadow-lg transition-shadow flex flex-col h-full"
                        >
                          <CardHeader className="pb-3">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
                                  {service.name}
                                </CardTitle>
                                {service.category && (
                                  <Badge
                                    variant="outline"
                                    className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium whitespace-nowrap flex-shrink-0 rounded-md"
                                  >
                                    {service.category}
                                  </Badge>
                                )}
                              </div>
                              {service.description && (
                                <p className="text-xs text-gray-600 line-clamp-3">
                                  {service.description}
                                </p>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0 flex-1 flex flex-col gap-3">
                            <div className="space-y-3">
                              <div className="flex justify-between items-center text-xs text-gray-700 py-2 border-y border-gray-100">
                                <span className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span>Duration</span>
                                </span>
                                <span className="font-semibold text-sm">{service.duration} min</span>
                              </div>
                              <div className="flex items-baseline justify-between">
                                <span className="text-xs text-gray-600">Starting from</span>
                                <span
                                  className="text-lg font-bold tracking-tight"
                                  style={{ color: primaryColor }}
                                >
                                  {formatPrice(service.price as any)}
                                </span>
                              </div>
                              {service.homeVisitAvailable && (
                                <div
                                  className="flex items-start gap-2 rounded-md border px-3 py-2 text-xs"
                                  style={{
                                    backgroundColor: `${primaryColor}0d`,
                                    borderColor: `${primaryColor}33`,
                                    color: secondaryColor
                                  }}
                                >
                                  <span className="mt-0.5">🏥</span>
                                  <span className="leading-snug">Home visit available</span>
                                </div>
                              )}
                            </div>
                            <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                              <p className="text-[10px] text-gray-500 leading-snug">
                                Tap to see available time
                              </p>
                              <Button
                                size="sm"
                                className="px-4 ml-auto"
                                style={{ backgroundColor: primaryColor, color: 'white' }}
                                onClick={() => handleBookService(service)}
                              >
                                Schedule
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {visible.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-gray-600">No services match your filters.</p>
                        <Button onClick={() => { setQuery(''); setActiveCat('All'); }} className="mt-3" variant="outline">Reset filters</Button>
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white border-t">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4" style={{ color: primaryColor }}>
            Patient Testimonials
          </h2>
          <p className="text-center text-gray-600 mb-12">What our patients say about their experience</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="border hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 leading-relaxed italic">"{testimonial.text}"</p>
                  <div className="pt-2 border-t border-gray-200">
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
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4" style={{ color: primaryColor }}>
            Frequently Asked Questions
          </h2>
          <p className="text-center text-gray-600 mb-12">Find answers to common questions about our services</p>

          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                className="w-full text-left p-5 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-all"
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
                    <ChevronDown className="w-4 h-4" />
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
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 border-t">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div>
            <h2 className="text-4xl font-bold mb-4" style={{ color: primaryColor }}>
              Stay Informed
            </h2>
            <p className="text-gray-600 text-lg">
              Subscribe to our newsletter for health tips and updates
            </p>
          </div>

          <div className="flex gap-2 flex-col sm:flex-row max-w-md mx-auto">
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

      {/* Business Hours */}
      {businessHours && (
        <section className="py-12 sm:py-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6" style={{ color: primaryColor }}>Clinic Hours</h2>
            <Card className="border border-[#e5e7eb]">
              <CardContent className="py-6">
                <BusinessHoursDisplay 
                  businessHours={businessHours}
                  className="w-full max-w-md mx-auto"
                />
              </CardContent>
            </Card>
          </div>
        </section>
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

      <BookingDialog
        service={selectedService}
        tenant={tenant}
        template="healthcarev2"
        isOpen={isBookingOpen}
        onOpenChange={setIsBookingOpen}
      />

      {/* Footer bisa copy dari kode kamu sebelumnya */}
      {/* WhatsApp floating, dsb */}
    </div>
  );
}
