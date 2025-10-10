'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TimeSlot, Booking, BookingStatus } from '@/types/booking';

interface BookingCalendarProps {
  bookings: Booking[];
  onDateSelect: (date: Date) => void;
  onBookingClick?: (booking: Booking) => void;
  selectedDate?: Date;
  className?: string;
}

export function BookingCalendar({
  bookings,
  onDateSelect,
  onBookingClick,
  selectedDate,
  className = ''
}: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date): Booking[] => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.scheduledAt);
      return (
        bookingDate.getDate() === date.getDate() &&
        bookingDate.getMonth() === date.getMonth() &&
        bookingDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Get status color
  const getStatusColor = (status: BookingStatus): string => {
    switch (status) {
      case BookingStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case BookingStatus.CONFIRMED:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case BookingStatus.COMPLETED:
        return 'bg-green-100 text-green-800 border-green-200';
      case BookingStatus.CANCELLED:
        return 'bg-red-100 text-red-800 border-red-200';
      case BookingStatus.NO_SHOW:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Navigate weeks
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  // Navigate days
  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  // Get calendar days for month view
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDay = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return days;
  };

  // Get week days
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Format time
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Render month view
  const renderMonthView = () => {
    const days = getCalendarDays();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const dayBookings = getBookingsForDate(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();

            return (
              <div
                key={index}
                className={`
                  min-h-[80px] p-1 border border-gray-200 cursor-pointer hover:bg-gray-50
                  ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
                  ${isToday ? 'bg-blue-50 border-blue-200' : ''}
                  ${isSelected ? 'bg-blue-100 border-blue-300' : ''}
                `}
                onClick={() => onDateSelect(day)}
              >
                <div className="text-sm font-medium mb-1">
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayBookings.slice(0, 2).map(booking => (
                    <div
                      key={booking.id}
                      className={`
                        text-xs p-1 rounded cursor-pointer truncate
                        ${getStatusColor(booking.status)}
                      `}
                      onClick={(e) => {
                        e.stopPropagation();
                        onBookingClick?.(booking);
                      }}
                    >
                      {formatTime(new Date(booking.scheduledAt))} {booking.customer?.name}
                    </div>
                  ))}
                  {dayBookings.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{dayBookings.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const days = getWeekDays();
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Week of {days[0].toLocaleDateString()}
          </h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Week grid */}
        <div className="grid grid-cols-8 gap-1">
          {/* Time column */}
          <div className="space-y-1">
            <div className="h-12"></div> {/* Header spacer */}
            {hours.map(hour => (
              <div key={hour} className="h-12 text-xs text-gray-500 pr-2 text-right">
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map(day => {
            const dayBookings = getBookingsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div key={day.toISOString()} className="space-y-1">
                {/* Day header */}
                <div className={`
                  h-12 p-2 text-center border border-gray-200 rounded
                  ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}
                `}>
                  <div className="text-xs text-gray-500">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-sm font-medium">
                    {day.getDate()}
                  </div>
                </div>

                {/* Hour slots */}
                {hours.map(hour => {
                  const hourBookings = dayBookings.filter(booking => {
                    const bookingHour = new Date(booking.scheduledAt).getHours();
                    return bookingHour === hour;
                  });

                  return (
                    <div
                      key={hour}
                      className="h-12 border border-gray-200 p-1 cursor-pointer hover:bg-gray-50"
                      onClick={() => onDateSelect(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour))}
                    >
                      {hourBookings.map(booking => (
                        <div
                          key={booking.id}
                          className={`
                            text-xs p-1 rounded cursor-pointer truncate
                            ${getStatusColor(booking.status)}
                          `}
                          onClick={(e) => {
                            e.stopPropagation();
                            onBookingClick?.(booking);
                          }}
                        >
                          {booking.customer?.name}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render day view
  const renderDayView = () => {
    const dayBookings = getBookingsForDate(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {currentDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDay('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDay('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Day schedule */}
        <div className="space-y-1">
          {hours.map(hour => {
            const hourBookings = dayBookings.filter(booking => {
              const bookingHour = new Date(booking.scheduledAt).getHours();
              return bookingHour === hour;
            });

            return (
              <div
                key={hour}
                className="flex items-center space-x-4 p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer"
                onClick={() => onDateSelect(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour))}
              >
                <div className="w-16 text-sm text-gray-500">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 space-y-2">
                  {hourBookings.map(booking => (
                    <div
                      key={booking.id}
                      className={`
                        p-3 rounded-lg cursor-pointer border
                        ${getStatusColor(booking.status)}
                      `}
                      onClick={(e) => {
                        e.stopPropagation();
                        onBookingClick?.(booking);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{booking.customer?.name}</div>
                          <div className="text-sm">{booking.service?.name}</div>
                          <div className="text-xs">
                            {formatTime(new Date(booking.scheduledAt))} - 
                            {formatTime(new Date(new Date(booking.scheduledAt).getTime() + booking.duration * 60000))}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {hourBookings.length === 0 && (
                    <div className="text-sm text-gray-400 italic">
                      No bookings
                    </div>
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
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Booking Calendar</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              Day
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
      </CardContent>
    </Card>
  );
}