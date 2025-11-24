'use client';

import React from 'react';
import { Booking } from '@/types/booking';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UnifiedBookingPanel } from './UnifiedBookingPanel';

interface BookingDetailsDrawerProps {
  booking: Booking | null;
  tenantId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingUpdate?: (bookingId: string, updates: Partial<Booking>) => Promise<void>;
  onGenerateInvoice?: (bookingId: string) => Promise<void>;
  isGeneratingInvoice?: boolean;
}

export function BookingDetailsDrawer({
  booking,
  tenantId,
  isOpen,
  onOpenChange,
  onBookingUpdate,
  onGenerateInvoice,
  isGeneratingInvoice,
}: BookingDetailsDrawerProps) {
  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-0 sm:rounded-card bg-body border-0">
        <div className="bg-white px-6 py-5 rounded-t-card border-b border-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-txt-primary">Booking Details</h2>
              <p className="text-txt-secondary text-sm mt-1">
                View and manage booking information with unified panel
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 text-txt-muted hover:bg-gray-100 hover:text-txt-primary"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-6">
          <UnifiedBookingPanel
            booking={booking}
            tenantId={tenantId}
            onBookingUpdate={onBookingUpdate}
            onGenerateInvoice={onGenerateInvoice}
            isGeneratingInvoice={isGeneratingInvoice}
            onClose={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
