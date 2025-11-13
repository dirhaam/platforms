'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertCircle, CheckCircle } from '@/components/ui/alert';
import { Clock, Zap, Clock3 } from 'lucide-react';
import { Service } from '@/types/booking';

interface ServiceHours {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  hourlyQuota: number;
  modified?: boolean;
}

interface OperatingHoursSettingsProps {
  tenantId: string;
}

export default function OperatingHoursSettings({ tenantId }: OperatingHoursSettingsProps) {
  const [services, setServices] = useState<ServiceHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [subdomain, setSubdomain] = useState<string | null>(null);

  // Get subdomain from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setSubdomain(params.get('subdomain'));
    }
  }, []);

  // Fetch services
  useEffect(() => {
    if (!subdomain) return;
    
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/services', {
          headers: {
            'x-tenant-id': subdomain
          }
        });

        if (!response.ok) throw new Error('Failed to fetch services');

        const data = await response.json();
        const servicesList = (data.services || []).map((service: Service) => ({
          id: service.id,
          name: service.name,
          startTime: service.operatingHours?.startTime || '08:00',
          endTime: service.operatingHours?.endTime || '17:00',
          slotDurationMinutes: service.slotDurationMinutes || 30,
          hourlyQuota: service.hourlyQuota || 10,
        }));
        setServices(servicesList);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch services');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [subdomain]);

  const updateServiceField = (
    serviceId: string,
    field: keyof Omit<ServiceHours, 'id' | 'name' | 'modified'>,
    value: string | number
  ) => {
    setServices(services.map(s => 
      s.id === serviceId 
        ? { ...s, [field]: value, modified: true }
        : s
    ));
  };

  const handleSave = async (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    try {
      setSaving(serviceId);
      setError(null);

      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': subdomain!
        },
        body: JSON.stringify({
          operatingHours: {
            startTime: service.startTime,
            endTime: service.endTime
          },
          slotDurationMinutes: parseInt(String(service.slotDurationMinutes)),
          hourlyQuota: parseInt(String(service.hourlyQuota))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save operating hours');
      }

      setServices(services.map(s =>
        s.id === serviceId
          ? { ...s, modified: false }
          : s
      ));

      setSuccess(`Operating hours for "${service.name}" updated successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setSaving(null);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (services.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Operating Hours
          </CardTitle>
          <CardDescription>
            Set service availability and booking slots
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No services found. Please create a service first.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Operating Hours & Booking Slots
          </CardTitle>
          <CardDescription>
            Configure business hours, time slot duration, and hourly booking limits for each service
          </CardDescription>
        </CardHeader>
      </Card>

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

      {/* Services Grid */}
      <div className="grid gap-4">
        {services.map((service) => (
          <Card key={service.id} className={service.modified ? 'border-blue-300 bg-blue-50' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{service.name}</CardTitle>
                {service.modified && (
                  <Badge variant="default" className="bg-blue-600">
                    Unsaved
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Operating Hours Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`start-${service.id}`} className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4" />
                    Start Time
                  </Label>
                  <Input
                    id={`start-${service.id}`}
                    type="time"
                    value={service.startTime}
                    onChange={(e) => updateServiceField(service.id, 'startTime', e.target.value)}
                    disabled={saving === service.id}
                  />
                  <p className="text-xs text-gray-500 mt-1">When business opens</p>
                </div>
                <div>
                  <Label htmlFor={`end-${service.id}`} className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4" />
                    End Time
                  </Label>
                  <Input
                    id={`end-${service.id}`}
                    type="time"
                    value={service.endTime}
                    onChange={(e) => updateServiceField(service.id, 'endTime', e.target.value)}
                    disabled={saving === service.id}
                  />
                  <p className="text-xs text-gray-500 mt-1">When business closes</p>
                </div>
              </div>

              {/* Slot Duration & Quota Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`duration-${service.id}`} className="flex items-center gap-2 mb-2">
                    <Clock3 className="w-4 h-4" />
                    Time Slot Duration
                  </Label>
                  <select
                    id={`duration-${service.id}`}
                    value={service.slotDurationMinutes}
                    onChange={(e) => updateServiceField(service.id, 'slotDurationMinutes', parseInt(e.target.value))}
                    disabled={saving === service.id}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Duration of each time slot</p>
                </div>
                <div>
                  <Label htmlFor={`quota-${service.id}`} className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4" />
                    Hourly Quota
                  </Label>
                  <Input
                    id={`quota-${service.id}`}
                    type="number"
                    min="1"
                    value={service.hourlyQuota}
                    onChange={(e) => updateServiceField(service.id, 'hourlyQuota', parseInt(e.target.value) || 1)}
                    disabled={saving === service.id}
                  />
                  <p className="text-xs text-gray-500 mt-1">Max bookings per hour</p>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
                <strong>Example:</strong> If you open at 09:00, close at 18:00, slot duration is 30min, and quota is 3:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>9:00-9:30, 9:00-9:30, 9:00-9:30 → 3 slots in first hour</li>
                  <li>Then 10:00 hour starts fresh with new quota</li>
                </ul>
              </div>

              {/* Save Button */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  onClick={() => handleSave(service.id)}
                  disabled={saving === service.id || !service.modified}
                  className="flex-1"
                >
                  {saving === service.id ? 'Saving...' : 'Save Changes'}
                </Button>
                {service.modified && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setServices(services.map(s =>
                        s.id === service.id
                          ? {
                              ...s,
                              startTime: s.startTime,
                              endTime: s.endTime,
                              slotDurationMinutes: s.slotDurationMinutes,
                              hourlyQuota: s.hourlyQuota,
                              modified: false
                            }
                          : s
                      ));
                    }}
                    disabled={saving === service.id}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
