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

interface BookingCalendarProps {
  bookings: Booking[];
  onDateSelect: (date: Date) => void;
  onBookingClick?: (booking: Booking) => void;
  selectedDate?: Date;
  className?: string;
  businessHours?: { openTime: number; closeTime: number };
  statusFilter?: string;
  onStatusChange?: (status: string) => void;
}

export function BookingCalendar({
  bookings,
  onDateSelect,
  onBookingClick,
  selectedDate,
  className = '',
  businessHours = { openTime: 9, closeTime: 17 },
  statusFilter = 'all',
  onStatusChange
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
      case BookingStatus.PENDING: return 'bg-yellow-100 text-warning border-yellow-200';
      case BookingStatus.CONFIRMED: return 'bg-primary-light text-primary border-primary-light';
      case BookingStatus.COMPLETED: return 'bg-green-100 text-success border-green-200';
      case BookingStatus.CANCELLED: return 'bg-red-100 text-danger border-red-200';
      case BookingStatus.NO_SHOW: return 'bg-gray-100 text-secondary border-gray-200';
      default: return 'bg-gray-100 text-secondary border-gray-200';
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

  /* Filter Panel (Left Side) */
  const FilterPanel = () => {
    const filters = [
      { id: 'all', label: 'All Events', color: 'bg-gray-100 border-gray-200' },
      { id: 'pending', label: 'Pending', color: 'bg-yellow-100 border-yellow-200' },
      { id: 'confirmed', label: 'Confirmed', color: 'bg-primary-light border-primary-light' },
      { id: 'completed', label: 'Completed', color: 'bg-green-100 border-green-200' },
      { id: 'cancelled', label: 'Cancelled', color: 'bg-red-100 border-red-200' },
    ];

    return (
      <div className="w-full lg:w-48 flex-shrink-0 space-y-4">
        <h3 className="font-semibold text-sm text-txt-primary mb-2">Filters</h3>
        <div className="space-y-2">
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => onStatusChange?.(filter.id)}
              className={`
                w-full text-left px-3 py-2 rounded-md text-sm transition-all flex items-center gap-2
                ${statusFilter === filter.id
                  ? 'bg-white shadow-sm ring-1 ring-primary text-primary font-medium'
                  : 'text-txt-secondary hover:bg-gray-50'}
              `}
            >
              <div className={`w-3 h-3 rounded-full border ${filter.color}`}></div>
              {filter.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  /* Booking detail yang ditampilkan di kanan */
  const BookingDetailPanel = () => {
    const displayDate = currentDate;
    const bookingsForDate = getBookingsForDate(displayDate);

    return (
      <div className="flex-1 pl-4 border-l border-gray-200">
        <h3 className="font-semibold text-sm mb-4 text-txt-primary flex items-center gap-2">
          <i className='bx bx-calendar-event text-primary'></i>
          {displayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h3>
        <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
          {bookingsForDate.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <i className='bx bx-coffee text-2xl text-txt-muted mb-2'></i>
              <p className="text-xs text-txt-secondary">No bookings for this date</p>
            </div>
          ) : (
            bookingsForDate.map(booking => (
              <div
                key={booking.id}
                className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all duration-200 ${getStatusColor(booking.status)}`}
                onClick={() => onBookingClick?.(booking)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm mb-1 truncate">{booking.customer?.name}</div>
                    <div className="text-xs opacity-90 mb-1">{booking.service?.name}</div>
                    <div className="text-xs font-mono flex items-center gap-1 opacity-80">
                      <i className='bx bx-time'></i>
                      {formatTime(toDate(booking.scheduledAt))} -{' '}
                      {formatTime(new Date(toDate(booking.scheduledAt).getTime() + booking.duration * 60000))}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] px-1.5 h-5 bg-white/50 border-0 shadow-sm flex-shrink-0">{booking.status}</Badge>
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
      <div className="relative flex items-center justify-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="rounded-full bg-gray-50 hover:bg-primary-light hover:text-primary p-2 flex items-center transition-colors text-txt-secondary"
            type="button"
          >
            <i className='bx bx-chevron-left text-xl'></i>
          </button>
          <span className="text-lg font-bold text-txt-primary w-48 text-center select-none">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button
            onClick={() => navigateMonth('next')}
            className="rounded-full bg-gray-50 hover:bg-primary-light hover:text-primary p-2 flex items-center transition-colors text-txt-secondary"
            type="button"
          >
            <i className='bx bx-chevron-right text-xl'></i>
          </button>
        </div>

        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-32 justify-between text-xs px-3 h-9 border-gray-200 text-txt-secondary">
                {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View
                <i className='bx bx-chevron-down text-base'></i>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
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

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2">
        {weekdays.map((day, idx) => (
          <div
            key={day}
            className={`h-8 flex items-center justify-center font-semibold text-xs uppercase tracking-wider text-center ${idx === 6 ? 'text-danger' : 'text-txt-muted'}`}
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
                  flex flex-col items-center justify-center rounded-lg font-semibold text-sm
                  h-10 w-full transition-all relative select-none
                  ${isSelected
                  ? 'bg-primary text-white shadow-lg shadow-primary/40'
                  : isCurrentMonth
                    ? (isSunday ? 'text-danger hover:bg-red-50' : 'text-txt-primary hover:bg-primary-light/50 hover:text-primary')
                    : 'text-gray-300 cursor-not-allowed'}
                  ${isToday && !isSelected ? 'ring-1 ring-primary text-primary bg-white' : ''}
                  group
                `}
              type="button"
            >
              <span className="relative z-10">{day.getDate()}</span>
              {dayBookings.length > 0 && isCurrentMonth && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayBookings.slice(0, 3).map((_, i) => (
                    <div key={i} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-primary'}`} />
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
        <div className="relative flex items-center justify-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateWeek('prev')}
              className="rounded-full bg-gray-50 hover:bg-primary-light hover:text-primary p-2 flex items-center transition-colors text-txt-secondary"
              type="button"
            >
              <i className='bx bx-chevron-left text-xl'></i>
            </button>
            <span className="text-lg font-bold text-txt-primary w-48 text-center select-none">
              Week {Math.ceil((days[0].getDate() / 7))}
            </span>
            <button
              onClick={() => navigateWeek('next')}
              className="rounded-full bg-gray-50 hover:bg-primary-light hover:text-primary p-2 flex items-center transition-colors text-txt-secondary"
              type="button"
            >
              <i className='bx bx-chevron-right text-xl'></i>
            </button>
          </div>

          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-32 justify-between text-xs px-3 h-9 border-gray-200 text-txt-secondary">
                  {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View
                  <i className='bx bx-chevron-down text-base'></i>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
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

        {/* Day headers */}
        <div className="flex gap-2 mb-2 overflow-hidden pl-12">
          {days.map(day => {
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div
                key={day.toISOString()}
                className={`flex-1 p-1 text-center rounded-md text-xs flex flex-col items-center justify-center
                     ${isToday ? 'bg-primary-light text-primary font-bold' : 'bg-gray-50 text-txt-secondary'}
                  `}
              >
                <div className="text-[10px] opacity-70 uppercase">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className="text-sm">{day.getDate()}</div>
              </div>
            );
          })}
        </div>
        {/* Hours grid */}
        <div className="relative h-[400px] overflow-y-auto custom-scrollbar">
          {/* Time sidebar */}
          <div className="absolute left-0 top-0 w-10 space-y-2 pt-2">
            {hours.map(hour => (
              <div key={hour} className="h-12 text-[10px] text-txt-muted text-right pr-2 font-medium relative top-[-6px]">
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="ml-10 grid grid-cols-7 gap-2 pt-2">
            {days.map(day => {
              return (
                <div key={day.toISOString()} className="space-y-2">
                  {hours.map(hour => {
                    const dayBookings = getBookingsForDate(day);
                    const bookingsInHour = dayBookings.filter(b => toDate(b.scheduledAt).getHours() === hour);
                    const hasBooking = bookingsInHour.length > 0;

                    return (
                      <div
                        key={hour}
                        onClick={() => onDateSelect(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour))}
                        className={`
                                     h-12 rounded border border-transparent hover:border-primary/30 transition-all cursor-pointer relative
                                     ${hasBooking ? 'bg-primary-light/50 border-primary/20' : 'bg-gray-50/50 hover:bg-gray-100'}
                                  `}
                      >
                        {hasBooking && (
                          <div className="absolute inset-0.5 bg-primary rounded-sm text-[10px] text-white flex items-center justify-center font-bold shadow-sm">
                            {bookingsInHour.length > 1 ? `${bookingsInHour.length}` : getInitials(bookingsInHour[0].customer?.name || '')}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
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
        <div className="relative flex items-center justify-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateDay('prev')}
              className="rounded-full bg-gray-50 hover:bg-primary-light hover:text-primary p-2 flex items-center transition-colors text-txt-secondary"
              type="button"
            >
              <i className='bx bx-chevron-left text-xl'></i>
            </button>
            <span className="text-lg font-bold text-txt-primary w-48 text-center select-none">
              {currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <button
              onClick={() => navigateDay('next')}
              className="rounded-full bg-gray-50 hover:bg-primary-light hover:text-primary p-2 flex items-center transition-colors text-txt-secondary"
              type="button"
            >
              <i className='bx bx-chevron-right text-xl'></i>
            </button>
          </div>

          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-32 justify-between text-xs px-3 h-9 border-gray-200 text-txt-secondary">
                  {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View
                  <i className='bx bx-chevron-down text-base'></i>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
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

        {/* Hours list */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
          {hours.map(hour => {
            const hourBookings = bookingsByHour[hour] || [];
            return (
              <div key={hour} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group">
                <div className="w-14 pt-2 text-xs font-semibold text-txt-muted text-right">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 space-y-2 pt-1">
                  {hourBookings.length === 0 ? (
                    <div className="h-8 border-b border-gray-100 group-hover:border-dashed group-hover:border-gray-300 w-full"></div>
                  ) : (
                    hourBookings.map(booking => (
                      <div
                        key={booking.id}
                        className={`p-3 rounded-md border cursor-pointer shadow-sm hover:shadow-md transition-all ${getStatusColor(booking.status)}`}
                        onClick={e => {
                          e.stopPropagation();
                          onBookingClick?.(booking);
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm">{booking.customer?.name}</div>
                            <div className="text-xs opacity-90">{booking.service?.name}</div>
                          </div>
                          <Badge variant="outline" className="text-[10px] bg-white/60 border-0 px-1.5">{booking.status}</Badge>
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

  const getUpcomingHomeVisits = (): Booking[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    return bookings
      .filter(b => {
        const date = toDate(b.scheduledAt);
        return (
          b.isHomeVisit &&
          date >= today &&
          date <= nextWeek &&
          (b.status === BookingStatus.PENDING || b.status === BookingStatus.CONFIRMED)
        );
      })
      .sort((a, b) => toDate(a.scheduledAt).getTime() - toDate(b.scheduledAt).getTime());
  };

  /* Upcoming Home Visits Panel */
  const UpcomingHomeVisitsPanel = () => {
    const upcomingVisits = getUpcomingHomeVisits();

    return (
      <div className="flex-1 pl-4 border-l border-gray-200 mt-6 pt-6 border-t">
        <h3 className="font-semibold text-sm mb-4 text-txt-primary flex items-center gap-2">
          <i className='bx bx-map-pin text-primary'></i>
          Upcoming Home Visits (7 Days)
        </h3>
        <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
          {upcomingVisits.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <i className='bx bx-home text-2xl text-txt-muted mb-2'></i>
              <p className="text-xs text-txt-secondary">No upcoming home visits</p>
            </div>
          ) : (
            upcomingVisits.map(booking => (
              <div
                key={booking.id}
                className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all duration-200 ${getStatusColor(booking.status)}`}
                onClick={() => onBookingClick?.(booking)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm mb-1 truncate">{booking.customer?.name}</div>
                    <div className="text-xs opacity-90 mb-1 flex items-center gap-1">
                      <i className='bx bx-map text-[10px]'></i>
                      <span className="truncate">{booking.homeVisitAddress || 'No address'}</span>
                    </div>
                    <div className="text-xs font-mono flex items-center gap-1 opacity-80">
                      <i className='bx bx-calendar'></i>
                      {toDate(booking.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {formatTime(toDate(booking.scheduledAt))}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] px-1.5 h-5 bg-white/50 border-0 shadow-sm flex-shrink-0">{booking.status}</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full ${className}`}>
      {/* 3-column layout: Filters - Calendar - Details */}
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* Left: Filters */}
        <FilterPanel />

        {/* Center: Calendar views */}
        <div className="flex-1 min-w-[300px]">
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </div>

        {/* Right: Booking detail panel */}
        <div className="w-full lg:w-80 flex-shrink-0 lg:h-auto flex flex-col">
          <BookingDetailPanel />
          <UpcomingHomeVisitsPanel />
        </div>
      </div>
    </div>
  );
}