'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Loader } from 'lucide-react';
import LandingPageStyleSettings from '@/components/tenant/LandingPageStyleSettings';
import { BlockedDatesManager } from '@/components/booking/BlockedDatesManager';
import InvoiceBrandingSettings from '@/components/settings/InvoiceBrandingSettings';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage business configuration and preferences</p>
      </div>

      {/* Blocked Dates Section */}
      {tenantId && <BlockedDatesManager tenantId={tenantId} />}

      {/* Invoice Branding Section */}
      {tenantId && <InvoiceBrandingSettings tenantId={tenantId} />}

      {/* Landing Page Style Section */}
      <LandingPageStyleSettings subdomain={subdomain} currentTemplate="modern" />

      {/* More Settings Sections Can Be Added Here */}
    </div>
  );
}
