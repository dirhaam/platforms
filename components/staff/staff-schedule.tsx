'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { TimePicker } from '@/components/ui/time-picker';

interface ScheduleItem {
  id: string;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  notes?: string;
}

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

interface Props {
  staffId: string;
  tenantId: string;
  staffName?: string;
}

export function StaffSchedule({ staffId, tenantId, staffName }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [schedule, setSchedule] = useState<Record<number, ScheduleItem>>({});

  useEffect(() => {
    fetchSchedule();
  }, [staffId, tenantId]);

  const fetchSchedule = async () => {
    try {
      const response = await fetch(`/api/staff/${staffId}/schedule`, {
        headers: { 'X-Tenant-ID': tenantId },
      });
      if (!response.ok) throw new Error('Failed to fetch schedule');
      const data = await response.json();

      // Initialize all days
      const scheduleMap: Record<number, ScheduleItem> = {};
      DAYS.forEach((day) => {
        const existing = data.schedule?.find(
          (s: ScheduleItem) => s.dayOfWeek === day.value
        );
        scheduleMap[day.value] = existing || {
          dayOfWeek: day.value,
          dayName: day.label,
          startTime: '08:00',
          endTime: '17:00',
          isAvailable: true,
        };
      });
      setSchedule(scheduleMap);
    } catch (err) {
      console.error('Error fetching schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (dayOfWeek: number) => {
    const item = schedule[dayOfWeek];
    if (!item) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/staff/${staffId}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
        },
        body: JSON.stringify({
          dayOfWeek,
          startTime: item.startTime,
          endTime: item.endTime,
          isAvailable: item.isAvailable,
          notes: item.notes,
        }),
      });

      if (!response.ok) throw new Error('Failed to save schedule');

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const updateScheduleItem = (
    dayOfWeek: number,
    field: string,
    value: any
  ) => {
    setSchedule((prev) => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Working Schedule</CardTitle>
        <CardDescription>
          {staffName && `${staffName}'s`} custom working hours (overrides business hours)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Schedule updated successfully
            </AlertDescription>
          </Alert>
        )}

        {DAYS.map((day) => {
          const item = schedule[day.value];
          if (!item) return null;

          return (
            <div key={day.value} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">{day.label}</h3>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`available-${day.value}`} className="text-sm">
                    Available
                  </Label>
                  <Switch
                    id={`available-${day.value}`}
                    checked={item.isAvailable}
                    onCheckedChange={(checked) =>
                      updateScheduleItem(day.value, 'isAvailable', checked)
                    }
                  />
                </div>
              </div>

              {item.isAvailable && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`start-${day.value}`} className="text-sm">
                        Start Time
                      </Label>
                      <TimePicker
                        value={item.startTime}
                        onChange={(value) =>
                          updateScheduleItem(day.value, 'startTime', value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`end-${day.value}`} className="text-sm">
                        End Time
                      </Label>
                      <TimePicker
                        value={item.endTime}
                        onChange={(value) =>
                          updateScheduleItem(day.value, 'endTime', value)
                        }
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => handleSave(day.value)}
                    disabled={saving}
                    size="sm"
                    className="w-full"
                  >
                    {saving && (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    )}
                    Save {day.label} Schedule
                  </Button>
                </>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
