'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Calendar, FileText, Palette, Image, Clock } from 'lucide-react';
import { AdminPageHeader } from '@/components/tenant/AdminPageHeader';
import LandingPageStyleSettings from '@/components/tenant/LandingPageStyleSettings';
import { BlockedDatesManager } from '@/components/booking/BlockedDatesManager';
import BusinessHoursGlobalSettings from '@/components/settings/BusinessHoursGlobalSettings';
import OperatingHoursSettings from '@/components/settings/OperatingHoursSettings';
import InvoiceSettings from '@/components/settings/InvoiceSettings';
import LandingPageMediaSettings from '@/components/settings/LandingPageMediaSettings';
import { PermissionGate } from '@/components/tenant/permission-gate';

interface TenantData {
  id: string;
  subdomain: string;
}

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
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('appearance');
  const [landingPageMedia, setLandingPageMedia] = useState({
    videos: [],
    socialMedia: [],
    galleries: [],
  });

  useEffect(() => {
    if (!subdomain) {
      router.push('/tenant/login');
      return;
    }

    // Fetch tenant ID from subdomain
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

  // Fetch landing page media
  useEffect(() => {
    if (!tenantId) return;

    const fetchMedia = async () => {
      try {
        const response = await fetch('/api/settings/landing-page-media', {
          headers: {
            'x-tenant-id': tenantId,
          },
          cache: 'no-store',
          credentials: 'same-origin',
        });
        if (response.ok) {
          const result = await response.json();
          setLandingPageMedia(result.data || {
            videos: [],
            socialMedia: [],
            galleries: [],
          });
        }
      } catch (error) {
        console.error('Error fetching landing page media:', error);
      }
    };

    fetchMedia();
  }, [tenantId]);

  if (!subdomain || loading) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 p-4">
      <AdminPageHeader
        title="Settings"
        description="Manage business configuration and preferences"
      />

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="invoice" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Invoice</span>
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            <span className="hidden sm:inline">Media</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Calendar</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Contents */}
        <div className="flex-1 overflow-auto">
          {/* Appearance Tab */}
          <TabsContent value="appearance" className="mt-0">
            <div className="max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
              <LandingPageStyleSettings subdomain={subdomain} currentTemplate="modern" />
            </div>
          </TabsContent>

          {/* Invoice Tab */}
          <TabsContent value="invoice" className="mt-0">
            <div className="max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
              {tenantId && <InvoiceSettings tenantId={tenantId} />}
            </div>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="mt-0">
            <div className="max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
              {tenantId && (
                <LandingPageMediaSettings
                  tenantId={tenantId}
                  initialData={landingPageMedia}
                />
              )}
            </div>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="mt-0">
            <div className="max-h-[calc(100vh-180px)] overflow-y-auto pr-2 space-y-4">
              {tenantId && (
                <>
                  <BusinessHoursGlobalSettings tenantId={tenantId} />
                  <OperatingHoursSettings tenantId={tenantId} />
                  <BlockedDatesManager tenantId={tenantId} />
                </>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
