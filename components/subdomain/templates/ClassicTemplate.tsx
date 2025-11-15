'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MapPin, ChevronRight } from 'lucide-react';
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

  const defaultPrimary = '#1f3447';
  const primaryColor = tenant.brandColors?.primary || defaultPrimary;

  return (
    <div className="min-h-screen bg-[#f5efe6] flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg my-8 mx-auto overflow-visible">
        {/* HEADER (putih) */}
        <header className="px-4 sm:px-8 pt-6 pb-0 bg-white">
          <div className="flex items-center justify-between py-2">
            <div>
              <span className="font-semibold text-lg text-slate-900">
                {tenant.businessName}
              </span>
            </div>
            <Button
              className="hidden sm:inline-flex rounded-full text-white px-6 py-2 shadow font-medium"
              style={{ backgroundColor: primaryColor }}
              onClick={() => setIsBookingOpen(true)}
            >Book Now</Button>
          </div>
        </header>
        {/* HERO NAVY */}
        <div className="relative px-0 pb-0">
          <div style={{ backgroundColor: primaryColor }}>
            <div className="px-7 sm:px-12 py-12 sm:py-16 text-white">
              <div className="max-w-xl">
                <p className="text-xs sm:text-sm tracking-[0.18em] uppercase text-sky-200 mb-3">
                </p>
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
          <div className="w-full flex justify-end" style={{ position: 'relative', marginTop: '-2rem' }}>
            <Card className="w-72 shadow-lg rounded-2xl border-none bg-white mr-10">
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
                            onClick={() => setIsBookingOpen(true)}
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

          {/* Videos Section */}
          {videos.length > 0 && (
            <section className="py-8 bg-slate-100 rounded-xl">
              <VideoSection
                videos={videos}
                displayType="grid"
                primaryColor={primaryColor}
                mode="inline"
                showHeader={false}
                size={videoOptions?.videoSize}
                autoplay={videoOptions?.autoplay}
              />
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
        </div>

        {/* FOOTER */}
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
