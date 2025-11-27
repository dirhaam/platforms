'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface HomeVisitAddressSelectorProps {
  address: string;
  latitude?: number;
  longitude?: number;
  tenantId: string;
  onAddressChange: (address: string) => void;
  onCoordinatesChange: (lat: number, lng: number) => void;
}

export function HomeVisitAddressSelector({
  address,
  latitude,
  longitude,
  tenantId,
  onAddressChange,
  onCoordinatesChange
}: HomeVisitAddressSelectorProps) {
  const [addrSuggestions, setAddrSuggestions] = useState<Array<{ label: string; lat: number; lng: number }>>([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addrTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchRef = useRef<string>('');
  const isUserTypingRef = useRef<boolean>(false);

  const performSearch = useCallback(async (searchAddress: string) => {
    // Prevent duplicate searches
    if (lastSearchRef.current === searchAddress) {
      return;
    }
    lastSearchRef.current = searchAddress;

    if (!searchAddress || searchAddress.trim().length < 4) {
      setAddrSuggestions([]);
      return;
    }

    setAddrLoading(true);
    try {
      const res = await fetch('/api/location/validate-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: searchAddress.trim(), tenantId })
      });
      const data = await res.json();
      const list: Array<{ label: string; lat: number; lng: number }> = [];
      if (data?.address?.fullAddress && data?.address?.coordinates) {
        list.push({ label: data.address.fullAddress, lat: data.address.coordinates.lat, lng: data.address.coordinates.lng });
      }
      (data?.suggestions || []).forEach((s: any) => {
        if (s?.fullAddress && s?.coordinates) {
          list.push({ label: s.fullAddress, lat: s.coordinates.lat, lng: s.coordinates.lng });
        }
      });
      setAddrSuggestions(list.slice(0, 5));
      // IMPORTANT: Do NOT auto-fill coordinates during search to avoid ghost typing loop
      // User must explicitly select from suggestions or manually enter coordinates
    } catch (e) {
      console.error('Error searching address:', e);
      setAddrSuggestions([]);
    } finally {
      setAddrLoading(false);
    }
  }, [tenantId]);

  const handleAddressInput = useCallback((val: string) => {
    onAddressChange(val);
    
    // Clear existing timer
    if (addrTimerRef.current) {
      clearTimeout(addrTimerRef.current);
    }
    
    // Set new debounced search with 500ms delay
    addrTimerRef.current = setTimeout(() => {
      performSearch(val);
    }, 500);
  }, [onAddressChange, performSearch]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (addrTimerRef.current) {
        clearTimeout(addrTimerRef.current);
      }
    };
  }, []);

  const handleSuggestionSelect = (suggestion: { label: string; lat: number; lng: number }) => {
    onAddressChange(suggestion.label);
    onCoordinatesChange(suggestion.lat, suggestion.lng);
    setAddrSuggestions([]);
  };

  const handleGpsClick = () => {
    setError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onCoordinatesChange(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          setError('Tidak dapat mengakses GPS. Izinkan lokasi di browser.');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setError('Browser tidak mendukung geolocation');
    }
  };

  return (
    <div className="space-y-3">
      {/* Error Display */}
      {error && (
        <div className="p-3 bg-danger-light dark:bg-[#3a2a36] border border-danger/30 rounded text-danger text-sm flex items-center gap-2">
          <i className='bx bx-error-circle'></i>
          {error}
        </div>
      )}

      {/* Address Search */}
      <div className="space-y-2 relative">
        <Label htmlFor="homeAddress" className="text-txt-primary dark:text-[#d5d5e2]">Alamat Home Visit *</Label>
        <Input
          id="homeAddress"
          placeholder="Cari alamat (jalan/kecamatan/kota)"
          value={address}
          onChange={(e) => handleAddressInput(e.target.value)}
        />
        {addrLoading && (
          <div className="absolute right-2 top-9 text-xs text-txt-muted flex items-center gap-1">
            <i className='bx bx-loader-alt animate-spin'></i>
            Mencari...
          </div>
        )}
        {addrSuggestions.length > 0 && (
          <div className="absolute z-[100] mt-1 w-full bg-white dark:bg-[#2b2c40] border border-gray-200 dark:border-[#4e4f6c] rounded-lg shadow-lg overflow-hidden">
            {addrSuggestions.map((s, idx) => (
              <button
                type="button"
                key={`${s.label}-${idx}`}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#35365f] text-sm text-txt-primary dark:text-[#d5d5e2] transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSuggestionSelect(s);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <i className='bx bx-map-pin text-primary mr-2'></i>
                {s.label}
                <span className="block text-xs text-txt-muted ml-5">{s.lat.toFixed(6)}, {s.lng.toFixed(6)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Coordinates Input */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor="lat" className="text-txt-secondary dark:text-[#b2b2c4]">Latitude</Label>
          <Input
            id="lat"
            type="number"
            step="0.000001"
            placeholder="-6.2"
            value={latitude ?? ''}
            onChange={(e) => {
              const val = e.target.value === '' ? undefined : Number(e.target.value);
              if (val !== undefined && longitude !== undefined) {
                onCoordinatesChange(val, longitude);
              }
            }}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="lng" className="text-txt-secondary dark:text-[#b2b2c4]">Longitude</Label>
          <Input
            id="lng"
            type="number"
            step="0.000001"
            placeholder="106.8"
            value={longitude ?? ''}
            onChange={(e) => {
              const val = e.target.value === '' ? undefined : Number(e.target.value);
              if (val !== undefined && latitude !== undefined) {
                onCoordinatesChange(latitude, val);
              }
            }}
          />
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleGpsClick();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <i className='bx bx-current-location mr-2'></i>
            Gunakan GPS
          </Button>
        </div>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-txt-muted flex items-start gap-2">
        <i className='bx bx-bulb text-warning'></i>
        <span>Tips: ketik alamat lalu pilih dari daftar. Koordinat akan terisi otomatis, dan biaya travel akan dihitung.</span>
      </p>
    </div>
  );
}
