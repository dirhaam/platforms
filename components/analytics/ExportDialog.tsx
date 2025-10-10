'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileText, FileSpreadsheet, FileImage } from 'lucide-react';
import { format as formatDate } from 'date-fns';

interface ExportDialogProps {
  tenantId: string;
  trigger?: React.ReactNode;
  defaultDataType?: string;
}

export function ExportDialog({ tenantId, trigger, defaultDataType = 'bookings' }: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [dataType, setDataType] = useState(defaultDataType);
  const [format, setFormat] = useState<'xlsx' | 'csv' | 'pdf'>('xlsx');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  });
  const [includeFields, setIncludeFields] = useState<string[]>([]);

  const dataTypes = [
    { value: 'bookings', label: 'Bookings', icon: Calendar },
    { value: 'customers', label: 'Customers', icon: FileText },
    { value: 'services', label: 'Services', icon: FileSpreadsheet },
    { value: 'financial', label: 'Financial Data', icon: FileImage }
  ];

  const formats = [
    { value: 'xlsx', label: 'Excel (.xlsx)', icon: FileSpreadsheet },
    { value: 'csv', label: 'CSV (.csv)', icon: FileText },
    { value: 'pdf', label: 'PDF (.pdf)', icon: FileImage }
  ];

  const fieldOptions = {
    bookings: [
      'Customer Information',
      'Service Details',
      'Payment Information',
      'Home Visit Details',
      'Notes and Comments'
    ],
    customers: [
      'Contact Information',
      'Booking History',
      'Financial Summary',
      'Notes and Preferences'
    ],
    services: [
      'Service Details',
      'Pricing Information',
      'Performance Metrics',
      'Availability Settings'
    ],
    financial: [
      'Payment Details',
      'Tax Information',
      'Monthly Summaries',
      'Revenue Breakdown'
    ]
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/analytics/export/${tenantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataType,
          format,
          dateRange,
          includeFields
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${dataType}-export-${format === 'xlsx' ? 'xlsx' : format === 'csv' ? 'csv' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setIsOpen(false);
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      // You might want to show a toast notification here
    } finally {
      setIsExporting(false);
    }
  };

  const handleFieldToggle = (field: string, checked: boolean) => {
    if (checked) {
      setIncludeFields(prev => [...prev, field]);
    } else {
      setIncludeFields(prev => prev.filter(f => f !== field));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Choose what data to export and in which format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Data Type Selection */}
          <div className="space-y-2">
            <Label>Data Type</Label>
            <Select value={dataType} onValueChange={setDataType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dataTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={format} onValueChange={(value: 'xlsx' | 'csv' | 'pdf') => setFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formats.map((fmt) => {
                  const Icon = fmt.icon;
                  return (
                    <SelectItem key={fmt.value} value={fmt.value}>
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span>{fmt.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Selection */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDate(dateRange.startDate, 'MMM dd, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.startDate}
                    onSelect={(date) => {
                      if (date) {
                        setDateRange(prev => ({ ...prev, startDate: date }));
                      }
                    }}
                    disabled={(date) => date > dateRange.endDate || date > new Date()}
                  />
                </PopoverContent>
              </Popover>
              <span className="text-gray-500">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDate(dateRange.endDate, 'MMM dd, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.endDate}
                    onSelect={(date) => {
                      if (date) {
                        setDateRange(prev => ({ ...prev, endDate: date }));
                      }
                    }}
                    disabled={(date) => date < dateRange.startDate || date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Field Selection */}
          <div className="space-y-2">
            <Label>Include Fields (Optional)</Label>
            <div className="grid grid-cols-2 gap-2">
              {fieldOptions[dataType as keyof typeof fieldOptions]?.map((field) => (
                <div key={field} className="flex items-center space-x-2">
                  <Checkbox
                    id={field}
                    checked={includeFields.includes(field)}
                    onCheckedChange={(checked) => handleFieldToggle(field, checked as boolean)}
                  />
                  <Label htmlFor={field} className="text-sm">
                    {field}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Leave unchecked to include all available fields
            </p>
          </div>

          {/* Export Preview */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Export Preview</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Data:</strong> {dataTypes.find(t => t.value === dataType)?.label}</p>
              <p><strong>Format:</strong> {formats.find(f => f.value === format)?.label}</p>
              <p><strong>Period:</strong> {formatDate(dateRange.startDate, 'MMM dd')} - {formatDate(dateRange.endDate, 'MMM dd, yyyy')}</p>
              <p><strong>Fields:</strong> {includeFields.length > 0 ? `${includeFields.length} selected` : 'All fields'}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}