'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Booking, BookingStatus } from '@/types/booking';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface BookingCalendarProps {
  bookings: Booking[];
  onDateSelect: (date: Date) => void;
  onBookingClick?: (booking: Booking) => void;
  selectedDate?: Date;
  className?: string;
  businessHours?: { openTime: number; closeTime: number };
  statusFilter?: string; // Kept for compatibility, but we'll use internal state for multi-select
  onStatusChange?: (status: string) => void; // Kept for compatibility
}

export function BookingCalendar({
  bookings,
  onDateSelect,
  onBookingClick,
  selectedDate,
  className = '',
  businessHours = { openTime: 9, closeTime: 17 },
  statusFilter: initialStatusFilter = 'all',
  onStatusChange
}: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list'>('month');

  // Filter State
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['pending', 'confirmed', 'completed', 'cancelled']);

  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(selectedDate);
    }
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
        bookingDate.getFullYear() === date.getFullYear() &&
        selectedStatuses.includes(booking.status.toLowerCase())
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
      case BookingStatus.PENDING: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case BookingStatus.CONFIRMED: return 'bg-blue-100 text-blue-700 border-blue-200';
      case BookingStatus.COMPLETED: return 'bg-green-100 text-green-700 border-green-200';
      case BookingStatus.CANCELLED: return 'bg-red-100 text-red-700 border-red-200';
      case BookingStatus.NO_SHOW: return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusBaseColor = (status: string): string => {
    switch (status) {
      case 'pending': return 'bg-yellow-400 border-yellow-400';
      case 'confirmed': return 'bg-blue-500 border-blue-500';
      case 'completed': return 'bg-green-500 border-green-500';
      case 'cancelled': return 'bg-red-500 border-red-500';
      default: return 'bg-gray-400 border-gray-400';
    }
  }

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

  const toggleStatus = (status: string) => {
    if (status === 'all') {
      if (selectedStatuses.length === 4) {
        setSelectedStatuses([]);
      } else {
        setSelectedStatuses(['pending', 'confirmed', 'completed', 'cancelled']);
      }
    } else {
      setSelectedStatuses(prev =>
        prev.includes(status)
          ? prev.filter(s => s !== status)
          : [...prev, status]
      );
    }
  };

  /* Sidebar Component */
  const Sidebar = () => {
    const filters = [
      { id: 'pending', label: 'Pending', color: 'bg-yellow-400' },
      { id: 'confirmed', label: 'Confirmed', color: 'bg-blue-500' },
      { id: 'completed', label: 'Completed', color: 'bg-green-500' },
      { id: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
    ];

    return (
      <div className="w-full lg:w-64 flex-shrink-0 space-y-6 border-r border-gray-100 pr-6">
        {/* Mini Calendar */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-2">
          <Calendar
            mode="single"
            selected={currentDate}
            onSelect={(date) => date && onDateSelect(date)}
            className="rounded-md border-0"
            classNames={{
              head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
              cell: "h-8 w-8 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            }}
          />
        </div>

        {/* Filters */}
        <div>
          <h3 className="font-semibold text-sm text-txt-primary mb-3 px-1">Event Filters</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2 px-1">
              <Checkbox
                id="filter-all"
                checked={selectedStatuses.length === 4}
                onCheckedChange={() => toggleStatus('all')}
                className="border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label
                htmlFor="filter-all"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-txt-secondary cursor-pointer"
              >
                View All
              </label>
            </div>

            {filters.map(filter => (
              <div key={filter.id} className="flex items-center space-x-2 px-1">
                <Checkbox
                  id={`filter-${filter.id}`}
                  checked={selectedStatuses.includes(filter.id)}
                  onCheckedChange={() => toggleStatus(filter.id)}
                  className={`border-gray-300 data-[state=checked]:${filter.color} data-[state=checked]:border-transparent`}
                  style={{
                    backgroundColor: selectedStatuses.includes(filter.id) ? 'var(--checkbox-color)' : undefined,
                    borderColor: selectedStatuses.includes(filter.id) ? 'var(--checkbox-color)' : undefined,
                  }}
                />
                {/* Hack to pass dynamic color to checkbox since tailwind classes might not be safe-listed if dynamic */}
                <style jsx global>{`
                            #filter-${filter.id}[data-state=checked] {
                                background-color: ${filter.color === 'bg-yellow-400' ? '#facc15' :
                    filter.color === 'bg-blue-500' ? '#3b82f6' :
                      filter.color === 'bg-green-500' ? '#22c55e' : '#ef4444'} !important;
                                border-color: transparent !important;
                            }
                         `}</style>

                <label
                  htmlFor={`filter-${filter.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-txt-secondary cursor-pointer"
                >
                  {filter.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /* MONTH VIEW */
  const renderMonthView = () => (
    <div className="space-y-4 h-full flex flex-col">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-200 rounded-t-lg overflow-hidden">
        {weekdays.map((day, idx) => (
          <div
            key={day}
            className={`h-10 flex items-center justify-center font-semibold text-xs uppercase tracking-wider bg-white ${idx === 6 ? 'text-red-500' : 'text-gray-500'}`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 grid-rows-6 gap-px bg-gray-200 border-x border-b border-gray-200 rounded-b-lg overflow-hidden flex-1 min-h-[600px]">
        {getCalendarDays().map((day, idx) => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = day.toDateString() === new Date().toDateString();
          const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
          const dayBookings = getBookingsForDate(day);

          return (
            <div
              key={idx}
              onClick={() => isCurrentMonth && onDateSelect(day)}
              className={`
                  flex flex-col bg-white p-1 transition-all relative group min-h-[100px]
                  ${!isCurrentMonth ? 'bg-gray-50/50' : 'hover:bg-gray-50 cursor-pointer'}
                  ${isSelected ? 'bg-blue-50/30' : ''}
              `}
            >
              <div className="flex justify-between items-start">
                <span className={`
                    text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                    ${isToday
                    ? 'bg-primary text-white shadow-sm'
                    : !isCurrentMonth
                      ? 'text-gray-300'
                      : 'text-gray-700'}
                  `}>
                  {day.getDate()}
                </span>
              </div>

              <div className="flex-1 mt-1 space-y-1 overflow-hidden">
                {dayBookings.slice(0, 3).map((booking, i) => (
                  <div
                    key={booking.id}
                    className={`
                        text-[10px] px-1.5 py-0.5 rounded truncate font-medium border
                        ${getStatusColor(booking.status)}
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookingClick?.(booking);
                    }}
                  >
                    {booking.customer?.name || 'Unknown'}
                  </div>
                ))}
                {dayBookings.length > 3 && (
                  <div className="text-[10px] text-gray-500 font-medium pl-1">
                    +{dayBookings.length - 3} more
                  </div>
                )}
              </div>
            </div>
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
      <div className="space-y-4 h-full overflow-hidden flex flex-col">
        {/* Day headers */}
        <div className="grid grid-cols-8 gap-0 border-b border-gray-200 pb-2">
          <div className="w-16"></div> {/* Time column spacer */}
          {days.map(day => {
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div
                key={day.toISOString()}
                className="text-center"
              >
                <div className={`text-xs font-medium uppercase ${isToday ? 'text-primary' : 'text-gray-500'}`}>
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-lg font-semibold ${isToday ? 'text-primary' : 'text-gray-900'}`}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Hours grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="grid grid-cols-8 gap-0">
            {/* Time sidebar */}
            <div className="w-16 border-r border-gray-100">
              {hours.map(hour => (
                <div key={hour} className="h-20 text-xs text-gray-400 text-right pr-2 pt-2 relative">
                  <span className="relative -top-3">{hour.toString().padStart(2, '0')}:00</span>
                </div>
              ))}
            </div>

            {/* Days columns */}
            {days.map(day => (
              <div key={day.toISOString()} className="border-r border-gray-100 relative min-h-[800px]">
                {/* Grid lines */}
                {hours.map(hour => (
                  <div key={hour} className="h-20 border-b border-gray-50"></div>
                ))}

                {/* Events */}
                {getBookingsForDate(day).map(booking => {
                  const startHour = toDate(booking.scheduledAt).getHours();
                  const startMin = toDate(booking.scheduledAt).getMinutes();
                  const duration = booking.duration || 60; // default 60 mins

                  // Calculate position
                  const top = ((startHour - businessHours.openTime) * 80) + ((startMin / 60) * 80);
                  const height = (duration / 60) * 80;

                  return (
                    <div
                      key={booking.id}
                      className={`
                                    absolute left-0.5 right-0.5 rounded border p-1 overflow-hidden cursor-pointer hover:brightness-95 transition-all
                                    ${getStatusColor(booking.status)}
                                `}
                      style={{ top: `${top}px`, height: `${height}px` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onBookingClick?.(booking);
                      }}
                    >
                      <div className="font-semibold text-xs truncate">{booking.customer?.name}</div>
                      <div className="text-[10px] opacity-90 truncate">{booking.service?.name}</div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /* DAY VIEW */
  const renderDayView = () => {
    const dayBookings = getBookingsForDate(currentDate);
    const hours = Array.from({ length: businessHours.closeTime - businessHours.openTime }, (_, i) => businessHours.openTime + i);

    return (
      <div className="space-y-4 h-full overflow-hidden flex flex-col">
        {/* Day Header */}
        <div className="text-center border-b border-gray-200 pb-4">
          <div className="text-sm font-medium text-gray-500 uppercase">
            {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {currentDate.getDate()}
          </div>
        </div>

        {/* Hours list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="relative min-h-[800px]">
            {hours.map(hour => (
              <div key={hour} className="flex h-20 border-b border-gray-50 group">
                <div className="w-20 text-xs text-gray-400 text-right pr-4 pt-2 border-r border-gray-100">
                  <span className="relative -top-3">{hour.toString().padStart(2, '0')}:00</span>
                </div>
                <div className="flex-1 relative">
                  {/* Events for this hour */}
                  {dayBookings
                    .filter(b => toDate(b.scheduledAt).getHours() === hour)
                    .map(booking => {
                      const startMin = toDate(booking.scheduledAt).getMinutes();
                      const duration = booking.duration || 60;
                      const top = (startMin / 60) * 80;
                      const height = (duration / 60) * 80;

                      return (
                        <div
                          key={booking.id}
                          className={`
                                                absolute left-2 right-2 rounded border p-2 overflow-hidden cursor-pointer hover:brightness-95 transition-all flex items-center justify-between
                                                ${getStatusColor(booking.status)}
                                            `}
                          style={{ top: `${top}px`, height: `${height}px`, minHeight: '40px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onBookingClick?.(booking);
                          }}
                        >
                          <div>
                            <div className="font-semibold text-sm">{booking.customer?.name}</div>
                            <div className="text-xs opacity-90">{booking.service?.name}</div>
                          </div>
                          <div className="text-xs font-mono opacity-80">
                            {formatTime(toDate(booking.scheduledAt))} - {formatTime(new Date(toDate(booking.scheduledAt).getTime() + booking.duration * 60000))}
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full bg-white rounded-card shadow-card p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        {/* Left: Title & Navigation */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-gray-200"
              onClick={() => viewMode === 'month' ? navigateMonth('prev') : viewMode === 'week' ? navigateWeek('prev') : navigateDay('prev')}
            >
              <i className='bx bx-chevron-left text-lg'></i>
            </Button>
            <h2 className="text-xl font-bold text-gray-900 min-w-[180px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-gray-200"
              onClick={() => viewMode === 'month' ? navigateMonth('next') : viewMode === 'week' ? navigateWeek('next') : navigateDay('next')}
            >
              <i className='bx bx-chevron-right text-lg'></i>
            </Button>
          </div>
        </div>

        {/* Right: View Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {(['month', 'week', 'day'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`
                        px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize
                        ${viewMode === mode
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}
                    `}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Calendar Area */}
        <div className="flex-1 min-w-0 min-h-[600px]">
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </div>
      </div>
    </div>
  );
}