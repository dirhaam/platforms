'use client';

import { useSearchParams } from 'next/navigation';
import { NewBookingDialog } from '@/components/booking/NewBookingDialog';
import { useState } from 'react';

export default function BookingNewPage() {
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain') || '';
  const [isOpen, setIsOpen] = useState(true);

  return (
    <NewBookingDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      subdomain={subdomain}
      onBookingCreated={() => {
        // Dialog will close after booking is created
      }}
    />
  );
}
