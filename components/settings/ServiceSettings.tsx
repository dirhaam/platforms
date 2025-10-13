'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import type { Service } from '@/types/database';

interface ServiceSettingsProps {
  tenantId: string;
  initialServices: Service[];
}

interface ServiceFormData {
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  homeVisitAvailable: boolean;
  homeVisitSurcharge: number;
}

export default function ServiceSettings({ tenantId, initialServices }: ServiceSettingsProps) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    duration: 60,
    price: 0,
    category: '',
    homeVisitAvailable: false,
    homeVisitSurcharge: 0,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration: 60,
      price: 0,
      category: '',
      homeVisitAvailable: false,
      homeVisitSurcharge: 0,
    });
    setEditingService(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (service: Service) => {
    setFormData({
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: Number(service.price),
      category: service.category,
      homeVisitAvailable: service.homeVisitAvailable ?? false,
      homeVisitSurcharge: Number(service.homeVisitSurcharge || 0),
    });
    setEditingService(service);
    setIsDialogOpen(true);
  };

  const handleInputChange = (field: keyof ServiceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const url = editingService 
        ? `/api/services/${editingService.id}`
        : '/api/services';
      
      const method = editingService ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        if (editingService) {
          // Update existing service
          setServices(prev => 
            prev.map(service => 
              service.id === editingService.id ? result.service : service
            )
          );
          setMessage({ type: 'success', text: 'Service updated successfully!' });
        } else {
          // Add new service
          setServices(prev => [...prev, result.service]);
          setMessage({ type: 'success', text: 'Service created successfully!' });
        }
        setIsDialogOpen(false);
        resetForm();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save service' });
      }
    } catch (error) {
      console.error('Error saving service:', error);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !service.isActive }),
      });

      const result = await response.json();

      if (result.success) {
        setServices(prev => 
          prev.map(s => 
            s.id === service.id ? { ...s, isActive: !s.isActive } : s
          )
        );
      }
    } catch (error) {
      console.error('Error toggling service status:', error);
    }
  };

  const handleDelete = async (service: Service) => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setServices(prev => prev.filter(s => s.id !== service.id));
        setMessage({ type: 'success', text: 'Service deleted successfully!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete service' });
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Services</h3>
          <p className="text-sm text-gray-600">
            Manage your service offerings and pricing
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      <div className="grid gap-4">
        {services.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500 mb-4">No services added yet</p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Service
              </Button>
            </CardContent>
          </Card>
        ) : (
          services.map((service) => (
            <Card key={service.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{service.name}</h4>
                      <Badge variant={service.isActive ? 'default' : 'secondary'}>
                        {service.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {service.homeVisitAvailable && (
                        <Badge variant="outline">Home Visit</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{service.duration} minutes</span>
                      <span>Rp {Number(service.price).toLocaleString('id-ID')}</span>
                      <span>{service.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={service.isActive ?? true}
                      onCheckedChange={() => handleToggleActive(service)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(service)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(service)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Service Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingService ? 'Edit Service' : 'Add New Service'}
            </DialogTitle>
            <DialogDescription>
              {editingService 
                ? 'Update your service details and pricing'
                : 'Create a new service offering for your business'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="serviceName">Service Name *</Label>
                <Input
                  id="serviceName"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Haircut & Styling"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  placeholder="e.g., Hair Services"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your service..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                  min="15"
                  step="15"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (Rp) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                  min="0"
                  step="1000"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="homeVisit"
                  checked={formData.homeVisitAvailable}
                  onCheckedChange={(checked) => handleInputChange('homeVisitAvailable', checked)}
                />
                <Label htmlFor="homeVisit">Available for home visits</Label>
              </div>

              {formData.homeVisitAvailable && (
                <div className="space-y-2">
                  <Label htmlFor="surcharge">Home Visit Surcharge (Rp)</Label>
                  <Input
                    id="surcharge"
                    type="number"
                    value={formData.homeVisitSurcharge}
                    onChange={(e) => handleInputChange('homeVisitSurcharge', parseFloat(e.target.value))}
                    min="0"
                    step="1000"
                    placeholder="Additional charge for home visits"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingService ? 'Update Service' : 'Create Service'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}