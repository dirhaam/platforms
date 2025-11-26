'use client';

import { Button } from '@/components/ui/button';
import { Booking } from '@/types/booking';
import { SalesTransaction } from '@/types/sales';
import { BookingCalendar } from './BookingCalendar';
import { UnifiedTransactionTable } from './UnifiedTransactionTable';
import { HomeVisitBookingManager } from './HomeVisitBookingManagerNew';
import { SalesSummaryCards } from './SalesSummaryCards';

type ViewMode = 'calendar' | 'booking' | 'sales' | 'home-visits';

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

      {/* Booking View */}
      {viewMode === 'booking' && (
        <div className="space-y-6">
          {/* Booking Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Bookings */}
            <div className="bg-white rounded-card shadow-card p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 border border-gray-100">
              <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center text-info mb-3">
                <i className='bx bx-calendar-check text-2xl'></i>
              </div>
              <span className="block text-txt-secondary text-sm mb-1">Total Bookings</span>
              <h3 className="text-2xl font-bold text-txt-primary mb-3">
                {filteredBookings.length}
              </h3>
              <div className="flex items-center gap-1 text-xs text-success font-medium">
                <i className='bx bx-arrow-up'></i>
                <span>Active</span>
              </div>
            </div>

            {/* Confirmed Bookings */}
            <div className="bg-white rounded-card shadow-card p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 border border-gray-100">
              <div className="w-10 h-10 rounded bg-green-100 flex items-center justify-center text-success mb-3">
                <i className='bx bx-check-circle text-2xl'></i>
              </div>
              <span className="block text-txt-secondary text-sm mb-1">Confirmed</span>
              <h3 className="text-2xl font-bold text-txt-primary mb-3">
                {filteredBookings.filter(b => b.status === 'confirmed').length}
              </h3>
              <p className="text-xs text-txt-muted">Ready to execute</p>
            </div>

            {/* Pending Payment */}
            <div className="bg-white rounded-card shadow-card p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 border border-gray-100">
              <div className="w-10 h-10 rounded bg-orange-100 flex items-center justify-center text-warning mb-3">
                <i className='bx bx-clock-5 text-2xl'></i>
              </div>
              <span className="block text-txt-secondary text-sm mb-1">Pending Payment</span>
              <h3 className="text-2xl font-bold text-txt-primary mb-3">
                {filteredBookings.filter(b => b.paymentStatus === 'pending').length}
              </h3>
              <p className="text-xs text-txt-muted">Requires follow-up</p>
            </div>

            {/* Completed */}
            <div className="bg-white rounded-card shadow-card p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 border border-gray-100">
              <div className="w-10 h-10 rounded bg-purple-100 flex items-center justify-center text-purple-600 mb-3">
                <i className='bx bx-check text-2xl'></i>
              </div>
              <span className="block text-txt-secondary text-sm mb-1">Completed</span>
              <h3 className="text-2xl font-bold text-txt-primary mb-3">
                {filteredBookings.filter(b => b.status === 'completed').length}
              </h3>
              <p className="text-xs text-txt-muted">Finished jobs</p>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-white rounded-card shadow-card overflow-hidden border border-gray-100">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h5 className="font-semibold text-lg text-txt-primary">All Bookings</h5>
              {onNewBooking && (
                <Button
                  onClick={onNewBooking}
                  className="bg-primary hover:bg-primary-dark text-white shadow-md shadow-primary/30"
                >
                  <i className='bx bx-plus text-lg mr-1'></i>
                  New Booking
                </Button>
              )}
            </div>
            <div className="p-6">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-12 text-txt-muted">
                  <i className='bx bx-inbox text-4xl mb-3 opacity-50'></i>
                  <p className="text-sm">No bookings found</p>
                </div>
              ) : (
                <UnifiedTransactionTable
                  data={filteredBookings}
                  type="booking"
                  renderActions={(item) => (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border border-gray-300 text-txt-secondary hover:text-primary hover:border-primary hover:bg-primary-light/10"
                      onClick={() => onBookingClick(item as Booking)}
                    >
                      <i className='bx bx-show text-lg mr-1'></i> View
                    </Button>
                  )}
                />
              )}
            </div>
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