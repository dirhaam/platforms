'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Booking } from '@/types/booking';
import { SalesTransaction } from '@/types/sales';
import { BookingCalendar } from './BookingCalendar';
import { UnifiedTransactionTable } from './UnifiedTransactionTable';
import { HomeVisitBookingManager } from './HomeVisitBookingManagerNew';
import { SalesSummaryCards } from './SalesSummaryCards';

type ViewMode = 'calendar' | 'booking' | 'sales' | 'home-visits';
type ListViewMode = 'today' | 'week' | 'all';

interface BookingViewsTabsProps {
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  filteredBookings: Booking[];
  selectedDate: Date;
  onDateSelect: (d: Date) => void;
  onBookingClick: (b: Booking) => void;
  onNewBooking?: () => void;

  // Sales
  salesTransactions: SalesTransaction[];
  salesSummary: any;
  loadingSales: boolean;
  onNewSale: () => void;
  onViewSalesTransaction: (t: SalesTransaction) => void;

  // Home Visits
  resolvedTenantId: string;
  bookings: Booking[];
  services: any[];
  businessLocation: string;
  businessCoordinates?: { lat: number; lng: number };

  // Filters
  searchTerm: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  paymentFilter: string;
  onPaymentChange: (v: string) => void;
  onRefreshAll: () => void;
}

export function BookingViewsTabs({
  viewMode,
  filteredBookings,
  selectedDate,
  onDateSelect,
  onBookingClick,
  onNewBooking,
  salesTransactions,
  salesSummary,
  loadingSales,
  onNewSale,
  onViewSalesTransaction,
  resolvedTenantId,
  bookings,
  services,
  businessLocation,
  businessCoordinates,
  statusFilter,
  onStatusChange,
}: BookingViewsTabsProps) {

  // Local state for Booking List View
  const [listViewMode, setListViewMode] = useState<ListViewMode>('all');
  const [homeVisitOnly, setHomeVisitOnly] = useState(false);

  // Filter logic for Booking List View
  const getDisplayBookings = () => {
    let result = [...filteredBookings];

    // 1. Filter by Date Mode
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (listViewMode === 'today') {
      result = result.filter(b => {
        const d = new Date(b.scheduledAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });
    } else if (listViewMode === 'week') {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1); // Include today
      
      result = result.filter(b => {
        const d = new Date(b.scheduledAt);
        return d >= sevenDaysAgo;
      });
    }

    // 2. Filter by Home Visit
    if (homeVisitOnly) {
      result = result.filter(b => b.isHomeVisit);
    }

    // 3. Sort by newest
    result.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

    return result;
  };

  const displayBookings = getDisplayBookings();

  // Group bookings by date
  const groupedBookings = displayBookings.reduce((acc, booking) => {
    const date = new Date(booking.scheduledAt).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);

  // Stats calculation based on displayBookings
  const stats = {
    total: displayBookings.length,
    pending: displayBookings.filter(b => ['pending', 'confirmed'].includes(b.status)).length,
    completed: displayBookings.filter(b => b.status === 'completed').length,
    homeVisit: displayBookings.filter(b => b.isHomeVisit).length,
  };

  const formatTime = (dateStr: string | Date) => {
    return new Date(dateStr).toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-warning/10 dark:bg-warning/20', text: 'text-warning', label: 'Menunggu' },
      confirmed: { bg: 'bg-info/10 dark:bg-info/20', text: 'text-info', label: 'Dikonfirmasi' },
      completed: { bg: 'bg-success/10 dark:bg-success/20', text: 'text-success', label: 'Selesai' },
      cancelled: { bg: 'bg-danger/10 dark:bg-danger/20', text: 'text-danger', label: 'Dibatalkan' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const openGoogleMaps = (lat?: number, lng?: number, address?: string) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else if (address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-card shadow-card p-6">
          <BookingCalendar
            bookings={filteredBookings}
            selectedDate={selectedDate}
            onDateSelect={onDateSelect}
            onBookingClick={onBookingClick}
            statusFilter={statusFilter}
            onStatusChange={onStatusChange}
          />
        </div>
      )}

      {/* Booking View (Redesigned) */}
      {viewMode === 'booking' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-[#2b2c40] rounded-lg p-3 border border-gray-100 dark:border-[#4e4f6c]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-light dark:bg-[#35365f] flex items-center justify-center flex-shrink-0">
                  <i className='bx bx-calendar text-lg text-primary dark:text-[#a5a7ff]'></i>
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-xl font-bold text-txt-primary dark:text-[#d5d5e2] truncate">{stats.total}</p>
                  <p className="text-[10px] text-txt-muted dark:text-[#7e7f96] truncate">Total</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#2b2c40] rounded-lg p-3 border border-gray-100 dark:border-[#4e4f6c]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-warning/10 dark:bg-warning/20 flex items-center justify-center flex-shrink-0">
                  <i className='bx bx-time-five text-lg text-warning'></i>
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-xl font-bold text-txt-primary dark:text-[#d5d5e2] truncate">{stats.pending}</p>
                  <p className="text-[10px] text-txt-muted dark:text-[#7e7f96] truncate">Pending/Active</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#2b2c40] rounded-lg p-3 border border-gray-100 dark:border-[#4e4f6c]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-success/10 dark:bg-success/20 flex items-center justify-center flex-shrink-0">
                  <i className='bx bx-check-circle text-lg text-success'></i>
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-xl font-bold text-txt-primary dark:text-[#d5d5e2] truncate">{stats.completed}</p>
                  <p className="text-[10px] text-txt-muted dark:text-[#7e7f96] truncate">Selesai</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#2b2c40] rounded-lg p-3 border border-gray-100 dark:border-[#4e4f6c]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-info/10 dark:bg-info/20 flex items-center justify-center flex-shrink-0">
                  <i className='bx bx-home-heart text-lg text-info'></i>
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-xl font-bold text-txt-primary dark:text-[#d5d5e2] truncate">{stats.homeVisit}</p>
                  <p className="text-[10px] text-txt-muted dark:text-[#7e7f96] truncate">Home Visit</p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls & New Booking Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#2b2c40] p-4 rounded-lg border border-gray-100 dark:border-[#4e4f6c]">
            <div className="flex flex-col w-full sm:w-auto sm:flex-row gap-2">
              <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-[#4e4f6c] w-full sm:w-auto">
                <button
                  onClick={() => setListViewMode('today')}
                  className={`flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-xs font-medium transition-colors ${
                    listViewMode === 'today'
                      ? 'bg-primary text-white'
                      : 'bg-white dark:bg-[#2b2c40] text-txt-secondary dark:text-[#b2b2c4]'
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  onClick={() => setListViewMode('week')}
                  className={`flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-xs font-medium transition-colors ${
                    listViewMode === 'week'
                      ? 'bg-primary text-white'
                      : 'bg-white dark:bg-[#2b2c40] text-txt-secondary dark:text-[#b2b2c4]'
                  }`}
                >
                  7 Hari
                </button>
                <button
                  onClick={() => setListViewMode('all')}
                  className={`flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-xs font-medium transition-colors ${
                    listViewMode === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-white dark:bg-[#2b2c40] text-txt-secondary dark:text-[#b2b2c4]'
                  }`}
                >
                  Semua
                </button>
              </div>
              <button
                onClick={() => setHomeVisitOnly(!homeVisitOnly)}
                className={`w-full sm:w-auto px-3 py-2 sm:py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center justify-center ${
                  homeVisitOnly
                    ? 'bg-info text-white border-info'
                    : 'bg-white dark:bg-[#2b2c40] text-txt-secondary dark:text-[#b2b2c4] border-gray-200 dark:border-[#4e4f6c]'
                }`}
              >
                <i className='bx bx-home-heart mr-1'></i>
                Home Visit
              </button>
            </div>

            {onNewBooking && (
              <Button
                onClick={onNewBooking}
                className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white shadow-md shadow-primary/30"
              >
                <i className='bx bx-plus text-lg mr-1'></i>
                New Booking
              </Button>
            )}
          </div>

          {/* Bookings List (Grouped by Date) */}
          <div className="space-y-4">
            {displayBookings.length === 0 ? (
              <div className="bg-white dark:bg-[#2b2c40] rounded-lg border border-gray-100 dark:border-[#4e4f6c] p-12">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#35365f] flex items-center justify-center mb-4">
                    <i className='bx bx-calendar-x text-3xl text-txt-muted dark:text-[#7e7f96]'></i>
                  </div>
                  <p className="text-txt-muted dark:text-[#7e7f96]">Tidak ada booking ditemukan</p>
                </div>
              </div>
            ) : (
              Object.entries(groupedBookings).map(([date, dateBookings]) => (
                <div key={date} className="bg-white dark:bg-[#2b2c40] rounded-lg border border-gray-100 dark:border-[#4e4f6c]">
                  {/* Date Header */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-[#4e4f6c] bg-gray-50 dark:bg-[#232333] rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <i className='bx bx-calendar text-primary dark:text-[#a5a7ff]'></i>
                      <span className="font-medium text-txt-primary dark:text-[#d5d5e2]">
                        {new Date(date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary-light dark:bg-[#35365f] text-primary dark:text-[#a5a7ff]">
                        {dateBookings.length} booking
                      </span>
                    </div>
                  </div>

                  {/* Bookings */}
                  <div className="divide-y divide-gray-100 dark:divide-[#4e4f6c]">
                    {dateBookings.map((booking) => (
                      <div 
                        key={booking.id} 
                        className="p-4 hover:bg-gray-50 dark:hover:bg-[#232333] transition-colors cursor-pointer"
                        onClick={() => onBookingClick(booking)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0">
                            {/* Time */}
                            <div className="flex-shrink-0 w-16 text-center">
                              <p className="text-lg font-bold text-primary dark:text-[#a5a7ff]">
                                {formatTime(booking.scheduledAt)}
                              </p>
                              <p className="text-xs text-txt-muted dark:text-[#7e7f96]">
                                {booking.duration} menit
                              </p>
                            </div>

                            {/* Details */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-txt-primary dark:text-[#d5d5e2]">
                                  {booking.customer?.name || 'Unknown Customer'}
                                </p>
                                {booking.isHomeVisit && (
                                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-info/10 dark:bg-info/20 text-info">
                                    <i className='bx bx-home-heart mr-1'></i>
                                    Home Visit
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-txt-secondary dark:text-[#b2b2c4]">
                                {booking.service?.name || 'Unknown Service'}
                              </p>
                              {booking.isHomeVisit && booking.homeVisitAddress && (
                                <p className="text-xs text-txt-muted dark:text-[#7e7f96] mt-1 truncate">
                                  <i className='bx bx-map mr-1'></i>
                                  {booking.homeVisitAddress}
                                </p>
                              )}
                              {/* Staff Assignment Info for Admin */}
                              {booking.staffId && (
                                <p className="text-xs text-txt-muted mt-1 flex items-center gap-1">
                                  <i className='bx bx-user'></i>
                                  Staff Assigned
                                </p>
                              )}
                              {!booking.staffId && (
                                <p className="text-xs text-warning mt-1 flex items-center gap-1">
                                  <i className='bx bx-error-circle'></i>
                                  Unassigned
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Status & Actions */}
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(booking.status)}
                            {booking.isHomeVisit && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Use coordinates if available, otherwise address
                                  const lat = booking.homeVisitCoordinates?.lat;
                                  const lng = booking.homeVisitCoordinates?.lng;
                                  openGoogleMaps(lat, lng, booking.homeVisitAddress);
                                }}
                                className="p-2 rounded-lg bg-primary-light dark:bg-[#35365f] text-primary dark:text-[#a5a7ff] hover:bg-primary hover:text-white transition-colors"
                                title="Buka di Google Maps"
                              >
                                <i className='bx bx-navigation text-lg'></i>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Sales View */}
      {viewMode === 'sales' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <SalesSummaryCards summary={salesSummary} />

          {/* Transactions Table */}
          <div className="bg-white rounded-card shadow-card overflow-hidden border border-gray-100">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
              <h5 className="font-semibold text-lg text-txt-primary">Sales Transactions</h5>
              <Button
                onClick={onNewSale}
                className="bg-primary hover:bg-primary-dark text-white shadow-md shadow-primary/30"
              >
                <i className='bx bx-plus text-lg mr-1'></i>
                New Sale
              </Button>
            </div>
            <div className="p-6">
              {loadingSales ? (
                <div className="text-center py-12 text-txt-muted">
                  <i className='bx bx-loader-alt bx-spin text-3xl mb-2 opacity-50'></i>
                  <p className="text-sm">Loading sales data...</p>
                </div>
              ) : salesTransactions.length === 0 ? (
                <div className="text-center py-12 text-txt-muted">
                  <i className='bx bx-inbox text-4xl mb-3 opacity-50'></i>
                  <p className="text-sm">No sales found</p>
                </div>
              ) : (
                <UnifiedTransactionTable
                  data={salesTransactions}
                  type="sales"
                  renderActions={(transaction) => (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border border-gray-300 text-txt-secondary hover:text-primary hover:border-primary hover:bg-primary-light/10"
                      onClick={() => onViewSalesTransaction(transaction as SalesTransaction)}
                    >
                      <i className='bx bx-show text-lg mr-1'></i>
                      View
                    </Button>
                  )}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Home Visits View */}
      {viewMode === 'home-visits' && (
        <div className="bg-white rounded-card shadow-card overflow-hidden border border-gray-100">
          {resolvedTenantId && (
            <HomeVisitBookingManager
              tenantId={resolvedTenantId}
              bookings={bookings}
              services={services}
              businessLocation={businessLocation}
              businessCoordinates={businessCoordinates || undefined}
            />
          )}
        </div>
      )}
    </div>
  );
}