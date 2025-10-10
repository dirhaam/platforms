'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, X } from 'lucide-react';
import type { BusinessProfileData } from '@/lib/settings/settings-service';
import { SettingsService } from '@/lib/settings/settings-service';

interface BusinessProfileSettingsProps {
  tenantId: string;
  initialData: BusinessProfileData | null;
}

export default function BusinessProfileSettings({
  tenantId,
  initialData,
}: BusinessProfileSettingsProps) {
  const [formData, setFormData] = useState<BusinessProfileData>({
    businessName: initialData?.businessName || '',
    businessCategory: initialData?.businessCategory || '',
    ownerName: initialData?.ownerName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    businessDescription: initialData?.businessDescription || '',
    logo: initialData?.logo || '',
    brandColors: initialData?.brandColors || {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#f59e0b',
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const businessCategories = SettingsService.getBusinessCategories();

  const handleInputChange = (field: keyof BusinessProfileData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  const handleColorChange = (colorType: 'primary' | 'secondary' | 'accent', value: string) => {
    setFormData(prev => ({
      ...prev,
      brandColors: {
        ...prev.brandColors!,
        [colorType]: value,
      },
    }));
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await fetch('/api/settings/business-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const response = await result.json();

      if (response.success) {
        setMessage({ type: 'success', text: 'Business profile updated successfully!' });
      } else {
        setMessage({ type: 'error', text: response.error || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, just set a placeholder URL
    // In a real implementation, you'd upload to a file storage service
    const logoUrl = URL.createObjectURL(file);
    handleInputChange('logo', logoUrl);
  };

  const removeLogo = () => {
    handleInputChange('logo', '');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name *</Label>
          <Input
            id="businessName"
            value={formData.businessName}
            onChange={(e) => handleInputChange('businessName', e.target.value)}
            placeholder="Enter your business name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessCategory">Business Category *</Label>
          <Select
            value={formData.businessCategory}
            onValueChange={(value) => handleInputChange('businessCategory', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {businessCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ownerName">Owner Name *</Label>
          <Input
            id="ownerName"
            value={formData.ownerName}
            onChange={(e) => handleInputChange('ownerName', e.target.value)}
            placeholder="Enter owner's name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter email address"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="Enter phone number"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Enter business address"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessDescription">Business Description</Label>
        <Textarea
          id="businessDescription"
          value={formData.businessDescription}
          onChange={(e) => handleInputChange('businessDescription', e.target.value)}
          placeholder="Describe your business and services"
          rows={4}
        />
      </div>

      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Business Logo</CardTitle>
          <CardDescription>
            Upload your business logo to personalize your booking page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.logo ? (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  <img
                    src={formData.logo}
                    alt="Business Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Logo uploaded</p>
                  <p className="text-xs text-gray-500">Click to change or remove</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removeLogo}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <Label htmlFor="logo-upload" className="cursor-pointer">
                    <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                      Upload a logo
                    </span>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 2MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Brand Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Brand Colors</CardTitle>
          <CardDescription>
            Customize your brand colors to match your business identity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={formData.brandColors?.primary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  className="w-12 h-10 p-1 border rounded"
                />
                <Input
                  value={formData.brandColors?.primary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={formData.brandColors?.secondary}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  className="w-12 h-10 p-1 border rounded"
                />
                <Input
                  value={formData.brandColors?.secondary}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  placeholder="#64748b"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="accentColor"
                  type="color"
                  value={formData.brandColors?.accent}
                  onChange={(e) => handleColorChange('accent', e.target.value)}
                  className="w-12 h-10 p-1 border rounded"
                />
                <Input
                  value={formData.brandColors?.accent}
                  onChange={(e) => handleColorChange('accent', e.target.value)}
                  placeholder="#f59e0b"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );
}