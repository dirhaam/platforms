'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, DollarSign, Calculator, Info } from 'lucide-react';
import { Service } from '@/types/booking';
import { Address, TravelCalculation } from '@/types/location';

interface PricingCalculatorProps {
  service: Service;
  isHomeVisit: boolean;
  homeVisitAddress?: Address;
  tenantId: string;
  businessLocation?: string;
  onPriceCalculated?: (totalPrice: number, breakdown: PriceBreakdown) => void;
}

interface PriceBreakdown {
  basePrice: number;
  homeVisitSurcharge: number;
  travelSurcharge: number;
  totalPrice: number;
  travelInfo?: TravelCalculation;
}

export function PricingCalculator({
  service,
  isHomeVisit,
  homeVisitAddress,
  tenantId,
  businessLocation,
  onPriceCalculated
}: PricingCalculatorProps) {
  const [calculating, setCalculating] = useState(false);
  const [breakdown, setBreakdown] = useState<PriceBreakdown>({
    basePrice: Number(service.price),
    homeVisitSurcharge: 0,
    travelSurcharge: 0,
    totalPrice: Number(service.price)
  });

  useEffect(() => {
    calculatePricing();
  }, [service, isHomeVisit, homeVisitAddress, businessLocation]);

  const calculatePricing = async () => {
    const basePrice = Number(service.price);
    let homeVisitSurcharge = 0;
    let travelSurcharge = 0;
    let travelInfo: TravelCalculation | undefined;

    // Add home visit surcharge if applicable
    if (isHomeVisit && service.homeVisitSurcharge) {
      homeVisitSurcharge = Number(service.homeVisitSurcharge);
    }

    // Calculate travel surcharge if address is provided
    if (isHomeVisit && homeVisitAddress && businessLocation) {
      setCalculating(true);
      try {
        const response = await fetch('/api/location/calculate-travel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            origin: businessLocation,
            destination: homeVisitAddress.coordinates || homeVisitAddress.fullAddress,
            tenantId,
            serviceId: service.id
          })
        });

        if (response.ok) {
          travelInfo = await response.json();
          travelSurcharge = travelInfo?.surcharge || 0;
        }
      } catch (error) {
        console.error('Error calculating travel surcharge:', error);
      } finally {
        setCalculating(false);
      }
    }

    const totalPrice = basePrice + homeVisitSurcharge + travelSurcharge;
    const newBreakdown: PriceBreakdown = {
      basePrice,
      homeVisitSurcharge,
      travelSurcharge,
      totalPrice,
      travelInfo
    };

    setBreakdown(newBreakdown);
    onPriceCalculated?.(totalPrice, newBreakdown);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Price Calculation
        </CardTitle>
        <CardDescription>
          Detailed breakdown of service pricing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Service Details */}
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">{service.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatDuration(service.duration)} • {service.category}
              </p>
            </div>
            <Badge variant="outline">{formatCurrency(breakdown.basePrice)}</Badge>
          </div>

          <Separator />

          {/* Price Breakdown */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Base service price</span>
              <span className="text-sm font-medium">{formatCurrency(breakdown.basePrice)}</span>
            </div>

            {isHomeVisit && (
              <>
                {breakdown.homeVisitSurcharge > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Home visit surcharge
                    </span>
                    <span className="text-sm font-medium">{formatCurrency(breakdown.homeVisitSurcharge)}</span>
                  </div>
                )}

                {homeVisitAddress && businessLocation && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Travel surcharge
                        {calculating && <span className="text-xs text-muted-foreground">(calculating...)</span>}
                      </span>
                      <span className="text-sm font-medium">
                        {calculating ? '...' : formatCurrency(breakdown.travelSurcharge)}
                      </span>
                    </div>

                    {breakdown.travelInfo && (
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-muted-foreground">Distance</p>
                            <p className="font-medium">{breakdown.travelInfo.distance.toFixed(1)} km</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Travel Time</p>
                            <p className="font-medium">{formatDuration(breakdown.travelInfo.duration)}</p>
                          </div>
                        </div>
                        
                        {!breakdown.travelInfo.isWithinServiceArea && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                            <Info className="h-3 w-3" />
                            <span>Location is outside defined service areas</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {isHomeVisit && !homeVisitAddress && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    <span>Enter address to calculate travel surcharge</span>
                  </div>
                )}
              </>
            )}
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total Price</span>
            <span className="text-primary">
              {calculating ? 'Calculating...' : formatCurrency(breakdown.totalPrice)}
            </span>
          </div>

          {/* Additional Information */}
          {isHomeVisit && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Home Visit Service</p>
                  <ul className="text-xs space-y-1">
                    <li>• Service will be performed at your location</li>
                    <li>• Travel time is included in the service duration</li>
                    <li>• Additional travel surcharge may apply based on distance</li>
                    {breakdown.travelInfo && breakdown.travelInfo.duration > 0 && (
                      <li>• Estimated arrival: {formatDuration(breakdown.travelInfo.duration)} travel time</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}