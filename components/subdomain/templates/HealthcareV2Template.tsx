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
      className="w-full h-full rounded-3xl shadow-2xl border-4 border-white/20"
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
      <div className="flex justify-center items-center gap-2 mt-8">
        <button className="p-3 rounded-full hover:bg-gray-100 border transition-all" disabled={page === 0} onClick={() => setPage(page-1)}>
          <i className='bx bx-chevron-left text-xl'></i>
        </button>
        {Array(totalPages).fill(0).map((_, i) => (
          <button
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${i === page ? 'bg-[#1f3447] scale-110' : 'bg-gray-300'}`}
            onClick={() => setPage(i)}
          />
        ))}
        <button className="p-3 rounded-full hover:bg-gray-100 border transition-all" disabled={page === totalPages-1} onClick={() => setPage(page+1)}>
          <i className='bx bx-chevron-right text-xl'></i>
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
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-primary/20">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-gray-100 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center gap-3 group">
              {tenant.logo && (
                <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-gray-50 shadow-sm group-hover:scale-105 transition-transform duration-300">
                  <Image src={tenant.logo} alt={`${tenant.businessName} logo`} fill sizes="40px" className="object-cover" />
                </div>
              )}
              <div>
                <p className="text-lg font-bold leading-tight tracking-tight" style={{ color: primaryColor }}>{tenant.businessName}</p>
              </div>
            </Link>
            <div className="hidden sm:flex items-center gap-4">
              {tenant.phone && (
                <a
                  href={`tel:${tenant.phone}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary transition-colors"
                  style={{ '--hover-color': primaryColor } as any}
                >
                  <i className='bx bx-phone text-lg'></i> {tenant.phone}
                </a>
              )}
              <Button
                size="sm"
                onClick={() => handleBookService()}
                className="text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 rounded-full px-6"
                style={{ backgroundColor: primaryColor }}
              >
                Book now
                <i className='bx bx-chevron-right text-lg ml-1'></i>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        aria-label="Intro"
      >
        <div 
          className="absolute inset-0 -z-10"
          style={{ 
            background: `radial-gradient(circle at 80% 20%, ${secondaryColor}15 0%, transparent 50%), radial-gradient(circle at 20% 80%, ${primaryColor}10 0%, transparent 50%), white` 
          }} 
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center py-16 lg:py-24">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-medium mb-6 animate-fade-in">
                <span className="flex h-2 w-2 rounded-full" style={{ backgroundColor: accentColor }}></span>
                Available for appointments
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-gray-900 mb-6">
                Your Health, <br />
                <span style={{ color: primaryColor }}>Our Priority</span>
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed max-w-prose mb-8">
                {tenant.businessDescription || 'Experience professional healthcare services designed around your needs. Dedicated staff, modern facilities, and a personal touch.'}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Button 
                  size="lg" 
                  onClick={() => handleBookService()} 
                  className="text-white h-12 px-8 rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                  style={{ backgroundColor: primaryColor }}
                >
                  Book Appointment
                </Button>
                {tenant.whatsappNumber && (
                  <a
                    href={`https://wa.me/${tenant.whatsappNumber.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium shadow-sm"
                  >
                    <i className='bx bxl-whatsapp text-xl text-green-500'></i> Chat on WhatsApp
                  </a>
                )}
              </div>
              <div className="mt-10 flex items-center gap-6 text-sm font-medium text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center overflow-hidden">
                        <i className='bx bx-user text-gray-400 text-xs'></i>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center text-yellow-400">
                      <i className='bx bxs-star'></i>
                      <i className='bx bxs-star'></i>
                      <i className='bx bxs-star'></i>
                      <i className='bx bxs-star'></i>
                      <i className='bx bxs-star'></i>
                    </div>
                    <span className="text-xs">Trusted by 2k+ patients</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div 
                className="absolute -inset-4 rounded-[2.5rem] blur-2xl opacity-30 -z-10 transform rotate-3 scale-105"
                style={{ backgroundColor: primaryColor }}
              />
              <div
                className={
                  `relative rounded-[2rem] overflow-hidden shadow-2xl bg-white border-4 border-white ` +
                  (videoSize === 'small'
                    ? 'lg:h-64 h-40'
                    : videoSize === 'large'
                    ? 'lg:h-[30rem] h-80'
                    : 'lg:h-96 h-64')
                }
              >
                {videos && videos.length > 0 ? (
                  <HeroVideo video={videos[0] as VideoItem} autoplay={autoplay} />
                ) : (
                  <Image
                    src={tenant.logo || '/placeholder.svg'}
                    alt={`${tenant.businessName} cover`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                )}
              </div>
              {/* Floating card decoration */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 hidden md:block animate-bounce-slow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <i className='bx bx-shield-quarter text-2xl'></i>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Certified</p>
                    <p className="text-sm font-bold text-gray-900">Professional Care</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      {services.length > 0 && (
        <section className="py-20 sm:py-28 bg-gray-50/50" aria-label="Services">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div className="max-w-2xl">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-4">Our Services</h2>
                <p className="text-gray-600 text-lg">Explore our wide range of medical services designed for your well-being.</p>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto bg-white p-1.5 rounded-xl border shadow-sm">
                <div className="pl-3 text-gray-400">
                  <i className='bx bx-search text-xl'></i>
                </div>
                <Input
                  placeholder="Search services..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="border-0 focus-visible:ring-0 bg-transparent w-full md:w-64"
                />
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-primary">
                  <i className='bx bx-filter-alt'></i>
                </Button>
              </div>
            </div>

            <Tabs value={activeCat} defaultValue="All" onValueChange={(v) => setActiveCat(v)}>
              <TabsList className="flex flex-wrap gap-2 bg-transparent p-0 h-auto justify-start mb-8">
                {categories.map((c) => (
                  <TabsTrigger 
                    key={c} 
                    value={c} 
                    className="data-[state=active]:bg-gray-900 data-[state=active]:text-white bg-white border border-gray-200 rounded-full px-6 py-2.5 text-sm font-medium transition-all shadow-sm"
                  >
                    {c}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {categories.map((cat) => {
                const visible = (services || []).filter(filterBy(cat, query));
                return (
                  <TabsContent key={cat} value={cat} className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                      {visible.map((service) => (
                        <div
                          key={service.id}
                          className="group relative bg-white rounded-3xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                        >
                          <div className="absolute top-6 right-6">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-300">
                              <i className='bx bx-right-arrow-alt text-2xl text-gray-400 group-hover:text-primary transition-colors'></i>
                            </div>
                          </div>
                          
                          <div className="mb-6">
                            {service.category && (
                              <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-xs font-semibold text-gray-600 mb-3">
                                {service.category}
                              </span>
                            )}
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors mb-2 pr-12">
                              {service.name}
                            </h3>
                            {service.description && (
                              <p className="text-sm text-gray-500 line-clamp-2">
                                {service.description}
                              </p>
                            )}
                          </div>

                          <div className="mt-auto pt-6 border-t border-dashed border-gray-100 flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Starting from</p>
                              <p className="text-lg font-bold" style={{ color: primaryColor }}>
                                {formatPrice(service.price as any)}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md">
                                <i className='bx bx-time text-base'></i>
                                {service.duration} min
                              </div>
                              {service.homeVisitAvailable && (
                                <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-md">
                                  <i className='bx bx-home-heart text-base'></i>
                                  Home Visit
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Clickable overlay */}
                          <button 
                            className="absolute inset-0 rounded-3xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                            onClick={() => handleBookService(service)}
                          >
                            <span className="sr-only">Book {service.name}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                    {visible.length === 0 && (
                      <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <i className='bx bx-search text-3xl text-gray-300'></i>
                        </div>
                        <p className="text-gray-500 font-medium">No services found matching your criteria.</p>
                        <Button onClick={() => { setQuery(''); setActiveCat('All'); }} className="mt-4" variant="outline">
                          Clear Filters
                        </Button>
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2 block">Testimonials</span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-gray-900">
              What our patients say
            </h2>
            <div className="w-20 h-1.5 rounded-full mx-auto" style={{ backgroundColor: primaryColor }}></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-gray-50 rounded-3xl p-8 relative group hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100">
                <i className='bx bxs-quote-alt-left text-4xl text-gray-200 absolute top-8 left-8 group-hover:text-primary/20 transition-colors'></i>
                <div className="relative z-10 pt-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <i key={j} className='bx bxs-star text-yellow-400 text-lg'></i>
                    ))}
                  </div>
                  <p className="text-gray-600 leading-relaxed mb-6 font-medium">"{testimonial.text}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{testimonial.name}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 border-y border-gray-200">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Common Questions
          </h2>

          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <div
                key={idx}
                className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${expandedFAQ === idx ? 'shadow-md border-primary/30' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                  className="w-full text-left p-6 flex items-center justify-between"
                >
                  <span className="font-semibold text-lg text-gray-900">{item.question}</span>
                  <span 
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${expandedFAQ === idx ? 'bg-primary text-white rotate-180' : 'bg-gray-100 text-gray-500'}`}
                    style={expandedFAQ === idx ? { backgroundColor: primaryColor } : {}}
                  >
                    <i className='bx bx-chevron-down text-xl'></i>
                  </span>
                </button>
                
                <div 
                  className={`px-6 transition-all duration-300 ease-in-out overflow-hidden ${expandedFAQ === idx ? 'max-h-48 opacity-100 pb-6' : 'max-h-0 opacity-0'}`}
                >
                  <p className="text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                    {item.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gray-900">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `radial-gradient(${primaryColor} 1px, transparent 1px)`, backgroundSize: '30px 30px' }}></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <div>
            <div className="inline-block p-3 rounded-2xl bg-white/10 backdrop-blur-sm mb-6">
               <i className='bx bx-envelope text-3xl text-white'></i>
            </div>
            <h2 className="text-4xl font-bold mb-4 text-white">
              Stay Healthy, Stay Informed
            </h2>
            <p className="text-gray-300 text-lg max-w-xl mx-auto">
              Join our community newsletter for the latest health tips, news, and exclusive offers.
            </p>
          </div>

          <div className="flex gap-3 flex-col sm:flex-row max-w-lg mx-auto bg-white/5 p-2 rounded-2xl backdrop-blur-sm border border-white/10">
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-6 py-4 rounded-xl bg-white/90 border-0 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-primary"
            />
            <Button 
              onClick={() => {
                if (email) {
                  setEmail('');
                }
              }}
              style={{ backgroundColor: primaryColor }}
              className="text-white h-auto py-4 px-8 rounded-xl hover:brightness-110 shadow-lg font-semibold text-base"
            >
              Subscribe
            </Button>
          </div>
          <p className="text-xs text-gray-500">We care about your data in our privacy policy.</p>
        </div>
      </section>

      {/* Business Hours */}
      {businessHours && (
        <section className="py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Opening Hours</h2>
              <p className="text-gray-500">We are here to serve you during these times</p>
            </div>
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full -mr-10 -mt-10" style={{ '--tw-gradient-from': `${primaryColor}20` } as any}></div>
              <BusinessHoursDisplay 
                businessHours={businessHours}
                className="w-full max-w-md mx-auto relative z-10"
              />
            </div>
          </div>
        </section>
      )}

      {/* Social Media Section */}
      {socialMedia && socialMedia.length > 0 && (
        <div className="bg-gray-50 border-t border-gray-200 py-12">
           <SocialMediaSection 
            socialMedia={socialMedia}
            displayType="icons"
            title="Follow Our Updates"
            primaryColor={primaryColor}
            orientation="horizontal"
          />
        </div>
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
