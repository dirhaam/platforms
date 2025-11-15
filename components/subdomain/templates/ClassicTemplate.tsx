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
  videoOptions
}: ClassicTemplateProps) {
  const [selectedService, setSelectedService] = useState<Service | undefined>();
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const primaryColor = tenant.brandColors?.primary || '#2c3e50';

  const handleBookService = (service?: Service) => {
    setSelectedService(service);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top Navigation */}
      <nav className="border-b border-gray-200 shadow-sm bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              {tenant.logo ? (
                <img
                  src={tenant.logo}
                  alt={tenant.businessName}
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <div className="text-3xl">{tenant.emoji}</div>
              )}
              <div>
                <h1
                  className="text-xl font-bold"
                  style={{ color: primaryColor }}
                >
                  {tenant.businessName}
                </h1>
                <p className="text-xs text-gray-600">{tenant.businessCategory}</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => handleBookService()}>
              Book Now
            </Button>
          </div>
        </div>
      </nav>

      {/* Content + Sidebar */}
      <div className="flex-1 flex items-stretch">
        {/* Sidebar (desktop only) */}
        <aside className="hidden lg:block w-72 border-r border-gray-200 bg-gray-50">
          <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-6 space-y-8">
            {/* About */}
            {(tenant.businessDescription || '').trim() && (
              <section>
                <h3
                  className="text-sm font-semibold mb-2 uppercase tracking-wide"
                  style={{ color: primaryColor }}
                >
                  About
                </h3>
                <p className="text-sm text-gray-700">
                  {tenant.businessDescription}
                </p>
              </section>
            )}

            {/* Business Hours */}
            {businessHours && (
              <section>
                <h3
                  className="text-sm font-semibold mb-3 uppercase tracking-wide"
                  style={{ color: primaryColor }}
                >
                  Hours
                </h3>

                <Card className="shadow-sm border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      Business Hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* Komponen bawaan, tapi dibatasi lebar & rapi */}
                    <div className="w-full">
                      <BusinessHoursDisplay businessHours={businessHours} />
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Contact */}
            <section>
              <h3
                className="text-sm font-semibold mb-3 uppercase tracking-wide"
                style={{ color: primaryColor }}
              >
                Contact
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                {tenant.phone && (
                  <a
                    href={`tel:${tenant.phone}`}
                    className="flex items-center gap-2 hover:text-blue-600"
                  >
                    <Phone className="h-4 w-4" />
                    <span>{tenant.phone}</span>
                  </a>
                )}
                {tenant.email && (
                  <a
                    href={`mailto:${tenant.email}`}
                    className="flex items-center gap-2 hover:text-blue-600"
                  >
                    <Mail className="h-4 w-4" />
                    <span>{tenant.email}</span>
                  </a>
                )}
                {tenant.address && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(
                      tenant.address
                    )}`}
                    className="flex items-center gap-2 hover:text-blue-600"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>{tenant.address}</span>
                  </a>
                )}
              </div>
            </section>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Hero */}
          <section
            className="py-16 px-4 sm:px-6 lg:px-8"
            style={{ backgroundColor: primaryColor, color: 'white' }}
          >
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Welcome to {tenant.businessName}
              </h2>
              {tenant.businessDescription && (
                <p className="text-lg opacity-90 mb-8">
                  {tenant.businessDescription}
                </p>
              )}
              <Button
                size="lg"
                className="bg-white text-gray-900 hover:bg-gray-100 font-semibold"
                onClick={() => handleBookService()}
              >
                Book Appointment Today
              </Button>
            </div>
          </section>

          {/* Services */}
          {services.length > 0 && (
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
              <div className="max-w-3xl mx-auto">
                <h2
                  className="text-3xl font-bold mb-10 text-center"
                  style={{ color: primaryColor }}
                >
                  Our Services
                </h2>

                <div className="space-y-4">
                  {services.slice(0, 8).map((service) => (
                    <Card
                      key={service.id}
                      className="border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {service.name}
                              </h3>
                              {service.category && (
                                <Badge variant="outline" className="text-xs">
                                  {service.category}
                                </Badge>
                              )}
                            </div>
                            {service.description && (
                              <p className="text-sm text-gray-600 mb-3">
                                {service.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                              <span>⏱ {service.duration} min</span>
                              <span>
                                💰 IDR{' '}
                                {Number(service.price).toLocaleString('id-ID')}
                              </span>
                              {service.homeVisitAvailable && (
                                <span className="text-green-600">
                                  📍 Home visit available
                                </span>
                              )}
                            </div>
                          </div>

                          <Button
                            onClick={() => handleBookService(service)}
                            className="text-white"
                            style={{ backgroundColor: primaryColor }}
                          >
                            Book <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Videos */}
          {videos.length > 0 && (
            <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
              <div className="max-w-4xl mx-auto">
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
          {socialMedia.length > 0 && (
            <section className="py-10 px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
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
          {galleries &&
            galleries.map((gallery) => (
              <section
                key={gallery.id}
                className="py-10 px-4 sm:px-6 lg:px-8 bg-white"
              >
                <div className="max-w-4xl mx-auto">
                  <PhotoGallerySection
                    gallery={gallery}
                    primaryColor={primaryColor}
                  />
                </div>
              </section>
            ))}

          {/* Footer */}
          <footer
            className="border-t border-gray-300 py-8 px-4 sm:px-6 lg:px-8 mt-8"
            style={{ backgroundColor: primaryColor, color: 'white' }}
          >
            <div className="max-w-4xl mx-auto text-center text-sm">
              <p>© 2024 {tenant.businessName}. All rights reserved.</p>
              <p className="opacity-80 flex flex-wrap justify-center gap-2 mt-1">
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
        </main>
      </div>

      {/* Booking Dialog */}
      <BookingDialog
        service={selectedService}
        tenant={tenant}
        template="classic"
        isOpen={isBookingOpen}
        onOpenChange={setIsBookingOpen}
      />
    </div>
  );
}
