'use client';

import React, { useState, useEffect } from 'react';

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
      if (data && data.slots) {
        data.slots = data.slots.map((slot: any) => ({
          ...slot,
          start: typeof slot.start === 'string' ? new Date(slot.start) : slot.start,
          end: typeof slot.end === 'string' ? new Date(slot.end) : slot.end
        }));
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
  // IMPORTANT: Use LOCAL time (getHours) for grouping since display is in local time
  const groupSlotsByPeriod = (slots: TimeSlot[]) => {
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
                type="button"
                variant={isSelected ? 'default' : slot.available ? 'outline' : 'ghost'}
                size="sm"
                disabled={!slot.available}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (slot.available) {
                    onSlotSelect(slot);
                  }
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                className={`
                  text-xs h-8 px-2
                  ${!slot.available ? 'opacity-50 cursor-not-allowed' : ''}
                  ${isSelected ? 'ring-2 ring-primary' : ''}
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
          <CardTitle className="flex items-center gap-2">
            <i className='bx bx-time-five text-xl text-primary'></i>
            <span>Waktu Tersedia</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <i className='bx bx-loader-alt text-3xl text-primary animate-spin'></i>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className='bx bx-time-five text-xl text-primary'></i>
            <span>Waktu Tersedia</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <i className='bx bx-error-circle'></i>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            type="button"
            variant="outline" 
            size="sm" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              fetchAvailability();
            }}
            className="mt-4"
          >
            Coba Lagi
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!availability) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className='bx bx-time-five text-xl text-primary'></i>
            <span>Waktu Tersedia</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-txt-muted">
            Pilih tanggal untuk melihat waktu tersedia
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!availability.businessHours.isOpen) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className='bx bx-time-five text-xl text-primary'></i>
            <span>Waktu Tersedia</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <i className='bx bx-calendar-x'></i>
            <AlertDescription>
              Tutup pada hari {selectedDate.toLocaleDateString('id-ID', { weekday: 'long' })}
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
          <CardTitle className="flex items-center gap-2">
            <i className='bx bx-time-five text-xl text-primary'></i>
            <span>Waktu Tersedia</span>
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {availableSlots.length} dari {totalSlots} tersedia
          </Badge>
        </div>
        <div className="text-sm text-txt-secondary">
          {selectedDate.toLocaleDateString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
        {availability.businessHours.openTime && availability.businessHours.closeTime && (
          <div className="text-sm text-txt-muted">
            Jam operasional: {availability.businessHours.openTime} - {availability.businessHours.closeTime}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {availableSlots.length === 0 ? (
          <Alert>
            <i className='bx bx-info-circle'></i>
            <AlertDescription>
              Tidak ada slot waktu tersedia untuk tanggal ini. Silakan pilih tanggal lain.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {renderTimePeriod('Pagi', morning)}
            {renderTimePeriod('Siang', afternoon)}
            {renderTimePeriod('Malam', evening)}
          </>
        )}

        {selectedSlot && (
          <div className="mt-6 p-4 bg-primary-light dark:bg-[#35365f] border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2">
              <i className='bx bx-check-circle text-primary'></i>
              <span className="text-sm font-medium text-primary">
                Waktu Dipilih: {formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 border border-gray-300 rounded"></div>
              <span>Tersedia</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <span>Terisi</span>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              fetchAvailability();
            }}
            className="text-xs"
          >
            <i className='bx bx-refresh mr-1'></i>
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}