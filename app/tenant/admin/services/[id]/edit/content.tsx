'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, AlertCircle, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Service } from '@/types/booking';
import { HomeVisitConfig } from '@/components/services/home-visit-config';
import { StaffAssignment } from '@/components/services/staff-assignment';

interface ServiceEditContentProps {
  serviceId: string;
}

export function ServiceEditContent({ serviceId }: ServiceEditContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain');
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch service data
  useEffect(() => {
    if (!serviceId || !subdomain) return;

    const fetchService = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/services/${serviceId}`, {
          headers: {
            'x-tenant-id': subdomain
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch service');
        }

        const data = await response.json();
        setService(data.service || data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch service');
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [serviceId, subdomain]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!service || !serviceId || !subdomain) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(false);

      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': subdomain
        },
        body: JSON.stringify({
          name: service.name,
          description: service.description,
          duration: service.duration,
          price: service.price,
          category: service.category,
          isActive: service.isActive,
          homeVisitAvailable: service.homeVisitAvailable,
          homeVisitSurcharge: service.homeVisitSurcharge || 0
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Show detailed validation errors if available
        let errorMessage = errorData.error || 'Failed to update service';
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
      setError(err instanceof Error ? err.message : 'Failed to update service');
    } finally {
      setSubmitting(false);
    }
  };

  if (!serviceId || !subdomain) {
    return null;
  }

  if (loading) {
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
          <h1 className="text-3xl font-bold text-gray-900">Edit Service</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-gray-600">Loading service details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!service) {
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
          <h1 className="text-3xl font-bold text-gray-900">Edit Service</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Service not found</AlertDescription>
        </Alert>
      </div>
    );
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
        <h1 className="text-3xl font-bold text-gray-900">Edit Service</h1>
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
            Service updated successfully. Redirecting...
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
              <Label htmlFor="name">Service Name</Label>
              <Input
                id="name"
                value={service.name}
                onChange={(e) =>
                  setService({ ...service, name: e.target.value })
                }
                disabled={submitting}
                className="mt-1"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={service.description || ''}
                onChange={(e) =>
                  setService({ ...service, description: e.target.value })
                }
                disabled={submitting}
                className="mt-1"
                rows={4}
              />
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={service.category || ''}
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
                <Label htmlFor="duration">Duration (minutes)</Label>
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
                <Label htmlFor="price">Price (IDR)</Label>
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

            {/* Status Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#232333] rounded-lg border border-gray-200 dark:border-[#4e4f6c]">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  service.isActive 
                    ? 'bg-[#e8fadf] dark:bg-[#36483f] text-success' 
                    : 'bg-gray-200 dark:bg-[#4e4f6c] text-txt-muted dark:text-[#7e7f96]'
                }`}>
                  <i className={`bx ${service.isActive ? 'bx-check-circle' : 'bx-x-circle'} text-xl`}></i>
                </div>
                <div>
                  <p className="font-medium text-txt-primary dark:text-[#d5d5e2]">Status Layanan</p>
                  <p className="text-xs text-txt-muted dark:text-[#7e7f96]">
                    {service.isActive ? 'Layanan aktif dan dapat dipesan' : 'Layanan nonaktif'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={service.isActive || false}
                  onChange={(e) => setService({ ...service, isActive: e.target.checked })}
                  disabled={submitting}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-[#4e4f6c] peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:bg-success transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-200 peer-checked:after:translate-x-5"></div>
              </label>
            </div>

            {/* Home Visit Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#232333] rounded-lg border border-gray-200 dark:border-[#4e4f6c]">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  service.homeVisitAvailable 
                    ? 'bg-primary-light dark:bg-[#35365f] text-primary dark:text-[#a5a7ff]' 
                    : 'bg-gray-200 dark:bg-[#4e4f6c] text-txt-muted dark:text-[#7e7f96]'
                }`}>
                  <i className={`bx bx-home-heart text-xl`}></i>
                </div>
                <div>
                  <p className="font-medium text-txt-primary dark:text-[#d5d5e2]">Home Visit</p>
                  <p className="text-xs text-txt-muted dark:text-[#7e7f96]">
                    Layanan dapat dilakukan di lokasi pelanggan
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={service.homeVisitAvailable || false}
                  onChange={(e) => setService({ ...service, homeVisitAvailable: e.target.checked })}
                  disabled={submitting}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-[#4e4f6c] peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:bg-primary transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-200 peer-checked:after:translate-x-5"></div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-4 border-t pt-6">
              <Button
                type="submit"
                disabled={submitting || success}
                className="gap-2"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
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

      {/* Home Visit Configuration Section */}
      {service && (
        <>
          <HomeVisitConfig
            serviceId={serviceId}
            tenantId={subdomain || ''}
          />

          {/* Staff Assignment Section */}
          <StaffAssignment
            serviceId={serviceId}
            tenantId={subdomain || ''}
          />
        </>
      )}
    </div>
  );
}
