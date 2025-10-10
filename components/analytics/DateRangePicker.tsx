'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format as formatDate } from 'date-fns';

interface DateRangePickerProps {
  value: {
    startDate: Date;
    endDate: Date;
  };
  onChange: (dateRange: { startDate: Date; endDate: Date }) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const presetRanges = [
    {
      label: 'Last 7 days',
      getValue: () => ({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      })
    },
    {
      label: 'Last 30 days',
      getValue: () => ({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      })
    },
    {
      label: 'Last 90 days',
      getValue: () => ({
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      })
    },
    {
      label: 'This month',
      getValue: () => {
        const now = new Date();
        return {
          startDate: new Date(now.getFullYear(), now.getMonth(), 1),
          endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        };
      }
    },
    {
      label: 'Last month',
      getValue: () => {
        const now = new Date();
        return {
          startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          endDate: new Date(now.getFullYear(), now.getMonth(), 0)
        };
      }
    },
    {
      label: 'This year',
      getValue: () => {
        const now = new Date();
        return {
          startDate: new Date(now.getFullYear(), 0, 1),
          endDate: new Date(now.getFullYear(), 11, 31)
        };
      }
    }
  ];

  const handlePresetSelect = (preset: string) => {
    const range = presetRanges.find(r => r.label === preset);
    if (range) {
      onChange(range.getValue());
      setIsOpen(false);
    }
  };

  const formatDateRange = () => {
    return `${formatDate(value.startDate, 'MMM dd')} - ${formatDate(value.endDate, 'MMM dd, yyyy')}`;
  };

  return (
    <div className="flex items-center space-x-2">
      <Select onValueChange={handlePresetSelect}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Quick select" />
        </SelectTrigger>
        <SelectContent>
          {presetRanges.map((preset) => (
            <SelectItem key={preset.label} value={preset.label}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <Calendar
                  mode="single"
                  selected={value.startDate}
                  onSelect={(date) => {
                    if (date) {
                      onChange({
                        startDate: date,
                        endDate: value.endDate
                      });
                    }
                  }}
                  disabled={(date) => date > value.endDate || date > new Date()}
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <Calendar
                  mode="single"
                  selected={value.endDate}
                  onSelect={(date) => {
                    if (date) {
                      onChange({
                        startDate: value.startDate,
                        endDate: date
                      });
                    }
                  }}
                  disabled={(date) => date < value.startDate || date > new Date()}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsOpen(false)}>
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}