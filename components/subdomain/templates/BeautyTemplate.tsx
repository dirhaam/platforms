'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MapPin, Star, Sparkles } from 'lucide-react';
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

interface BeautyTemplateProps {
  tenant: TenantData;
  services?: Service[];
  businessHours?: BusinessHours;
  videos?: VideoItem[];
  socialMedia?: SocialMediaLink[];
  galleries?: PhotoGallery[];
  videoOptions?: { videoSize: 'small'|'medium'|'large'; autoplay: boolean };
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
  
  const primaryColor = tenant.brandColors?.primary || '#d946ef';
  
  const handleBookService = (service?: Service) => {
    setSelectedService(service);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              {tenant.logo ? (
                <img src={tenant.logo} alt={tenant.businessName} className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="text-3xl">{tenant.emoji}</div>
              )}
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  {tenant.businessName}
                </h1>
                <p className="text-xs text-gray-600">{tenant.businessCategory}</p>
              </div>
            </div>
            <Button 
              size="lg"
              style={{ backgroundColor: primaryColor }}
              className="text-white"
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
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            {tenant.businessName}
          </h2>
          {tenant.businessDescription && (
            <p className="text-xl text-gray-700 mb-8">{tenant.businessDescription}</p>
          )}
          <Button 
            size="lg" 
            className="text-white text-lg px-8 py-3"
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
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Premium Services
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.slice(0, 9).map((service) => (
                <Card 
                  key={service.id} 
                  className="group hover:shadow-2xl transition-all duration-300 overflow-hidden border-0 bg-white/80 backdrop-blur"
                >
                  {/* Gradient Top */}
                  <div 
                    className="h-1 bg-gradient-to-r from-pink-500 to-purple-500"
                  />
                  
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-3">
                      <CardTitle className="text-xl">{service.name}</CardTitle>
                      <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white border-0">
                        {service.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {service.description && (
                      <p className="text-sm text-gray-600">{service.description}</p>
                    )}
                    
                    <div className="space-y-2 py-3 border-t border-b border-pink-100">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Duration</span>
                        <span className="font-semibold">{service.duration} min</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Price</span>
                        <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                          IDR {Number(service.price).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {service.homeVisitAvailable && (
                      <div className="p-2 bg-pink-50 rounded text-sm text-pink-700 font-medium">
                        ✨ Home visit available (+IDR {Number(service.homeVisitSurcharge || 0).toLocaleString('id-ID')})
                      </div>
                    )}

                    <Button 
                      className="w-full text-white"
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

      {/* Why Choose Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Why Choose Us
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '👑', title: 'Premium Quality', desc: 'Best products & techniques' },
              { icon: '✨', title: 'Expert Team', desc: 'Certified professionals' },
              { icon: '⏰', title: 'Quick Booking', desc: 'Reserve instantly online' },
              { icon: '😊', title: 'Satisfaction', desc: '100% satisfaction guaranteed' }
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Get in Touch
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tenant.phone && (
              <Card className="border-0 bg-gradient-to-br from-pink-50 to-pink-100">
                <CardContent className="pt-6 text-center">
                  <Phone className="h-8 w-8 mx-auto mb-4" style={{ color: primaryColor }} />
                  <p className="font-semibold mb-2">Call Us</p>
                  <a href={`tel:${tenant.phone}`} className="text-sm hover:underline">
                    {tenant.phone}
                  </a>
                </CardContent>
              </Card>
            )}
            
            {tenant.email && (
              <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="pt-6 text-center">
                  <Mail className="h-8 w-8 mx-auto mb-4" style={{ color: primaryColor }} />
                  <p className="font-semibold mb-2">Email Us</p>
                  <a href={`mailto:${tenant.email}`} className="text-sm hover:underline">
                    {tenant.email}
                  </a>
                </CardContent>
              </Card>
            )}
            
            {tenant.address && (
              <Card className="border-0 bg-gradient-to-br from-pink-50 to-purple-50">
                <CardContent className="pt-6 text-center">
                  <MapPin className="h-8 w-8 mx-auto mb-4" style={{ color: primaryColor }} />
                  <p className="font-semibold mb-2">Location</p>
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(tenant.address)}`} className="text-sm hover:underline">
                    View Map
                  </a>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Videos Inline (no section/header) */}
      {videos && videos.length > 0 && (
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

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-center">
        <p>© 2024 {tenant.businessName}. All services reserved.</p>
        <p className="text-sm opacity-80">
          Powered by <Link href={`${protocol}://${rootDomain}`} className="hover:underline">{rootDomain}</Link>
        </p>
        <p className="text-sm opacity-80 mt-2">
          <Link href="/tenant/login" className="hover:underline font-medium text-pink-200">Business Admin Login</Link>
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
