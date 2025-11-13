'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Phone, Mail, MapPin, Clock, Shield, Heart, Users,
  Star, ChevronRight, Filter as FilterIcon, MessageCircle
} from 'lucide-react';
// We intentionally avoid importing protocol/rootDomain from '@/lib/utils'.
// Instead, we use safe local helpers that tolerate missing/invalid env and SSR.
import BookingDialog from '@/components/booking/BookingDialog';
import BusinessHoursDisplay from '@/components/subdomain/BusinessHoursDisplay';
import VideoSection from '@/components/subdomain/sections/VideoSection';
import SocialMediaSection from '@/components/subdomain/sections/SocialMediaSection';
import PhotoGallerySection from '@/components/subdomain/sections/PhotoGallerySection';
import type { Service, VideoItem, SocialMediaLink, PhotoGallery } from '@/types/booking';

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
  whatsappNumber?: string; // optional WA contact for CTA
}

interface HealthcareTemplateProps {
  tenant: TenantData;
  services?: Service[];
  businessHours?: BusinessHours;
  videos?: VideoItem[];
  socialMedia?: SocialMediaLink[];
  galleries?: PhotoGallery[];
}

/**
 * SAFETY: Some bundlers/envs can inline non-string values for env (undefined/null),
 * or strip process entirely. These utilities guarantee we never call string
 * methods on null/undefined and never touch window on SSR.
 */
const getRawEnv = (key: string): string => {
  // Guard against process/env being missing or non-objects
  const p: any = (typeof process !== 'undefined' ? (process as any) : undefined);
  const envObj: any = (p && typeof p === 'object' && p.env && typeof p.env === 'object') ? p.env : undefined;
  const val: any = envObj ? envObj[key] : undefined;
  return typeof val === 'string' ? val : '';
};

const coerceProtocol = (value: string): 'http' | 'https' => {
  const v = String(value || '').replace(':', '').toLowerCase();
  return (v === 'http' || v === 'https') ? (v as 'http' | 'https') : 'https';
};

const getProtocol = (): 'http' | 'https' => {
  const envProto = coerceProtocol(getRawEnv('NEXT_PUBLIC_PROTOCOL'));
  if (envProto) return envProto;
  if (typeof window !== 'undefined' && window?.location && typeof window.location.protocol === 'string') {
    return coerceProtocol(window.location.protocol);
  }
  return 'https';
};

const getRootDomain = (): string => {
  const envDomain = String(getRawEnv('NEXT_PUBLIC_ROOT_DOMAIN') || '').trim();
  if (envDomain) return envDomain;
  if (typeof window !== 'undefined' && window?.location && typeof window.location.hostname === 'string' && window.location.hostname) {
    return window.location.hostname;
  }
  return 'booqing.my.id';
};

const buildPoweredByUrl = (): string => `${getProtocol()}://${getRootDomain()}`;

/**
 * Redesigned healthcare template
 */
export default function HealthcareTemplateV2({ tenant, services = [], businessHours, videos = [], socialMedia = [], galleries = [] }: HealthcareTemplateProps) {
  const [selectedService, setSelectedService] = useState<Service | undefined>();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [query, setQuery] = useState('');

  const primaryColor = tenant.brandColors?.primary || '#0ea5e9'; // sky-500-like
  const secondaryColor = tenant.brandColors?.secondary || '#0369a1';
  const accentColor = tenant.brandColors?.accent || '#22c55e';

  const bgGradient = `linear-gradient(180deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;

  // Derive categories once; ensure stable order and include "All"
  const categories = useMemo(() => {
    const cats = Array.from(new Set((services || []).map((s) => s.category).filter(Boolean))) as string[];
    return ['All', ...cats];
  }, [services]);

  // Active category must always be valid for Radix Tabs; give Tabs a defaultValue too
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
      // IDR default; no decimals for clean display
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
    } catch {
      return `IDR ${Number(amount || 0).toLocaleString()}`;
    }
  };

  const handleBookService = (service?: Service) => {
    setSelectedService(service);
    setIsBookingOpen(true);
  };

  // --- Dev-time sanity checks (test cases) ---
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.assert(formatPrice(15000).includes('15') || formatPrice(15000).includes('Rp'), 'formatPrice should format a number');
      console.assert(/^https?:\/\//.test(buildPoweredByUrl()), 'buildPoweredByUrl should return an http(s) URL');
      console.assert(['http', 'https'].includes(getProtocol()), 'getProtocol should be http or https');
      console.assert(getRootDomain().length > 3, 'getRootDomain should be a non-trivial hostname');

      // Additional tests for filtering/category integrity
      const fakeServices: Service[] = [
        { id: '1', name: 'Consultation', category: 'General', duration: 30, price: 100000 } as any,
        { id: '2', name: 'Dental Check', category: 'Dental', duration: 45, price: 250000 } as any,
      ];
      const cats = Array.from(new Set(fakeServices.map(s => s.category)));
      console.assert(cats.includes('General') && cats.includes('Dental'), 'categories should include existing service categories');
      const filteredAll = fakeServices.filter(filterBy('All', ''));
      const filteredDental = fakeServices.filter(filterBy('Dental', 'dental'));
      console.assert(filteredAll.length === 2, 'filterBy(All, "") should return all services');
      console.assert(filteredDental.length === 1 && filteredDental[0].category === 'Dental', 'filterBy should filter by category and query');

      // New tests for env safety when values are null/undefined/non-string
      console.assert(typeof getRawEnv('SOME_RANDOM_KEY') === 'string', 'getRawEnv must always return a string');
      console.assert(['http', 'https'].includes(coerceProtocol('HTTP') as any), 'coerceProtocol should normalize casing');
      console.assert(coerceProtocol('') === 'https', 'coerceProtocol should default to https');
    } catch {
      // Never block UI in dev due to assertions
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Top Announcement / trust bar */}
      <div className="w-full bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-center gap-3 text-xs sm:text-sm text-gray-600">
          <Shield className="w-4 h-4" aria-hidden />
          <span aria-live="polite">Certified practitioners • HIPAA-like privacy best-practices • Transparent pricing</span>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/90 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <Link href="/" className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400 rounded-md">
              {tenant.logo ? (
                <div className="relative h-10 w-10 overflow-hidden rounded-full ring-1 ring-black/10">
                  <Image src={tenant.logo} alt={`${tenant.businessName} logo`} fill sizes="40px" className="object-cover" />
                </div>
              ) : (
                <div className="text-2xl" aria-hidden>{tenant.emoji}</div>
              )}
              <div>
                <p className="text-base font-bold leading-tight" style={{ color: primaryColor }}>{tenant.businessName}</p>
                <p className="text-xs text-gray-600">{tenant.businessCategory}</p>
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
        style={{ background: bgGradient }}
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

            <div className="relative lg:h-80 h-56 rounded-2xl overflow-hidden ring-1 ring-white/20 shadow-xl">
              <Image
                src={tenant.logo || '/placeholder.svg'}
                alt={`${tenant.businessName} cover`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust / features */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: Shield, label: 'Certified', desc: 'Fully licensed professionals' },
              { icon: Heart, label: 'Patient-first', desc: 'Compassionate, human care' },
              { icon: Users, label: 'Experienced', desc: 'Years of expertise' }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <Card key={idx} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-8">
                    <div className="mx-auto mb-3 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}1a` }}>
                      <Icon className="h-6 w-6" style={{ color: primaryColor }} />
                    </div>
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
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

              {/* Render a TabsContent for each category to satisfy Radix Tabs expectations. */}
              {categories.map((cat) => {
                const visible = (services || []).filter(filterBy(cat, query));
                return (
                  <TabsContent key={cat} value={cat} className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {visible.map((service) => (
                        <Card key={service.id} className="border border-gray-200 hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <CardTitle className="text-lg leading-tight">{service.name}</CardTitle>
                                {service.description && (
                                  <CardDescription className="text-sm mt-1 line-clamp-2">{service.description}</CardDescription>
                                )}
                              </div>
                              {service.category && (
                                <Badge variant="secondary" className="shrink-0" style={{ backgroundColor: `${primaryColor}1a`, color: secondaryColor }}>
                                  {service.category}
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4 pt-2">
                            <div className="flex justify-between items-center text-sm text-gray-700 py-2 border-y border-gray-100">
                              <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> Duration</span>
                              <span className="font-semibold">{service.duration} min</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">Price</span>
                              <span className="text-xl font-bold" style={{ color: primaryColor }}>
                                {formatPrice(service.price as any)}
                              </span>
                            </div>
                            {service.homeVisitAvailable && (
                              <div className="p-3 rounded-md text-sm border" style={{ backgroundColor: `${primaryColor}0d`, borderColor: `${primaryColor}33`, color: secondaryColor }}>
                                🏥 Home visit available (+ {formatPrice(service.homeVisitSurcharge || 0)})
                              </div>
                            )}
                            <Button className="w-full text-white" style={{ backgroundColor: primaryColor }} onClick={() => handleBookService(service)}>
                              Schedule Service
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Empty state per-category */}
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
        <section className="py-12 sm:py-16" aria-label="Clinic Hours">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8" style={{ color: secondaryColor }}>Clinic Hours</h2>
            <Card className="border-2" style={{ borderColor: primaryColor }}>
              <CardContent className="pt-6">
                <BusinessHoursDisplay businessHours={businessHours} />
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Contact */}
      <section className="py-12 sm:py-16 bg-gray-50" aria-label="Contact">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10" style={{ color: secondaryColor }}>Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tenant.phone && (
              <Card className="border border-gray-200">
                <CardContent className="pt-6">
                  <Phone className="h-7 w-7 mx-auto mb-3" style={{ color: primaryColor }} />
                  <h3 className="font-semibold text-center mb-2">Emergency & Appointments</h3>
                  <a href={`tel:${tenant.phone}`} className="block text-center font-semibold hover:underline" style={{ color: secondaryColor }}>{tenant.phone}</a>
                </CardContent>
              </Card>
            )}
            {tenant.email && (
              <Card className="border border-gray-200">
                <CardContent className="pt-6">
                  <Mail className="h-7 w-7 mx-auto mb-3" style={{ color: primaryColor }} />
                  <h3 className="font-semibold text-center mb-2">Email</h3>
                  <a href={`mailto:${tenant.email}`} className="block text-center font-semibold hover:underline" style={{ color: secondaryColor }}>{tenant.email}</a>
                </CardContent>
              </Card>
            )}
            {tenant.address && (
              <Card className="border border-gray-200">
                <CardContent className="pt-6">
                  <MapPin className="h-7 w-7 mx-auto mb-3" style={{ color: primaryColor }} />
                  <h3 className="font-semibold text-center mb-2">Location</h3>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(tenant.address)}`}
                    className="block text-center font-semibold hover:underline"
                    style={{ color: secondaryColor }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Get Directions
                  </a>
                </CardContent>
              </Card>
            )}
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

      {/* CTA band */}
      <section className="py-10" style={{ background: bgGradient }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-white">
            <div>
              <p className="text-2xl font-bold">Ready to feel better?</p>
              <p className="text-white/90">Secure your slot in seconds. No upfront payment needed.</p>
            </div>
            <Button size="lg" onClick={() => handleBookService()} className="bg-white text-gray-900 hover:bg-gray-100">
              Schedule Appointment
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 text-white" style={{ background: bgGradient }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-semibold mb-1">{tenant.businessName}</p>
          <p className="text-sm opacity-90 mb-3">Providing quality healthcare services since 2024</p>
          <Separator className="mx-auto max-w-sm bg-white/20" />
          <p className="text-xs opacity-80 mt-3">© {new Date().getFullYear()} {tenant.businessName}. All rights reserved.</p>
          <p className="text-xs opacity-80 mt-2 flex flex-wrap justify-center gap-2">
            Powered by <Link href={buildPoweredByUrl()} className="underline underline-offset-2">{getRootDomain()}</Link>
            <span>•</span>
            <Link href="/tenant/login" className="underline underline-offset-2">Business Admin Login</Link>
          </p>
        </div>
      </footer>

      {/* Sticky mobile booking bar */}
      <div className="sm:hidden fixed bottom-4 left-0 right-0 z-40 px-4">
        <div className="mx-auto max-w-md rounded-full shadow-lg ring-1 ring-black/5 overflow-hidden flex items-center" style={{ backgroundColor: primaryColor }}>
          <button
            onClick={() => handleBookService()}
            className="flex-1 py-3 px-5 text-white font-semibold text-center"
          >
            Book now
          </button>
          <Separator orientation="vertical" className="h-10 bg-white/20" />
          <a
            href={`tel:${tenant.phone}`}
            className="py-3 px-4 text-white/90"
            aria-label="Call clinic"
          >
            <Phone className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Floating WhatsApp */}
      {tenant.whatsappNumber && (
        <a
          href={`https://wa.me/${tenant.whatsappNumber.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-24 right-4 sm:right-6 z-40 inline-flex items-center justify-center w-12 h-12 rounded-full shadow-lg ring-1 ring-black/10"
          style={{ backgroundColor: accentColor }}
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </a>
      )}

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