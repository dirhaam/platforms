'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { EnhancedTenant, BusinessCategory } from '@/lib/subdomain-constants';
import { BUSINESS_CATEGORIES } from '@/lib/subdomain-constants';

interface TenantEditDialogProps {
  tenant: EnhancedTenant;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<EnhancedTenant>) => Promise<void>;
}

export function TenantEditDialog({ tenant, isOpen, onClose, onSave }: TenantEditDialogProps) {
  const [formData, setFormData] = useState({
    businessName: tenant.businessName,
    ownerName: tenant.ownerName,
    email: tenant.email,
    phone: tenant.phone,
    businessCategory: tenant.businessCategory,
    businessDescription: tenant.businessDescription || '',
    address: tenant.address || '',
    emoji: tenant.emoji,
    subscriptionPlan: tenant.subscriptionPlan,
    subscriptionStatus: tenant.subscriptionStatus,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSave({
        businessName: formData.businessName,
        ownerName: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
        businessCategory: formData.businessCategory as BusinessCategory,
        businessDescription: formData.businessDescription || undefined,
        address: formData.address || undefined,
        emoji: formData.emoji,
        subscriptionPlan: formData.subscriptionPlan,
        subscriptionStatus: formData.subscriptionStatus,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to update tenant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Tenant: {tenant.subdomain}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Business Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700">Business Information</h3>
              
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="businessCategory">Business Category *</Label>
                <Select
                  value={formData.businessCategory}
                  onValueChange={(value) => handleInputChange('businessCategory', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="emoji">Emoji *</Label>
                <Input
                  id="emoji"
                  value={formData.emoji}
                  onChange={(e) => handleInputChange('emoji', e.target.value)}
                  maxLength={10}
                  required
                />
              </div>

              <div>
                <Label htmlFor="businessDescription">Business Description</Label>
                <Textarea
                  id="businessDescription"
                  value={formData.businessDescription}
                  onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700">Contact Information</h3>
              
              <div>
                <Label htmlFor="ownerName">Owner Name *</Label>
                <Input
                  id="ownerName"
                  value={formData.ownerName}
                  onChange={(e) => handleInputChange('ownerName', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Subscription Management */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm text-gray-700 mb-4">Subscription Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subscriptionPlan">Subscription Plan</Label>
                <Select
                  value={formData.subscriptionPlan}
                  onValueChange={(value) => handleInputChange('subscriptionPlan', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subscriptionStatus">Subscription Status</Label>
                <Select
                  value={formData.subscriptionStatus}
                  onValueChange={(value) => handleInputChange('subscriptionStatus', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}