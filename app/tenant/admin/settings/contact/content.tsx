'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ContactPageSettings from '@/components/settings/ContactPageSettings';
import { PermissionGate } from '@/components/tenant/permission-gate';
import { AdminPageHeader } from '@/components/tenant/AdminPageHeader';

interface TenantData {
  id: string;
  subdomain: string;
}

export default function ContactSettingsContent() {
  return (
    <PermissionGate feature="settings">
      <ContactSettingsInner />
    </PermissionGate>
  );
}

function ContactSettingsInner() {
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
      <AdminPageHeader
        title="Contact Link"
        description="Halaman link kontak"
      />
      {tenantId && subdomain && (
        <ContactPageSettings tenantId={tenantId} subdomain={subdomain} />
      )}
    </div>
  );
}
