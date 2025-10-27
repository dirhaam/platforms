'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Loader } from 'lucide-react';
import LandingPageStyleSettings from '@/components/tenant/LandingPageStyleSettings';

export default function SettingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain');

  useEffect(() => {
    if (!subdomain) {
      router.push('/tenant/login');
    }
  }, [subdomain, router]);

  if (!subdomain) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage business configuration and preferences</p>
      </div>

      {/* Landing Page Style Section */}
      <LandingPageStyleSettings subdomain={subdomain} currentTemplate="modern" />

      {/* More Settings Sections Can Be Added Here */}
    </div>
  );
}
