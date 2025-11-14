'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Service } from '@/types/booking';

interface ServiceHours {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  hourlyQuota: number;
}

interface OperatingHoursSettingsProps {
  tenantId: string;
}

export default function OperatingHoursSettings({ tenantId }: OperatingHoursSettingsProps) {
  const [services, setServices] = useState<ServiceHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

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
    field: keyof Omit<ServiceHours, 'id' | 'name'>,
    value: string | number
  ) => {
    setServices(services.map(s => 
      s.id === serviceId 
        ? { ...s, [field]: value }
        : s
    ));
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setError(null);

      // Save all services in parallel
      const savePromises = services.map(service =>
        fetch(`/api/services/${service.id}`, {
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
        })
      );

      const results = await Promise.all(savePromises);
      
      // Check if all requests were successful
      if (results.some(r => !r.ok)) {
        throw new Error('Failed to save some operating hours');
      }

      setSuccess('All operating hours updated successfully');
      setHasChanges(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Operating Hours & Booking Slots
        </CardTitle>
        <CardDescription>
          Configure business hours, time slot duration, and hourly booking limits for all services
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {/* Services Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold">Service Name</th>
                <th className="text-left py-3 px-4 font-semibold">Start Time</th>
                <th className="text-left py-3 px-4 font-semibold">End Time</th>
                <th className="text-left py-3 px-4 font-semibold">Slot Duration</th>
                <th className="text-left py-3 px-4 font-semibold">Hourly Quota</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service, idx) => (
                <tr key={service.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-3 px-4 font-medium">{service.name}</td>
                  <td className="py-3 px-4">
                    <Input
                      type="time"
                      value={service.startTime}
                      onChange={(e) => updateServiceField(service.id, 'startTime', e.target.value)}
                      disabled={saving}
                      className="max-w-[120px]"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <Input
                      type="time"
                      value={service.endTime}
                      onChange={(e) => updateServiceField(service.id, 'endTime', e.target.value)}
                      disabled={saving}
                      className="max-w-[120px]"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={service.slotDurationMinutes}
                      onChange={(e) => updateServiceField(service.id, 'slotDurationMinutes', parseInt(e.target.value))}
                      disabled={saving}
                      className="px-2 py-1 border border-gray-300 rounded text-sm max-w-[120px]"
                    >
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                      <option value={60}>60 min</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <Input
                      type="number"
                      min="1"
                      value={service.hourlyQuota}
                      onChange={(e) => updateServiceField(service.id, 'hourlyQuota', parseInt(e.target.value) || 1)}
                      disabled={saving}
                      className="max-w-[100px]"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Save Button */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleSaveAll}
            disabled={saving || !hasChanges}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving All...
              </>
            ) : (
              'Save All Changes'
            )}
          </Button>
          {hasChanges && (
            <span className="text-sm text-orange-600 flex items-center">
              ⚠️ You have unsaved changes
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
