export const runtime = 'nodejs';

import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default async function CustomersPage({
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
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-600 mt-2">Manage customer database and information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Customer management interface is being developed...</p>
        </CardContent>
      </Card>
    </div>
  );
}
