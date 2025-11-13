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
      <style>{`
        .blocking-date-calendar button[aria-disabled="true"] {
          background-color: #fee2e2 !important;
          color: #b91c1c !important;
          font-weight: 600 !important;
          border: 2px solid #dc2626 !important;
        }
        .blocking-date-calendar button[aria-disabled="false"]:not([aria-selected="true"]) {
          background-color: #f0fdf4 !important;
          color: #166534 !important;
        }
        /* Move prev/next buttons next to month name */
        .blocking-date-calendar .rdp-caption {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 0.5rem !important;
          position: relative !important;
          width: 100% !important;
        }
        .blocking-date-calendar .rdp-caption_label {
          order: 2 !important;
          flex: 0 !important;
          text-align: center !important;
        }
        .blocking-date-calendar .rdp-nav {
          position: static !important;
          width: auto !important;
          display: flex !important;
          gap: 0.5rem !important;
          order: 1 !important;
        }
        .blocking-date-calendar .rdp-nav_button_previous {
          position: static !important;
          order: 1 !important;
        }
        .blocking-date-calendar .rdp-nav_button_next {
          position: static !important;
          order: 3 !important;
          margin-left: 0.5rem !important;
        }

      `}</style>

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
      <div className="blocking-date-calendar">
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
            day: 'h-9 w-9 p-0 font-normal text-sm rounded',
            day_selected: 'bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700',
            day_today: 'bg-blue-100 text-blue-900 font-bold',
            day_outside: 'text-gray-400 opacity-50',
            head_cell: 'text-gray-600 font-semibold text-xs',
            caption_label: 'text-sm font-semibold text-gray-900'
          }}
          formatters={{
            formatWeekdayName: (date) => date.toLocaleDateString('en-US', { weekday: 'short' })
          }}
        />
      </div>

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
