'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface HomeVisitConfig {
  enabled: boolean;
  dailyQuota: number;
  timeSlots: string[];
  requireAddress: boolean;
  calculateTravelSurcharge: boolean;
}

interface HomeVisitSettingsProps {
  tenantId: string;
}

const DEFAULT_TIME_SLOTS = ['09:00', '13:00', '16:00'];

export default function HomeVisitSettings({ tenantId }: HomeVisitSettingsProps) {
  const [config, setConfig] = useState<HomeVisitConfig>({
    enabled: true,
    dailyQuota: 3,
    timeSlots: DEFAULT_TIME_SLOTS,
    requireAddress: true,
    calculateTravelSurcharge: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newSlot, setNewSlot] = useState('');

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/settings/home-visit?tenantId=${tenantId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.config) {
            setConfig(data.config);
          }
        }
      } catch (err) {
        console.error('Error fetching home visit settings:', err);
      } finally {
        setLoading(false);
      }
    };

    if (tenantId) {
      fetchSettings();
    }
  }, [tenantId]);

  const handleAddSlot = () => {
    if (!newSlot || !/^\d{2}:\d{2}$/.test(newSlot)) {
      setError('Please enter a valid time (HH:MM format)');
      return;
    }
    if (config.timeSlots.includes(newSlot)) {
      setError('This time slot already exists');
      return;
    }
    setConfig(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, newSlot].sort()
    }));
    setNewSlot('');
    setError(null);
  };

  const handleRemoveSlot = (slot: string) => {
    setConfig(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter(s => s !== slot)
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (config.dailyQuota < 1) {
        setError('Daily quota must be at least 1');
        return;
      }

      if (config.timeSlots.length === 0) {
        setError('At least one time slot is required');
        return;
      }

      const response = await fetch('/api/settings/home-visit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          config,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save settings');
      }

      setSuccess('Home visit settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center">
            <i className='bx bx-home-heart text-primary text-xl'></i>
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-txt-primary">
              Home Visit Settings
            </CardTitle>
            <CardDescription className="text-txt-secondary">
              Configure global home visit booking options
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <i className='bx bx-error-circle text-danger mr-2'></i>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200 text-success">
            <i className='bx bx-check-circle mr-2'></i>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Enable Home Visit */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100">
          <div className="space-y-1">
            <Label className="text-base font-medium text-txt-primary flex items-center gap-2">
              <i className='bx bx-power-off text-primary'></i> Enable Home Visit
            </Label>
            <p className="text-xs text-txt-secondary">
              Allow customers to book home visit services
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
            className="data-[state=checked]:bg-primary"
          />
        </div>

        {config.enabled && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
            {/* Daily Quota */}
            <div className="space-y-2">
              <Label htmlFor="daily-quota" className="text-txt-primary font-semibold flex items-center gap-2">
                <i className='bx bx-calendar-check text-primary'></i> Daily Home Visit Quota
              </Label>
              <Input
                id="daily-quota"
                type="number"
                min="1"
                max="20"
                value={config.dailyQuota}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  dailyQuota: parseInt(e.target.value) || 1
                }))}
                className="bg-gray-50 border-transparent focus:bg-white focus:border-primary max-w-[200px]"
              />
              <p className="text-xs text-txt-muted">
                Maximum home visit bookings allowed per day
              </p>
            </div>

            {/* Time Slots */}
            <div className="space-y-3">
              <Label className="text-txt-primary font-semibold flex items-center gap-2">
                <i className='bx bx-time text-primary'></i> Available Time Slots
              </Label>
              
              <div className="flex flex-wrap gap-2">
                {config.timeSlots.map((slot) => (
                  <Badge
                    key={slot}
                    variant="secondary"
                    className="bg-primary-light text-primary px-3 py-1.5 text-sm font-medium"
                  >
                    {slot}
                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(slot)}
                      className="ml-2 hover:text-danger transition-colors"
                    >
                      <i className='bx bx-x'></i>
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  type="time"
                  value={newSlot}
                  onChange={(e) => setNewSlot(e.target.value)}
                  className="bg-gray-50 border-transparent focus:bg-white focus:border-primary max-w-[150px]"
                  placeholder="HH:MM"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSlot}
                  className="border-primary text-primary hover:bg-primary-light"
                >
                  <i className='bx bx-plus mr-1'></i> Add Slot
                </Button>
              </div>
              <p className="text-xs text-txt-muted">
                Fixed time slots when home visit bookings can be made
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium text-txt-primary">
                    Require Address
                  </Label>
                  <p className="text-xs text-txt-muted">
                    Customer must provide address for home visit
                  </p>
                </div>
                <Switch
                  checked={config.requireAddress}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, requireAddress: checked }))}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium text-txt-primary">
                    Calculate Travel Surcharge
                  </Label>
                  <p className="text-xs text-txt-muted">
                    Auto-calculate travel surcharge based on distance
                  </p>
                </div>
                <Switch
                  checked={config.calculateTravelSurcharge}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, calculateTravelSurcharge: checked }))}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary hover:bg-primary-dark text-white"
          size="lg"
        >
          {saving ? (
            <>
              <i className='bx bx-loader-alt animate-spin mr-2'></i> Saving...
            </>
          ) : (
            <>
              <i className='bx bx-save mr-2'></i> Save Home Visit Settings
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
