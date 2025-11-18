'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Booking, BookingStatus } from '@/types/booking';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BookingCalendarProps {
  bookings: Booking[];
  onDateSelect: (date: Date) => void;
  onBookingClick?: (booking: Booking) => void;
  selectedDate?: Date;
  className?: string;
  businessHours?: { openTime: number; closeTime: number };
}

export function BookingCalendar({
  bookings,
  onDateSelect,
  onBookingClick,
  selectedDate,
  className = '',
  businessHours = { openTime: 9, closeTime: 17 }
}: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  useEffect(() => {
    setCurrentDate(selectedDate || new Date());
  }, [selectedDate]);

  const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const toDate = (scheduledAt: Date | string): Date =>
    typeof scheduledAt === 'string' ? new Date(scheduledAt) : scheduledAt;

  const getBookingsForDate = (date: Date): Booking[] => (
    bookings.filter(booking => {
      const bookingDate = toDate(booking.scheduledAt);
      return (
        bookingDate.getDate() === date.getDate() &&
        bookingDate.getMonth() === date.getMonth() &&
        bookingDate.getFullYear() === date.getFullYear()
      );
    })
  );

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - ((currentDate.getDay() + 6) % 7));
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const firstDayWeekday = (firstDay.getDay() + 6) % 7;
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDayWeekday);

    const days = [];
    for (let i = 0; i < 42; i++) {
      days.push(new Date(startDate));
      startDate.setDate(startDate.getDate() + 1);
    }
    return days;
  };

  const formatTime = (date: Date): string =>
    date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

  const getStatusColor = (status: BookingStatus): string => {
    switch (status) {
      case BookingStatus.PENDING: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case BookingStatus.CONFIRMED: return 'bg-blue-100 text-blue-800 border-blue-200';
      case BookingStatus.COMPLETED: return 'bg-green-100 text-green-800 border-green-200';
      case BookingStatus.CANCELLED: return 'bg-red-100 text-red-800 border-red-200';
      case BookingStatus.NO_SHOW: return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getInitials = (name: string): string => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  /* Booking detail yang ditampilkan di kanan */
  const BookingDetailPanel = () => {
    const displayDate = currentDate; // Always use currentDate (dari navigation)
    const bookingsForDate = getBookingsForDate(displayDate);
    
    return (
      <div className="flex-1 pl-4 border-l border-gray-200">
        <h3 className="font-semibold text-sm mb-3">
          {displayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {bookingsForDate.length === 0 ? (
            <p className="text-xs text-gray-400">No bookings for this date</p>
          ) : (
            bookingsForDate.map(booking => (
              <div
                key={booking.id}
                className={`p-2 rounded border cursor-pointer hover:shadow-sm transition ${getStatusColor(booking.status)}`}
                onClick={() => onBookingClick?.(booking)}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs">{booking.customer?.name}</div>
                    <div className="text-xs">{booking.service?.name}</div>
                    <div className="text-xs">
                      {formatTime(toDate(booking.scheduledAt))} -{' '}
                      {formatTime(new Date(toDate(booking.scheduledAt).getTime() + booking.duration * 60000))}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs px-1 flex-shrink-0">{booking.status}</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  /* MONTH VIEW */
  const renderMonthView = () => (
    <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="rounded-full bg-gray-100 hover:bg-gray-200 p-1 flex items-center transition"
            type="button"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </button>
          <span className="text-xl font-bold text-gray-900 whitespace-nowrap">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button
            onClick={() => navigateMonth('next')}
            className="rounded-full bg-gray-100 hover:bg-gray-200 p-1 flex items-center transition"
            type="button"
          >
            <ChevronRight className="h-5 w-5 text-gray-700" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs px-2">
                {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setViewMode('month')}>
                Month View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode('week')}>
                Week View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode('day')}>
                Day View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2">
          {weekdays.map((day, idx) => (
            <div
              key={day}
              className={`h-12 w-12 flex items-center justify-center font-semibold text-xs text-center ${idx === 6 ? 'text-red-600' : 'text-gray-600'}`}
            >
              {day}
            </div>
          ))}
        </div>
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {getCalendarDays().map((day, idx) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
            const isSunday = day.getDay() === 0;
            const dayBookings = getBookingsForDate(day);
            return (
              <button
                key={idx}
                onClick={() => isCurrentMonth && onDateSelect(day)}
                disabled={!isCurrentMonth}
                className={`
                  flex items-center justify-center rounded-lg font-semibold text-xs
                  h-12 w-12 transition-all relative select-none
                  ${isSelected ? 'bg-black text-white shadow' :
                    isCurrentMonth ? (
                      isSunday ? 'bg-gray-50 text-red-600 hover:bg-blue-50' :
                        'bg-gray-50 text-gray-900 hover:bg-blue-50'
                    )
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                  ${isToday ? 'ring-2 ring-blue-400' : ''}
                  group
                `}
                type="button"
              >
                <span className="relative z-10">{day.getDate()}</span>
                {dayBookings.length > 0 && isCurrentMonth && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
                    {dayBookings.slice(0, 3).map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
    </div>
  );

  /* WEEK VIEW */
  const renderWeekView = () => {
    const days = getWeekDays();
    const hours = Array.from({ length: businessHours.closeTime - businessHours.openTime }, (_, i) => businessHours.openTime + i);

    return (
      <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <button
              onClick={() => navigateWeek('prev')}
              className="rounded-full bg-gray-100 hover:bg-gray-200 p-1 flex items-center transition"
              type="button"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>
            <span className="text-xl font-bold text-gray-900 whitespace-nowrap">
              Week {Math.ceil((days[0].getDate() / 7))}
            </span>
            <button
              onClick={() => navigateWeek('next')}
              className="rounded-full bg-gray-100 hover:bg-gray-200 p-1 flex items-center transition"
              type="button"
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs px-2">
                  {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setViewMode('month')}>
                  Month View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode('week')}>
                  Week View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode('day')}>
                  Day View
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* Day headers */}
          <div className="flex gap-2 mb-2">
            <div className="w-12 flex-shrink-0"></div>
            <div className="flex gap-2">
              {days.map(day => {
                const isToday = day.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={day.toISOString()}
                    className={`w-12 h-12 p-1 text-center border rounded text-xs flex flex-col items-center justify-center flex-shrink-0 ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <div className="text-xs text-gray-500">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div className="text-xs font-medium">{day.getDate()}</div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Hours grid - fixed width */}
          <div className="flex gap-2 max-h-96 overflow-x-auto pb-2">
            <div className="w-12 space-y-2 flex-shrink-0">
              {hours.map(hour => (
                <div key={hour} className="h-12 text-xs text-gray-500 text-right pr-1 flex items-center justify-end">
                  {hour.toString().padStart(2, '0')}
                </div>
              ))}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {days.map(day => {
                const dayBookings = getBookingsForDate(day);
                const bookingsByHour = dayBookings.reduce((acc, booking) => {
                  const hour = toDate(booking.scheduledAt).getHours();
                  if (!acc[hour]) acc[hour] = [];
                  acc[hour].push(booking);
                  return acc;
                }, {} as Record<number, Booking[]>);
                return (
                  <div key={day.toISOString()} className="w-12 space-y-2 flex-shrink-0">
                    {hours.map(hour => {
                      const hasBooking = bookingsByHour[hour];
                      const bookingCount = hasBooking ? bookingsByHour[hour].length : 0;
                      const initials = hasBooking ? getInitials(bookingsByHour[hour][0].customer?.name || '') : '';
                      return (
                        <div
                          key={hour}
                          className={`h-12 rounded cursor-pointer transition flex items-center justify-center text-xs font-semibold relative ${
                            hasBooking ? 'bg-blue-200 hover:bg-blue-300 text-blue-900' : 'bg-gray-100 hover:bg-gray-200 text-gray-400'
                          }`}
                          onClick={() => onDateSelect(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour))}
                          title={hasBooking ? `${bookingCount} booking(s)` : 'No bookings'}
                        >
                          {initials}
                          {bookingCount > 1 && (
                            <div className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center transform translate-x-1 -translate-y-1">
                              {bookingCount}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
      </div>
    );
  };

  /* DAY VIEW */
  const renderDayView = () => {
    const dayBookings = getBookingsForDate(currentDate);
    const hours = Array.from({ length: businessHours.closeTime - businessHours.openTime }, (_, i) => businessHours.openTime + i);
    const bookingsByHour = dayBookings.reduce((acc, booking) => {
      const hour = toDate(booking.scheduledAt).getHours();
      if (!acc[hour]) acc[hour] = [];
      acc[hour].push(booking);
      return acc;
    }, {} as Record<number, Booking[]>);

    return (
      <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <button
              onClick={() => navigateDay('prev')}
              className="rounded-full bg-gray-100 hover:bg-gray-200 p-1 flex items-center transition"
              type="button"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>
            <span className="text-xl font-bold text-gray-900 whitespace-nowrap">
              {currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <button
              onClick={() => navigateDay('next')}
              className="rounded-full bg-gray-100 hover:bg-gray-200 p-1 flex items-center transition"
              type="button"
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs px-2">
                  {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setViewMode('month')}>
                  Month View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode('week')}>
                  Week View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode('day')}>
                  Day View
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* Hours list */}
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {hours.map(hour => {
              const hourBookings = bookingsByHour[hour] || [];
              return (
                <div key={hour} className="flex items-start gap-2 p-1 border rounded hover:bg-blue-50 cursor-pointer bg-white text-xs">
                  <div className="w-12 text-gray-500 flex-shrink-0 pt-1">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  <div className="flex-1 space-y-1">
                    {hourBookings.length === 0 ? (
                      <div className="text-gray-400">-</div>
                    ) : (
                      hourBookings.map(booking => (
                        <div
                          key={booking.id}
                          className={`p-1 rounded cursor-pointer border ${getStatusColor(booking.status)}`}
                          onClick={e => {
                            e.stopPropagation();
                            onBookingClick?.(booking);
                          }}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-xs">{booking.customer?.name}</div>
                              <div className="text-xs text-gray-600">{booking.service?.name}</div>
                            </div>
                            <Badge variant="outline" className="text-xs px-1 flex-shrink-0">{booking.status}</Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
      </div>
    );
  };

  return (
    <div className={`min-h-fit w-full px-2 py-2 ${className}`}>
      {viewMode === 'week' ? (
        // Week view - full width
        <div>
          {renderWeekView()}
        </div>
      ) : (
        // Month and Day views - 2 column layout
        <div className="flex gap-4 w-full">
          <div className="w-96 flex-shrink-0">
            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'day' && renderDayView()}
          </div>

          {/* Booking detail panel */}
          <div className="w-72 pl-4 border-l border-gray-200 flex-shrink-0">
            <BookingDetailPanel />
          </div>
        </div>
      )}
    </div>
  );
}
