'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { toast } from 'sonner';
import { TravelCalculation } from '@/types/location';

interface TravelEstimateCardProps {
  tenantId: string;
  origin: string | { lat: number; lng: number };
  destination: string;
  destinationCoordinates?: { lat: number; lng: number }; // Optional pre-resolved coordinates
  serviceId?: string;
  onCalculationComplete?: (calc: TravelCalculation) => void;
  onConfirm?: (calc: TravelCalculation) => void;
  isLoading?: boolean;
  autoCalculate?: boolean; // Auto calculate when component mounts
}

export function TravelEstimateCard({
  tenantId,
  origin,
  destination,
  destinationCoordinates,
  serviceId,
  onCalculationComplete,
  onConfirm,
  isLoading = false,
  autoCalculate = true
}: TravelEstimateCardProps) {
  const [calculation, setCalculation] = useState<TravelCalculation | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoCalculate && destination && origin) {
      handleCalculate();
    }
  }, [destination, origin, serviceId, tenantId, autoCalculate]);

  const handleCalculate = async () => {
    if (!destination || !origin) {
      const msg = 'Origin dan destination diperlukan';
      setError(msg);
      console.error('[TravelEstimateCard]', msg, { origin, destination });
      return;
    }

    console.log('[TravelEstimateCard] Calculating travel:', { origin, destination, tenantId, serviceId });
    setCalculating(true);
    setError(null);

    try {
      // If destination coordinates provided, use them instead of address
      const destinationForCalculation = destinationCoordinates || destination;
      
      console.log('[TravelEstimateCard] Using destination:', {
        hasCoordinates: !!destinationCoordinates,
        destination: destinationForCalculation
      });
      
      const response = await fetch('/api/location/calculate-travel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination: destinationForCalculation,
          tenantId,
          serviceId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMsg = errorData?.error || `HTTP ${response.status}`;
        throw new Error(`Travel calculation failed: ${errorMsg}`);
      }

      const result: TravelCalculation = await response.json();
      console.log('[TravelEstimateCard] Calculation result:', result);
      setCalculation(result);
      onCalculationComplete?.(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Travel calculation failed';
      console.error('[TravelEstimateCard] Error:', message);
      setError(message);
      toast.error(message);
    } finally {
      setCalculating(false);
    }
  };

  const handleConfirm = async () => {
    if (!calculation) return;

    setConfirming(true);
    try {
      onConfirm?.(calculation);
    } finally {
      setConfirming(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (error && !calculation) {
    return (
      <Card className="border-danger/30 bg-danger-light dark:bg-[#3a2a36]">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-danger">
            <i className='bx bx-error-circle text-xl'></i>
            <span>{error}</span>
          </div>
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCalculate();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            variant="outline"
            size="sm"
            className="mt-4"
            disabled={calculating || isLoading}
          >
            {calculating ? <i className='bx bx-loader-alt animate-spin mr-2'></i> : null}
            Coba Lagi
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (calculating || isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 py-8">
            <i className='bx bx-loader-alt text-2xl animate-spin text-primary'></i>
            <span className="text-txt-muted">Menghitung perkiraan biaya travel...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!calculation) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCalculate();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full"
            disabled={!destination || !origin}
          >
            <i className='bx bx-calculator mr-2'></i>
            Hitung Biaya Travel
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary-light to-transparent dark:from-[#35365f] dark:to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <i className='bx bx-map-pin text-xl text-primary'></i>
            Perkiraan Biaya Travel
          </CardTitle>
          <Badge variant={calculation.isWithinServiceArea ? 'default' : 'secondary'}>
            {calculation.isWithinServiceArea ? 'Dalam Area' : 'Luar Area'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Travel Details Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-white dark:bg-[#232333] rounded-lg border border-gray-200 dark:border-[#4e4f6c]">
            <p className="text-xs text-txt-muted mb-1 flex items-center gap-1">
              <i className='bx bx-map'></i>
              Jarak
            </p>
            <p className="font-bold text-lg text-primary">
              {calculation.distance.toFixed(1)} km
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-[#232333] rounded-lg border border-gray-200 dark:border-[#4e4f6c]">
            <p className="text-xs text-txt-muted mb-1 flex items-center gap-1">
              <i className='bx bx-time-five'></i>
              Waktu
            </p>
            <p className="font-bold text-lg text-success">
              {formatDuration(calculation.duration)}
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-[#232333] rounded-lg border border-gray-200 dark:border-[#4e4f6c]">
            <p className="text-xs text-txt-muted mb-1 flex items-center gap-1">
              <i className='bx bx-dollar'></i>
              Surcharge
            </p>
            <p className="font-bold text-lg text-warning">
              {formatCurrency(calculation.surcharge)}
            </p>
          </div>
        </div>

        {/* Status Message */}
        {calculation.isWithinServiceArea ? (
          <div className="flex items-center gap-2 text-sm text-success bg-success-light dark:bg-[#2a3a2f] p-3 rounded-lg">
            <i className='bx bx-check-circle'></i>
            Lokasi dalam area layanan. Surcharge sesuai tarif yang berlaku.
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-warning bg-warning-light dark:bg-[#3a362a] p-3 rounded-lg">
            <i className='bx bx-info-circle'></i>
            Lokasi di luar area layanan utama. Surcharge tambahan mungkin berlaku.
          </div>
        )}

        {/* Recalculate Button Only */}
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleCalculate();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          variant="outline"
          className="w-full"
          disabled={calculating || confirming || isLoading}
        >
          <i className='bx bx-refresh mr-2'></i>
          Hitung Ulang
        </Button>
      </CardContent>
    </Card>
  );
}
