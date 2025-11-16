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
  Star, ChevronRight, ChevronLeft, Filter as FilterIcon, MessageCircle
} from 'lucide-react';
import BookingDialog from '@/components/booking/BookingDialog';
import BusinessHoursDisplay from '@/components/subdomain/BusinessHoursDisplay';
import SocialMediaSection from '@/components/subdomain/sections/SocialMediaSection';
import PhotoGallerySection from '@/components/subdomain/sections/PhotoGallerySection';
import type { Service, VideoItem, SocialMediaLink, PhotoGallery } from '@/types/booking';

// ---- VideoCarouselGrid --- //
function getYoutubeEmbedUrl(raw: string, autoplay?: boolean) {
  try {
    const url = new URL(raw);
    // If already an embed URL, just append autoplay if needed
    if (url.pathname.startsWith('/embed/')) {
      if (autoplay) url.searchParams.set('autoplay', '1');
      return url.toString();
    }
    const id = url.searchParams.get('v');
    if (!id) return raw;
    const params = new URLSearchParams();
    if (autoplay) {
      params.set('autoplay', '1');
      params.set('mute', '1');
    }
    return `https://www.youtube.com/embed/${id}?${params.toString()}`;
  } catch {
    return raw;
  }
}

function HeroVideo({ video, autoplay }: { video: any; autoplay?: boolean }) {
  const type = (video && (video.type || video.provider)) as string | undefined;
  const rawUrl = video && (video.url || video.link);

  if (!rawUrl) return null;

  if (type === 'youtube') {
    const src = getYoutubeEmbedUrl(rawUrl, autoplay);
    return (
      <iframe
        src={src}
        frameBorder="0"
        allowFullScreen
        title={video.title || 'Video'}
        className="w-full h-full rounded-2xl overflow-hidden shadow"
      />
    );
  }

  return (
    <video
      controls={!autoplay}
      autoPlay={!!autoplay}
      muted={!!autoplay}
      playsInline
      src={rawUrl}
      className="w-full h-full object-cover rounded-2xl overflow-hidden shadow"
    />
  );
}

function VideoCarouselGrid({ videos = [] }: { videos?: any[] }) {
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
          <VideoItem key={i} video={video} />
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
  useEffect(() => {
    if (!categories.includes(activeCat)) setActiveCat('All');
  }, [categories, activeCat]);

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
                <HeroVideo video={videos[0]} autoplay={autoplay} />
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
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {visible.map((service) => (
                        <Card key={service.id} className="border border-gray-200 hover:shadow-lg transition-shadow flex flex-col h-full">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <CardTitle className="text-lg leading-tight">{service.name}</CardTitle>
                                {service.description && (
                                  <p className="text-sm mt-1 line-clamp-2">{service.description}</p>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-2 flex-1 flex flex-col space-y-4">
                            <div>
                              <div className="flex justify-between items-center text-sm text-gray-700 py-2 border-y border-gray-100">
                                <span className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" /> Duration
                                </span>
                                <span className="font-semibold">{service.duration} min</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-700">Price</span>
                                <span className="text-xl font-bold" style={{ color: primaryColor }}>
                                  {formatPrice(service.price as any)}
                                </span>
                              </div>
                              {service.homeVisitAvailable && (
                                <div className="p-3 rounded-md text-sm border mt-2" style={{ backgroundColor: `${primaryColor}0d`, borderColor: `${primaryColor}33`, color: secondaryColor }}>
                                  🏥 Home visit available
                                </div>
                              )}
                            </div>
                            {/* EMPTY FLEX-1 */}
                            <div className="flex-1" />
                            <Button 
                              className="w-full mt-4"
                              style={{ backgroundColor: primaryColor, color: 'white' }}
                              onClick={() => handleBookService(service)}
                            >
                              Schedule Service
                            </Button>
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
