'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, FileText, Download, Settings } from 'lucide-react';
import { format } from 'date-fns';

interface ReportGeneratorProps {
  tenantId: string;
  isAdmin?: boolean;
}

export function ReportGenerator({ tenantId, isAdmin = false }: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportConfig, setReportConfig] = useState({
    title: 'Business Performance Report',
    description: '',
    dateRange: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date()
    },
    sections: [] as string[],
    format: 'pdf' as 'pdf' | 'xlsx',
    includeCharts: true,
    includeComparison: false
  });

  const reportSections = [
    { id: 'executive-summary', label: 'Executive Summary', description: 'Key metrics and performance overview' },
    { id: 'booking-analysis', label: 'Booking Analysis', description: 'Detailed booking trends and patterns' },
    { id: 'customer-insights', label: 'Customer Insights', description: 'Customer behavior and demographics' },
    { id: 'service-performance', label: 'Service Performance', description: 'Service popularity and revenue' },
    { id: 'financial-summary', label: 'Financial Summary', description: 'Revenue, payments, and financial health' },
    { id: 'time-analysis', label: 'Time Analysis', description: 'Peak hours, busy days, and seasonal trends' },
    { id: 'growth-metrics', label: 'Growth Metrics', description: 'Growth rates and trend analysis' }
  ];

  const platformSections = [
    { id: 'platform-overview', label: 'Platform Overview', description: 'Overall platform statistics' },
    { id: 'tenant-performance', label: 'Tenant Performance', description: 'Top performing tenants and metrics' },
    { id: 'feature-adoption', label: 'Feature Adoption', description: 'Feature usage across tenants' },
    { id: 'revenue-analysis', label: 'Revenue Analysis', description: 'Platform revenue and growth' }
  ];

  const availableSections = isAdmin ? [...reportSections, ...platformSections] : reportSections;

  const handleSectionToggle = (sectionId: string, checked: boolean) => {
    if (checked) {
      setReportConfig(prev => ({
        ...prev,
        sections: [...prev.sections, sectionId]
      }));
    } else {
      setReportConfig(prev => ({
        ...prev,
        sections: prev.sections.filter(s => s !== sectionId)
      }));
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const endpoint = isAdmin ? '/api/analytics/reports/platform' : `/api/analytics/reports/${tenantId}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportConfig),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportConfig.title.toLowerCase().replace(/\s+/g, '-')}.${reportConfig.format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Report generation failed');
      }
    } catch (error) {
      console.error('Report generation error:', error);
      // You might want to show a toast notification here
    } finally {
      setIsGenerating(false);
    }
  };

  const presetReports = [
    {
      name: 'Monthly Business Review',
      config: {
        title: 'Monthly Business Review',
        sections: ['executive-summary', 'booking-analysis', 'financial-summary', 'growth-metrics'],
        dateRange: {
          startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
        }
      }
    },
    {
      name: 'Customer Analysis Report',
      config: {
        title: 'Customer Analysis Report',
        sections: ['customer-insights', 'service-performance', 'time-analysis'],
        dateRange: {
          startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          endDate: new Date()
        }
      }
    },
    {
      name: 'Financial Performance Report',
      config: {
        title: 'Financial Performance Report',
        sections: ['financial-summary', 'booking-analysis', 'growth-metrics'],
        dateRange: {
          startDate: new Date(new Date().getFullYear(), 0, 1),
          endDate: new Date()
        }
      }
    }
  ];

  const loadPreset = (preset: typeof presetReports[0]) => {
    setReportConfig(prev => ({
      ...prev,
      ...preset.config
    }));
  };

  return (
    <div className="space-y-6">
      {/* Preset Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Quick Reports</span>
          </CardTitle>
          <CardDescription>
            Generate common reports with pre-configured settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {presetReports.map((preset) => (
              <Card key={preset.name} className="cursor-pointer hover:bg-gray-50" onClick={() => loadPreset(preset)}>
                <CardContent className="p-4">
                  <h4 className="font-medium">{preset.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {preset.config.sections.length} sections included
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Custom Report</span>
          </CardTitle>
          <CardDescription>
            Configure a custom report with specific sections and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Report Title</Label>
              <Input
                id="title"
                value={reportConfig.title}
                onChange={(e) => setReportConfig(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter report title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <Select 
                value={reportConfig.format} 
                onValueChange={(value: 'pdf' | 'xlsx') => setReportConfig(prev => ({ ...prev, format: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Report</SelectItem>
                  <SelectItem value="xlsx">Excel Workbook</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={reportConfig.description}
              onChange={(e) => setReportConfig(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the report purpose"
              rows={2}
            />
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Report Period</Label>
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(reportConfig.dateRange.startDate, 'MMM dd, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={reportConfig.dateRange.startDate}
                    onSelect={(date) => {
                      if (date) {
                        setReportConfig(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, startDate: date }
                        }));
                      }
                    }}
                    disabled={(date) => date > reportConfig.dateRange.endDate || date > new Date()}
                  />
                </PopoverContent>
              </Popover>
              <span className="text-gray-500">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(reportConfig.dateRange.endDate, 'MMM dd, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={reportConfig.dateRange.endDate}
                    onSelect={(date) => {
                      if (date) {
                        setReportConfig(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, endDate: date }
                        }));
                      }
                    }}
                    disabled={(date) => date < reportConfig.dateRange.startDate || date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Report Sections */}
          <div className="space-y-2">
            <Label>Report Sections</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableSections.map((section) => (
                <div key={section.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={section.id}
                    checked={reportConfig.sections.includes(section.id)}
                    onCheckedChange={(checked) => handleSectionToggle(section.id, checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={section.id} className="font-medium">
                      {section.label}
                    </Label>
                    <p className="text-xs text-gray-600 mt-1">
                      {section.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <Label>Additional Options</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCharts"
                  checked={reportConfig.includeCharts}
                  onCheckedChange={(checked) => 
                    setReportConfig(prev => ({ ...prev, includeCharts: checked as boolean }))
                  }
                />
                <Label htmlFor="includeCharts">Include charts and visualizations</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeComparison"
                  checked={reportConfig.includeComparison}
                  onCheckedChange={(checked) => 
                    setReportConfig(prev => ({ ...prev, includeComparison: checked as boolean }))
                  }
                />
                <Label htmlFor="includeComparison">Include comparison with previous period</Label>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleGenerateReport} 
              disabled={isGenerating || reportConfig.sections.length === 0}
              size="lg"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating Report...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}