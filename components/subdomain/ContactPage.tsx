'use client';

import { useState } from 'react';
import Link from 'next/link';

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
  // Profile layout
  profileLayout?: 'classic' | 'hero';
  titleStyle?: 'text' | 'logo';
  titleSize?: 'small' | 'large';
  titleColor?: string;
  // Theme
  theme?: string;
  // Background
  backgroundType: string;
  backgroundValue: string;
  backgroundColor?: string;
  // Text
  fontFamily: string;
  pageTextColor?: string;
  // Button
  buttonStyle: string;
  buttonCorners?: 'square' | 'rounded' | 'pill';
  buttonShadow: string | boolean;
  buttonColor?: string;
  buttonTextColor?: string;
  // Legacy
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
  const iconClass = "text-xl";
  switch (platform.toLowerCase()) {
    case 'facebook': return <i className={`bx bxl-facebook ${iconClass}`}></i>;
    case 'instagram': return <i className={`bx bxl-instagram ${iconClass}`}></i>;
    case 'tiktok': return <i className={`bx bxl-tiktok ${iconClass}`}></i>;
    case 'youtube': return <i className={`bx bxl-youtube ${iconClass}`}></i>;
    case 'linkedin': return <i className={`bx bxl-linkedin ${iconClass}`}></i>;
    case 'twitter': return <i className={`bx bxl-twitter ${iconClass}`}></i>;
    case 'whatsapp': return <i className={`bx bxl-whatsapp ${iconClass}`}></i>;
    default: return <i className={`bx bx-link-external ${iconClass}`}></i>;
  }
};

export default function ContactPage({
  tenant,
  links,
  settings,
  socialMedia,
}: ContactPageProps) {
  const [clickedLink, setClickedLink] = useState<string | null>(null);

  // Profile settings
  const pageTitle = settings?.pageTitle || tenant.businessName;
  const pageDescription = settings?.pageDescription || tenant.businessCategory;
  const profileImage = settings?.profileImage || tenant.logo;
  const profileLayout = settings?.profileLayout || 'classic';
  const titleSize = settings?.titleSize || 'large';
  const titleColor = settings?.titleColor || '#ffffff';
  const pageTextColor = settings?.pageTextColor || '#ffffff';
  
  // Display settings
  const showLogo = settings?.showLogo !== false;
  const showSocialIcons = settings?.showSocialIcons !== false;
  
  // Button settings
  const buttonStyle = settings?.buttonStyle || 'solid';
  const buttonCorners = settings?.buttonCorners || 'rounded';
  const buttonShadow = settings?.buttonShadow || 'subtle';
  const buttonColor = settings?.buttonColor || '#ffffff';
  const buttonTextColor = settings?.buttonTextColor || '#000000';
  
  // Background
  const backgroundColor = settings?.backgroundColor || settings?.backgroundValue || '#000000';

  const getBackgroundStyle = (): React.CSSProperties => {
    const bgType = settings?.backgroundType || 'solid';
    const bgValue = settings?.backgroundValue || '#000000';

    switch (bgType) {
      case 'solid':
        return { backgroundColor: backgroundColor };
      case 'gradient':
        return { background: bgValue };
      case 'blur':
        return { 
          backgroundColor: backgroundColor,
          backdropFilter: 'blur(20px)',
        };
      case 'pattern':
        return { 
          backgroundColor: backgroundColor,
          backgroundImage: getPatternStyle(bgValue),
          backgroundSize: bgValue === 'dots' ? '20px 20px' : bgValue === 'grid' ? '40px 40px' : '10px 10px',
        };
      case 'image':
        return {
          backgroundImage: `url(${bgValue})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        };
      case 'video':
        return { backgroundColor: backgroundColor };
      default:
        return { backgroundColor: '#000000' };
    }
  };

  const getPatternStyle = (pattern: string) => {
    switch (pattern) {
      case 'dots':
        return `radial-gradient(circle, ${pageTextColor}20 1px, transparent 1px)`;
      case 'grid':
        return `linear-gradient(${pageTextColor}10 1px, transparent 1px), linear-gradient(90deg, ${pageTextColor}10 1px, transparent 1px)`;
      case 'diagonal':
        return `repeating-linear-gradient(45deg, ${pageTextColor}10 0, ${pageTextColor}10 1px, transparent 0, transparent 50%)`;
      default:
        return 'none';
    }
  };

  const getButtonCornerClass = () => {
    switch (buttonCorners) {
      case 'pill': return 'rounded-full';
      case 'square': return 'rounded-none';
      default: return 'rounded-xl';
    }
  };

  const getButtonStyleClass = () => {
    switch (buttonStyle) {
      case 'glass': return 'bg-white/10 backdrop-blur-sm border border-white/20';
      case 'outline': return 'bg-transparent border-2';
      default: return ''; // solid
    }
  };

  const getButtonShadowClass = () => {
    if (typeof buttonShadow === 'boolean') {
      return buttonShadow ? 'shadow-lg hover:shadow-xl' : '';
    }
    switch (buttonShadow) {
      case 'subtle': return 'shadow-md hover:shadow-lg';
      case 'strong': return 'shadow-xl hover:shadow-2xl';
      case 'hard': return 'shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]';
      default: return '';
    }
  };

  const getButtonClass = () => {
    return `w-full p-4 flex items-center gap-3 transition-all duration-300 hover:scale-[1.02] ${getButtonCornerClass()} ${getButtonStyleClass()} ${getButtonShadowClass()}`;
  };

  const getButtonInlineStyle = () => {
    if (buttonStyle === 'solid') {
      return { backgroundColor: buttonColor, color: buttonTextColor };
    } else if (buttonStyle === 'outline') {
      return { borderColor: buttonColor, color: buttonColor };
    }
    return { color: pageTextColor };
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
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-white/20 hover:scale-110"
          style={{ color: pageTextColor }}
          title="Kembali ke halaman utama"
        >
          <i className='bx bx-home text-xl'></i>
        </Link>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-start justify-center px-4 pb-8">
        <div className="w-full max-w-md space-y-8">
          {/* Profile Section */}
          {showLogo && (
            <div className={`text-center space-y-4 pt-4 ${profileLayout === 'hero' ? 'pb-4' : ''}`}>
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={pageTitle}
                  className={`object-cover mx-auto border-4 border-white/20 shadow-xl ${
                    profileLayout === 'hero' 
                      ? 'w-full h-40 rounded-2xl' 
                      : 'w-24 h-24 rounded-full'
                  }`}
                />
              ) : tenant.emoji ? (
                <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm border-4 border-white/20 flex items-center justify-center mx-auto text-5xl shadow-xl">
                  {tenant.emoji}
                </div>
              ) : null}

              <div>
                <h1 
                  className={`font-bold drop-shadow-lg ${titleSize === 'large' ? 'text-2xl' : 'text-lg'}`}
                  style={{ color: titleColor }}
                >
                  {pageTitle}
                </h1>
                {pageDescription && (
                  <p className="mt-1 text-sm opacity-80" style={{ color: pageTextColor }}>
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
                className={`${getButtonClass()} ${clickedLink === link.id ? 'scale-95 opacity-80' : ''}`}
                style={link.background_color ? {
                  backgroundColor: link.background_color,
                  color: link.text_color || buttonTextColor,
                } : getButtonInlineStyle()}
              >
                <span className="text-2xl flex-shrink-0">{link.icon || '🔗'}</span>
                <span className="flex-1 font-medium text-left">{link.title}</span>
                <i className='bx bx-link-external opacity-60'></i>
              </button>
            ))}

            {/* Default contact links if no custom links */}
            {links.length === 0 && (
              <>
                {tenant.phone && (
                  <a
                    href={`tel:${tenant.phone}`}
                    className={getButtonClass()}
                    style={getButtonInlineStyle()}
                  >
                    <i className='bx bx-phone text-2xl'></i>
                    <span className="flex-1 font-medium">{tenant.phone}</span>
                  </a>
                )}
                {tenant.email && (
                  <a
                    href={`mailto:${tenant.email}`}
                    className={getButtonClass()}
                    style={getButtonInlineStyle()}
                  >
                    <i className='bx bx-envelope text-2xl'></i>
                    <span className="flex-1 font-medium">{tenant.email}</span>
                  </a>
                )}
                {tenant.address && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(tenant.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={getButtonClass()}
                    style={getButtonInlineStyle()}
                  >
                    <i className='bx bx-map text-2xl'></i>
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
                  <i className='bx bxl-whatsapp text-xl'></i>
                </a>
              )}
              {tenant.phone && (
                <a
                  href={`tel:${tenant.phone}`}
                  className="w-12 h-12 rounded-full bg-blue-500/80 backdrop-blur-sm flex items-center justify-center text-white hover:bg-blue-500 hover:scale-110 transition-all duration-300 shadow-lg"
                  title="Call"
                >
                  <i className='bx bx-phone text-xl'></i>
                </a>
              )}
              {tenant.email && (
                <a
                  href={`mailto:${tenant.email}`}
                  className="w-12 h-12 rounded-full bg-purple-500/80 backdrop-blur-sm flex items-center justify-center text-white hover:bg-purple-500 hover:scale-110 transition-all duration-300 shadow-lg"
                  title="Email"
                >
                  <i className='bx bx-envelope text-xl'></i>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-6">
        <p className="text-xs opacity-40" style={{ color: pageTextColor }}>
          Powered by{' '}
          <a 
            href={`/s/${tenant.subdomain}`} 
            className="hover:opacity-70 transition-opacity"
          >
            Booqing Platform
          </a>
        </p>
      </div>
    </div>
  );
}
