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

      // Ensure element has dimensions before initializing map
      if (mapRef.current.offsetHeight === 0) {
        console.warn('[RouteMiniMap] Container has no height, retrying...');
        setTimeout(init, 100);
        return;
      }

      const defaultCenter = destination || origin || { lat: -6.2088, lng: 106.8456 };
      mapInstance.current = window.L.map(mapRef.current).setView([defaultCenter.lat, defaultCenter.lng], 13);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstance.current);

      // Call renderOverlays (async) and trigger resize after
      renderOverlays().then(() => {
        setTimeout(() => {
          if (mapInstance.current) {
            mapInstance.current.invalidateSize();
          }
        }, 300);
      }).catch((err) => {
        console.error('[RouteMiniMap] Error rendering overlays:', err);
      });
    };

    const renderOverlays = async () => {
      overlays.current.forEach((o) => o.remove());
      overlays.current = [];

      const points: Coordinates[] = [];

      if (origin) {
        const marker = window.L.marker([origin.lat, origin.lng]);
        marker.bindPopup('<b>🏢 Homebase</b>');
        marker.addTo(mapInstance.current);
        overlays.current.push(marker);
        points.push(origin);
      }

      if (destination) {
        const marker = window.L.marker([destination.lat, destination.lng]);
        marker.bindPopup('<b>🏠 Customer</b>');
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
        // Try to fetch actual route from OSRM instead of straight line
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=simplified&geometries=geojson`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);
          
          const data = await response.json();
          
          if (data.routes && data.routes.length > 0 && data.routes[0].geometry?.coordinates) {
            // Draw actual route from OSRM
            const latlngs = data.routes[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
            const poly = window.L.polyline(latlngs, { color: '#2563eb', weight: 4, opacity: 0.8 });
            poly.addTo(mapInstance.current);
            overlays.current.push(poly);
          } else {
            // Fallback: straight line
            drawFallbackLine();
          }
        } catch (error) {
          console.warn('[RouteMiniMap] Failed to fetch OSRM route, using fallback:', error);
          drawFallbackLine();
        }
      }

      function drawFallbackLine() {
        if (origin && destination) {
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
      }

      // Fit bounds to shown elements
      let boundsPoints: Coordinates[] = points;
      if (route && route.length > 1) {
        boundsPoints = route;
      } else if (origin && destination) {
        // For OSRM route, we need to fit on all fetched coordinates if available
        // For now, just use origin and destination
        boundsPoints = [origin, destination];
      }
      
      if (boundsPoints.length > 0) {
        const bounds = window.L.latLngBounds(boundsPoints.map((p) => [p.lat, p.lng]));
        mapInstance.current.fitBounds(bounds, { padding: [20, 20] });
      }
    };

    init();

    // Use Intersection Observer to detect when map becomes visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && mapInstance.current) {
            // Map is now visible, trigger resize
            setTimeout(() => {
              if (mapInstance.current) {
                mapInstance.current.invalidateSize();
              }
            }, 100);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (mapRef.current) {
      observer.observe(mapRef.current);
    }

    return () => {
      observer.disconnect();
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
      className={`w-full rounded-md border bg-gray-100 ${className}`}
      style={{ 
        height: typeof height === 'number' ? `${height}px` : height,
        minHeight: '200px'
      }}
    />
  );
}
