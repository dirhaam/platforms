'use client';

import React, { useState } from 'react';
import { Calendar, Repeat, X, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly';
  interval: number; // Every X days/weeks/months
  daysOfWeek?: number[]; // For weekly: 0=Sunday, 1=Monday, etc.
  dayOfMonth?: number; // For monthly: day of month
  endDate?: Date;
  occurrences?: number; // Alternative to endDate
}

interface RecurringBookingManagerProps {
  onPatternChange: (pattern: RecurringPattern | null) => void;
  initialPattern?: RecurringPattern;
  className?: string;
}

export function RecurringBookingManager({
  onPatternChange,
  initialPattern,
  className = ''
}: RecurringBookingManagerProps) {
  const [isEnabled, setIsEnabled] = useState(!!initialPattern);
  const [pattern, setPattern] = useState<RecurringPattern>(
    initialPattern || {
      type: 'weekly',
      interval: 1,
      daysOfWeek: [],
    }
  );
  const [endType, setEndType] = useState<'never' | 'date' | 'occurrences'>('never');

  const daysOfWeek = [
    { value: 0, label: 'Sunday', short: 'Sun' },
    { value: 1, label: 'Monday', short: 'Mon' },
    { value: 2, label: 'Tuesday', short: 'Tue' },
    { value: 3, label: 'Wednesday', short: 'Wed' },
    { value: 4, label: 'Thursday', short: 'Thu' },
    { value: 5, label: 'Friday', short: 'Fri' },
    { value: 6, label: 'Saturday', short: 'Sat' },
  ];

  // Update pattern and notify parent
  const updatePattern = (updates: Partial<RecurringPattern>) => {
    const newPattern = { ...pattern, ...updates };
    setPattern(newPattern);
    
    if (isEnabled) {
      onPatternChange(newPattern);
    }
  };

  // Toggle recurring booking
  const toggleRecurring = (enabled: boolean) => {
    setIsEnabled(enabled);
    onPatternChange(enabled ? pattern : null);
  };

  // Handle day of week selection
  const toggleDayOfWeek = (day: number) => {
    const currentDays = pattern.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();
    
    updatePattern({ daysOfWeek: newDays });
  };

  // Handle end type change
  const handleEndTypeChange = (type: 'never' | 'date' | 'occurrences') => {
    setEndType(type);
    const updates: Partial<RecurringPattern> = {};
    
    if (type === 'never') {
      updates.endDate = undefined;
      updates.occurrences = undefined;
    } else if (type === 'date') {
      updates.occurrences = undefined;
      if (!pattern.endDate) {
        const defaultEndDate = new Date();
        defaultEndDate.setMonth(defaultEndDate.getMonth() + 3);
        updates.endDate = defaultEndDate;
      }
    } else if (type === 'occurrences') {
      updates.endDate = undefined;
      if (!pattern.occurrences) {
        updates.occurrences = 10;
      }
    }
    
    updatePattern(updates);
  };

  // Generate preview text
  const generatePreviewText = (): string => {
    if (!isEnabled) return '';

    let text = `Repeats every `;
    
    if (pattern.interval > 1) {
      text += `${pattern.interval} `;
    }

    switch (pattern.type) {
      case 'daily':
        text += pattern.interval === 1 ? 'day' : 'days';
        break;
      case 'weekly':
        text += pattern.interval === 1 ? 'week' : 'weeks';
        if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
          const dayNames = pattern.daysOfWeek
            .map(day => daysOfWeek.find(d => d.value === day)?.short)
            .join(', ');
          text += ` on ${dayNames}`;
        }
        break;
      case 'monthly':
        text += pattern.interval === 1 ? 'month' : 'months';
        if (pattern.dayOfMonth) {
          text += ` on day ${pattern.dayOfMonth}`;
        }
        break;
    }

    if (endType === 'date' && pattern.endDate) {
      text += ` until ${pattern.endDate.toLocaleDateString()}`;
    } else if (endType === 'occurrences' && pattern.occurrences) {
      text += ` for ${pattern.occurrences} occurrences`;
    }

    return text;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Repeat className="h-5 w-5" />
            <span>Recurring Booking</span>
          </CardTitle>
          <Checkbox
            checked={isEnabled}
            onCheckedChange={toggleRecurring}
          />
        </div>
      </CardHeader>
      
      {isEnabled && (
        <CardContent className="space-y-6">
          {/* Repeat Type */}
          <div className="space-y-2">
            <Label>Repeat</Label>
            <div className="flex items-center space-x-2">
              <span className="text-sm">Every</span>
              <Input
                type="number"
                min="1"
                max="99"
                value={pattern.interval}
                onChange={(e) => updatePattern({ interval: parseInt(e.target.value) || 1 })}
                className="w-20"
              />
              <Select
                value={pattern.type}
                onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                  updatePattern({ type: value })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Day(s)</SelectItem>
                  <SelectItem value="weekly">Week(s)</SelectItem>
                  <SelectItem value="monthly">Month(s)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Weekly Options */}
          {pattern.type === 'weekly' && (
            <div className="space-y-2">
              <Label>Repeat on</Label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map(day => (
                  <Button
                    key={day.value}
                    variant={pattern.daysOfWeek?.includes(day.value) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleDayOfWeek(day.value)}
                    className="text-xs"
                  >
                    {day.short}
                  </Button>
                ))}
              </div>
              {pattern.daysOfWeek?.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please select at least one day of the week.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Monthly Options */}
          {pattern.type === 'monthly' && (
            <div className="space-y-2">
              <Label>Day of month</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={pattern.dayOfMonth || ''}
                onChange={(e) => updatePattern({ dayOfMonth: parseInt(e.target.value) || undefined })}
                placeholder="Day of month (1-31)"
                className="w-32"
              />
            </div>
          )}

          {/* End Options */}
          <div className="space-y-4">
            <Label>Ends</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={endType === 'never'}
                  onCheckedChange={() => handleEndTypeChange('never')}
                />
                <span className="text-sm">Never</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={endType === 'date'}
                  onCheckedChange={() => handleEndTypeChange('date')}
                />
                <span className="text-sm">On</span>
                {endType === 'date' && (
                  <Input
                    type="date"
                    value={pattern.endDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => updatePattern({ 
                      endDate: e.target.value ? new Date(e.target.value) : undefined 
                    })}
                    className="w-40"
                  />
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={endType === 'occurrences'}
                  onCheckedChange={() => handleEndTypeChange('occurrences')}
                />
                <span className="text-sm">After</span>
                {endType === 'occurrences' && (
                  <>
                    <Input
                      type="number"
                      min="1"
                      max="999"
                      value={pattern.occurrences || ''}
                      onChange={(e) => updatePattern({ 
                        occurrences: parseInt(e.target.value) || undefined 
                      })}
                      className="w-20"
                    />
                    <span className="text-sm">occurrences</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Preview */}
          {generatePreviewText() && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-blue-900">Preview</div>
                  <div className="text-sm text-blue-700">{generatePreviewText()}</div>
                </div>
              </div>
            </div>
          )}

          {/* Validation Warnings */}
          {pattern.type === 'weekly' && pattern.daysOfWeek?.length === 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please select at least one day of the week for weekly recurring bookings.
              </AlertDescription>
            </Alert>
          )}

          {pattern.type === 'monthly' && !pattern.dayOfMonth && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please specify the day of the month for monthly recurring bookings.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      )}
    </Card>
  );
}