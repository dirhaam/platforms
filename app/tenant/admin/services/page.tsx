export const runtime = 'nodejs';

import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ subdomain?: string }>;
}) {
  const params = await searchParams;
  const subdomain = params.subdomain;

  if (!subdomain) redirect('/tenant/login?subdomain=unknown');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Services</h1>
        <p className="text-gray-600 mt-2">Manage your business services and pricing</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Services management interface is being developed...</p>
        </CardContent>
      </Card>
    </div>
  );
}
