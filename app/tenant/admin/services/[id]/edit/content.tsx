'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, AlertCircle, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Service } from '@/types/booking';

interface ServiceEditContentProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ subdomain?: string }>;
}

export function ServiceEditContent({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: ServiceEditContentProps) {
  const router = useRouter();
  const [params, setParams] = useState<{ id: string } | null>(null);
  const [searchParams, setSearchParams] = useState<{ subdomain?: string } | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Resolve params and searchParams
  useEffect(() => {
    (async () => {
      const resolvedParams = await paramsPromise;
      const resolvedSearchParams = await searchParamsPromise;
      setParams(resolvedParams);
      setSearchParams(resolvedSearchParams);
    })();
  }, [paramsPromise, searchParamsPromise]);

  // Fetch service data
  useEffect(() => {
    if (!params || !searchParams?.subdomain) return;

    const fetchService = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/services/${params.id}`, {
          headers: {
            'x-tenant-id': searchParams.subdomain!
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
  }, [params, searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!service || !params || !searchParams?.subdomain) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(false);

      const response = await fetch(`/api/services/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': searchParams.subdomain!
        },
        body: JSON.stringify({
          name: service.name,
          description: service.description,
          duration: service.duration,
          price: service.price,
          category: service.category,
          isActive: service.isActive,
          homeVisitAvailable: service.homeVisitAvailable,
          homeVisitSurcharge: service.homeVisitSurcharge
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update service');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/tenant/admin/services?subdomain=${searchParams.subdomain}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update service');
    } finally {
      setSubmitting(false);
    }
  };

  if (!params || !searchParams?.subdomain) {
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
                <Label htmlFor="price">Price (PKR)</Label>
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
                checked={service.isActive || false}
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

            {/* Home Visit Options */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="homeVisitAvailable"
                  checked={service.homeVisitAvailable || false}
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
                    Home Visit Surcharge (PKR)
                  </Label>
                  <Input
                    id="homeVisitSurcharge"
                    type="number"
                    value={service.homeVisitSurcharge || 0}
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
    </div>
  );
}
