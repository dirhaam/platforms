'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, AlertCircle, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { TimePicker } from '@/components/ui/time-picker';

interface NewService {
  name: string;
  description: string;
  category: string;
  duration: number;
  price: number;
  isActive: boolean;
  homeVisitAvailable: boolean;
  homeVisitSurcharge: number;
  operatingHours?: {
    startTime: string;
    endTime: string;
  } | null;
  slotDurationMinutes: number;
  hourlyQuota: number;
}

const DEFAULT_SERVICE: NewService = {
  name: '',
  description: '',
  category: '',
  duration: 60,
  price: 0,
  isActive: true,
  homeVisitAvailable: false,
  homeVisitSurcharge: 0,
  operatingHours: {
    startTime: '08:00',
    endTime: '17:00'
  },
  slotDurationMinutes: 30,
  hourlyQuota: 10
};

export function ServiceCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain');
  const [service, setService] = useState<NewService>(DEFAULT_SERVICE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!subdomain) return;

    // Validate required fields
    if (!service.name.trim()) {
      setError('Service name is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(false);

      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': subdomain
        },
        body: JSON.stringify({
          ...service,
          homeVisitSurcharge: service.homeVisitSurcharge || 0,
          operatingHours: service.operatingHours,
          slotDurationMinutes: service.slotDurationMinutes || 30,
          hourlyQuota: service.hourlyQuota || 10
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Show detailed validation errors if available
        let errorMessage = errorData.error || 'Failed to create service';
        if (errorData.details && Array.isArray(errorData.details)) {
          errorMessage = errorData.details.map((d: any) => d.message).join(', ');
        }
        
        throw new Error(errorMessage);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/tenant/admin/services?subdomain=${subdomain}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create service');
    } finally {
      setSubmitting(false);
    }
  };

  if (!subdomain) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Create Service</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Service created successfully. Redirecting...
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Service Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                value={service.name}
                onChange={(e) =>
                  setService({ ...service, name: e.target.value })
                }
                disabled={submitting}
                className="mt-1"
                placeholder="e.g., Haircut, Massage, Facial"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={service.description}
                onChange={(e) =>
                  setService({ ...service, description: e.target.value })
                }
                disabled={submitting}
                className="mt-1"
                rows={4}
                placeholder="Describe your service..."
              />
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={service.category}
                onChange={(e) =>
                  setService({ ...service, category: e.target.value })
                }
                disabled={submitting}
                className="mt-1"
                placeholder="e.g., hair, massage, skincare"
              />
            </div>

            {/* Duration & Price Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={service.duration}
                  onChange={(e) =>
                    setService({
                      ...service,
                      duration: parseInt(e.target.value) || 0
                    })
                  }
                  disabled={submitting}
                  className="mt-1"
                  min="5"
                  step="5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="price">Price (IDR) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={service.price}
                  onChange={(e) =>
                    setService({ ...service, price: parseInt(e.target.value) || 0 })
                  }
                  disabled={submitting}
                  className="mt-1"
                  min="0"
                  step="100"
                  required
                />
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={service.isActive}
                onCheckedChange={(checked) =>
                  setService({
                    ...service,
                    isActive: checked as boolean
                  })
                }
                disabled={submitting}
              />
              <Label htmlFor="isActive" className="font-normal cursor-pointer">
                Service is Active
              </Label>
            </div>

            {/* Operating Hours & Quota */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-gray-900">Booking Availability</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <TimePicker
                    value={service.operatingHours?.startTime || '08:00'}
                    onChange={(value) =>
                      setService({
                        ...service,
                        operatingHours: {
                          ...service.operatingHours || { startTime: '08:00', endTime: '17:00' },
                          startTime: value
                        }
                      })
                    }
                    disabled={submitting}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <TimePicker
                    value={service.operatingHours?.endTime || '17:00'}
                    onChange={(value) =>
                      setService({
                        ...service,
                        operatingHours: {
                          ...service.operatingHours || { startTime: '08:00', endTime: '17:00' },
                          endTime: value
                        }
                      })
                    }
                    disabled={submitting}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="slotDuration">Time Slot Duration (min)</Label>
                  <Input
                    id="slotDuration"
                    type="number"
                    value={service.slotDurationMinutes}
                    onChange={(e) =>
                      setService({
                        ...service,
                        slotDurationMinutes: parseInt(e.target.value) || 30
                      })
                    }
                    disabled={submitting}
                    className="mt-1"
                    min="15"
                    step="15"
                  />
                  <p className="text-xs text-gray-500 mt-1">Available time slot increment (15, 30, 60 min)</p>
                </div>
                <div>
                  <Label htmlFor="hourlyQuota">Hourly Quota (max bookings/hour)</Label>
                  <Input
                    id="hourlyQuota"
                    type="number"
                    value={service.hourlyQuota}
                    onChange={(e) =>
                      setService({
                        ...service,
                        hourlyQuota: parseInt(e.target.value) || 10
                      })
                    }
                    disabled={submitting}
                    className="mt-1"
                    min="1"
                    step="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max concurrent bookings per hour</p>
                </div>
              </div>
            </div>

            {/* Home Visit Options */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="homeVisitAvailable"
                  checked={service.homeVisitAvailable}
                  onCheckedChange={(checked) =>
                    setService({
                      ...service,
                      homeVisitAvailable: checked as boolean
                    })
                  }
                  disabled={submitting}
                />
                <Label
                  htmlFor="homeVisitAvailable"
                  className="font-normal cursor-pointer"
                >
                  Available for home visits
                </Label>
              </div>

              {service.homeVisitAvailable && (
                <div>
                  <Label htmlFor="homeVisitSurcharge">
                    Home Visit Surcharge (IDR)
                  </Label>
                  <Input
                    id="homeVisitSurcharge"
                    type="number"
                    value={service.homeVisitSurcharge}
                    onChange={(e) =>
                      setService({
                        ...service,
                        homeVisitSurcharge: parseInt(e.target.value) || 0
                      })
                    }
                    disabled={submitting}
                    className="mt-1"
                    min="0"
                    step="100"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4 border-t pt-6">
              <Button
                type="submit"
                disabled={submitting || success}
                className="gap-2"
              >
                {submitting ? 'Creating...' : 'Create Service'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
