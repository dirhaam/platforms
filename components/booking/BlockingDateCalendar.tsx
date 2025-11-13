'use client';

import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { AlertCircle } from 'lucide-react';

interface BlockingDateCalendarProps {
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  blockedDates: Set<string>;
  month?: Date;
  onMonthChange?: (date: Date) => void;
}

export function BlockingDateCalendar({
  selected,
  onSelect,
  disabled,
  blockedDates,
  month,
  onMonthChange
}: BlockingDateCalendarProps) {
  // Custom disabled function that marks blocked dates red but still allows viewing
  const isDisabledOrBlocked = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return disabled?.(date) || blockedDates.has(dateStr);
  };

  return (
    <div className="space-y-3 p-4">
      {/* Legend */}
      <div className="grid grid-cols-2 gap-3 pb-3 border-b">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded"></div>
          <span className="text-xs text-gray-700">Blocked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-gray-300 rounded"></div>
          <span className="text-xs text-gray-700">Available</span>
        </div>
      </div>

      {/* Calendar */}
      <Calendar
        mode="single"
        selected={selected}
        onSelect={onSelect}
        disabled={isDisabledOrBlocked}
        month={month}
        onMonthChange={onMonthChange}
        className="w-full"
        classNames={{
          cell: 'h-9 w-9 text-center text-sm p-0 relative',
          day: 'h-9 w-9 p-0 font-normal text-sm aria-selected:opacity-100',
          day_selected: 'bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700',
          day_today: 'bg-blue-100 text-blue-900 font-bold',
          day_outside: 'text-gray-400 opacity-50',
          day_disabled: 'bg-red-100 text-red-700 font-semibold border-2 border-red-500 cursor-not-allowed',
          head_cell: 'text-gray-600 font-semibold w-9 h-9 text-xs',
          caption_label: 'text-sm font-semibold text-gray-900'
        }}
      />

      {/* Info Box */}
      {blockedDates.size > 0 && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-red-800">
                {blockedDates.size} date{blockedDates.size !== 1 ? 's' : ''} blocked
              </p>
              <p className="text-xs text-red-700 mt-1">
                Dates marked in red are not available for booking.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
