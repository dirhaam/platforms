'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ServiceArea, CreateServiceAreaRequest, UpdateServiceAreaRequest, ServiceAreaBoundary } from '@/types/location';
import { Service } from '@/types/booking';
import { toast } from 'sonner';

interface ServiceAreaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  serviceArea?: ServiceArea | null;
  onSave: () => void;
}

export function ServiceAreaDialog({ 
  open, 
  onOpenChange, 
  tenantId, 
  serviceArea, 
  onSave 
}: ServiceAreaDialogProps) {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    boundaryType: 'circle' as 'circle' | 'polygon',
    centerLat: '',
    centerLng: '',
    radius: '',
    baseTravelSurcharge: '',
    perKmSurcharge: '',
    maxTravelDistance: '',
    estimatedTravelTime: '',
    availableServices: [] as string[],
    isActive: true
  });

  useEffect(() => {
    if (open) {
      fetchServices();
      if (serviceArea) {
        // Populate form with existing data
        setFormData({
          name: serviceArea.name,
          description: serviceArea.description || '',
          boundaryType: serviceArea.boundaries.type,
          centerLat: serviceArea.boundaries.center?.lat.toString() || '',
          centerLng: serviceArea.boundaries.center?.lng.toString() || '',
          radius: serviceArea.boundaries.radius?.toString() || '',
          baseTravelSurcharge: serviceArea.baseTravelSurcharge.toString(),
          perKmSurcharge: serviceArea.perKmSurcharge?.toString() || '',
          maxTravelDistance: serviceArea.maxTravelDistance.toString(),
          estimatedTravelTime: serviceArea.estimatedTravelTime.toString(),
          availableServices: serviceArea.availableServices,
          isActive: serviceArea.isActive
        });
      } else {
        // Reset form for new service area
        setFormData({
          name: '',
          description: '',
          boundaryType: 'circle',
          centerLat: '',
          centerLng: '',
          radius: '',
          baseTravelSurcharge: '',
          perKmSurcharge: '',
          maxTravelDistance: '',
          estimatedTravelTime: '',
          availableServices: [],
          isActive: true
        });
      }
    }
  }, [open, serviceArea]);

  const fetchServices = async () => {
    try {
      const response = await fetch(`/api/services?tenantId=${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        setServices(data.services.filter((s: Service) => s.homeVisitAvailable));
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.baseTravelSurcharge || !formData.maxTravelDistance || !formData.estimatedTravelTime) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (formData.boundaryType === 'circle' && (!formData.centerLat || !formData.centerLng || !formData.radius)) {
        toast.error('Please provide center coordinates and radius for circular area');
        return;
      }

      // Prepare boundaries
      const boundaries: ServiceAreaBoundary = {
        type: formData.boundaryType
      };

      if (formData.boundaryType === 'circle') {
        boundaries.center = {
          lat: parseFloat(formData.centerLat),
          lng: parseFloat(formData.centerLng)
        };
        boundaries.radius = parseFloat(formData.radius);
      }

      const requestData = {
        name: formData.name,
        description: formData.description || undefined,
        boundaries,
        baseTravelSurcharge: parseFloat(formData.baseTravelSurcharge),
        perKmSurcharge: formData.perKmSurcharge ? parseFloat(formData.perKmSurcharge) : undefined,
        maxTravelDistance: parseFloat(formData.maxTravelDistance),
        estimatedTravelTime: parseInt(formData.estimatedTravelTime),
        availableServices: formData.availableServices,
        ...(serviceArea && { isActive: formData.isActive })
      };

      const url = serviceArea 
        ? `/api/service-areas/${serviceArea.id}?tenantId=${tenantId}`
        : `/api/service-areas?tenantId=${tenantId}`;
      
      const method = serviceArea ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        toast.success(serviceArea ? 'Service area updated successfully' : 'Service area created successfully');
        onSave();
        onOpenChange(false);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to save service area');
      }
    } catch (error) {
      console.error('Error saving service area:', error);
      toast.error('Failed to save service area');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      availableServices: checked
        ? [...prev.availableServices, serviceId]
        : prev.availableServices.filter(id => id !== serviceId)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {serviceArea ? 'Edit Service Area' : 'Create Service Area'}
          </DialogTitle>
          <DialogDescription>
            Define a coverage area for home visit services with location-based pricing
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Central Jakarta"
                  required
                />
              </div>
              
              {serviceArea && (
                <div className="space-y-2">
                  <Label htmlFor="isActive">Status</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label htmlFor="isActive">
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </Label>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description of the service area"
                rows={2}
              />
            </div>
          </div>

          {/* Geographic Boundaries */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Geographic Boundaries</h3>
            
            <div className="space-y-2">
              <Label htmlFor="boundaryType">Boundary Type</Label>
              <Select
                value={formData.boundaryType}
                onValueChange={(value: 'circle' | 'polygon') => 
                  setFormData(prev => ({ ...prev, boundaryType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="circle">Circular Area</SelectItem>
                  <SelectItem value="polygon" disabled>Custom Polygon (Coming Soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.boundaryType === 'circle' && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="centerLat">Center Latitude *</Label>
                  <Input
                    id="centerLat"
                    type="number"
                    step="any"
                    value={formData.centerLat}
                    onChange={(e) => setFormData(prev => ({ ...prev, centerLat: e.target.value }))}
                    placeholder="-6.2088"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="centerLng">Center Longitude *</Label>
                  <Input
                    id="centerLng"
                    type="number"
                    step="any"
                    value={formData.centerLng}
                    onChange={(e) => setFormData(prev => ({ ...prev, centerLng: e.target.value }))}
                    placeholder="106.8456"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="radius">Radius (km) *</Label>
                  <Input
                    id="radius"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.radius}
                    onChange={(e) => setFormData(prev => ({ ...prev, radius: e.target.value }))}
                    placeholder="5.0"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          {/* Pricing and Logistics */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Pricing and Logistics</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="baseTravelSurcharge">Base Travel Surcharge (IDR) *</Label>
                <Input
                  id="baseTravelSurcharge"
                  type="number"
                  min="0"
                  value={formData.baseTravelSurcharge}
                  onChange={(e) => setFormData(prev => ({ ...prev, baseTravelSurcharge: e.target.value }))}
                  placeholder="10000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="perKmSurcharge">Per KM Surcharge (IDR)</Label>
                <Input
                  id="perKmSurcharge"
                  type="number"
                  min="0"
                  value={formData.perKmSurcharge}
                  onChange={(e) => setFormData(prev => ({ ...prev, perKmSurcharge: e.target.value }))}
                  placeholder="5000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxTravelDistance">Max Travel Distance (km) *</Label>
                <Input
                  id="maxTravelDistance"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.maxTravelDistance}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxTravelDistance: e.target.value }))}
                  placeholder="15.0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedTravelTime">Est. Travel Time (min) *</Label>
                <Input
                  id="estimatedTravelTime"
                  type="number"
                  min="1"
                  value={formData.estimatedTravelTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedTravelTime: e.target.value }))}
                  placeholder="30"
                  required
                />
              </div>
            </div>
          </div>

          {/* Available Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Available Services</h3>
            <p className="text-sm text-muted-foreground">
              Select which services are available in this area. Only services with home visit enabled are shown.
            </p>
            
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No home visit services found. Create services with home visit enabled first.
              </p>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`service-${service.id}`}
                      checked={formData.availableServices.includes(service.id)}
                      onChange={(e) => handleServiceToggle(service.id, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={`service-${service.id}`} className="text-sm">
                      {service.name} - {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0
                      }).format(Number(service.price))}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (serviceArea ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}