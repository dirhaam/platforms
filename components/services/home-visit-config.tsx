'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface HomeVisitConfig {
  serviceType: 'on_premise' | 'home_visit' | 'both';
  homeVisitFullDayBooking: boolean;
  homeVisitMinBufferMinutes: number;
  dailyQuotaPerStaff?: number;
  requiresStaffAssignment: boolean;
}

interface Props {
  serviceId: string;
  tenantId: string;
  onSave?: (config: HomeVisitConfig) => void;
}

export function HomeVisitConfig({ serviceId, tenantId, onSave }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState<HomeVisitConfig>({
    serviceType: 'on_premise',
    homeVisitFullDayBooking: false,
    homeVisitMinBufferMinutes: 30,
    dailyQuotaPerStaff: undefined,
    requiresStaffAssignment: false,
  });

  useEffect(() => {
    fetchConfig();
  }, [serviceId, tenantId]);

  const fetchConfig = async () => {
    try {
      const response = await fetch(
        `/api/services/${serviceId}/home-visit-config`,
        {
          headers: { 'X-Tenant-ID': tenantId },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch config');
      const data = await response.json();
      setConfig(data);
    } catch (err) {
      console.error('Error fetching home visit config:', err);
      // Default config if not found
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(
        `/api/services/${serviceId}/home-visit-config`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': tenantId,
          },
          body: JSON.stringify(config),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      setSuccess(true);
      onSave?.(config);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
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
        <CardTitle>Home Visit Configuration</CardTitle>
        <CardDescription>
          Configure how this service handles home visit bookings
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
              Configuration saved successfully
            </AlertDescription>
          </Alert>
        )}

        {/* Service Type */}
        <div className="space-y-2">
          <Label htmlFor="service-type">Service Type</Label>
          <Select
            value={config.serviceType}
            onValueChange={(value: any) =>
              setConfig({ ...config, serviceType: value })
            }
          >
            <SelectTrigger id="service-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="on_premise">
                On Premise Only (Office/Salon)
              </SelectItem>
              <SelectItem value="home_visit">
                Home Visit Only (Customer Home)
              </SelectItem>
              <SelectItem value="both">
                Both (Flexible)
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            Choose where this service can be performed
          </p>
        </div>

        {/* Show home visit options only if home_visit is selected */}
        {(config.serviceType === 'home_visit' || config.serviceType === 'both') && (
          <>
            {/* Full Day Booking */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <Label className="text-base font-medium">
                  Full Day Booking Only
                </Label>
                <p className="text-xs text-gray-500">
                  Only allow 1 booking per day per staff (e.g., Makeup Artist)
                </p>
              </div>
              <Switch
                checked={config.homeVisitFullDayBooking}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, homeVisitFullDayBooking: checked })
                }
              />
            </div>

            {/* Travel Buffer Minutes */}
            <div className="space-y-2">
              <Label htmlFor="buffer-minutes">
                Travel Buffer Between Appointments (minutes)
              </Label>
              <Input
                id="buffer-minutes"
                type="number"
                min="0"
                max="240"
                value={config.homeVisitMinBufferMinutes}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    homeVisitMinBufferMinutes: parseInt(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-gray-500">
                Time needed for travel between appointments. Default: 30 minutes
              </p>
            </div>

            {/* Daily Quota */}
            <div className="space-y-2">
              <Label htmlFor="daily-quota">
                Daily Quota Per Staff (optional)
              </Label>
              <Input
                id="daily-quota"
                type="number"
                min="1"
                max="20"
                placeholder="Leave empty for unlimited"
                value={config.dailyQuotaPerStaff || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    dailyQuotaPerStaff: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
              />
              <p className="text-xs text-gray-500">
                Maximum bookings per staff member per day. Leave empty for
                unlimited.
              </p>
            </div>
          </>
        )}

        {/* Requires Staff Assignment */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-1">
            <Label className="text-base font-medium">
              Requires Staff Assignment
            </Label>
            <p className="text-xs text-gray-500">
              Each booking must be assigned to a staff member
            </p>
          </div>
          <Switch
            checked={config.requiresStaffAssignment}
            onCheckedChange={(checked) =>
              setConfig({ ...config, requiresStaffAssignment: checked })
            }
          />
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full"
          size="lg"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Configuration
        </Button>
      </CardContent>
    </Card>
  );
}
