'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Palette, Check, Loader } from 'lucide-react';
import { toast } from 'sonner';

interface Template {
  id: 'modern' | 'classic' | 'minimal' | 'beauty' | 'healthcare';
  name: string;
  description: string;
  bestFor: string;
  icon: string;
  colors: string[];
}

const TEMPLATES: Template[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary design with vibrant colors and smooth animations',
    bestFor: 'Startups, tech companies, modern services',
    icon: '✨',
    colors: ['#3b82f6', '#8b5cf6', '#ec4899']
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional elegant layout with sidebar navigation',
    bestFor: 'Law firms, medical practices, corporate services',
    icon: '🏛️',
    colors: ['#2c3e50', '#34495e', '#7f8c8d']
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and simple with focus on whitespace and typography',
    bestFor: 'Tech startups, design agencies, luxury brands',
    icon: '✏️',
    colors: ['#000000', '#666666', '#cccccc']
  },
  {
    id: 'beauty',
    name: 'Beauty/Salon',
    description: 'Glamorous design with gradients and premium aesthetic',
    bestFor: 'Salons, spas, beauty services, wellness',
    icon: '💄',
    colors: ['#ec4899', '#d946ef', '#a855f7']
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Professional design focused on trust and credibility',
    bestFor: 'Hospitals, clinics, medical practices, therapy',
    icon: '🏥',
    colors: ['#0369a1', '#0284c7', '#0ea5e9']
  }
];

interface LandingPageStyleSettingsProps {
  subdomain: string;
  currentTemplate?: string;
}

export default function LandingPageStyleSettings({ subdomain, currentTemplate = 'modern' }: LandingPageStyleSettingsProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(currentTemplate);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleSaveTemplate = async () => {
    if (selectedTemplate === currentTemplate) {
      toast.info('No changes to save');
      return;
    }

    setSaving(true);
    try {
      const url = new URL('/api/settings/template', window.location.origin);
      url.searchParams.set('subdomain', subdomain);
      
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: selectedTemplate
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save template');
      }

      toast.success('Landing page style updated successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save template');
      setSelectedTemplate(currentTemplate);
    } finally {
      setSaving(false);
    }
  };

  const currentTemplateData = TEMPLATES.find(t => t.id === currentTemplate);
  const selectedTemplateData = TEMPLATES.find(t => t.id === selectedTemplate);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Landing Page Style
          </CardTitle>
          <CardDescription>
            Choose the design template for your landing page. All templates include your services, booking system, and contact information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Template Info */}
          {currentTemplateData && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Current Style:</strong> {currentTemplateData.name}
              </p>
              <p className="text-xs text-blue-700 mt-1">{currentTemplateData.description}</p>
            </div>
          )}

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {TEMPLATES.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`
                  p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${selectedTemplate === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                {/* Template Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{template.icon}</div>
                  {selectedTemplate === template.id && (
                    <Badge className="bg-blue-600">
                      <Check className="h-3 w-3 mr-1" />
                      Selected
                    </Badge>
                  )}
                </div>

                {/* Template Name */}
                <h3 className="font-bold text-sm mb-1">{template.name}</h3>

                {/* Template Description */}
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {template.description}
                </p>

                {/* Best For */}
                <p className="text-xs text-gray-500 mb-3 pb-3 border-b">
                  <strong>Best for:</strong> {template.bestFor}
                </p>

                {/* Color Preview */}
                <div className="flex gap-1">
                  {template.colors.map((color, idx) => (
                    <div
                      key={idx}
                      className="flex-1 h-6 rounded-sm"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Selected Template Preview Info */}
          {selectedTemplateData && selectedTemplate !== currentTemplate && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-900">
                <strong>Preview:</strong> {selectedTemplateData.name}
              </p>
              <p className="text-xs text-amber-700 mt-1">{selectedTemplateData.description}</p>
              <p className="text-xs text-amber-700 mt-2">
                <strong>Best for:</strong> {selectedTemplateData.bestFor}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setPreviewOpen(!previewOpen);
                toast.info(`Preview opening in new tab...`);
                window.open(`https://${subdomain}.booqing.my.id/`, '_blank');
              }}
            >
              Preview Live
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={saving || selectedTemplate === currentTemplate}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save Style
                  {selectedTemplate !== currentTemplate && ' (Changes pending)'}
                </>
              )}
            </Button>
          </div>

          {/* Info Box */}
          <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
            <p>
              <strong>💡 Note:</strong> All templates include your services, pricing, business hours, and booking system. 
              The style you choose only affects how your landing page looks, not the functionality.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
