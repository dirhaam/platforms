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
import { Alert, AlertDescription } from '@/components/ui/alert';

interface HomeVisitConfig {
  serviceType: 'on_premise' | 'home_visit' | 'both';
  homeVisitFullDayBooking: boolean;
  homeVisitMinBufferMinutes: number;
  dailyQuotaPerStaff?: number;
  requiresStaffAssignment: boolean;
  // Simplified quota-based (no staff assignment)
  dailyHomeVisitQuota?: number;
  homeVisitTimeSlots?: string[];
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
    dailyHomeVisitQuota: 3,
    homeVisitTimeSlots: ['09:00', '13:00', '16:00'],
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
      <Card className="shadow-card border-none rounded-card bg-white">
        <CardContent className="flex items-center justify-center py-8">
          <i className='bx bx-loader-alt animate-spin text-2xl text-primary'></i>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card border-none rounded-card bg-white">
      <CardHeader>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded bg-primary-light flex items-center justify-center text-primary">
            <i className='bx bx-home-heart text-xl'></i>
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-txt-primary">Home Visit Configuration</CardTitle>
            <CardDescription className="text-txt-secondary">
              Configure how this service handles home visit bookings
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-danger">
            <i className='bx bx-error-circle text-xl mr-2'></i>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 text-success">
            <i className='bx bx-check-circle text-xl mr-2'></i>
            <AlertDescription>
              Configuration saved successfully
            </AlertDescription>
          </Alert>
        )}

        {/* Service Type */}
        <div className="space-y-2">
          <Label htmlFor="service-type" className="text-txt-primary font-semibold flex items-center gap-2">
            <i className='bx bx-category text-primary'></i> Service Type
          </Label>
          <Select
            value={config.serviceType}
            onValueChange={(value: any) =>
              setConfig({ ...config, serviceType: value })
            }
          >
            <SelectTrigger id="service-type" className="bg-gray-50 border-transparent focus:bg-white focus:border-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="on_premise">
                <div className="flex items-center gap-2">
                  <i className='bx bx-building'></i> On Premise Only (Office/Salon)
                </div>
              </SelectItem>
              <SelectItem value="home_visit">
                <div className="flex items-center gap-2">
                  <i className='bx bx-home'></i> Home Visit Only (Customer Home)
                </div>
              </SelectItem>
              <SelectItem value="both">
                <div className="flex items-center gap-2">
                  <i className='bx bx-buildings'></i> Both (Flexible)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-txt-muted">
            Choose where this service can be performed
          </p>
        </div>

        {/* Show home visit options only if home_visit is selected */}
        {(config.serviceType === 'home_visit' || config.serviceType === 'both') && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Full Day Booking */}
            <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-4">
              <div className="space-y-1">
                <Label className="text-base font-medium text-txt-primary flex items-center gap-2">
                  <i className='bx bx-calendar-event text-primary'></i> Full Day Booking Only
                </Label>
                <p className="text-xs text-txt-secondary">
                  Only allow 1 booking per day per staff (e.g., Makeup Artist)
                </p>
              </div>
              <Switch
                checked={config.homeVisitFullDayBooking}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, homeVisitFullDayBooking: checked })
                }
                className="data-[state=checked]:bg-primary"
              />
            </div>

            {/* Travel Buffer Minutes */}
            <div className="space-y-2">
              <Label htmlFor="buffer-minutes" className="text-txt-primary font-semibold flex items-center gap-2">
                <i className='bx bx-time-five text-primary'></i> Travel Buffer (minutes)
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
                className="bg-gray-50 border-transparent focus:bg-white focus:border-primary"
              />
              <p className="text-xs text-txt-muted">
                Time needed for travel between appointments. Default: 30 minutes
              </p>
            </div>

            {/* Daily Quota */}
            <div className="space-y-2">
              <Label htmlFor="daily-quota" className="text-txt-primary font-semibold flex items-center gap-2">
                <i className='bx bx-list-check text-primary'></i> Daily Quota Per Staff
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
                className="bg-gray-50 border-transparent focus:bg-white focus:border-primary"
              />
              <p className="text-xs text-txt-muted">
                Maximum bookings per staff member per day. Leave empty for unlimited.
              </p>
            </div>
          </div>
        )}

        {/* SIMPLIFIED QUOTA-BASED SETTINGS */}
        {(config.serviceType === 'home_visit' || config.serviceType === 'both') && (
          <div className="space-y-4 p-4 rounded-lg bg-blue-50 border border-blue-100">
            <div className="flex items-center gap-2 text-blue-700 font-medium">
              <i className='bx bx-bulb'></i> Simplified Home Visit Settings (No Staff Required)
            </div>
            
            {/* Daily Home Visit Quota */}
            <div className="space-y-2">
              <Label htmlFor="daily-hv-quota" className="text-txt-primary font-semibold flex items-center gap-2">
                <i className='bx bx-calendar-check text-primary'></i> Daily Home Visit Quota
              </Label>
              <Input
                id="daily-hv-quota"
                type="number"
                min="1"
                max="20"
                value={config.dailyHomeVisitQuota || 3}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    dailyHomeVisitQuota: parseInt(e.target.value) || 3,
                  })
                }
                className="bg-white border-gray-200 focus:border-primary"
              />
              <p className="text-xs text-txt-muted">
                Maximum home visit bookings allowed per day (without staff assignment)
              </p>
            </div>

            {/* Time Slots */}
            <div className="space-y-2">
              <Label className="text-txt-primary font-semibold flex items-center gap-2">
                <i className='bx bx-time text-primary'></i> Available Time Slots
              </Label>
              <Input
                placeholder="09:00, 13:00, 16:00"
                value={(config.homeVisitTimeSlots || []).join(', ')}
                onChange={(e) => {
                  const slots = e.target.value
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => /^\d{2}:\d{2}$/.test(s));
                  setConfig({
                    ...config,
                    homeVisitTimeSlots: slots.length > 0 ? slots : ['09:00', '13:00', '16:00'],
                  });
                }}
                className="bg-white border-gray-200 focus:border-primary"
              />
              <p className="text-xs text-txt-muted">
                Fixed time slots for home visit (comma separated, e.g., 09:00, 13:00, 16:00)
              </p>
            </div>
          </div>
        )}

        {/* Requires Staff Assignment */}
        <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-4">
          <div className="space-y-1">
            <Label className="text-base font-medium text-txt-primary flex items-center gap-2">
              <i className='bx bx-user-check text-primary'></i> Requires Staff Assignment
            </Label>
            <p className="text-xs text-txt-secondary">
              Enable this for advanced scheduling with staff availability
            </p>
          </div>
          <Switch
            checked={config.requiresStaffAssignment}
            onCheckedChange={(checked) =>
              setConfig({ ...config, requiresStaffAssignment: checked })
            }
            className="data-[state=checked]:bg-primary"
          />
        </div>
        
        {config.requiresStaffAssignment && (
          <Alert className="bg-amber-50 border-amber-200 text-amber-800">
            <i className='bx bx-info-circle text-xl mr-2'></i>
            <AlertDescription>
              Staff assignment enabled - This uses advanced scheduling with staff availability, travel buffers, and staff quotas.
              Disable this for simpler quota-based home visits.
            </AlertDescription>
          </Alert>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary hover:bg-primary-dark text-white shadow-md shadow-primary/20"
          size="lg"
        >
          {saving ? (
            <>
              <i className='bx bx-loader-alt animate-spin mr-2'></i> Saving...
            </>
          ) : (
            <>
              <i className='bx bx-save mr-2'></i> Save Configuration
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
