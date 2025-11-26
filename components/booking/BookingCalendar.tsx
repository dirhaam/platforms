'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Booking, BookingStatus } from '@/types/booking';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

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

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const weekdaysMain = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekdaysMini = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const toDate = (scheduledAt: Date | string): Date =>
  typeof scheduledAt === 'string' ? new Date(scheduledAt) : scheduledAt;

const formatTime = (date: Date): string =>
  date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

const getStatusColor = (status: BookingStatus): { bg: string; text: string; border: string } => {
  switch (status) {
    case BookingStatus.PENDING: return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' }; // kuning
    case BookingStatus.CONFIRMED: return { bg: '#E0E7FF', text: '#3730A3', border: '#C7D2FE' }; // biru
    case BookingStatus.COMPLETED: return { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' }; // hijau
    case BookingStatus.CANCELLED: return { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' }; // merah
    case BookingStatus.NO_SHOW: return { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' };
    default: return { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' };
  }
};

const FilterPanel = ({
  selectedStatuses,
  onToggleStatus,
  onToggleAll
}: {
  selectedStatuses: string[],
  onToggleStatus: (id: string) => void,
  onToggleAll: () => void
}) => {
  const filters = [
    { id: 'pending', label: 'Pending', color: '#FACC15', textColor: '#FACC15', borderColor: '#FACC15' },      // kuning
    { id: 'confirmed', label: 'Confirmed', color: '#6366F1', textColor: '#6366F1', borderColor: '#6366F1' },  // biru
    { id: 'completed', label: 'Completed', color: '#22C55E', textColor: '#22C55E', borderColor: '#22C55E' },  // hijau
    { id: 'cancelled', label: 'Cancelled', color: '#F43F5E', textColor: '#F43F5E', borderColor: '#F43F5E' },  // merah
  ];


  return (
    <div className="w-full lg:w-64 flex-shrink-0 space-y-6 border-r border-gray-100 pr-6">
      <div>
        <h3 className="font-semibold text-sm text-gray-700 mb-4">Event Filters</h3>
        <div className="space-y-2.5">
          <div className="flex items-center space-x-2.5">
            <Checkbox
              id="filter-all"
              checked={selectedStatuses.length === 4}
              onCheckedChange={onToggleAll}
              className="rounded border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <label
              htmlFor="filter-all"
              className="text-sm font-medium text-gray-700 cursor-pointer select-none"
            >
              View All
            </label>
          </div>
          {filters.map(filter => {
            const isChecked = selectedStatuses.includes(filter.id);
            return (
              <div key={filter.id} className="flex items-center space-x-2.5">
                <Checkbox
                  id={`filter-${filter.id}`}
                  checked={isChecked}
                  onCheckedChange={() => onToggleStatus(filter.id)}
                  className="rounded border-2 data-[state=checked]:border-transparent"
                  style={{
                    backgroundColor: isChecked ? filter.color : 'transparent',
                    borderColor: isChecked ? filter.borderColor : '#D1D5DB',
                  }}
                />
                <label
                  htmlFor={`filter-${filter.id}`}
                  className="text-sm font-medium cursor-pointer select-none"
                  style={{
                    color: isChecked ? filter.textColor : '#6B7280'
                  }}
                >
                  {filter.label}
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

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
  const [miniDate, setMiniDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list'>('month');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['pending', 'confirmed', 'completed', 'cancelled']);

  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(selectedDate);
    }
  }, [selectedDate]);

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

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const firstDayWeekday = firstDay.getDay();
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDayWeekday);

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      days.push(new Date(startDate));
      startDate.setDate(startDate.getDate() + 1);
    }
    return days;
  };

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - startOfWeek.getDay());
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
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

  const navigateMiniMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(miniDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setMiniDate(newDate);
  };

  const onMiniDateSelect = (date: Date) => {
    setCurrentDate(date); // pilih di main calendar juga
    onDateSelect(date);
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };
  const toggleAllStatuses = () => {
    if (selectedStatuses.length === 4) {
      setSelectedStatuses([]);
    } else {
      setSelectedStatuses(['pending', 'confirmed', 'completed', 'cancelled']);
    }
  };

  // MINI CALENDAR SIDEBAR - FINAL REVISION sesuai permintaan 
  const renderMiniCalendar = () => (
    <div className="mb-6 mini-calendar-hide-default">
      {/* Header bulan + arrow */}
      <div className="flex items-center justify-between mb-1 gap-2">
        <button
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          onClick={() => navigateMiniMonth('prev')}
        >
          <ChevronLeft size={20} className="text-gray-400" />
        </button>
        <span className="flex-1 text-center font-semibold text-base text-gray-900">
          {monthNames[miniDate.getMonth()]} {miniDate.getFullYear()}
        </span>
        <button
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          onClick={() => navigateMiniMonth('next')}
        >
          <ChevronRight size={20} className="text-gray-400" />
        </button>
      </div>
      {/* Baris nama hari */}
      <div className="grid grid-cols-7 mb-2 gap-x-1">
        {weekdaysMini.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-400 h-7 flex items-center justify-center">
            {day}
          </div>
        ))}
      </div>
      {/* Grid tanggal style persis gambar 2 */}
      <Calendar
        month={miniDate}
        mode="single"
        selected={currentDate}
        onSelect={date => date && onMiniDateSelect(date)}
        className="p-0 rounded-md border-0 w-full bg-transparent shadow-none"
        classNames={{
          months: "flex flex-col w-full",
          month: "w-full space-y-0",
          caption: "hidden",
          table: "w-full border-collapse",
          head_row: "hidden",
          row: "grid grid-cols-7 gap-x-1 w-full",
          cell: "h-8 w-full text-center p-0 relative flex items-center justify-center",
          day: "h-8 w-8 rounded-md flex items-center justify-center cursor-pointer transition-all hover:bg-gray-100 text-gray-900 font-normal",
          day_selected: "bg-[#6366F1] text-white font-semibold hover:bg-[#6366F1]",
          day_today: "bg-[#E0E7FF] text-[#6366F1] font-semibold",
          day_outside: "text-gray-300 opacity-50",
        }}
      />
    </div>
  );


  // MONTH VIEW
  const renderMonthView = () => (
    <div className="space-y-4 h-full flex flex-col">
      <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-200 rounded-t-lg overflow-hidden">
        {weekdaysMain.map((day, idx) => (
          <div
            key={day}
            className={`h-10 flex items-center justify-center font-semibold text-xs uppercase tracking-wider bg-white ${idx === 6 ? 'text-red-500' : 'text-gray-500'}`}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6 gap-px bg-gray-200 border-x border-b border-gray-200 rounded-b-lg overflow-hidden flex-1 min-h-[600px]">
        {getCalendarDays().map((day, idx) => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth() && day.getFullYear() === currentDate.getFullYear();
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
              <div className="flex-1 mt-1.5 space-y-1.5 overflow-hidden">
                {dayBookings.slice(0, 3).map((booking) => {
                  const colors = getStatusColor(booking.status);
                  return (
                    <div
                      key={booking.id}
                      className="text-xs px-2 py-1.5 rounded-md truncate font-medium border cursor-pointer transition-all hover:shadow-sm"
                      style={{
                        backgroundColor: colors.bg,
                        color: colors.text,
                        borderColor: colors.border
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onBookingClick?.(booking);
                      }}
                    >
                      {booking.customer?.name || 'Unknown'}
                    </div>
                  );
                })}
                {dayBookings.length > 3 && (
                  <div className="text-[11px] text-gray-500 font-medium pl-1.5">
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

  // WEEK VIEW
  const renderWeekView = () => {
    const days = getWeekDays();
    const hours = Array.from({ length: businessHours.closeTime - businessHours.openTime }, (_, i) => businessHours.openTime + i);

    return (
      <div className="space-y-4 h-full overflow-hidden flex flex-col">
        <div className="grid grid-cols-8 gap-0 border-b border-gray-200 pb-2">
          <div className="w-16"></div>
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
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="grid grid-cols-8 gap-0">
            <div className="w-16 border-r border-gray-100">
              {hours.map(hour => (
                <div key={hour} className="h-20 text-xs text-gray-400 text-right pr-2 pt-2 relative">
                  <span className="relative -top-3">{hour.toString().padStart(2, '0')}:00</span>
                </div>
              ))}
            </div>
            {days.map(day => (
              <div key={day.toISOString()} className="border-r border-gray-100 relative min-h-[800px]">
                {hours.map(hour => (
                  <div key={hour} className="h-20 border-b border-gray-50"></div>
                ))}
                {getBookingsForDate(day).map(booking => {
                  const startHour = toDate(booking.scheduledAt).getHours();
                  const startMin = toDate(booking.scheduledAt).getMinutes();
                  const duration = booking.duration || 60;
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

  // DAY VIEW
  const renderDayView = () => {
    const dayBookings = getBookingsForDate(currentDate);
    const hours = Array.from({ length: businessHours.closeTime - businessHours.openTime }, (_, i) => businessHours.openTime + i);

    return (
      <div className="space-y-4 h-full overflow-hidden flex flex-col">
        <div className="text-center border-b border-gray-200 pb-4">
          <div className="text-sm font-medium text-gray-500 uppercase">
            {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {currentDate.getDate()}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="relative min-h-[800px]">
            {hours.map(hour => (
              <div key={hour} className="flex h-20 border-b border-gray-50 group">
                <div className="w-20 text-xs text-gray-400 text-right pr-4 pt-2 border-r border-gray-100">
                  <span className="relative -top-3">{hour.toString().padStart(2, '0')}:00</span>
                </div>
                <div className="flex-1 relative">
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

  // MAIN RETURN
  return (
    <div className={`w-full bg-white rounded-card shadow-card p-6 ${className}`}>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* MINI CALENDAR SIDEBAR */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-6 border-r border-gray-100 pr-6">
          {renderMiniCalendar()}
          {/* Filter Panel tetap */}
          <FilterPanel
            selectedStatuses={selectedStatuses}
            onToggleStatus={toggleStatus}
            onToggleAll={toggleAllStatuses}
          />
        </div>
        {/* MAIN CALENDAR AREA */}
        <div className="flex-1 min-w-0 min-h-[600px]">
          {/* Header & view switcher hanya di main calendar */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full border-gray-200"
                onClick={() => viewMode === 'month' ? navigateMonth('prev') : viewMode === 'week' ? navigateWeek('prev') : navigateDay('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full border-gray-200"
                onClick={() => viewMode === 'month' ? navigateMonth('next') : viewMode === 'week' ? navigateWeek('next') : navigateDay('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-bold text-gray-900 min-w-[180px]">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
            </div>
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
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </div>
      </div>
    </div>
  );
}
