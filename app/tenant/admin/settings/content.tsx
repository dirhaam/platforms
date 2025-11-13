'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Calendar, FileText, Palette } from 'lucide-react';
import LandingPageStyleSettings from '@/components/tenant/LandingPageStyleSettings';
import { BlockedDatesManager } from '@/components/booking/BlockedDatesManager';
import OperatingHoursSettings from '@/components/settings/OperatingHoursSettings';
import InvoiceSettings from '@/components/settings/InvoiceSettings';

interface TenantData {
  id: string;
  subdomain: string;
}

export default function SettingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain');
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('appearance');

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

  if (!subdomain || loading) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-gray-900" />
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        </div>
        <p className="text-sm text-gray-600 mt-1">Manage business configuration and preferences</p>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="invoice" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Invoice</span>
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

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="mt-0">
            <div className="max-h-[calc(100vh-180px)] overflow-y-auto pr-2 space-y-6">
              {tenantId && (
                <>
                  <OperatingHoursSettings tenantId={tenantId} />
                  <div className="mt-8 pt-8 border-t">
                    <BlockedDatesManager tenantId={tenantId} />
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
