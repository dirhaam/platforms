'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import type { LandingPageSettingsData } from '@/lib/settings/settings-service';

interface LandingPageSettingsProps {
  tenantId: string;
  initialData: LandingPageSettingsData;
}

export default function LandingPageSettings({ tenantId, initialData }: LandingPageSettingsProps) {
  const [formData, setFormData] = useState<LandingPageSettingsData>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (field: keyof LandingPageSettingsData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/settings/landing-page', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Landing page settings updated successfully!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update settings' });
      }
    } catch (error) {
      console.error('Error updating landing page settings:', error);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Hero Section */}
      <Card>
        <CardHeader>
          <CardTitle>Hero Section</CardTitle>
          <CardDescription>
            Customize the main banner area of your landing page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="heroTitle">Hero Title</Label>
            <Input
              id="heroTitle"
              value={formData.heroTitle || ''}
              onChange={(e) => handleInputChange('heroTitle', e.target.value)}
              placeholder="Welcome to our business"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
            <Textarea
              id="heroSubtitle"
              value={formData.heroSubtitle || ''}
              onChange={(e) => handleInputChange('heroSubtitle', e.target.value)}
              placeholder="Brief description of your services"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* About Section */}
      <Card>
        <CardHeader>
          <CardTitle>About Section</CardTitle>
          <CardDescription>
            Tell visitors about your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="aboutText">About Text</Label>
            <Textarea
              id="aboutText"
              value={formData.aboutText || ''}
              onChange={(e) => handleInputChange('aboutText', e.target.value)}
              placeholder="Tell your story and what makes your business special"
              rows={5}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section Visibility */}
      <Card>
        <CardHeader>
          <CardTitle>Section Visibility</CardTitle>
          <CardDescription>
            Choose which sections to display on your landing page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="showServices">Show Services Section</Label>
            <Switch
              id="showServices"
              checked={formData.showServices}
              onCheckedChange={(checked) => handleInputChange('showServices', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="showReviews">Show Reviews Section</Label>
            <Switch
              id="showReviews"
              checked={formData.showReviews}
              onCheckedChange={(checked) => handleInputChange('showReviews', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="showContact">Show Contact Section</Label>
            <Switch
              id="showContact"
              checked={formData.showContact}
              onCheckedChange={(checked) => handleInputChange('showContact', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="showGallery">Show Gallery Section</Label>
            <Switch
              id="showGallery"
              checked={formData.showGallery}
              onCheckedChange={(checked) => handleInputChange('showGallery', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* SEO Settings */}
      <Card>
        <CardHeader>
          <CardTitle>SEO Settings</CardTitle>
          <CardDescription>
            Optimize your page for search engines
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seoTitle">SEO Title</Label>
            <Input
              id="seoTitle"
              value={formData.seoTitle || ''}
              onChange={(e) => handleInputChange('seoTitle', e.target.value)}
              placeholder="Page title for search engines"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="seoDescription">SEO Description</Label>
            <Textarea
              id="seoDescription"
              value={formData.seoDescription || ''}
              onChange={(e) => handleInputChange('seoDescription', e.target.value)}
              placeholder="Brief description for search results"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="seoKeywords">SEO Keywords</Label>
            <Input
              id="seoKeywords"
              value={formData.seoKeywords || ''}
              onChange={(e) => handleInputChange('seoKeywords', e.target.value)}
              placeholder="Keywords separated by commas"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Landing Page Settings'
          )}
        </Button>
      </div>
    </form>
  );
}