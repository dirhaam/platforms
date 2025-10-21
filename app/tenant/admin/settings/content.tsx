'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Loader } from 'lucide-react';
import LandingPageStyleSettings from '@/components/tenant/LandingPageStyleSettings';

export default function SettingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subdomain = searchParams.get('subdomain');
  const [currentTemplate, setCurrentTemplate] = useState<string>('modern');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subdomain) {
      router.push('/tenant/login');
      return;
    }

    fetchCurrentTemplate();
  }, [subdomain, router]);

  const fetchCurrentTemplate = async () => {
    try {
      const url = new URL('/api/tenant/settings/template', window.location.origin);
      url.searchParams.set('subdomain', subdomain!);
      
      const response = await fetch(url.toString());

      if (response.ok) {
        const data = await response.json();
        setCurrentTemplate(data.template || 'modern');
      } else {
        console.error('Failed to fetch template:', response.status);
        setCurrentTemplate('modern');
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      setCurrentTemplate('modern');
    } finally {
      setLoading(false);
    }
  };

  if (!subdomain) {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage business configuration and preferences</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-gray-600">
              <Loader className="h-4 w-4 animate-spin" />
              Loading settings...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage business configuration and preferences</p>
      </div>

      {/* Landing Page Style Section */}
      <LandingPageStyleSettings subdomain={subdomain} currentTemplate={currentTemplate} />

      {/* More Settings Sections Can Be Added Here */}
    </div>
  );
}
