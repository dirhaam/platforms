import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Booking } from '../types';

interface BookingScheduleViewProps {
  scheduleViewMode: 'day' | 'week';
  onViewModeChange: (mode: 'day' | 'week') => void;
  getBookingsGroupedByDay: () => Map<string, Booking[]>;
  getBookingsGroupedByWeek: () => Map<string, Booking[]>;
  onBookingClick: (booking: Booking) => void;
}

export function BookingScheduleView({
  scheduleViewMode,
  onViewModeChange,
  getBookingsGroupedByDay,
  getBookingsGroupedByWeek,
  onBookingClick,
}: BookingScheduleViewProps) {
  const renderBookingCard = (booking: Booking, showDate = false) => (
    <div
      key={booking.id}
      className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
      onClick={() => onBookingClick(booking)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-2">
            <div className="font-semibold text-gray-900">{booking.customer?.name}</div>
            <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
              {booking.bookingNumber || 'N/A'}
            </div>
          </div>
          <div className={`grid ${showDate ? 'grid-cols-3' : 'grid-cols-2'} gap-4 text-sm`}>
            {showDate && (
              <div>
                <div className="text-gray-500 text-xs">Date</div>
                <div className="text-gray-900 font-medium">
                  {new Date(booking.scheduledAt).toLocaleDateString()}
                </div>
              </div>
            )}
            <div>
              <div className="text-gray-500 text-xs">Service</div>
              <div className="text-gray-900 font-medium">{booking.service?.name}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Time</div>
              <div className="text-gray-900 font-medium">
                {new Date(booking.scheduledAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Duration</div>
              <div className="text-gray-900 font-medium">{booking.duration} min</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Amount</div>
              <div className="text-gray-900 font-medium">${booking.totalAmount.toFixed(2)}</div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 ml-4">
          <Badge
            className={`
              ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
              ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
              ${booking.status === 'completed' ? 'bg-blue-100 text-blue-800' : ''}
              ${booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
              ${booking.status === 'no_show' ? 'bg-orange-100 text-orange-800' : ''}
            `}
          >
            {booking.status}
          </Badge>
          {booking.paymentStatus && (
            <Badge variant="outline" className="text-xs">
              {booking.paymentStatus}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* View Mode Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Button
              variant={scheduleViewMode === 'day' ? 'default' : 'outline'}
              onClick={() => onViewModeChange('day')}
              size="sm"
            >
              Day View
            </Button>
            <Button
              variant={scheduleViewMode === 'week' ? 'default' : 'outline'}
              onClick={() => onViewModeChange('week')}
              size="sm"
            >
              Week View
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Content */}
      <Card>
        <CardHeader>
          <CardTitle>{scheduleViewMode === 'day' ? 'Daily' : 'Weekly'} Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {scheduleViewMode === 'day' ? (
              (() => {
                const dayBookings = getBookingsGroupedByDay();
                return dayBookings.size === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No bookings scheduled
                  </div>
                ) : (
                  Array.from(dayBookings.entries()).map(([dateKey, bookingsForDay]) => (
                    <div key={dateKey} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-4 text-gray-900">{dateKey}</h4>
                      <div className="space-y-3">
                        {bookingsForDay.map(booking => renderBookingCard(booking, false))}
                      </div>
                    </div>
                  ))
                );
              })()
            ) : (
              (() => {
                const weekBookings = getBookingsGroupedByWeek();
                return weekBookings.size === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No bookings scheduled
                  </div>
                ) : (
                  Array.from(weekBookings.entries()).map(([weekKey, bookingsForWeek]) => (
                    <div key={weekKey} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-4 text-gray-900">{weekKey}</h4>
                      <div className="space-y-3">
                        {bookingsForWeek.map(booking => renderBookingCard(booking, true))}
                      </div>
                    </div>
                  ))
                );
              })()
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
