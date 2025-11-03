'use client';

import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, DollarSign } from 'lucide-react';
import { Booking } from '@/types/booking';

interface LocationMapProps {
  bookings: Booking[];
  businessLocation?: { lat: number; lng: number } | string;
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

export function LocationMap({ 
  bookings, 
  businessLocation, 
  center = { lat: -6.2088, lng: 106.8456 }, // Default to Jakarta
  zoom = 12,
  className = '' 
}: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Load Google Maps script if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=geometry,places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = () => initializeMap();
    } else {
      initializeMap();
    }

    async function initializeMap() {
      if (!mapRef.current) return;

      // Handle business location which could be coordinates or address string
      let businessCoords = center;
      if (businessLocation) {
        if (typeof businessLocation === 'string') {
          // Geocode the address to get coordinates
          try {
            const geocoder = new window.google.maps.Geocoder();
            const response = await new Promise((resolve, reject) => {
              geocoder.geocode({ address: businessLocation }, (results, status) => {
                if (status === 'OK' && results[0]) {
                  resolve(results[0].geometry.location);
                } else {
                  console.error('Geocoding failed:', status);
                  reject(null);
                }
              });
            }) as google.maps.LatLng;
            
            if (response) {
              businessCoords = { 
                lat: response.lat(), 
                lng: response.lng() 
              };
            }
          } catch (error) {
            console.error('Error geocoding business location:', error);
            // Keep default center if geocoding fails
          }
        } else {
          // It's already coordinates
          businessCoords = businessLocation;
        }
      }

      // Initialize map
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: businessCoords,
        zoom: zoom || 12,
        mapTypeId: 'roadmap',
        disableDefaultUI: true,
        zoomControl: true,
        streetViewControl: true,
        mapTypeControl: true,
      });

      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Add business location marker if available
      if (businessLocation) {
        const marker = new window.google.maps.Marker({
          position: businessCoords,
          map: mapInstance.current,
          title: 'Business Location',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });

        // Add info window for business location
        const businessInfoWindow = new window.google.maps.InfoWindow({
          content: `
            <div class="p-2">
              <h3 class="font-bold text-gray-800">Business Location</h3>
              <p class="text-sm text-gray-600">${typeof businessLocation === 'string' ? businessLocation : 'Business Coordinates'}</p>
            </div>
          `,
        });

        marker.addListener('click', () => {
          businessInfoWindow.open(mapInstance.current, marker);
        });
      }

      // Add markers for home visit bookings
      bookings
        .filter(booking => booking.isHomeVisit && booking.homeVisitCoordinates)
        .forEach(booking => {
          if (!booking.homeVisitCoordinates) return;

          const marker = new window.google.maps.Marker({
            position: {
              lat: booking.homeVisitCoordinates.lat,
              lng: booking.homeVisitCoordinates.lng,
            },
            map: mapInstance.current,
            title: `${booking.customer?.name || 'Customer'} - ${booking.service?.name || 'Service'}`,
          });

          // Create info window content
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div class="p-2 min-w-[200px]">
                <h3 class="font-bold text-gray-800">${booking.customer?.name || 'Unknown Customer'}</h3>
                <p class="text-sm text-gray-600">${booking.service?.name || 'Service'}</p>
                <p class="text-sm text-gray-600">${new Date(booking.scheduledAt).toLocaleString()}</p>
                <p class="text-sm text-gray-600">${booking.homeVisitAddress}</p>
                ${booking.totalAmount ? `<p class="text-sm font-semibold mt-1">Total: IDR ${Number(booking.totalAmount).toLocaleString('id-ID')}</p>` : ''}
                ${booking.status ? `<div class="mt-1"><span class="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">${booking.status}</span></div>` : ''}
              </div>
            `,
          });

          marker.addListener('click', () => {
            infoWindow.open(mapInstance.current, marker);
          });

          markersRef.current.push(marker);
        });

      // If we have business location and bookings, fit the map to show all
      if (businessLocation && markersRef.current.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        
        // Extend bounds to include business location
        bounds.extend(new window.google.maps.LatLng(businessLocation.lat, businessLocation.lng));
        
        // Extend bounds to include all booking locations
        bookings
          .filter(booking => booking.isHomeVisit && booking.homeVisitCoordinates)
          .forEach(booking => {
            if (booking.homeVisitCoordinates) {
              bounds.extend(
                new window.google.maps.LatLng(
                  booking.homeVisitCoordinates.lat,
                  booking.homeVisitCoordinates.lng
                )
              );
            }
          });

        mapInstance.current.fitBounds(bounds);
      }
    }

    return () => {
      // Clean up markers
      if (mapInstance.current) {
        markersRef.current.forEach(marker => {
          marker.setMap(null);
        });
        markersRef.current = [];
      }
    };
  }, [bookings, businessLocation, center, zoom]);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Home Visit Locations
            </CardTitle>
            <CardDescription>
              Map view of all home visit bookings
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {bookings.filter(b => b.isHomeVisit).length} visits
            </Badge>
            {businessLocation && (
              <Badge variant="outline" className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                Business
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={mapRef} 
          className="w-full h-96 rounded-lg border"
          style={{ minHeight: '400px' }}
        >
          {!window.google && (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Loading map...</p>
                <p className="text-sm text-gray-500 mt-1">Google Maps API is loading</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 space-y-2">
          <h4 className="font-medium text-sm">Key</h4>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Customer Location</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Business Location</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-gray-600" />
              <span>Scheduled Time</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-3 w-3 text-gray-600" />
              <span>Service Amount</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}