'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LandingPageStyleSettings from '@/components/tenant/LandingPageStyleSettings';
import { BlockedDatesManager } from '@/components/booking/BlockedDatesManager';
import BusinessHoursGlobalSettings from '@/components/settings/BusinessHoursGlobalSettings';
import OperatingHoursSettings from '@/components/settings/OperatingHoursSettings';
import HomeVisitSettings from '@/components/settings/HomeVisitSettings';
import InvoiceSettings from '@/components/settings/InvoiceSettings';
import LandingPageMediaSettings from '@/components/settings/LandingPageMediaSettings';
import ContactPageSettings from '@/components/settings/ContactPageSettings';
import { PermissionGate } from '@/components/tenant/permission-gate';

interface TenantData {
  id: string;
  subdomain: string;
}

type TabType = 'appearance' | 'contact' | 'invoice' | 'media' | 'calendar' | 'notifications' | 'integrations';

interface MenuItem {
  id: TabType;
  title: string;
  icon: string;
  description: string;
  badge?: string;
  badgeColor?: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const MENU_GROUPS: MenuGroup[] = [
  {
    title: 'Landing Page',
    items: [
      { id: 'appearance', title: 'Tampilan', icon: 'bx-palette', description: 'Tema dan style landing page' },
      { id: 'media', title: 'Media', icon: 'bx-image', description: 'Video, galeri, dan media' },
      { id: 'contact', title: 'Contact Link', icon: 'bx-link', description: 'Halaman link kontak' },
    ]
  },
  {
    title: 'Operasional',
    items: [
      { id: 'calendar', title: 'Kalender', icon: 'bx-calendar', description: 'Jam operasional & libur' },
      { id: 'invoice', title: 'Invoice', icon: 'bx-receipt', description: 'Pengaturan faktur' },
    ]
  },
  {
    title: 'Lainnya',
    items: [
      { id: 'notifications', title: 'Notifikasi', icon: 'bx-bell', description: 'Pengaturan notifikasi', badge: 'Soon', badgeColor: 'warning' },
      { id: 'integrations', title: 'Integrasi', icon: 'bx-plug', description: 'Koneksi eksternal', badge: 'Soon', badgeColor: 'warning' },
    ]
  }
];

export default function SettingsPageContent() {
  return (
    <PermissionGate feature="settings">
      <SettingsPageInner />
    </PermissionGate>
  );
}

function SettingsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain');
  const tabParam = (searchParams?.get('tab') as TabType) || 'appearance';
  
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [landingPageMedia, setLandingPageMedia] = useState({
    videos: [],
    socialMedia: [],
    galleries: [],
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Find current menu item
  const currentItem = MENU_GROUPS.flatMap(g => g.items).find(item => item.id === tabParam) || MENU_GROUPS[0].items[0];

  useEffect(() => {
    if (!subdomain) {
      router.push('/tenant/login');
      return;
    }

    const fetchTenantId = async () => {
      try {
        const response = await fetch(`/api/tenants/${subdomain}`);
        if (response.ok) {
          const data: TenantData = await response.json();
          setTenantId(data.id);
        }
      } catch (error) {
        console.error('Error fetching tenant:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenantId();
  }, [subdomain, router]);

  useEffect(() => {
    if (!tenantId) return;

    const fetchMedia = async () => {
      try {
        const response = await fetch('/api/settings/landing-page-media', {
          headers: { 'x-tenant-id': tenantId },
          cache: 'no-store',
          credentials: 'same-origin',
        });
        if (response.ok) {
          const result = await response.json();
          setLandingPageMedia(result.data || { videos: [], socialMedia: [], galleries: [] });
        }
      } catch (error) {
        console.error('Error fetching landing page media:', error);
      }
    };

    fetchMedia();
  }, [tenantId]);

  const handleTabChange = (tab: TabType) => {
    router.push(`/tenant/admin/settings?subdomain=${subdomain}&tab=${tab}`);
    setMobileMenuOpen(false);
  };

  if (!subdomain) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 rounded-lg bg-primary-light dark:bg-[#35365f] flex items-center justify-center mb-4">
          <i className='bx bx-loader-alt text-2xl text-primary dark:text-[#a5a7ff] animate-spin'></i>
        </div>
        <p className="text-txt-secondary dark:text-[#b2b2c4]">Memuat pengaturan...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)]">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
            <i className='bx bx-cog text-xl text-primary dark:text-[#a5a7ff]'></i>
          </div>
          <div>
            <h4 className="text-xl font-bold text-txt-primary dark:text-[#d5d5e2]">Pengaturan</h4>
            <p className="text-sm text-txt-muted dark:text-[#7e7f96]">Kelola pengaturan bisnis Anda</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mobile Menu Toggle */}
        <div className="lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#2b2c40] rounded-lg border border-gray-100 dark:border-[#4e4f6c] shadow-card"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
                <i className={`bx ${currentItem.icon} text-lg text-primary dark:text-[#a5a7ff]`}></i>
              </div>
              <div className="text-left">
                <p className="font-medium text-txt-primary dark:text-[#d5d5e2]">{currentItem.title}</p>
                <p className="text-xs text-txt-muted dark:text-[#7e7f96]">{currentItem.description}</p>
              </div>
            </div>
            <i className={`bx bx-chevron-down text-xl text-txt-muted dark:text-[#7e7f96] transition-transform duration-200 ${mobileMenuOpen ? 'rotate-180' : ''}`}></i>
          </button>

          {/* Mobile Menu Dropdown */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-[600px] mt-2' : 'max-h-0'}`}>
            <div className="bg-white dark:bg-[#2b2c40] rounded-lg border border-gray-100 dark:border-[#4e4f6c] shadow-card p-2">
              {MENU_GROUPS.map((group, groupIndex) => (
                <div key={group.title}>
                  {groupIndex > 0 && <div className="my-2 border-t border-gray-100 dark:border-[#4e4f6c]"></div>}
                  <p className="px-3 py-2 text-xs font-semibold text-txt-muted dark:text-[#7e7f96] uppercase tracking-wider">
                    {group.title}
                  </p>
                  {group.items.map((item) => {
                    const isActive = tabParam === item.id;
                    const isDisabled = item.badge === 'Soon';
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => !isDisabled && handleTabChange(item.id)}
                        disabled={isDisabled}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 ${
                          isActive
                            ? 'bg-primary-light dark:bg-[#35365f] text-primary dark:text-[#a5a7ff]'
                            : isDisabled
                            ? 'text-txt-muted dark:text-[#7e7f96] cursor-not-allowed opacity-60'
                            : 'text-txt-secondary dark:text-[#b2b2c4] hover:bg-gray-50 dark:hover:bg-[#232333]'
                        }`}
                      >
                        <i className={`bx ${item.icon} text-lg`}></i>
                        <span className="flex-1 text-left text-sm font-medium">{item.title}</span>
                        {item.badge && (
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                            item.badgeColor === 'warning' 
                              ? 'bg-warning/10 text-warning' 
                              : 'bg-primary-light text-primary'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 bg-white dark:bg-[#2b2c40] rounded-lg border border-gray-100 dark:border-[#4e4f6c] shadow-card overflow-hidden">
            {MENU_GROUPS.map((group, groupIndex) => (
              <div key={group.title}>
                {groupIndex > 0 && <div className="border-t border-gray-100 dark:border-[#4e4f6c]"></div>}
                <div className="p-4 pb-2">
                  <p className="text-xs font-semibold text-txt-muted dark:text-[#7e7f96] uppercase tracking-wider">
                    {group.title}
                  </p>
                </div>
                <div className="px-2 pb-3 space-y-1">
                  {group.items.map((item) => {
                    const isActive = tabParam === item.id;
                    const isDisabled = item.badge === 'Soon';
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => !isDisabled && handleTabChange(item.id)}
                        disabled={isDisabled}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ease-in-out group ${
                          isActive
                            ? 'bg-primary-light dark:bg-[#35365f] text-primary dark:text-[#a5a7ff]'
                            : isDisabled
                            ? 'text-txt-muted dark:text-[#7e7f96] cursor-not-allowed opacity-60'
                            : 'text-txt-secondary dark:text-[#b2b2c4] hover:bg-gray-50 dark:hover:bg-[#232333] hover:text-primary dark:hover:text-[#a5a7ff]'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded flex items-center justify-center transition-colors duration-150 ${
                          isActive 
                            ? 'bg-primary/10 dark:bg-primary/20' 
                            : 'bg-gray-100 dark:bg-[#35365f] group-hover:bg-primary/10 dark:group-hover:bg-primary/20'
                        }`}>
                          <i className={`bx ${item.icon} text-lg ${
                            isActive 
                              ? 'text-primary dark:text-[#a5a7ff]' 
                              : isDisabled 
                              ? '' 
                              : 'group-hover:text-primary dark:group-hover:text-[#a5a7ff]'
                          }`}></i>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className={`text-xs ${
                            isActive 
                              ? 'text-primary/70 dark:text-[#a5a7ff]/70' 
                              : 'text-txt-muted dark:text-[#7e7f96]'
                          }`}>
                            {item.description}
                          </p>
                        </div>
                        {item.badge && (
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                            item.badgeColor === 'warning' 
                              ? 'bg-warning/10 text-warning' 
                              : 'bg-primary-light text-primary'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Help Card */}
            <div className="border-t border-gray-100 dark:border-[#4e4f6c] p-4">
              <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-[#35365f]/50 dark:to-[#35365f] rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-3">
                  <i className='bx bx-help-circle text-xl text-primary dark:text-[#a5a7ff]'></i>
                </div>
                <p className="text-sm font-medium text-txt-primary dark:text-[#d5d5e2] mb-1">Butuh bantuan?</p>
                <p className="text-xs text-txt-muted dark:text-[#7e7f96] mb-3">Hubungi tim support kami untuk bantuan.</p>
                <a 
                  href="mailto:support@booqing.my.id" 
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary dark:text-[#a5a7ff] hover:underline"
                >
                  <i className='bx bx-envelope'></i>
                  Hubungi Support
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {/* Content Header */}
          <div className="hidden lg:flex items-center gap-3 mb-6 p-4 bg-white dark:bg-[#2b2c40] rounded-lg border border-gray-100 dark:border-[#4e4f6c] shadow-card">
            <div className="w-10 h-10 rounded-lg bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
              <i className={`bx ${currentItem.icon} text-xl text-primary dark:text-[#a5a7ff]`}></i>
            </div>
            <div>
              <h5 className="text-lg font-semibold text-txt-primary dark:text-[#d5d5e2]">{currentItem.title}</h5>
              <p className="text-sm text-txt-muted dark:text-[#7e7f96]">{currentItem.description}</p>
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Appearance Tab */}
            {tabParam === 'appearance' && (
              <LandingPageStyleSettings subdomain={subdomain} currentTemplate="modern" />
            )}

            {/* Contact Tab */}
            {tabParam === 'contact' && tenantId && subdomain && (
              <ContactPageSettings tenantId={tenantId} subdomain={subdomain} />
            )}

            {/* Invoice Tab */}
            {tabParam === 'invoice' && tenantId && (
              <InvoiceSettings tenantId={tenantId} />
            )}

            {/* Media Tab */}
            {tabParam === 'media' && tenantId && (
              <LandingPageMediaSettings tenantId={tenantId} initialData={landingPageMedia} />
            )}

            {/* Calendar Tab */}
            {tabParam === 'calendar' && tenantId && (
              <>
                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-[#25445c]/30 rounded-lg border border-blue-100 dark:border-blue-800/30">
                  <i className='bx bx-info-circle text-xl text-info flex-shrink-0 mt-0.5'></i>
                  <p className="text-sm text-txt-secondary dark:text-[#b2b2c4]">
                    Pengaturan kalender akan mempengaruhi ketersediaan booking di landing page Anda.
                  </p>
                </div>
                <BusinessHoursGlobalSettings tenantId={tenantId} />
                <OperatingHoursSettings tenantId={tenantId} />
                <HomeVisitSettings tenantId={tenantId} />
                <BlockedDatesManager tenantId={tenantId} />
              </>
            )}

            {/* Coming Soon Tabs */}
            {(tabParam === 'notifications' || tabParam === 'integrations') && (
              <div className="bg-white dark:bg-[#2b2c40] rounded-lg border border-gray-100 dark:border-[#4e4f6c] shadow-card p-12">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-warning/10 dark:bg-warning/20 flex items-center justify-center mx-auto mb-4">
                    <i className='bx bx-time text-4xl text-warning'></i>
                  </div>
                  <h5 className="text-lg font-semibold text-txt-primary dark:text-[#d5d5e2] mb-2">Segera Hadir</h5>
                  <p className="text-txt-muted dark:text-[#7e7f96] max-w-sm mx-auto">
                    Fitur {currentItem.title} sedang dalam pengembangan dan akan segera tersedia.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
