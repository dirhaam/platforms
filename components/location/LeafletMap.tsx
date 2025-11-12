'use client';

import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { Booking } from '@/types/booking';

interface LeafletMapProps {
  bookings: Booking[];
  businessLocation?: { lat: number; lng: number };
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
}

declare global {
  interface Window {
    L: any;
  }
}

export function LeafletMap({
  bookings,
  businessLocation,
  center,
  zoom = 12,
  className = '',
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // If map already initialized, skip reinitialization
    if (mapInstance.current) return;

    // Load Leaflet CSS and JS if not already loaded
    if (!window.L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      script.async = true;
      script.onload = () => initializeMap();
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    async function initializeMap() {
      if (!mapRef.current || !window.L || mapInstance.current) return;

      // Initialize map
      const mapCenter = businessLocation || center || { lat: 0, lng: 0 };
      mapInstance.current = window.L.map(mapRef.current).setView(
        [mapCenter.lat, mapCenter.lng],
        zoom || 12
      );

      // Add OpenStreetMap tiles
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstance.current);

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      // Add business location marker if available
      if (businessLocation) {
        const businessMarker = window.L.marker([businessLocation.lat, businessLocation.lng], {
          icon: window.L.icon({
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl:
              'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            shadowSize: [41, 41],
            shadowAnchor: [13, 41],
          }),
        })
          .bindPopup(
            `<div class="p-2">
              <h3 class="font-bold text-gray-800">Business Location</h3>
              <p class="text-sm text-gray-600">${businessLocation.lat.toFixed(6)}, ${businessLocation.lng.toFixed(6)}</p>
            </div>`
          )
          .addTo(mapInstance.current);

        markersRef.current.push(businessMarker);
      }

      // Add markers for home visit bookings
      const homeVisitBookings = bookings.filter(
        (b) => b.isHomeVisit && b.homeVisitCoordinates
      );

      homeVisitBookings.forEach((booking) => {
        if (!booking.homeVisitCoordinates) return;

        const marker = window.L.marker(
          [booking.homeVisitCoordinates.lat, booking.homeVisitCoordinates.lng],
          {
            icon: window.L.icon({
              iconUrl:
                'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowUrl:
                'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
              shadowSize: [41, 41],
              shadowAnchor: [13, 41],
            }),
          }
        )
          .bindPopup(
            `<div class="p-2 min-w-[250px]">
              <h3 class="font-bold text-gray-800">${booking.customer?.name || 'Unknown Customer'}</h3>
              <p class="text-sm text-gray-600">${booking.service?.name || 'Service'}</p>
              <p class="text-sm text-gray-600">${new Date(booking.scheduledAt).toLocaleString('id-ID')}</p>
              <p class="text-sm text-gray-600">${booking.homeVisitAddress}</p>
              ${booking.totalAmount ? `<p class="text-sm font-semibold mt-1">Total: IDR ${Number(booking.totalAmount).toLocaleString('id-ID')}</p>` : ''}
              ${booking.status ? `<div class="mt-1"><span class="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">${booking.status}</span></div>` : ''}
            </div>`
          )
          .addTo(mapInstance.current);

        markersRef.current.push(marker);
      });

      // Fit map to show all markers
      if (markersRef.current.length > 0) {
        const group = window.L.featureGroup(markersRef.current);
        mapInstance.current.fitBounds(group.getBounds(), { padding: [50, 50] });
      }
    }

    return () => {
      // Clean up on unmount
      if (mapInstance.current) {
        mapInstance.current.remove();
      }
    };
  }, [bookings, businessLocation, center, zoom]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Home Visit Locations Map
        </CardTitle>
        <CardDescription>
          Displaying {bookings.filter((b) => b.isHomeVisit && b.homeVisitCoordinates).length} home
          visit location(s) on OpenStreetMap
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          ref={mapRef}
          className={`w-full rounded-lg border border-gray-200 ${className}`}
          style={{ height: '500px' }}
        />
      </CardContent>
    </Card>
  );
}
