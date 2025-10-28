'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { BookingDashboard } from '@/components/booking/BookingDashboard';

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
        <p className="text-gray-600 mt-2">Manage customer bookings with unified panel</p>
      </div>

      <BookingDashboard tenantId={subdomain} />
    </div>
  );
}
