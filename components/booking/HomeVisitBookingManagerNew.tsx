'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, AlertTriangle } from 'lucide-react';
import { Booking, Service } from '@/types/booking';
import { HomeVisitBookingList } from './HomeVisitBookingList';
import { LeafletMap } from '@/components/location/LeafletMap';
import { toast } from 'sonner';

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
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Tidak ada home visit bookings</h3>
          <p className="text-muted-foreground text-center">
            Home visit bookings akan ditampilkan di sini setelah dibuat dari menu booking.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Home Visit Schedule
              </CardTitle>
              <CardDescription>
                {homeVisitBookings.length} home visit{homeVisitBookings.length !== 1 ? 's' : ''} - Tampilan daftar
              </CardDescription>
            </div>
            <Badge variant="outline">{homeVisitBookings.length} bookings</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Warning if missing travel data */}
      {missingTravelData.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">
                  {missingTravelData.length} booking(s) belum memiliki data travel
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Travel calculation akan dilakukan saat membuat booking baru melalui menu booking.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collapsible List */}
      <HomeVisitBookingList bookings={homeVisitBookings} services={servicesMap} />

      {/* Map View (if we have coordinates) */}
      {homeVisitBookings.some(b => b.homeVisitCoordinates) && (
        <Card>
          <CardHeader>
            <CardTitle>Peta Lokasi Home Visit</CardTitle>
            <CardDescription>
              Visualisasi semua lokasi home visit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeafletMap
              bookings={homeVisitBookings}
              businessLocation={businessCoordinates}
              center={businessCoordinates || { lat: -6.2088, lng: 106.8456 }}
              zoom={businessCoordinates ? 14 : 12}
              height={400}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
