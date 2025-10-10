'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { ServiceArea } from '@/types/location';
import { ServiceAreaDialog } from './ServiceAreaDialog';
import { toast } from 'sonner';

interface ServiceAreaManagementProps {
  tenantId: string;
}

export function ServiceAreaManagement({ tenantId }: ServiceAreaManagementProps) {
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<ServiceArea | null>(null);

  useEffect(() => {
    fetchServiceAreas();
  }, [tenantId]);

  const fetchServiceAreas = async () => {
    try {
      const response = await fetch(`/api/service-areas?tenantId=${tenantId}&includeInactive=true`);
      if (response.ok) {
        const data = await response.json();
        setServiceAreas(data.serviceAreas);
      } else {
        toast.error('Failed to fetch service areas');
      }
    } catch (error) {
      console.error('Error fetching service areas:', error);
      toast.error('Failed to fetch service areas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingArea(null);
    setDialogOpen(true);
  };

  const handleEdit = (area: ServiceArea) => {
    setEditingArea(area);
    setDialogOpen(true);
  };

  const handleDelete = async (areaId: string) => {
    if (!confirm('Are you sure you want to delete this service area?')) {
      return;
    }

    try {
      const response = await fetch(`/api/service-areas/${areaId}?tenantId=${tenantId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Service area deleted successfully');
        fetchServiceAreas();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete service area');
      }
    } catch (error) {
      console.error('Error deleting service area:', error);
      toast.error('Failed to delete service area');
    }
  };

  const handleSave = () => {
    setDialogOpen(false);
    fetchServiceAreas();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Service Areas</h2>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add Service Area
          </Button>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Service Areas</h2>
          <p className="text-muted-foreground">
            Define coverage areas for home visit services
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service Area
        </Button>
      </div>

      {serviceAreas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No service areas defined</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create service areas to enable home visit bookings with location-based pricing
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Service Area
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {serviceAreas.map((area) => (
            <Card key={area.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {area.name}
                      <Badge variant={area.isActive ? 'default' : 'secondary'}>
                        {area.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </CardTitle>
                    {area.description && (
                      <CardDescription>{area.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(area)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(area.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Base Surcharge</p>
                    <p>{formatCurrency(Number(area.baseTravelSurcharge))}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Per KM</p>
                    <p>
                      {area.perKmSurcharge 
                        ? formatCurrency(Number(area.perKmSurcharge))
                        : 'Not set'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Max Distance</p>
                    <p>{area.maxTravelDistance} km</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Est. Travel Time</p>
                    <p>{area.estimatedTravelTime} min</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="font-medium text-muted-foreground mb-2">Coverage Type</p>
                  <Badge variant="outline">
                    {area.boundaries.type === 'circle' ? 'Circular Area' : 'Custom Polygon'}
                  </Badge>
                  {area.boundaries.type === 'circle' && area.boundaries.radius && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      {area.boundaries.radius} km radius
                    </span>
                  )}
                </div>

                {area.availableServices.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium text-muted-foreground mb-2">Available Services</p>
                    <p className="text-sm">{area.availableServices.length} services configured</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ServiceAreaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tenantId={tenantId}
        serviceArea={editingArea}
        onSave={handleSave}
      />
    </div>
  );
}