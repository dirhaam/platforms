'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { TimePicker } from '@/components/ui/time-picker';
import type { BusinessHours } from '@/types/database';

interface BusinessHoursSettingsProps {
  tenantId: string;
  initialData: BusinessHours | null;
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

interface DaySchedule {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export default function BusinessHoursSettings({ tenantId, initialData }: BusinessHoursSettingsProps) {
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>(() => {
    const defaultSchedule: Record<string, DaySchedule> = {};
    
    DAYS_OF_WEEK.forEach(day => {
      defaultSchedule[day.key] = {
        isOpen: true,
        openTime: '09:00',
        closeTime: '17:00',
      };
    });

    // If we have initial data, merge it
    if (initialData?.schedule) {
      const savedSchedule = initialData.schedule as any;
      Object.keys(savedSchedule).forEach(day => {
        if (defaultSchedule[day]) {
          defaultSchedule[day] = {
            isOpen: savedSchedule[day].isOpen || false,
            openTime: savedSchedule[day].openTime || '09:00',
            closeTime: savedSchedule[day].closeTime || '17:00',
          };
        }
      });
    }

    return defaultSchedule;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDayToggle = (day: string, isOpen: boolean) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], isOpen },
    }));
    setMessage(null);
  };

  const handleTimeChange = (day: string, field: 'openTime' | 'closeTime', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/settings/business-hours', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schedule,
          timezone: 'Asia/Jakarta',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Business hours updated successfully!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update business hours' });
      }
    } catch (error) {
      console.error('Error updating business hours:', error);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {DAYS_OF_WEEK.map((day) => (
          <Card key={day.key}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Switch
                    checked={schedule[day.key]?.isOpen || false}
                    onCheckedChange={(checked) => handleDayToggle(day.key, checked)}
                  />
                  <Label className="font-medium w-20">{day.label}</Label>
                </div>

                {schedule[day.key]?.isOpen && (
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Label className="text-sm">Open:</Label>
                      <TimePicker
                        value={schedule[day.key]?.openTime || '09:00'}
                        onChange={(value) => handleTimeChange(day.key, 'openTime', value)}
                        className="w-32"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label className="text-sm">Close:</Label>
                      <TimePicker
                        value={schedule[day.key]?.closeTime || '17:00'}
                        onChange={(value) => handleTimeChange(day.key, 'closeTime', value)}
                        className="w-32"
                      />
                    </div>
                  </div>
                )}

                {!schedule[day.key]?.isOpen && (
                  <span className="text-sm text-gray-500">Closed</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Business Hours'
          )}
        </Button>
      </div>
    </form>
  );
}