"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, List, DollarSign, MapPin, Plus, Eye } from 'lucide-react';
import { Booking } from '@/types/booking';
import { SalesTransaction } from '@/types/sales';
import { BookingCalendar } from './BookingCalendar';
import { UnifiedTransactionTable } from './UnifiedTransactionTable';
import { HomeVisitBookingManager } from './HomeVisitBookingManagerNew';
import { Button } from '@/components/ui/button';
import { BookingFilters } from './BookingFilters';

type ViewMode = 'calendar' | 'list' | 'sales' | 'home-visits';

interface BookingViewsTabsProps {
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  filteredBookings: Booking[];
  selectedDate: Date;
  onDateSelect: (d: Date) => void;
  onBookingClick: (b: Booking) => void;

  // Sales
  salesTransactions: SalesTransaction[];
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
  onViewModeChange,
  filteredBookings,
  selectedDate,
  onDateSelect,
  onBookingClick,
  salesTransactions,
  loadingSales,
  onNewSale,
  onViewSalesTransaction,
  resolvedTenantId,
  bookings,
  services,
  businessLocation,
  businessCoordinates,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  paymentFilter,
  onPaymentChange,
  onRefreshAll,
}: BookingViewsTabsProps) {
  const isBookingView = viewMode === 'calendar' || viewMode === 'list' || viewMode === 'home-visits';
  const statusOptions = isBookingView
    ? [
        { value: 'all', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ]
    : [
        { value: 'all', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'refunded', label: 'Refunded' },
      ];

  const paymentOptions = isBookingView
    ? [
        { value: 'all', label: 'All Payments' },
        { value: 'pending', label: 'Pending' },
        { value: 'paid', label: 'Paid' },
        { value: 'refunded', label: 'Refunded' },
      ]
    : [
        { value: 'all', label: 'All Payments' },
        { value: 'pending', label: 'Pending' },
        { value: 'paid', label: 'Paid' },
        { value: 'partial', label: 'Partial' },
        { value: 'refunded', label: 'Refunded' },
      ];

  return (
    <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as ViewMode)}>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <TabsList>
              <TabsTrigger value="calendar">
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="h-4 w-4 mr-2" />
                Booking
              </TabsTrigger>
              <TabsTrigger value="sales">
                <DollarSign className="h-4 w-4 mr-2" />
                Sales
              </TabsTrigger>
              <TabsTrigger value="home-visits">
                <MapPin className="h-4 w-4 mr-2" />
                Home Visits
              </TabsTrigger>
            </TabsList>
            <BookingFilters
              layout="inline"
              searchTerm={searchTerm}
              onSearchChange={onSearchChange}
              statusFilter={statusFilter}
              onStatusChange={onStatusChange}
              paymentFilter={paymentFilter}
              onPaymentChange={onPaymentChange}
              onRefresh={onRefreshAll}
              statusOptions={statusOptions}
              paymentOptions={paymentOptions}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Calendar View */}
      <TabsContent value="calendar" className="mt-4">
        <Card>
          <CardContent className="pt-6">
            <BookingCalendar
              bookings={filteredBookings}
              selectedDate={selectedDate}
              onDateSelect={onDateSelect}
              onBookingClick={onBookingClick}
            />
          </CardContent>
        </Card>
      </TabsContent>

      {/* List View */}
      <TabsContent value="list" className="mt-4">
        <Card>
          <CardContent className="pt-6">
            <UnifiedTransactionTable
              data={filteredBookings}
              type="booking"
              renderActions={(item) => (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onBookingClick(item as Booking)}
                >
                  View
                </Button>
              )}
            />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Sales View */}
      <TabsContent value="sales" className="mt-4">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Sales Transactions</CardTitle>
            <Button onClick={onNewSale} className="gap-2">
              <Plus className="w-4 h-4" />
              New Sale
            </Button>
          </CardHeader>
          <CardContent>
            {loadingSales ? (
              <p className="text-sm text-gray-600">Loading sales data...</p>
            ) : (
              <UnifiedTransactionTable
                data={salesTransactions}
                type="sales"
                renderActions={(transaction) => (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewSalesTransaction(transaction as SalesTransaction)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                )}
              />
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Home Visits View */}
      <TabsContent value="home-visits" className="mt-4">
        {resolvedTenantId && (
          <HomeVisitBookingManager
            tenantId={resolvedTenantId}
            bookings={bookings}
            services={services}
            businessLocation={businessLocation}
            businessCoordinates={businessCoordinates || undefined}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
