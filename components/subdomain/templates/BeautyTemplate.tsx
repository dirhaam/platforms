'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MapPin, Sparkles } from 'lucide-react';
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

  // Peach & Cream palette
  const defaultPrimary = '#F7C6A5'; // soft peach
  const primaryColor = tenant.brandColors?.primary || defaultPrimary;

  const handleBookService = (service?: Service) => {
    setSelectedService(service);
    setIsBookingOpen(true);
  };

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

              <h1 className="text-xl font-semibold bg-gradient-to-r from-[#E3A078] to-[#F7C6A5] bg-clip-text text-transparent">
                {tenant.businessName}
              </h1>
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
      <footer className="py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#E3A078] to-[#F7C6A5] text-white text-center">
        <p className="font-medium">
          © 2024 {tenant.businessName}. All services reserved.
        </p>

        <p className="text-sm opacity-90 mt-2">
          Powered by{' '}
          <Link
            href={`${protocol}://${rootDomain}`}
            className="hover:underline font-medium"
          >
            {rootDomain}
          </Link>
        </p>

        <p className="text-sm opacity-90 mt-2">
          <Link
            href="/tenant/login"
            className="hover:underline font-medium"
          >
            Business Admin Login
          </Link>
        </p>
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
