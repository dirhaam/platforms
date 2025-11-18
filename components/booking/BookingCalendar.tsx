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

  const toDate = (scheduledAt: Date | string): Date => (
    typeof scheduledAt === 'string' ? new Date(scheduledAt) : scheduledAt
  );

  const getBookingsForDate = (date: Date): Booking[] => {
    return bookings.filter(booking => {
      const bookingDate = toDate(booking.scheduledAt);
      return (
        bookingDate.getDate() === date.getDate() &&
        bookingDate.getMonth() === date.getMonth() &&
        bookingDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // For week view: get all bookings per day mapped by hour
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

  // =============== Month View Update ===============
  const renderMonthView = () => (
    <div className="space-y-6 max-w-md px-2">
      {/* Header bulan */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateMonth('prev')}
          className="w-9 h-9 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition"
          type="button"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="text-center flex-1">
          <div className="text-xl font-bold text-gray-900 tracking-wide">
            {monthNames[currentDate.getMonth()]} <span>{currentDate.getFullYear()}</span>
          </div>
        </div>
        <button
          onClick={() => navigateMonth('next')}
          className="w-9 h-9 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition"
          type="button"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>
      {/* Weekday Header */}
      <div className="grid grid-cols-7 gap-x-2 mb-2">
        {weekdays.map((day, index) => (
          <div
            key={day}
            className={`h-10 w-10 md:h-11 md:w-11 flex items-center justify-center font-semibold text-xs md:text-sm text-center
              ${index === 6 ? 'text-red-600' : 'text-gray-600'}`}
          >
            {day}
          </div>
        ))}
      </div>
      {/* Grid tanggal */}
      <div className="grid grid-cols-7 gap-x-2 gap-y-2">
        {getCalendarDays().map((day, index) => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = day.toDateString() === new Date().toDateString();
          const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
          const isSunday = day.getDay() === 0;
          const dayBookings = getBookingsForDate(day);
          return (
            <button
              key={index}
              onClick={() => isCurrentMonth && onDateSelect(day)}
              disabled={!isCurrentMonth}
              className={`
                flex items-center justify-center rounded-xl font-semibold text-xs md:text-sm
                h-10 w-10 md:h-11 md:w-11 transition-all relative select-none
                ${isSelected ? 'bg-black text-white shadow' : 
                  isCurrentMonth ? 
                    isSunday ? 'bg-gray-50 text-red-600 hover:bg-blue-50' : 'bg-gray-50 text-gray-900 hover:bg-blue-50' :
                  'bg-gray-100 text-gray-400 cursor-not-allowed'}
                ${isToday ? 'ring-2 ring-blue-400' : ''}
                group
              `}
              type="button"
            >
              <span className="relative z-10">{day.getDate()}</span>
              {/* Booking dots */}
              {dayBookings.length > 0 && isCurrentMonth && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                  {dayBookings.slice(0, 3).map((_, i) => (
                    <div key={i} className="w-1 h-1 rounded-full bg-blue-500" />
                  ))}
                </div>
              )}
              {/* Tooltip */}
              {dayBookings.length > 0 && (
                <div className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
                  {dayBookings.length} booking{dayBookings.length > 1 ? 's' : ''}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  // ============== Week View: Show all hours in business hours ==============
  const renderWeekView = () => {
    const days = getWeekDays();
    const hours = Array.from({ length: businessHours.closeTime - businessHours.openTime }, (_, i) => businessHours.openTime + i);
    
    return (
      <div className="space-y-4 max-w-md">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Week of {days[0].toLocaleDateString()}</div>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Navigate
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigateWeek('prev')}>
                  Previous Week
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigateWeek('next')}>
                  Next Week
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {/* Day headers */}
        <div className="grid grid-cols-8 gap-x-2 gap-y-2">
          <div></div>
          {days.map(day => {
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div
                key={day.toISOString()}
                className={`h-12 p-2 text-center border border-gray-200 rounded ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}
              >
                <div className="text-xs text-gray-500">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className="text-sm font-medium">{day.getDate()}</div>
              </div>
            );
          })}
        </div>
        {/* Hours grid */}
        <div className="grid grid-cols-8 gap-x-2 gap-y-2 overflow-y-auto max-h-96">
          <div className="space-y-2">
            {hours.map(hour => (
              <div key={hour} className="h-12 text-xs text-gray-500 text-right pr-2 flex items-center justify-end">
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>
          {days.map(day => {
            const dayBookings = getBookingsForDate(day);
            const bookingsByHour = dayBookings.reduce((acc, booking) => {
              const hour = toDate(booking.scheduledAt).getHours();
              if (!acc[hour]) acc[hour] = [];
              acc[hour].push(booking);
              return acc;
            }, {} as Record<number, Booking[]>);
            return (
              <div key={day.toISOString()} className="space-y-2">
                {hours.map(hour => (
                  <div
                    key={hour}
                    className="h-12 border border-gray-200 rounded p-1 cursor-pointer hover:bg-blue-50 bg-white"
                    onClick={() => onDateSelect(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour))}
                  >
                    {bookingsByHour[hour] && bookingsByHour[hour].map(booking => (
                      <div
                        key={booking.id}
                        className={`text-xs p-0.5 rounded truncate ${getStatusColor(booking.status)}`}
                        onClick={e => {
                          e.stopPropagation();
                          onBookingClick?.(booking);
                        }}
                        title={booking.customer?.name}
                      >
                        {booking.customer?.name}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // =============== Day view: show all hours in business hours ===============
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
      <div className="space-y-4 max-w-md">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">{currentDate.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })}</div>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Navigate
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigateDay('prev')}>
                  Previous Day
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigateDay('next')}>
                  Next Day
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {hours.map(hour => {
            const hourBookings = bookingsByHour[hour] || [];
            return (
              <div key={hour} className="flex items-start space-x-4 border rounded px-3 py-2 hover:bg-blue-50 cursor-pointer bg-white">
                <div className="w-16 text-sm text-gray-500 pt-1 flex-shrink-0">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 space-y-2">
                  {hourBookings.length === 0 ? (
                    <div className="text-xs text-gray-400">-</div>
                  ) : (
                    hourBookings.map(booking => (
                      <div
                        key={booking.id}
                        className={`p-2 rounded-lg cursor-pointer border ${getStatusColor(booking.status)}`}
                        onClick={e => {
                          e.stopPropagation();
                          onBookingClick?.(booking);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{booking.customer?.name}</div>
                            <div className="text-xs text-gray-600">{booking.service?.name}</div>
                            <div className="text-xs">
                              {formatTime(toDate(booking.scheduledAt))} -{' '}
                              {formatTime(new Date(toDate(booking.scheduledAt).getTime() + booking.duration * 60000))}
                            </div>
                          </div>
                          <Badge variant="outline" className="ml-2 flex-shrink-0">{booking.status}</Badge>
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

  // ========== Return UI tanpa Card di dalam ==========
  return (
    <div className={`min-h-fit w-full ${className}`}>
      {/* Header: Judul dan mode */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 font-semibold text-lg">
          <Calendar className="h-5 w-5" />
          <span>Booking Calendar</span>
        </div>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={viewMode === 'month' ? 'default' : 'outline'} size="sm">
                {viewMode === 'month' ? 'Month' : viewMode === 'week' ? 'Week' : 'Day'}
                <ChevronDown className="h-4 w-4 ml-1" />
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
      </div>
      {/* Main Content */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}
    </div>
  );
}
