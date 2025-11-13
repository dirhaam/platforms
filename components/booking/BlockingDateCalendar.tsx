'use client';

import React, { useEffect, useState } from 'react';
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

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function BlockingDateCalendar({
  selected,
  onSelect,
  disabled,
  blockedDates,
  month,
  onMonthChange
}: BlockingDateCalendarProps) {
  const [internalMonth, setInternalMonth] = useState<Date>(month ?? new Date());

  useEffect(() => {
    if (month) setInternalMonth(month);
  }, [month]);

  const currentMonth = month ?? internalMonth;

  const handleMonthChange = (newMonth: Date) => {
    setInternalMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const isDisabledOrBlocked = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return disabled?.(date) || blockedDates.has(dateStr);
  };

  return (
    <div className="space-y-3 p-4">
      <style>{`
        /* Sembunyikan caption & nav bawaan semua DayPicker */
        .rdp-caption,
        .rdp-nav {
          display: none !important;
        }

        /* Styling tanggal: merah untuk blocked (aria-disabled="true"), hijau untuk available */
        .blocking-date-calendar button[aria-disabled="true"] {
          background-color: #fee2e2 !important;
          color: #b91c1c !important;
          font-weight: 600 !important;
          border: 2px solid #dc2626 !important;
          cursor: not-allowed !important;
        }
        .blocking-date-calendar button[aria-disabled="false"] {
          background-color: #f0fdf4 !important;
          color: #166534 !important;
        }
      `}</style>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3 pb-3 border-b">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded" />
          <span className="text-xs text-gray-700">Blocked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-gray-300 rounded" />
          <span className="text-xs text-gray-700">Available</span>
        </div>
      </div>

      {/* Custom caption: < November 2025 > */}
      <div className="flex items-center justify-center gap-3 text-sm font-semibold text-gray-900">
        <button
          type="button"
          className="px-2 py-1 rounded hover:bg-gray-100"
          onClick={() => handleMonthChange(addMonths(currentMonth, -1))}
        >
          &lt;
        </button>
        <span className="min-w-[140px] text-center">
          {currentMonth.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })}
        </span>
        <button
          type="button"
          className="px-2 py-1 rounded hover:bg-gray-100"
          onClick={() => handleMonthChange(addMonths(currentMonth, 1))}
        >
          &gt;
        </button>
      </div>

      {/* Calendar */}
      <div className="blocking-date-calendar">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={onSelect}
          disabled={isDisabledOrBlocked}
          month={currentMonth}
          onMonthChange={handleMonthChange}
          disableNavigation
          className="w-full"
          classNames={{
            cell: 'h-9 w-9 text-center text-sm p-0 relative',
            // tidak pakai bg di sini, biar diatur CSS aria-disabled di atas
            day: 'h-9 w-9 p-0 font-normal text-sm rounded',
            day_selected:
              'bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700',
            day_today: 'bg-blue-100 text-blue-900 font-bold',
            day_outside: 'text-gray-400 opacity-50',
            day_disabled:
              'font-semibold', // warna & bg di-handle CSS aria-disabled
            head_cell: 'text-gray-600 font-semibold text-xs',
            caption_label: 'text-sm font-semibold text-gray-900',
          }}
          formatters={{
            formatWeekdayName: (date) =>
              date.toLocaleDateString('en-US', { weekday: 'short' }),
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
