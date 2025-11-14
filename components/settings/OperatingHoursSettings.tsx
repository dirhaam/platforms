'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertCircle, CheckCircle, Loader2, Zap, Clock3 } from 'lucide-react';
import { Service } from '@/types/booking';

interface ServiceConfig {
  id: string;
  name: string;
  slotDurationMinutes: number;
  hourlyQuota: number;
}

interface BusinessHours {
  [day: string]: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
}

interface OperatingHoursSettingsProps {
  tenantId: string;
}

export default function OperatingHoursSettings({ tenantId }: OperatingHoursSettingsProps) {
  const [services, setServices] = useState<ServiceConfig[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(null);
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

  // Fetch services and business hours
  useEffect(() => {
    if (!subdomain) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch services
        const servicesResponse = await fetch('/api/services', {
          headers: { 'x-tenant-id': subdomain }
        });

        if (!servicesResponse.ok) throw new Error('Failed to fetch services');

        const servicesData = await servicesResponse.json();
        const servicesList = (servicesData.services || []).map((service: Service) => ({
          id: service.id,
          name: service.name,
          slotDurationMinutes: service.slotDurationMinutes || 30,
          hourlyQuota: service.hourlyQuota || 10,
        }));
        setServices(servicesList);

        // Fetch business hours
        const hoursResponse = await fetch(`/api/settings/business-hours?tenantId=${tenantId}`);
        if (hoursResponse.ok) {
          const hoursData = await hoursResponse.json();
          setBusinessHours(hoursData.schedule);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [subdomain, tenantId]);

  const updateServiceField = (serviceId: string, field: string, value: any) => {
    setServices(services.map(s =>
      s.id === serviceId ? { ...s, [field]: value } : s
    ));
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setError(null);

      const savePromises = services.map(service =>
        fetch(`/api/services/${service.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': subdomain!
          },
          body: JSON.stringify({
            slotDurationMinutes: service.slotDurationMinutes,
            hourlyQuota: service.hourlyQuota
          })
        })
      );

      const results = await Promise.all(savePromises);

      if (results.some(r => !r.ok)) {
        throw new Error('Failed to save some services');
      }

      setSuccess('All service configurations updated successfully!');
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
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
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
            Service Time Slots
          </CardTitle>
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
          Service Time Slots & Quotas
        </CardTitle>
        <CardDescription>
          Configure time slot duration and hourly booking limits for each service
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

        {/* Global Business Hours Reference */}
        {businessHours && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 mb-2">Global Business Hours</p>
            <p className="text-xs text-blue-800">
              All services operate within these global hours. Manage global hours in the Business Hours Settings.
            </p>
          </div>
        )}

        {/* Services Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold">Service Name</th>
                <th className="text-left py-3 px-4 font-semibold">Slot Duration</th>
                <th className="text-left py-3 px-4 font-semibold">Hourly Quota</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service, idx) => (
                <tr key={service.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-3 px-4 font-medium">{service.name}</td>
                  <td className="py-3 px-4">
                    <select
                      value={service.slotDurationMinutes}
                      onChange={(e) => updateServiceField(service.id, 'slotDurationMinutes', parseInt(e.target.value))}
                      disabled={saving}
                      className="h-9 max-w-[120px] px-3 py-1 bg-white border border-gray-200 rounded-md text-sm !ring-0 !ring-offset-0 focus:!ring-0 focus:!ring-offset-0 outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
                      className="max-w-[100px] h-9 !ring-0 !ring-offset-0 focus-visible:!ring-0 focus-visible:!ring-offset-0"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Info Box */}
        <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-900">
          <strong>Example:</strong> If slot duration is 30 min and quota is 3, customers can book 3 slots of 30 minutes each hour (total 1.5 hours capacity per hour).
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
