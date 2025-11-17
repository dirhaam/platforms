'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TimeSlot, AvailabilityResponse } from '@/types/booking';

interface TimeSlotPickerProps {
  serviceId: string;
  selectedDate: Date;
  onSlotSelect: (slot: TimeSlot) => void;
  selectedSlot?: TimeSlot;
  tenantId: string;
  className?: string;
}

export function TimeSlotPicker({
  serviceId,
  selectedDate,
  onSlotSelect,
  selectedSlot,
  tenantId,
  className = ''
}: TimeSlotPickerProps) {
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch availability when date or service changes
  useEffect(() => {
    if (serviceId && selectedDate) {
      fetchAvailability();
    }
  }, [serviceId, selectedDate]);

  const fetchAvailability = async () => {
    setLoading(true);
    setError(null);

    try {
      const dateStr = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      const response = await fetch(
        `/api/bookings/availability?serviceId=${serviceId}&date=${dateStr}`,
        {
          headers: {
            'x-tenant-id': tenantId
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }

      const data = await response.json();
      console.log('[TimeSlotPicker] Availability response:', data);
      // API returns availability directly, not nested
      // Convert string timestamps to Date objects
      if (data && data.slots) {
        data.slots = data.slots.map((slot: any) => {
          const start = typeof slot.start === 'string' ? new Date(slot.start) : slot.start;
          const end = typeof slot.end === 'string' ? new Date(slot.end) : slot.end;
          
          // Debug timezone
          console.log('[TimeSlotPicker] Slot conversion:', {
            originalStart: slot.start,
            parsedStart: start.toISOString(),
            localStart: start.toLocaleString(),
            getHours: start.getHours(),
            getUTCHours: start.getUTCHours()
          });
          
          return {
            ...slot,
            start,
            end
          };
        });
      }
      setAvailability(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch availability');
    } finally {
      setLoading(false);
    }
  };

  // Format time for display
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Group slots by time periods
  // IMPORTANT: Use getUTCHours() because backend sends UTC times
  const groupSlotsByPeriod = (slots: TimeSlot[]) => {
    console.log('[groupSlotsByPeriod] Total slots received:', slots.length);
    if (slots.length > 0) {
      console.log('[groupSlotsByPeriod] First slot start:', slots[0].start);
      console.log('[groupSlotsByPeriod] First slot getHours() (local):', slots[0].start.getHours());
      console.log('[groupSlotsByPeriod] First slot getUTCHours():', slots[0].start.getUTCHours());
      console.log('[groupSlotsByPeriod] First slot toLocaleString():', slots[0].start.toLocaleString());
    }

    // FIXED: Group by LOCAL display time (getHours), not UTC
    // This way labels match what user SEES (e.g., 2:00 PM shows in Afternoon, not Morning)
    const morning = slots.filter(slot => {
      const hour = slot.start.getHours();
      return hour >= 6 && hour < 12;
    });

    const afternoon = slots.filter(slot => {
      const hour = slot.start.getHours();
      return hour >= 12 && hour < 17;
    });

    const evening = slots.filter(slot => {
      const hour = slot.start.getHours();
      return hour >= 17 && hour < 22;
    });

    console.log('[groupSlotsByPeriod] Results (local display time-based grouping):', { 
      morning: morning.length, 
      afternoon: afternoon.length, 
      evening: evening.length,
      morningHours: morning.length > 0 ? `${morning[0].start.getHours()}-${morning[morning.length-1].start.getHours()}` : 'N/A',
      afternoonHours: afternoon.length > 0 ? `${afternoon[0].start.getHours()}-${afternoon[afternoon.length-1].start.getHours()}` : 'N/A',
      eveningHours: evening.length > 0 ? `${evening[0].start.getHours()}-${evening[evening.length-1].start.getHours()}` : 'N/A'
    });

    return { morning, afternoon, evening };
  };

  // Render time period section
  const renderTimePeriod = (title: string, slots: TimeSlot[]) => {
    if (slots.length === 0) return null;

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">{title}</h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {slots.map((slot, index) => {
            const isSelected = selectedSlot && 
              slot.start.getTime() === selectedSlot.start.getTime();
            
            return (
              <Button
                key={index}
                variant={isSelected ? 'default' : slot.available ? 'outline' : 'ghost'}
                size="sm"
                disabled={!slot.available}
                onClick={() => slot.available && onSlotSelect(slot)}
                className={`
                  text-xs h-8 px-2
                  ${!slot.available ? 'opacity-50 cursor-not-allowed' : ''}
                  ${isSelected ? 'ring-2 ring-blue-500' : ''}
                `}
              >
                {formatTime(slot.start)}
              </Button>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Available Times</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Available Times</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAvailability}
            className="mt-4"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!availability) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Available Times</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Select a date to view available times
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!availability.businessHours.isOpen) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Available Times</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              Business is closed on {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { morning, afternoon, evening } = groupSlotsByPeriod(availability.slots);
  const availableSlots = availability.slots.filter(slot => slot.available);
  const totalSlots = availability.slots.length;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Available Times</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              {availableSlots.length} of {totalSlots} available
            </Badge>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          {selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
        {availability.businessHours.openTime && availability.businessHours.closeTime && (
          <div className="text-sm text-gray-500">
            Business hours: {availability.businessHours.openTime} - {availability.businessHours.closeTime}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {availableSlots.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No available time slots for this date. Please select a different date.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {renderTimePeriod('Morning', morning)}
            {renderTimePeriod('Afternoon', afternoon)}
            {renderTimePeriod('Evening', evening)}
          </>
        )}

        {selectedSlot && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Selected Time: {formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 border border-gray-300 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <span>Booked</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchAvailability}
            className="text-xs"
          >
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}