'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LandingPageMediaSettings from '@/components/settings/LandingPageMediaSettings';
import { PermissionGate } from '@/components/tenant/permission-gate';
import { AdminPageHeader } from '@/components/tenant/AdminPageHeader';

interface TenantData {
  id: string;
  subdomain: string;
}

export default function MediaSettingsContent() {
  return (
    <PermissionGate feature="settings">
      <MediaSettingsInner />
    </PermissionGate>
  );
}

function MediaSettingsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain');
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
      <AdminPageHeader
        title="Media"
        description="Video, galeri, dan media"
      />
      {tenantId && <LandingPageMediaSettings tenantId={tenantId} initialData={landingPageMedia} />}
    </div>
  );
}
