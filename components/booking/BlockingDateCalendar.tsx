'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BlockingDateCalendarProps {
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  blockedDates: Map<string, string>;
  month?: Date;
  onMonthChange?: (date: Date) => void;
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getFirstDayOfMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

function getCalendarDays(date: Date): (number | null)[] {
  const daysInMonth = getDaysInMonth(date);
  const firstDay = getFirstDayOfMonth(date);
  const days: (number | null)[] = [];

  // Previous month days
  const prevMonthDays = getDaysInMonth(addMonths(date, -1));
  for (let i = (firstDay + 6) % 7; i > 0; i--) {
    days.push(null);
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // Next month days
  while (days.length < 42) {
    days.push(null);
  }

  return days;
}

export function BlockingDateCalendar({
  selected,
  onSelect,
  disabled,
  blockedDates,
  month,
  onMonthChange,
}: BlockingDateCalendarProps) {
  const [internalMonth, setInternalMonth] = useState<Date>(
    month ?? new Date()
  );

  useEffect(() => {
    if (month) setInternalMonth(month);
  }, [month]);

  const currentMonth = month ?? internalMonth;

  const handleMonthChange = (newMonth: Date) => {
    setInternalMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDateString = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const createLocalDate = (year: number, month: number, day: number) => {
    return new Date(year, month, day, 12, 0, 0);
  };

  const isPastDate = (year: number, month: number, day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(year, month, day);
    dateToCheck.setHours(0, 0, 0, 0);
    return dateToCheck < today;
  };

  const isActuallyBlocked = (year: number, month: number, day: number) => {
    const dateStr = getDateString(year, month, day);
    return blockedDates.has(dateStr);
  };

  const isDisabledOrBlocked = (year: number, month: number, day: number) => {
    const localDate = createLocalDate(year, month, day);
    return disabled?.(localDate) || isActuallyBlocked(year, month, day);
  };

  const isSelected = (year: number, month: number, day: number) => {
    if (!selected) return false;
    const selectedDateStr = getLocalDateString(selected);
    const currentDateStr = getDateString(year, month, day);
    return selectedDateStr === currentDateStr;
  };

  const isSunday = (year: number, month: number, day: number) => {
    const date = new Date(year, month, day);
    return date.getDay() === 0; // 0 = Sunday
  };

  const calendarDays = getCalendarDays(currentMonth);
  const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm mx-auto">
      {/* Header dengan month/year dan navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => handleMonthChange(addMonths(currentMonth, -1))}
          className="w-12 h-12 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
          type="button"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>

        <div className="text-center flex-1">
          <div className="text-2xl font-bold text-gray-900 tracking-wide">
            {currentMonth.toLocaleDateString('en-US', { month: 'long' })}{' '}
            <span>{currentMonth.getFullYear()}</span>
          </div>
        </div>

        <button
          onClick={() => handleMonthChange(addMonths(currentMonth, 1))}
          className="w-12 h-12 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
          type="button"
        >
          <ChevronRight className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekdays.map((day, index) => (
          <div
            key={day}
            className={`text-center text-sm font-semibold h-10 flex items-center justify-center ${
              index === 6 ? 'text-red-600' : 'text-gray-600'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, idx) => {
          if (day === null) {
            return (
              <div
                key={`empty-${idx}`}
                className="h-10 w-10 rounded-xl"
              />
            );
          }

          const year = currentMonth.getFullYear();
          const month = currentMonth.getMonth();
          const dateStr = getDateString(year, month, day);
          const isBlockedOrDisabled = isDisabledOrBlocked(year, month, day);
          const isBlocked = isActuallyBlocked(year, month, day);
          const isPast = isPastDate(year, month, day);
          const isSelectedDay = isSelected(year, month, day);
          const isSundayDate = isSunday(year, month, day);
          const blockedReason = blockedDates.get(dateStr);

          return (
            <button
              key={`${year}-${month}-${day}`}
              onClick={() => {
                if (!isBlockedOrDisabled && !isPast) {
                  const localDate = createLocalDate(year, month, day);
                  onSelect(localDate);
                }
              }}
              disabled={isBlockedOrDisabled || isPast}
              title={isBlocked && blockedReason ? `Blocked: ${blockedReason}` : ''}
              className={`
                h-10 w-10 rounded-xl font-semibold text-sm transition-all
                flex items-center justify-center
                ${
                  isSelectedDay
                    ? 'bg-black text-white shadow-md'
                    : isBlocked
                    ? 'bg-red-100 text-red-700 border-2 border-red-600 cursor-not-allowed'
                    : isSundayDate
                    ? isPast
                      ? 'bg-gray-100 text-red-600 cursor-not-allowed'
                      : 'bg-gray-50 text-red-600 hover:bg-blue-50'
                    : isPast
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-50 text-gray-900 hover:bg-blue-50'
                }
              `}
              type="button"
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
