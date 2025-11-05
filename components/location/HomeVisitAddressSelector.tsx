'use client';

import React, { useState } from 'react';
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
  const [addrTimer, setAddrTimer] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddressInput = (val: string) => {
    onAddressChange(val);
    if (addrTimer) clearTimeout(addrTimer);
    
    const t = setTimeout(async () => {
      if (!val || val.trim().length < 4) {
        setAddrSuggestions([]);
        return;
      }
      setAddrLoading(true);
      try {
        const res = await fetch('/api/location/validate-address', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: val.trim(), tenantId })
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
        // Auto-fill coords if empty and we have a primary hit
        if (list.length > 0 && (!latitude || !longitude)) {
          onCoordinatesChange(list[0].lat, list[0].lng);
        }
      } catch (e) {
        setAddrSuggestions([]);
      } finally {
        setAddrLoading(false);
      }
    }, 450);
    setAddrTimer(t);
  };

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
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Address Search */}
      <div className="space-y-2 relative">
        <Label htmlFor="homeAddress">Home Address (with search) *</Label>
        <Input
          id="homeAddress"
          placeholder="Cari alamat (jalan/kecamatan/kota)"
          value={address}
          onChange={(e) => handleAddressInput(e.target.value)}
        />
        {addrLoading && (
          <div className="absolute right-2 top-9 text-xs text-gray-500">Searching…</div>
        )}
        {addrSuggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow">
            {addrSuggestions.map((s, idx) => (
              <button
                type="button"
                key={`${s.label}-${idx}`}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                onClick={() => handleSuggestionSelect(s)}
              >
                {s.label}
                <span className="block text-xs text-gray-500">{s.lat.toFixed(6)}, {s.lng.toFixed(6)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Coordinates Input */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor="lat">Latitude</Label>
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
          <Label htmlFor="lng">Longitude</Label>
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
            onClick={handleGpsClick}
          >
            Use GPS
          </Button>
        </div>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-gray-600">
        💡 Tips: ketik alamat lalu pilih dari daftar. Koordinat akan terisi otomatis, dan biaya travel akan dihitung.
      </p>
    </div>
  );
}
