'use client';

import React from 'react';
import { Booking } from '@/types/booking';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { UnifiedBookingPanel } from './UnifiedBookingPanel';

interface BookingDetailsDrawerProps {
  booking: Booking | null;
  tenantId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingUpdate?: (bookingId: string, updates: Partial<Booking>) => Promise<void>;
}

export function BookingDetailsDrawer({
  booking,
  tenantId,
  isOpen,
  onOpenChange,
  onBookingUpdate
}: BookingDetailsDrawerProps) {
  if (!booking) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[600px] md:w-[800px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Booking Details</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <UnifiedBookingPanel
            booking={booking}
            tenantId={tenantId}
            onBookingUpdate={onBookingUpdate}
            onClose={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
