'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, X, Plus, AlertCircle, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface BlackoutDate {
  id: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  isRecurring?: boolean;
  recurringPattern?: {
    type: 'weekly' | 'monthly' | 'yearly';
    interval: number;
  };
}

interface BlackoutDatesManagerProps {
  blackoutDates: BlackoutDate[];
  onAdd: (blackoutDate: Omit<BlackoutDate, 'id'>) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, blackoutDate: Partial<BlackoutDate>) => void;
  className?: string;
}

export function BlackoutDatesManager({
  blackoutDates,
  onAdd,
  onRemove,
  onUpdate,
  className = ''
}: BlackoutDatesManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newBlackout, setNewBlackout] = useState<Omit<BlackoutDate, 'id'>>({
    startDate: new Date(),
    endDate: new Date(),
    reason: '',
    isRecurring: false
  });
  const [errors, setErrors] = useState<string[]>([]);

  // Reset form when adding is cancelled
  useEffect(() => {
    if (!isAdding) {
      setNewBlackout({
        startDate: new Date(),
        endDate: new Date(),
        reason: '',
        isRecurring: false
      });
      setErrors([]);
    }
  }, [isAdding]);

  // Validate new blackout date
  const validateBlackout = (blackout: Omit<BlackoutDate, 'id'>): string[] => {
    const errors: string[] = [];

    if (!blackout.reason.trim()) {
      errors.push('Reason is required');
    }

    if (blackout.startDate > blackout.endDate) {
      errors.push('End date must be after start date');
    }

    // Check for overlaps with existing blackout dates
    const hasOverlap = blackoutDates.some(existing => {
      return (
        (blackout.startDate >= existing.startDate && blackout.startDate <= existing.endDate) ||
        (blackout.endDate >= existing.startDate && blackout.endDate <= existing.endDate) ||
        (blackout.startDate <= existing.startDate && blackout.endDate >= existing.endDate)
      );
    });

    if (hasOverlap) {
      errors.push('Date range overlaps with existing blackout period');
    }

    return errors;
  };

  // Handle add blackout date
  const handleAdd = () => {
    const validationErrors = validateBlackout(newBlackout);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    onAdd(newBlackout);
    setIsAdding(false);
  };

  // Format date range for display
  const formatDateRange = (startDate: Date, endDate: Date): string => {
    const start = startDate.toLocaleDateString();
    const end = endDate.toLocaleDateString();
    
    if (start === end) {
      return start;
    }
    
    return `${start} - ${end}`;
  };

  // Get duration in days
  const getDuration = (startDate: Date, endDate: Date): number => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // Check if date is in the past
  const isPastDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Sort blackout dates by start date
  const sortedBlackoutDates = [...blackoutDates].sort((a, b) => 
    a.startDate.getTime() - b.startDate.getTime()
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Ban className="h-5 w-5" />
            <span>Blackout Dates</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            disabled={isAdding}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Blackout
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Add new blackout form */}
        {isAdding && (
          <Card className="border-dashed">
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={newBlackout.startDate.toISOString().split('T')[0]}
                    onChange={(e) => setNewBlackout({
                      ...newBlackout,
                      startDate: new Date(e.target.value)
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={newBlackout.endDate.toISOString().split('T')[0]}
                    onChange={(e) => setNewBlackout({
                      ...newBlackout,
                      endDate: new Date(e.target.value)
                    })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  value={newBlackout.reason}
                  onChange={(e) => setNewBlackout({
                    ...newBlackout,
                    reason: e.target.value
                  })}
                  placeholder="e.g., Holiday, Vacation, Maintenance"
                  rows={2}
                />
              </div>

              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAdding(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAdd}
                >
                  Add Blackout
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing blackout dates */}
        {sortedBlackoutDates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Ban className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No blackout dates configured</p>
            <p className="text-sm">Add blackout dates to block booking availability</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedBlackoutDates.map((blackout) => (
              <div
                key={blackout.id}
                className={`
                  p-4 border rounded-lg
                  ${isPastDate(blackout.endDate) ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">
                        {formatDateRange(blackout.startDate, blackout.endDate)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {getDuration(blackout.startDate, blackout.endDate)} day{getDuration(blackout.startDate, blackout.endDate) !== 1 ? 's' : ''}
                      </Badge>
                      {isPastDate(blackout.endDate) && (
                        <Badge variant="secondary" className="text-xs">
                          Past
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{blackout.reason}</p>
                    {blackout.isRecurring && blackout.recurringPattern && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          Recurring {blackout.recurringPattern.type}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(blackout.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {sortedBlackoutDates.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                {sortedBlackoutDates.length} blackout period{sortedBlackoutDates.length !== 1 ? 's' : ''}
              </span>
              <span>
                {sortedBlackoutDates.filter(b => !isPastDate(b.endDate)).length} active
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}