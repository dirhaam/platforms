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

interface TabConfig {
  id: TabType;
  title: string;
  icon: string;
  description: string;
}

const TABS: Record<TabType, TabConfig> = {
  appearance: { id: 'appearance', title: 'Appearance', icon: 'palette', description: 'Tampilan dan tema landing page' },
  contact: { id: 'contact', title: 'Contact', icon: 'phone', description: 'Informasi kontak dan sosial media' },
  invoice: { id: 'invoice', title: 'Invoice', icon: 'receipt', description: 'Pengaturan faktur dan pembayaran' },
  media: { id: 'media', title: 'Media', icon: 'image', description: 'Video, galeri, dan media sosial' },
  calendar: { id: 'calendar', title: 'Calendar', icon: 'calendar', description: 'Jam operasional dan tanggal libur' },
};

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

  const currentTab = TABS[tabParam] || TABS.appearance;

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
          <h4 className="text-xl font-bold text-txt-primary dark:text-[#d5d5e2]">{currentTab.title}</h4>
          <p className="text-sm text-txt-secondary dark:text-[#b2b2c4]">{currentTab.description}</p>
        </div>
      </div>

      {/* Tab Content - No wrapper card, each component handles own styling */}
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
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-[#25445c]/30 rounded-lg">
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
      </div>
    </div>
  );
}
