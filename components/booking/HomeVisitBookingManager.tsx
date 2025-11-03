'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Clock, DollarSign, Route, AlertTriangle, CheckCircle } from 'lucide-react';
import { Booking, Service } from '@/types/booking';
import { TravelCalculation } from '@/types/location';
import { TravelCalculator } from '@/components/location/TravelCalculator';
import { LeafletMap } from '@/components/location/LeafletMap';
import { toast } from 'sonner';

interface HomeVisitBookingManagerProps {
  tenantId: string;
  bookings: Booking[];
  services: Service[];
  businessLocation?: string;
  onBookingUpdate?: (bookingId: string, updates: Partial<Booking>) => void;
}

export function HomeVisitBookingManager({
  tenantId,
  bookings,
  services,
  businessLocation,
  onBookingUpdate
}: HomeVisitBookingManagerProps) {
  const [travelCalculations, setTravelCalculations] = useState<Record<string, TravelCalculation>>({});
  const [calculating, setCalculating] = useState<Record<string, boolean>>({});
  const [businessCoords, setBusinessCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geocodingBusiness, setGeocodingBusiness] = useState(false);

  // Get all home visit bookings (no date filter) - sorted by scheduled date
  const homeVisitBookings = bookings
    .filter(booking => 
      booking.isHomeVisit && 
      booking.homeVisitAddress
    )
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  // Calculate travel time buffers and scheduling conflicts
  const calculateTravelBuffer = (booking: Booking, previousBooking?: Booking): number => {
    if (!previousBooking || !businessLocation) return 0;
    
    const travelCalc = travelCalculations[booking.id];
    if (travelCalc) {
      return Math.ceil(travelCalc.duration * 1.2); // Add 20% buffer
    }
    
    // Default buffer based on distance estimate
    return 30; // 30 minutes default
  };

  const checkSchedulingConflicts = (booking: Booking): {
    hasConflict: boolean;
    conflictType: 'travel_time' | 'overlap' | 'none';
    message?: string;
  } => {
    const bookingStart = new Date(booking.scheduledAt);
    const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60000);

    // Find previous booking
    const sortedBookings = homeVisitBookings
      .filter(b => b.id !== booking.id)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    const previousBooking = sortedBookings.find(b => 
      new Date(b.scheduledAt).getTime() < bookingStart.getTime()
    );

    if (previousBooking) {
      const prevEnd = new Date(new Date(previousBooking.scheduledAt).getTime() + previousBooking.duration * 60000);
      const requiredBuffer = calculateTravelBuffer(booking, previousBooking);
      const actualGap = (bookingStart.getTime() - prevEnd.getTime()) / (1000 * 60); // minutes

      if (actualGap < requiredBuffer) {
        return {
          hasConflict: true,
          conflictType: 'travel_time',
          message: `Insufficient travel time. Need ${requiredBuffer} minutes, have ${Math.floor(actualGap)} minutes.`
        };
      }
    }

    // Check for overlapping bookings
    const overlapping = sortedBookings.find(b => {
      const otherStart = new Date(b.scheduledAt);
      const otherEnd = new Date(otherStart.getTime() + b.duration * 60000);
      
      return (
        (bookingStart >= otherStart && bookingStart < otherEnd) ||
        (bookingEnd > otherStart && bookingEnd <= otherEnd) ||
        (bookingStart <= otherStart && bookingEnd >= otherEnd)
      );
    });

    if (overlapping) {
      return {
        hasConflict: true,
        conflictType: 'overlap',
        message: `Overlaps with booking at ${overlapping.homeVisitAddress}`
      };
    }

    return { hasConflict: false, conflictType: 'none' };
  };

  const calculateTravelForBooking = async (booking: Booking) => {
    if (!businessLocation || !booking.homeVisitAddress) return;

    setCalculating(prev => ({ ...prev, [booking.id]: true }));

    try {
      const response = await fetch('/api/location/calculate-travel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          origin: businessLocation,
          destination: booking.homeVisitAddress,
          tenantId,
          serviceId: booking.serviceId
        })
      });

      if (response.ok) {
        const calculation: TravelCalculation = await response.json();
        setTravelCalculations(prev => ({
          ...prev,
          [booking.id]: calculation
        }));

        // Update booking with calculated surcharge if needed
        if (calculation.surcharge > 0 && onBookingUpdate) {
          const currentAmount = Number(booking.totalAmount);
          const service = services.find(s => s.id === booking.serviceId);
          const baseAmount = service ? Number(service.price) : currentAmount;
          const homeVisitSurcharge = service?.homeVisitSurcharge ? Number(service.homeVisitSurcharge) : 0;
          const newTotal = baseAmount + homeVisitSurcharge + calculation.surcharge;

          if (Math.abs(newTotal - currentAmount) > 0.01) {
            onBookingUpdate(booking.id, { totalAmount: newTotal });
          }
        }
      } else {
        toast.error(`Failed to calculate travel for ${booking.customer?.name}`);
      }
    } catch (error) {
      console.error('Error calculating travel:', error);
      toast.error('Travel calculation failed');
    } finally {
      setCalculating(prev => ({ ...prev, [booking.id]: false }));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Geocode business location (homebase address) to get coordinates for map
  useEffect(() => {
    if (!businessLocation || typeof businessLocation !== 'string' || !tenantId) return;

    const geocodeBusinessLocation = async () => {
      setGeocodingBusiness(true);
      try {
        const response = await fetch('/api/location/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: businessLocation.trim(),
            tenantId
          })
        });

        const data = await response.json().catch(() => null);

        if (response.ok && data?.isValid && data?.coordinates) {
          setBusinessCoords(data.coordinates);
        } else {
          // Graceful fallback: log warning but continue
          const errMsg = data?.error || response.statusText || 'Unknown error';
          console.warn('Could not geocode homebase address, using default location:', errMsg);
          // Don't set businessCoords - will use default Jakarta
        }
      } catch (error) {
        console.warn('Error geocoding business location, using default:', error);
        // Graceful fallback - continue with default coordinates
      } finally {
        setGeocodingBusiness(false);
      }
    };

    geocodeBusinessLocation();
  }, [businessLocation, tenantId]);

  // Auto-calculate travel for all bookings when component mounts or bookings change
  useEffect(() => {
    if (businessLocation && homeVisitBookings.length > 0) {
      homeVisitBookings.forEach(booking => {
        if (!travelCalculations[booking.id] && !calculating[booking.id]) {
          calculateTravelForBooking(booking);
        }
      });
    }
  }, [businessLocation, homeVisitBookings.length]);

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Home Visit Schedule
          </CardTitle>
          <CardDescription>
            {homeVisitBookings.length} home visit{homeVisitBookings.length !== 1 ? 's' : ''} scheduled - All upcoming bookings
          </CardDescription>
        </CardHeader>
      </Card>

      {homeVisitBookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No home visits scheduled</h3>
            <p className="text-muted-foreground text-center">
              No home visit bookings found. Create one to get started!
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Travel Calculator */}
          {businessLocation && (
            <TravelCalculator
              tenantId={tenantId}
              bookings={homeVisitBookings}
              startLocation={businessLocation}
            />
          )}

          {/* Location Map */}
          <LeafletMap 
            bookings={homeVisitBookings}
            businessLocation={businessCoords || undefined}
            center={businessCoords || { lat: -6.2088, lng: 106.8456 }}
            zoom={businessCoords ? 14 : 12}
            className="mt-4"
          />

          {/* Individual Booking Cards */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Individual Bookings</h3>
            {homeVisitBookings
              .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
              .map((booking) => {
                const conflict = checkSchedulingConflicts(booking);
                const travelCalc = travelCalculations[booking.id];
                const isCalculating = calculating[booking.id];

                return (
                  <Card key={booking.id} className={conflict.hasConflict ? 'border-red-200 bg-red-50' : ''}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {booking.customer?.name}
                            {conflict.hasConflict ? (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Conflict
                              </Badge>
                            ) : (
                              <Badge variant="default" className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                OK
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            {booking.service?.name} • {formatTime(new Date(booking.scheduledAt))} • {formatDuration(booking.duration)}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(Number(booking.totalAmount))}</p>
                          <Badge variant="outline">{booking.status}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Address */}
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{booking.homeVisitAddress}</p>
                            {booking.homeVisitCoordinates && (
                              <p className="text-xs text-muted-foreground">
                                {booking.homeVisitCoordinates.lat.toFixed(6)}, {booking.homeVisitCoordinates.lng.toFixed(6)}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Travel Information */}
                        {businessLocation && (
                          <div className="bg-muted p-3 rounded-lg">
                            <h4 className="font-medium text-sm mb-3">Travel Information</h4>
                            
                            {isCalculating ? (
                              <p className="text-sm text-muted-foreground">
                                ⏳ Calculating travel information...
                              </p>
                            ) : travelCalc ? (
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Distance</p>
                                  <p className="font-medium">{travelCalc.distance.toFixed(1)} km</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Travel Time</p>
                                  <p className="font-medium">{formatDuration(travelCalc.duration)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Surcharge</p>
                                  <p className="font-medium">{formatCurrency(travelCalc.surcharge)}</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No travel data available
                              </p>
                            )}
                          </div>
                        )}

                        {/* Conflict Warning */}
                        {conflict.hasConflict && (
                          <div className="bg-red-100 border border-red-200 p-3 rounded-lg">
                            <div className="flex items-center gap-2 text-red-800">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="font-medium">Scheduling Conflict</span>
                            </div>
                            <p className="text-sm text-red-700 mt-1">{conflict.message}</p>
                          </div>
                        )}

                        {/* Notes */}
                        {booking.notes && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Notes</p>
                            <p className="text-sm">{booking.notes}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}