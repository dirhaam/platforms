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

type TabType = 'appearance' | 'contact' | 'invoice' | 'media' | 'calendar';

const TABS: { id: TabType; title: string; icon: string; description: string }[] = [
  { id: 'appearance', title: 'Appearance', icon: 'palette', description: 'Tampilan dan tema landing page' },
  { id: 'contact', title: 'Contact', icon: 'phone', description: 'Informasi kontak dan sosial media' },
  { id: 'invoice', title: 'Invoice', icon: 'receipt', description: 'Pengaturan faktur dan pembayaran' },
  { id: 'media', title: 'Media', icon: 'image', description: 'Video, galeri, dan media sosial' },
  { id: 'calendar', title: 'Calendar', icon: 'calendar', description: 'Jam operasional dan tanggal libur' },
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
  const tabParam = searchParams?.get('tab') as TabType | null;
  
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>(tabParam || 'appearance');
  const [landingPageMedia, setLandingPageMedia] = useState({
    videos: [],
    socialMedia: [],
    galleries: [],
  });

  // Sync activeTab with URL param
  useEffect(() => {
    if (tabParam && TABS.some(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Update URL when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    router.push(`/tenant/admin/settings?subdomain=${subdomain}&tab=${tab}`, { scroll: false });
  };

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

  const currentTab = TABS.find(t => t.id === activeTab);

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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h4 className="text-xl font-bold text-txt-primary dark:text-[#d5d5e2]">Settings</h4>
          <p className="text-sm text-txt-secondary dark:text-[#b2b2c4]">Kelola konfigurasi dan preferensi bisnis</p>
        </div>
      </div>

      {/* Tab Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`p-4 rounded-card text-left transition-all duration-200 ease-in-out ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-[1.02]'
                : 'bg-white dark:bg-[#2b2c40] shadow-card hover:shadow-lg hover:-translate-y-0.5 text-txt-primary dark:text-[#d5d5e2]'
            }`}
          >
            <div className={`w-10 h-10 rounded flex items-center justify-center mb-3 ${
              activeTab === tab.id
                ? 'bg-white/20'
                : 'bg-primary-light dark:bg-[#35365f]'
            }`}>
              <i className={`bx bx-${tab.icon} text-xl ${
                activeTab === tab.id ? 'text-white' : 'text-primary dark:text-[#a5a7ff]'
              }`}></i>
            </div>
            <p className="font-semibold text-sm">{tab.title}</p>
            <p className={`text-xs mt-1 line-clamp-2 ${
              activeTab === tab.id ? 'text-white/80' : 'text-txt-muted dark:text-[#7e7f96]'
            }`}>
              {tab.description}
            </p>
          </button>
        ))}
      </div>

      {/* Content Card */}
      <div className="bg-white dark:bg-[#2b2c40] rounded-card shadow-card overflow-hidden">
        {/* Card Header */}
        <div className="p-6 border-b border-gray-100 dark:border-[#4e4f6c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
              <i className={`bx bx-${currentTab?.icon} text-xl text-primary dark:text-[#a5a7ff]`}></i>
            </div>
            <div>
              <h5 className="text-lg font-semibold text-txt-primary dark:text-[#d5d5e2]">{currentTab?.title}</h5>
              <p className="text-xs text-txt-muted dark:text-[#7e7f96]">{currentTab?.description}</p>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <LandingPageStyleSettings subdomain={subdomain} currentTemplate="modern" />
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              {tenantId && subdomain && (
                <ContactPageSettings tenantId={tenantId} subdomain={subdomain} />
              )}
            </div>
          )}

          {/* Invoice Tab */}
          {activeTab === 'invoice' && (
            <div className="space-y-6">
              {tenantId && <InvoiceSettings tenantId={tenantId} />}
            </div>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              {tenantId && (
                <LandingPageMediaSettings
                  tenantId={tenantId}
                  initialData={landingPageMedia}
                />
              )}
            </div>
          )}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              {tenantId && (
                <>
                  <div className="bg-gray-50 dark:bg-[#232333] rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-txt-secondary dark:text-[#b2b2c4]">
                      <i className='bx bx-info-circle text-info'></i>
                      <span>Pengaturan kalender akan mempengaruhi ketersediaan booking di landing page Anda.</span>
                    </div>
                  </div>
                  <BusinessHoursGlobalSettings tenantId={tenantId} />
                  <OperatingHoursSettings tenantId={tenantId} />
                  <HomeVisitSettings tenantId={tenantId} />
                  <BlockedDatesManager tenantId={tenantId} />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
