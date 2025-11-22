'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { BookingDashboard } from '@/components/booking/BookingDashboard';
import { AdminPageHeader } from '@/components/tenant/AdminPageHeader';
import { Card, CardContent } from '@/components/ui/card';

export default function BookingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain');

  if (!subdomain) {
    router.push('/tenant/login');
    return null;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Bookings"
        description="Manage customer bookings with unified panel"
      />

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <BookingDashboard tenantId={subdomain} />
        </CardContent>
      </Card>
    </div>
  );
}
