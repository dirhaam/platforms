'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Clock, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
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
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleCalculate();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            variant="outline"
            size="sm"
            className="mt-4"
            disabled={calculating || isLoading}
          >
            {calculating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
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
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-muted-foreground">Menghitung perkiraan biaya travel...</span>
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
            onClick={(e) => {
              e.stopPropagation();
              handleCalculate();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full"
            disabled={!destination || !origin}
          >
            Hitung Biaya Travel
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
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
          <div className="p-3 bg-white rounded-lg border">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Jarak
            </p>
            <p className="font-bold text-lg text-blue-600">
              {calculation.distance.toFixed(1)} km
            </p>
          </div>

          <div className="p-3 bg-white rounded-lg border">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Waktu
            </p>
            <p className="font-bold text-lg text-green-600">
              {formatDuration(calculation.duration)}
            </p>
          </div>

          <div className="p-3 bg-white rounded-lg border">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Travel Surcharge
            </p>
            <p className="font-bold text-lg text-orange-600">
              {formatCurrency(calculation.surcharge)}
            </p>
          </div>
        </div>

        {/* Status Message */}
        {calculation.isWithinServiceArea ? (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
            <CheckCircle className="h-4 w-4" />
            Lokasi dalam area layanan. Surcharge sesuai tarif yang berlaku.
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            Lokasi di luar area layanan utama. Surcharge tambahan mungkin berlaku.
          </div>
        )}

        {/* Recalculate Button Only */}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleCalculate();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          variant="outline"
          className="w-full"
          disabled={calculating || confirming || isLoading}
        >
          Hitung Ulang
        </Button>
      </CardContent>
    </Card>
  );
}
