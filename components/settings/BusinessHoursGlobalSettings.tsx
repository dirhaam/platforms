'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface BusinessHours {
  [day: string]: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
}

interface BusinessHoursGlobalSettingsProps {
  tenantId: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function BusinessHoursGlobalSettings({ tenantId }: BusinessHoursGlobalSettingsProps) {
  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    monday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
    tuesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
    wednesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
    thursday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
    friday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
    saturday: { isOpen: false, openTime: '09:00', closeTime: '14:00' },
    sunday: { isOpen: false, openTime: '09:00', closeTime: '14:00' },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch current business hours
  useEffect(() => {
    const fetchBusinessHours = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/settings/business-hours?tenantId=${tenantId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.schedule) {
            setBusinessHours(data.schedule);
          }
        }
      } catch (err) {
        console.error('Error fetching business hours:', err);
      } finally {
        setLoading(false);
      }
    };

    if (tenantId) {
      fetchBusinessHours();
    }
  }, [tenantId]);

  const handleDayChange = (day: string, field: string, value: any) => {
    setBusinessHours(prev => ({
      ...prev,
      [day.toLowerCase()]: {
        ...prev[day.toLowerCase()],
        [field]: value,
      },
    }));
    setError(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate times
      for (const [day, hours] of Object.entries(businessHours)) {
        if (hours.isOpen && hours.openTime >= hours.closeTime) {
          setError(`${day}: Open time must be before close time`);
          return;
        }
      }

      const response = await fetch('/api/settings/business-hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          schedule: businessHours,
          timezone: 'Asia/Jakarta',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Business hours updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to update business hours');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Global Business Hours
        </CardTitle>
        <CardDescription>
          Set your operating hours for the entire business. All services will follow these hours.
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
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Days Table */}
        <div className="space-y-3">
          {DAYS.map(day => {
            const dayKey = day.toLowerCase();
            const hours = businessHours[dayKey];

            return (
              <div key={dayKey} className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-900">{day}</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hours.isOpen}
                      onChange={(e) => handleDayChange(dayKey, 'isOpen', e.target.checked)}
                      disabled={saving}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-600">Open</span>
                  </label>
                </div>

                {hours.isOpen && (
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label className="text-xs text-gray-600 mb-1 block">Open Time</Label>
                      <Input
                        type="time"
                        value={hours.openTime}
                        onChange={(e) => handleDayChange(dayKey, 'openTime', e.target.value)}
                        disabled={saving}
                        className="h-9"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-gray-600 mb-1 block">Close Time</Label>
                      <Input
                        type="time"
                        value={hours.closeTime}
                        onChange={(e) => handleDayChange(dayKey, 'closeTime', e.target.value)}
                        disabled={saving}
                        className="h-9"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Business Hours'
            )}
          </Button>
        </div>

        {/* Info Box */}
        <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-900">
          <strong>Note:</strong> These hours apply to all services. Each service can have a custom slot duration and hourly quota, but all services must operate within these global business hours.
        </div>
      </CardContent>
    </Card>
  );
}
