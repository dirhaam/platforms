"use client";

import React, { useEffect, useRef } from 'react';
import type { Coordinates } from '@/types/location';

declare global {
  interface Window {
    L: any;
  }
}

interface RouteMiniMapProps {
  origin?: Coordinates;
  destination?: Coordinates;
  route?: Coordinates[];
  className?: string;
  height?: number;
}

export function RouteMiniMap({ origin, destination, route, className = '', height = 200 }: RouteMiniMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const overlays = useRef<any[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    const ensureLeaflet = () =>
      new Promise<void>((resolve) => {
        if (window.L) return resolve();
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
        script.async = true;
        script.onload = () => resolve();
        document.head.appendChild(script);
      });

    const init = async () => {
      await ensureLeaflet();
      if (!mapRef.current || mapInstance.current) return;

      const defaultCenter = destination || origin || { lat: -6.2088, lng: 106.8456 };
      mapInstance.current = window.L.map(mapRef.current).setView([defaultCenter.lat, defaultCenter.lng], 13);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstance.current);

      renderOverlays();
    };

    const renderOverlays = () => {
      overlays.current.forEach((o) => o.remove());
      overlays.current = [];

      const points: Coordinates[] = [];

      if (origin) {
        const marker = window.L.marker([origin.lat, origin.lng]);
        marker.bindPopup('<b>Homebase</b>');
        marker.addTo(mapInstance.current);
        overlays.current.push(marker);
        points.push(origin);
      }

      if (destination) {
        const marker = window.L.marker([destination.lat, destination.lng]);
        marker.bindPopup('<b>Customer</b>');
        marker.addTo(mapInstance.current);
        overlays.current.push(marker);
        points.push(destination);
      }

      // Draw route polyline if provided
      if (route && route.length > 1) {
        const latlngs = route.map((p) => [p.lat, p.lng]);
        const poly = window.L.polyline(latlngs, { color: '#2563eb', weight: 4, opacity: 0.8 });
        poly.addTo(mapInstance.current);
        overlays.current.push(poly);
      } else if (origin && destination) {
        // Fallback: straight line between origin and destination
        const poly = window.L.polyline(
          [
            [origin.lat, origin.lng],
            [destination.lat, destination.lng],
          ],
          { color: '#64748b', dashArray: '6,6', weight: 3, opacity: 0.8 }
        );
        poly.addTo(mapInstance.current);
        overlays.current.push(poly);
      }

      // Fit bounds to shown elements
      const boundsPoints = route && route.length > 1 ? route : points;
      if (boundsPoints.length > 0) {
        const bounds = window.L.latLngBounds(boundsPoints.map((p) => [p.lat, p.lng]));
        mapInstance.current.fitBounds(bounds, { padding: [20, 20] });
      }
    };

    init();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        overlays.current = [];
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update overlays when data changes
  useEffect(() => {
    if (!mapInstance.current || !window.L) return;

    // Re-render overlays on prop changes
    // Clear existing overlays
    overlays.current.forEach((o) => o.remove());
    overlays.current = [];

    const points: Coordinates[] = [];

    if (origin) {
      const marker = window.L.marker([origin.lat, origin.lng]);
      marker.bindPopup('<b>Homebase</b>');
      marker.addTo(mapInstance.current);
      overlays.current.push(marker);
      points.push(origin);
    }

    if (destination) {
      const marker = window.L.marker([destination.lat, destination.lng]);
      marker.bindPopup('<b>Customer</b>');
      marker.addTo(mapInstance.current);
      overlays.current.push(marker);
      points.push(destination);
    }

    if (route && route.length > 1) {
      const latlngs = route.map((p) => [p.lat, p.lng]);
      const poly = window.L.polyline(latlngs, { color: '#2563eb', weight: 4, opacity: 0.8 });
      poly.addTo(mapInstance.current);
      overlays.current.push(poly);
    } else if (origin && destination) {
      const poly = window.L.polyline(
        [
          [origin.lat, origin.lng],
          [destination.lat, destination.lng],
        ],
        { color: '#64748b', dashArray: '6,6', weight: 3, opacity: 0.8 }
      );
      poly.addTo(mapInstance.current);
      overlays.current.push(poly);
    }

    const boundsPoints = route && route.length > 1 ? route : points;
    if (boundsPoints.length > 0) {
      const bounds = window.L.latLngBounds(boundsPoints.map((p) => [p.lat, p.lng]));
      mapInstance.current.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng, JSON.stringify(route)]);

  return (
    <div
      ref={mapRef}
      className={`w-full rounded-md border ${className}`}
      style={{ height }}
    />
  );
}
