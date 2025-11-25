'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Phone, Mail, MapPin, ArrowLeft, Facebook, Instagram, Youtube, Linkedin, Twitter, MessageCircle } from 'lucide-react';

interface ContactLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  icon_type?: string;
  background_color?: string;
  text_color?: string;
  display_order: number;
}

interface ContactPageSettings {
  pageTitle?: string;
  pageDescription?: string;
  profileImage?: string;
  backgroundType: string;
  backgroundValue: string;
  buttonStyle: string;
  buttonShadow: boolean;
  fontFamily: string;
  showSocialIcons: boolean;
  showLogo: boolean;
}

interface SocialMedia {
  id: string;
  platform: string;
  url: string;
  display_order: number;
}

interface TenantData {
  id: string;
  subdomain: string;
  businessName: string;
  businessCategory: string;
  logo?: string;
  emoji?: string;
  phone?: string;
  email?: string;
  address?: string;
  brandColors?: {
    primary?: string;
    secondary?: string;
  };
}

interface ContactPageProps {
  tenant: TenantData;
  links: ContactLink[];
  settings: ContactPageSettings | null;
  socialMedia: SocialMedia[];
}

const SocialIcon = ({ platform }: { platform: string }) => {
  const iconClass = "w-5 h-5";
  switch (platform.toLowerCase()) {
    case 'facebook': return <Facebook className={iconClass} />;
    case 'instagram': return <Instagram className={iconClass} />;
    case 'tiktok': return <span className={iconClass}>TT</span>;
    case 'youtube': return <Youtube className={iconClass} />;
    case 'linkedin': return <Linkedin className={iconClass} />;
    case 'twitter': return <Twitter className={iconClass} />;
    case 'whatsapp': return <MessageCircle className={iconClass} />;
    default: return <ExternalLink className={iconClass} />;
  }
};

export default function ContactPage({
  tenant,
  links,
  settings,
  socialMedia,
}: ContactPageProps) {
  const [clickedLink, setClickedLink] = useState<string | null>(null);

  const pageTitle = settings?.pageTitle || tenant.businessName;
  const pageDescription = settings?.pageDescription || tenant.businessCategory;
  const profileImage = settings?.profileImage || tenant.logo;
  const showLogo = settings?.showLogo !== false;
  const showSocialIcons = settings?.showSocialIcons !== false;
  const buttonStyle = settings?.buttonStyle || 'rounded';
  const buttonShadow = settings?.buttonShadow !== false;
  const primaryColor = tenant.brandColors?.primary || '#3b82f6';

  const getBackgroundStyle = () => {
    const bgType = settings?.backgroundType || 'solid';
    const bgValue = settings?.backgroundValue || '#000000';

    if (bgType === 'solid') {
      return { backgroundColor: bgValue };
    } else if (bgType === 'gradient') {
      return { background: bgValue };
    } else if (bgType === 'image') {
      return {
        backgroundImage: `url(${bgValue})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      };
    }
    return { backgroundColor: '#000000' };
  };

  const getButtonClass = () => {
    let base = 'w-full p-4 backdrop-blur-sm border border-white/20 text-white flex items-center gap-3 transition-all duration-300 hover:scale-[1.02] hover:bg-white/20';
    
    switch (buttonStyle) {
      case 'pill': base += ' rounded-full'; break;
      case 'square': base += ' rounded-none'; break;
      default: base += ' rounded-xl'; break;
    }
    
    if (buttonShadow) {
      base += ' shadow-lg hover:shadow-xl';
    }
    
    return base;
  };

  const handleLinkClick = async (link: ContactLink) => {
    setClickedLink(link.id);
    
    // Track click (fire and forget)
    fetch('/api/public/contact-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkId: link.id }),
    }).catch(() => {});

    // Small delay for visual feedback
    setTimeout(() => {
      window.open(link.url, '_blank', 'noopener,noreferrer');
      setClickedLink(null);
    }, 150);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={getBackgroundStyle()}
    >
      {/* Overlay for image backgrounds */}
      {settings?.backgroundType === 'image' && (
        <div className="fixed inset-0 bg-black/40 pointer-events-none" />
      )}

      {/* Back to main page */}
      <div className="relative z-10 p-4">
        <Link
          href={`/s/${tenant.subdomain}`}
          className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to main page
        </Link>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-start justify-center px-4 pb-8">
        <div className="w-full max-w-md space-y-8">
          {/* Profile Section */}
          {showLogo && (
            <div className="text-center space-y-4 pt-4">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={pageTitle}
                  className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-white/20 shadow-xl"
                />
              ) : tenant.emoji ? (
                <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm border-4 border-white/20 flex items-center justify-center mx-auto text-5xl shadow-xl">
                  {tenant.emoji}
                </div>
              ) : null}

              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                  {pageTitle}
                </h1>
                {pageDescription && (
                  <p className="text-white/80 mt-1 text-sm">
                    {pageDescription}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="space-y-3">
            {links.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link)}
                className={`${getButtonClass()} ${clickedLink === link.id ? 'scale-95 bg-white/30' : 'bg-white/10'}`}
                style={{
                  backgroundColor: link.background_color || undefined,
                  color: link.text_color || undefined,
                }}
              >
                <span className="text-2xl flex-shrink-0">{link.icon || '🔗'}</span>
                <span className="flex-1 font-medium text-left">{link.title}</span>
                <ExternalLink className="w-4 h-4 opacity-60" />
              </button>
            ))}

            {/* Default contact links if no custom links */}
            {links.length === 0 && (
              <>
                {tenant.phone && (
                  <a
                    href={`tel:${tenant.phone}`}
                    className={`${getButtonClass()} bg-white/10`}
                  >
                    <Phone className="w-6 h-6" />
                    <span className="flex-1 font-medium">{tenant.phone}</span>
                  </a>
                )}
                {tenant.email && (
                  <a
                    href={`mailto:${tenant.email}`}
                    className={`${getButtonClass()} bg-white/10`}
                  >
                    <Mail className="w-6 h-6" />
                    <span className="flex-1 font-medium">{tenant.email}</span>
                  </a>
                )}
                {tenant.address && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(tenant.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${getButtonClass()} bg-white/10`}
                  >
                    <MapPin className="w-6 h-6" />
                    <span className="flex-1 font-medium text-sm">{tenant.address}</span>
                  </a>
                )}
              </>
            )}
          </div>

          {/* Social Media Icons */}
          {showSocialIcons && socialMedia.length > 0 && (
            <div className="flex justify-center gap-4 pt-4">
              {socialMedia.map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all duration-300 shadow-lg"
                >
                  <SocialIcon platform={social.platform} />
                </a>
              ))}
            </div>
          )}

          {/* Quick Contact Buttons */}
          {(tenant.phone || tenant.email) && links.length > 0 && (
            <div className="flex justify-center gap-3 pt-2">
              {tenant.phone && (
                <a
                  href={`https://wa.me/${tenant.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-green-500/80 backdrop-blur-sm flex items-center justify-center text-white hover:bg-green-500 hover:scale-110 transition-all duration-300 shadow-lg"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
              )}
              {tenant.phone && (
                <a
                  href={`tel:${tenant.phone}`}
                  className="w-12 h-12 rounded-full bg-blue-500/80 backdrop-blur-sm flex items-center justify-center text-white hover:bg-blue-500 hover:scale-110 transition-all duration-300 shadow-lg"
                  title="Call"
                >
                  <Phone className="w-5 h-5" />
                </a>
              )}
              {tenant.email && (
                <a
                  href={`mailto:${tenant.email}`}
                  className="w-12 h-12 rounded-full bg-purple-500/80 backdrop-blur-sm flex items-center justify-center text-white hover:bg-purple-500 hover:scale-110 transition-all duration-300 shadow-lg"
                  title="Email"
                >
                  <Mail className="w-5 h-5" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-6">
        <p className="text-white/40 text-xs">
          Powered by{' '}
          <a href="/" className="hover:text-white/60 transition-colors">
            Platforms
          </a>
        </p>
      </div>
    </div>
  );
}
