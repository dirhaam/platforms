"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Building2, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TenantCreationFormProps {
  session: any;
}

interface FormData {
  // Basic Information
  businessName: string;
  subdomain: string;
  businessCategory: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  address: string;
  businessDescription: string;
  
  // Features
  whatsappEnabled: boolean;
  homeVisitEnabled: boolean;
  analyticsEnabled: boolean;
  customTemplatesEnabled: boolean;
  multiStaffEnabled: boolean;
  
  // Subscription
  subscriptionPlan: string;
  
  // Branding
  emoji: string;
  website: string;
}

export function TenantCreationForm({ session }: TenantCreationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    subdomain: '',
    businessCategory: '',
    ownerName: '',
    ownerEmail: '',
    phone: '',
    address: '',
    businessDescription: '',
    
    whatsappEnabled: false,
    homeVisitEnabled: false,
    analyticsEnabled: true,
    customTemplatesEnabled: false,
    multiStaffEnabled: false,
    
    subscriptionPlan: 'basic',
    emoji: '🏢',
    website: '',
  });

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    if (!formData.subdomain.trim()) {
      newErrors.subdomain = 'Subdomain is required';
    } else if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(formData.subdomain)) {
      newErrors.subdomain = 'Subdomain must contain only lowercase letters, numbers, and hyphens';
    }

    if (!formData.businessCategory) {
      newErrors.businessCategory = 'Business category is required';
    }

    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'Owner name is required';
    }

    if (!formData.ownerEmail.trim()) {
      newErrors.ownerEmail = 'Owner email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail)) {
      newErrors.ownerEmail = 'Invalid email format';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create tenant');
      }

      toast.success('Tenant created successfully!');
      router.push('/admin/tenants');
      
    } catch (error) {
      console.error('Error creating tenant:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create tenant');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Tenant Information
          </CardTitle>
          <CardDescription>
            Enter the details for the new tenant. All fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Business Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    placeholder="Enter business name"
                    disabled={isLoading}
                    className={errors.businessName ? 'border-red-500' : ''}
                  />
                  {errors.businessName && (
                    <p className="text-xs text-red-500">{errors.businessName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain *</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="subdomain"
                      value={formData.subdomain}
                      onChange={(e) => handleInputChange('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="mybusiness"
                      disabled={isLoading}
                      className={errors.subdomain ? 'border-red-500' : ''}
                    />
                    <span className="text-sm text-gray-500">.localhost:3000</span>
                  </div>
                  {errors.subdomain && (
                    <p className="text-xs text-red-500">{errors.subdomain}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Only lowercase letters, numbers, and hyphens allowed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessCategory">Business Category *</Label>
                  <Select 
                    value={formData.businessCategory} 
                    onValueChange={(value) => handleInputChange('businessCategory', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="beauty">Beauty & Salon</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="consulting">Consulting</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.businessCategory && (
                    <p className="text-xs text-red-500">{errors.businessCategory}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emoji">Business Emoji</Label>
                  <Input
                    id="emoji"
                    value={formData.emoji}
                    onChange={(e) => handleInputChange('emoji', e.target.value)}
                    placeholder="🏢"
                    maxLength={2}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessDescription">Business Description</Label>
                <Textarea
                  id="businessDescription"
                  value={formData.businessDescription}
                  onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                  placeholder="Brief description of the business services"
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Owner Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Owner Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner Name *</Label>
                  <Input
                    id="ownerName"
                    value={formData.ownerName}
                    onChange={(e) => handleInputChange('ownerName', e.target.value)}
                    placeholder="Enter owner's full name"
                    disabled={isLoading}
                    className={errors.ownerName ? 'border-red-500' : ''}
                  />
                  {errors.ownerName && (
                    <p className="text-xs text-red-500">{errors.ownerName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerEmail">Owner Email *</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    value={formData.ownerEmail}
                    onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
                    placeholder="owner@business.com"
                    disabled={isLoading}
                    className={errors.ownerEmail ? 'border-red-500' : ''}
                  />
                  {errors.ownerEmail && (
                    <p className="text-xs text-red-500">{errors.ownerEmail}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+62 812-3456-7890"
                    disabled={isLoading}
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-500">{errors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://business.com"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Full business address"
                  rows={2}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Features</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="whatsappEnabled">WhatsApp Integration</Label>
                  <Switch
                    id="whatsappEnabled"
                    checked={formData.whatsappEnabled}
                    onCheckedChange={(checked) => handleInputChange('whatsappEnabled', checked)}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="homeVisitEnabled">Home Visit Support</Label>
                  <Switch
                    id="homeVisitEnabled"
                    checked={formData.homeVisitEnabled}
                    onCheckedChange={(checked) => handleInputChange('homeVisitEnabled', checked)}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="analyticsEnabled">Analytics Dashboard</Label>
                  <Switch
                    id="analyticsEnabled"
                    checked={formData.analyticsEnabled}
                    onCheckedChange={(checked) => handleInputChange('analyticsEnabled', checked)}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="customTemplatesEnabled">Custom Templates</Label>
                  <Switch
                    id="customTemplatesEnabled"
                    checked={formData.customTemplatesEnabled}
                    onCheckedChange={(checked) => handleInputChange('customTemplatesEnabled', checked)}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="multiStaffEnabled">Multi-Staff Support</Label>
                  <Switch
                    id="multiStaffEnabled"
                    checked={formData.multiStaffEnabled}
                    onCheckedChange={(checked) => handleInputChange('multiStaffEnabled', checked)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subscriptionPlan">Subscription Plan</Label>
                  <Select 
                    value={formData.subscriptionPlan} 
                    onValueChange={(value) => handleInputChange('subscriptionPlan', value)}
                    disabled={isLoading}
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
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Create Tenant
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
