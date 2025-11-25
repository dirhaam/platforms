'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface HomeVisitConfigData {
  serviceType: 'on_premise' | 'home_visit' | 'both';
}

interface Props {
  serviceId: string;
  tenantId: string;
  onSave?: (config: HomeVisitConfigData) => void;
}

export function HomeVisitConfig({ serviceId, tenantId, onSave }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [serviceType, setServiceType] = useState<'on_premise' | 'home_visit' | 'both'>('on_premise');

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
      setServiceType(data.serviceType || 'on_premise');
    } catch (err) {
      console.error('Error fetching home visit config:', err);
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
          body: JSON.stringify({ serviceType }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      setSuccess(true);
      onSave?.({ serviceType });
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
            <CardTitle className="text-lg font-semibold text-txt-primary">Service Location Type</CardTitle>
            <CardDescription className="text-txt-secondary">
              Choose where this service can be performed
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
            <AlertDescription>Configuration saved successfully</AlertDescription>
          </Alert>
        )}

        {/* Service Type */}
        <div className="space-y-2">
          <Label htmlFor="service-type" className="text-txt-primary font-semibold flex items-center gap-2">
            <i className='bx bx-category text-primary'></i> Service Type
          </Label>
          <Select
            value={serviceType}
            onValueChange={(value: any) => setServiceType(value)}
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
                  <i className='bx bx-home'></i> Home Visit Only
                </div>
              </SelectItem>
              <SelectItem value="both">
                <div className="flex items-center gap-2">
                  <i className='bx bx-buildings'></i> Both (On Premise & Home Visit)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Info about global settings */}
        {(serviceType === 'home_visit' || serviceType === 'both') && (
          <Alert className="bg-blue-50 border-blue-200 text-blue-800">
            <i className='bx bx-info-circle text-xl mr-2'></i>
            <AlertDescription>
              <strong>Home visit settings</strong> (quota per hari, time slots) diatur di{' '}
              <strong>Settings → Calendar → Home Visit Settings</strong>
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
              <i className='bx bx-save mr-2'></i> Save
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
