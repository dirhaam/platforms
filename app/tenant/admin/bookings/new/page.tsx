'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function BookingNewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const subdomain = searchParams?.get('subdomain') || '';

  useEffect(() => {
    // Redirect to bookings page with dialog state
    // The booking form is now a modal dialog on the main bookings page
    router.push(`/tenant/admin/bookings?subdomain=${encodeURIComponent(subdomain)}`);
  }, [subdomain, router]);

  return null;
}
