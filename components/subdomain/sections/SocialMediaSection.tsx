'use client';

import React from 'react';
import { SocialMediaLink } from '@/types/booking';
import { Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';
import Link from 'next/link';

interface SocialMediaSectionProps {
  socialMedia: SocialMediaLink[];
  displayType?: 'icons' | 'links' | 'buttons';
  title?: string;
  description?: string;
  primaryColor?: string;
  orientation?: 'horizontal' | 'vertical';
}

const getPlatformIcon = (platform: string) => {
  const iconProps = { className: 'h-6 w-6' };
  switch (platform.toLowerCase()) {
    case 'facebook':
      return <Facebook {...iconProps} />;
    case 'instagram':
      return <Instagram {...iconProps} />;
    case 'linkedin':
      return <Linkedin {...iconProps} />;
    case 'twitter':
      return <Twitter {...iconProps} />;
    case 'tiktok':
      return (
        <svg {...iconProps} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.68v12.7a2.85 2.85 0 1 1-5.92-2.86 2.87 2.87 0 0 1 2.31 1.24V9.4a6.28 6.28 0 0 0-5.32 6.33 6.41 6.41 0 0 0 10.86-1.23v-3.6a8.38 8.38 0 0 0 4.77 1.52v-3.66a4.73 4.73 0 0 1-.67-.05z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg {...iconProps} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    default:
      return <Link {...iconProps} />;
  }
};

export default function SocialMediaSection({
  socialMedia,
  displayType = 'icons',
  title = 'Follow Us',
  description,
  primaryColor = '#0066ff',
  orientation = 'horizontal'
}: SocialMediaSectionProps) {
  if (!socialMedia || socialMedia.length === 0) return null;

  const activeSocial = socialMedia
    .filter(s => s.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  if (activeSocial.length === 0) return null;

  const containerClass = orientation === 'vertical' ? 'space-y-4' : 'flex flex-wrap gap-4 justify-center';
  const buttonClass = orientation === 'vertical' ? 'w-full' : '';

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {(title || description) && (
          <div className="text-center mb-8">
            {title && <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>}
            {description && <p className="text-lg text-gray-600">{description}</p>}
          </div>
        )}

        {displayType === 'icons' && (
          <div className="flex flex-wrap gap-6 justify-center">
            {activeSocial.map((social) => (
              <a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-full hover:scale-110 transition-transform duration-300"
                style={{
                  backgroundColor: `${primaryColor}20`,
                  color: primaryColor
                }}
                aria-label={`Visit our ${social.platform} page`}
              >
                {getPlatformIcon(social.platform)}
              </a>
            ))}
          </div>
        )}

        {displayType === 'links' && (
          <div className={`max-w-md mx-auto ${containerClass}`}>
            {activeSocial.map((social) => (
              <a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 px-6 py-3 rounded-lg border transition-colors ${buttonClass}`}
                style={{
                  borderColor: primaryColor,
                  color: primaryColor
                }}
              >
                {getPlatformIcon(social.platform)}
                <span className="capitalize font-medium">{social.platform}</span>
              </a>
            ))}
          </div>
        )}

        {displayType === 'buttons' && (
          <div className={`max-w-md mx-auto ${containerClass}`}>
            {activeSocial.map((social) => (
              <a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 px-6 py-3 rounded-lg text-white font-medium transition-opacity hover:opacity-90 ${buttonClass}`}
                style={{ backgroundColor: primaryColor }}
              >
                {getPlatformIcon(social.platform)}
                <span className="capitalize">Follow on {social.platform}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
