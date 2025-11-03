'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Clock, DollarSign, Route, Loader2 } from 'lucide-react';
import { TravelCalculation, RouteOptimization } from '@/types/location';
import { Booking } from '@/types/booking';
import { toast } from 'sonner';

interface TravelCalculatorProps {
  tenantId: string;
  bookings?: Booking[];
  startLocation?: string;
  onCalculationComplete?: (calculation: TravelCalculation | RouteOptimization) => void;
}

export function TravelCalculator({ 
  tenantId, 
  bookings = [], 
  startLocation,
  onCalculationComplete 
}: TravelCalculatorProps) {
  const [calculating, setCalculating] = useState(false);
  const [calculation, setCalculation] = useState<TravelCalculation | null>(null);
  const [routeOptimization, setRouteOptimization] = useState<RouteOptimization | null>(null);

  const calculateSingleTravel = async (origin: string, destination: string, serviceId?: string) => {
    setCalculating(true);
    try {
      const response = await fetch('/api/location/calculate-travel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          origin,
          destination,
          tenantId,
          serviceId
        })
      });

      if (response.ok) {
        const result: TravelCalculation = await response.json();
        setCalculation(result);
        onCalculationComplete?.(result);
        return result;
      } else {
        toast.error('Failed to calculate travel time and distance');
      }
    } catch (error) {
      console.error('Error calculating travel:', error);
      toast.error('Travel calculation service unavailable');
    } finally {
      setCalculating(false);
    }
  };

  const optimizeRoute = async () => {
    if (!startLocation || bookings.length === 0) {
      toast.error('Start location and bookings are required for route optimization');
      return;
    }

    setCalculating(true);
    try {
      const bookingData = bookings
        .filter(b => b.isHomeVisit && b.homeVisitAddress)
        .map(b => ({
          id: b.id,
          address: b.homeVisitAddress!,
          coordinates: b.homeVisitCoordinates,
          serviceTime: b.duration,
          scheduledAt: b.scheduledAt
        }));

      if (bookingData.length === 0) {
        toast.error('No home visit bookings found');
        return;
      }

      const response = await fetch('/api/location/optimize-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startLocation,
          bookings: bookingData,
          tenantId
        })
      });

      if (response.ok) {
        const raw = await response.json();
        const result: RouteOptimization = {
          ...raw,
          optimizedRoute: Array.isArray(raw.optimizedRoute)
            ? raw.optimizedRoute.map((s: any) => ({
                ...s,
                estimatedArrival: new Date(s.estimatedArrival),
              }))
            : [],
        };
        setRouteOptimization(result);
        onCalculationComplete?.(result);
        return result;
      } else {
        toast.error('Failed to optimize route');
      }
    } catch (error) {
      console.error('Error optimizing route:', error);
      toast.error('Route optimization service unavailable');
    } finally {
      setCalculating(false);
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

  const homeVisitBookings = bookings.filter(b => b.isHomeVisit && b.homeVisitAddress);

  return (
    <div className="space-y-6">
      {/* Route Optimization for Multiple Bookings */}
      {homeVisitBookings.length > 1 && startLocation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Route Optimization
            </CardTitle>
            <CardDescription>
              Optimize travel route for {homeVisitBookings.length} home visit bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Starting from</p>
                  <p className="font-medium">{startLocation}</p>
                </div>
                <Button 
                  onClick={optimizeRoute} 
                  disabled={calculating}
                  className="flex items-center gap-2"
                >
                  {calculating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Route className="h-4 w-4" />
                  )}
                  Optimize Route
                </Button>
              </div>

              {routeOptimization && (
                <div className="space-y-4">
                  <Separator />
                  
                  {/* Route Summary */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {routeOptimization.totalDistance.toFixed(1)} km
                      </p>
                      <p className="text-sm text-muted-foreground">Total Distance</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {formatDuration(routeOptimization.totalDuration)}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Time</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(routeOptimization.totalSurcharge)}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Surcharge</p>
                    </div>
                  </div>

                  {/* Optimized Route Steps */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Optimized Route</h4>
                    <div className="space-y-2">
                      {routeOptimization.optimizedRoute.map((stop, index) => (
                        <div key={stop.bookingId} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <div className="flex-shrink-0">
                            <Badge variant="outline">{index + 1}</Badge>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{stop.address}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {stop.estimatedArrival.toLocaleTimeString('id-ID', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                              <span>{formatDuration(stop.serviceTime)} service</span>
                              {stop.travelTimeFromPrevious > 0 && (
                                <span>{formatDuration(stop.travelTimeFromPrevious)} travel</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Travel Calculations */}
      {homeVisitBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Home Visit Locations
            </CardTitle>
            <CardDescription>
              Individual travel calculations for each booking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {homeVisitBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{booking.homeVisitAddress}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{booking.service?.name}</span>
                      <span>{formatDuration(booking.duration)}</span>
                      <span>
                        {booking.scheduledAt.toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  
                  {startLocation && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => calculateSingleTravel(
                        startLocation, 
                        booking.homeVisitAddress!, 
                        booking.serviceId
                      )}
                      disabled={calculating}
                    >
                      {calculating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Calculate'
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Single Travel Calculation Result */}
      {calculation && (
        <Card>
          <CardHeader>
            <CardTitle>Travel Calculation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {calculation.distance.toFixed(1)} km
                </p>
                <p className="text-sm text-muted-foreground">Distance</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {formatDuration(calculation.duration)}
                </p>
                <p className="text-sm text-muted-foreground">Duration</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(calculation.surcharge)}
                </p>
                <p className="text-sm text-muted-foreground">Surcharge</p>
              </div>
              <div className="text-center">
                <Badge variant={calculation.isWithinServiceArea ? 'default' : 'secondary'}>
                  {calculation.isWithinServiceArea ? 'In Service Area' : 'Outside Area'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {homeVisitBookings.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No home visit bookings</h3>
            <p className="text-muted-foreground text-center">
              Travel calculations will appear here when you have bookings with home visit addresses
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}