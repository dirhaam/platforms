'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, AlertTriangle } from 'lucide-react';
import { Booking, Service } from '@/types/booking';
import { HomeVisitBookingList } from './HomeVisitBookingList';

interface HomeVisitBookingManagerProps {
  tenantId: string;
  bookings: Booking[];
  services: Service[];
  businessLocation?: string;
  businessCoordinates?: { lat: number; lng: number };
}

export function HomeVisitBookingManager({
  tenantId,
  bookings,
  services,
  businessLocation,
  businessCoordinates
}: HomeVisitBookingManagerProps) {
  const [homeVisitBookings, setHomeVisitBookings] = useState<Booking[]>([]);
  const [servicesMap, setServicesMap] = useState<Map<string, Service>>(new Map());

  useEffect(() => {
    // Filter home visit bookings and sort by scheduled date
    const filtered = bookings
      .filter(booking => booking.isHomeVisit && booking.homeVisitAddress)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    setHomeVisitBookings(filtered);

    // Create services map for quick lookup
    const map = new Map<string, Service>();
    services.forEach(service => {
      map.set(service.id, service);
    });
    setServicesMap(map);
  }, [bookings, services]);

  // Check if all home visit bookings have travel data
  const missingTravelData = homeVisitBookings.filter(b => !b.travelDistance || !b.travelDuration);

  if (homeVisitBookings.length === 0) {
    return (
      <div className="bg-white rounded-card shadow-card p-12 text-center border border-gray-100">
        <MapPin className="h-12 w-12 text-txt-muted mb-4 mx-auto opacity-50" />
        <h3 className="text-lg font-semibold text-txt-primary mb-2">Tidak ada home visit bookings</h3>
        <p className="text-txt-muted text-sm">
          Home visit bookings akan ditampilkan di sini setelah dibuat dari menu booking.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-white rounded-card shadow-card p-5 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="flex items-center gap-2 font-semibold text-lg text-txt-primary mb-1">
              <MapPin className="h-5 w-5" />
              Home Visit Schedule
            </h4>
            <p className="text-txt-secondary text-sm">
              {homeVisitBookings.length} home visit{homeVisitBookings.length !== 1 ? 's' : ''} - Tampilan daftar
            </p>
          </div>
          <div className="bg-primary-light px-3 py-1 rounded text-sm font-medium text-primary">
            {homeVisitBookings.length} bookings
          </div>
        </div>
      </div>

      {/* Warning if missing travel data */}
      {missingTravelData.length > 0 && (
        <div className="bg-orange-50 rounded-card p-5 border border-orange-200 shadow-card">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-txt-primary">
                {missingTravelData.length} booking(s) belum memiliki data travel
              </p>
              <p className="text-sm text-txt-secondary mt-1">
                Travel calculation akan dilakukan saat membuat booking baru melalui menu booking.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible List with Mini-Maps */}
      <div className="space-y-3">
        <p className="text-sm text-txt-muted mb-3">
          💡 Klik untuk expand dan lihat map perjalanan dari homebase ke masing-masing customer
        </p>
        <HomeVisitBookingList 
          bookings={homeVisitBookings} 
          services={servicesMap}
          businessCoordinates={businessCoordinates}
        />
      </div>
    </div>
  );
}
