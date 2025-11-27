'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BlockedDatesManager } from '@/components/booking/BlockedDatesManager';
import BusinessHoursGlobalSettings from '@/components/settings/BusinessHoursGlobalSettings';
import OperatingHoursSettings from '@/components/settings/OperatingHoursSettings';
import HomeVisitSettings from '@/components/settings/HomeVisitSettings';
import { PermissionGate } from '@/components/tenant/permission-gate';

interface TenantData {
  id: string;
  subdomain: string;
}

export default function CalendarSettingsContent() {
  return (
    <PermissionGate feature="settings">
      <CalendarSettingsInner />
    </PermissionGate>
  );
}

function CalendarSettingsInner() {
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
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/tenant/admin/settings?subdomain=${subdomain}`)}
          className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-[#35365f] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#4e4f6c] transition-colors"
        >
          <i className='bx bx-arrow-back text-xl text-txt-secondary dark:text-[#b2b2c4]'></i>
        </button>
        <div className="w-10 h-10 rounded-lg bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
          <i className='bx bx-calendar text-xl text-primary dark:text-[#a5a7ff]'></i>
        </div>
        <div>
          <h4 className="text-xl font-bold text-txt-primary dark:text-[#d5d5e2]">Kalender</h4>
          <p className="text-sm text-txt-muted dark:text-[#7e7f96]">Jam operasional & libur</p>
        </div>
      </div>

      {/* Info Alert */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-[#25445c]/30 rounded-lg border border-blue-100 dark:border-blue-800/30">
        <i className='bx bx-info-circle text-xl text-info flex-shrink-0 mt-0.5'></i>
        <p className="text-sm text-txt-secondary dark:text-[#b2b2c4]">
          Pengaturan kalender akan mempengaruhi ketersediaan booking di landing page Anda.
        </p>
      </div>

      {/* Content */}
      {tenantId && (
        <>
          <BusinessHoursGlobalSettings tenantId={tenantId} />
          <OperatingHoursSettings tenantId={tenantId} />
          <HomeVisitSettings tenantId={tenantId} />
          <BlockedDatesManager tenantId={tenantId} />
        </>
      )}
    </div>
  );
}
