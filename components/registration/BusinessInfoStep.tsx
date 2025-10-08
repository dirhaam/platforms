'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BUSINESS_CATEGORIES } from '@/lib/subdomains';
import type { RegistrationData } from '@/components/registration/RegistrationWizard';

interface BusinessInfoStepProps {
  data: Partial<RegistrationData>;
  onUpdate: (data: Partial<RegistrationData>) => void;
  error?: string;
}

export function BusinessInfoStep({ data, onUpdate, error }: BusinessInfoStepProps) {
  const handleInputChange = (field: keyof RegistrationData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    onUpdate({ [field]: e.target.value });
  };

  const handleSelectChange = (field: keyof RegistrationData) => (value: string) => {
    onUpdate({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Tell Us About Your Business
        </h3>
        <p className="text-gray-600">
          This information will help us customize your booking system and create your business profile.
        </p>
      </div>

      <div className="space-y-4">
        {/* Business Name */}
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name *</Label>
          <Input
            id="businessName"
            placeholder="Your Business Name"
            value={data.businessName || ''}
            onChange={handleInputChange('businessName')}
            required
          />
        </div>

        {/* Owner Name */}
        <div className="space-y-2">
          <Label htmlFor="ownerName">Owner/Manager Name *</Label>
          <Input
            id="ownerName"
            placeholder="Your Full Name"
            value={data.ownerName || ''}
            onChange={handleInputChange('ownerName')}
            required
          />
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={data.email || ''}
              onChange={handleInputChange('email')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+60123456789"
              value={data.phone || ''}
              onChange={handleInputChange('phone')}
              required
            />
          </div>
        </div>

        {/* Business Category */}
        <div className="space-y-2">
          <Label htmlFor="businessCategory">Business Category *</Label>
          <Select 
            value={data.businessCategory || ''} 
            onValueChange={handleSelectChange('businessCategory')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your business category" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            This helps us provide relevant features and templates for your business type
          </p>
        </div>

        {/* Business Description */}
        <div className="space-y-2">
          <Label htmlFor="businessDescription">Business Description</Label>
          <Textarea
            id="businessDescription"
            placeholder="Briefly describe your business and the services you offer..."
            value={data.businessDescription || ''}
            onChange={handleInputChange('businessDescription')}
            rows={3}
          />
          <p className="text-xs text-gray-500">
            This will appear on your business landing page (optional)
          </p>
        </div>

        {/* Business Address */}
        <div className="space-y-2">
          <Label htmlFor="address">Business Address</Label>
          <Textarea
            id="address"
            placeholder="Your business address..."
            value={data.address || ''}
            onChange={handleInputChange('address')}
            rows={2}
          />
          <p className="text-xs text-gray-500">
            Helps customers find you and enables location-based features (optional)
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-500">{error}</div>
        )}
      </div>
    </div>
  );
}