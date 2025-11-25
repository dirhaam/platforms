'use client';

import { useState } from 'react';
import { Booking, Service } from '@/types/booking';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RouteMiniMap } from '@/components/location/RouteMiniMap';

interface HomeVisitBookingListProps {
  bookings: Booking[];
  services: Map<string, Service>;
  businessCoordinates?: { lat: number; lng: number };
}

export function HomeVisitBookingList({ bookings, services, businessCoordinates }: HomeVisitBookingListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDuration = (minutes: number | undefined) => {
    if (minutes === undefined) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-success';
      case 'completed': return 'bg-blue-100 text-info';
      case 'cancelled': return 'bg-red-100 text-danger';
      default: return 'bg-gray-100 text-txt-secondary';
    }
  };

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-card shadow-card p-12 text-center border-none">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className='bx bx-map text-3xl text-txt-muted opacity-50'></i>
        </div>
        <p className="text-txt-muted text-sm">Tidak ada home visit bookings</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => {
        const isExpanded = expandedId === booking.id;
        const service = services.get(booking.serviceId);

        return (
          <div key={booking.id} className="bg-white rounded-card shadow-card overflow-hidden hover:shadow-lg transition-all duration-300 border-none">
            {/* Collapsible Header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : booking.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 text-left space-y-2">
                {/* Top Row: Name and Status */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-lg text-txt-primary">
                      {booking.customer?.name || 'Unknown Customer'}
                    </p>
                    <p className="text-sm text-txt-secondary">
                      {service?.name || 'Unknown Service'}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(booking.status)} shadow-sm border-none`}>
                    {booking.status.toUpperCase()}
                  </Badge>
                </div>

                {/* Bottom Row: Quick Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-txt-secondary">
                  <span className="flex items-center gap-1">
                    <i className='bx bx-calendar text-primary'></i>
                    {formatDate(booking.scheduledAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <i className='bx bx-time text-primary'></i>
                    {formatDuration(booking.travelDuration)} travel
                  </span>
                  <span className="flex items-center gap-1">
                    <i className='bx bx-dollar text-primary'></i>
                    {formatCurrency(booking.travelSurchargeAmount)}
                  </span>
                </div>
              </div>

              {/* Expand/Collapse Icon */}
              <div className="ml-4 flex-shrink-0">
                <i className={`bx bx-chevron-${isExpanded ? 'up' : 'down'} text-2xl text-txt-muted`}></i>
              </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-gray-100 bg-gray-50/30 px-6 py-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
                {/* Address Section */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-txt-primary flex items-center gap-2">
                    <i className='bx bx-map text-primary'></i>
                    Alamat Home Visit
                  </h4>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <p className="font-medium text-txt-primary">{booking.homeVisitAddress}</p>
                    {booking.homeVisitCoordinates && (
                      <p className="text-xs text-txt-muted mt-1 flex items-center gap-1">
                        <i className='bx bx-target-lock'></i>
                        {booking.homeVisitCoordinates.lat.toFixed(6)}, {booking.homeVisitCoordinates.lng.toFixed(6)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Travel Information & Mini Map */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-txt-primary flex items-center gap-2">
                    <i className='bx bx-trip text-warning'></i>
                    Informasi Perjalanan & Rute
                  </h4>

                  {/* Travel Stats */}
                  {booking.travelDistance && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-100">
                        <p className="text-xs text-txt-muted mb-1">Jarak</p>
                        <p className="font-bold text-primary flex items-center justify-center gap-1">
                          <i className='bx bx-ruler'></i>
                          {booking.travelDistance.toFixed(1)} km
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-100">
                        <p className="text-xs text-txt-muted mb-1">Waktu Tempuh</p>
                        <p className="font-bold text-success flex items-center justify-center gap-1">
                          <i className='bx bx-time-five'></i>
                          {formatDuration(booking.travelDuration)}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-100">
                        <p className="text-xs text-txt-muted mb-1">Surcharge</p>
                        <p className="font-bold text-warning flex items-center justify-center gap-1">
                          <i className='bx bx-coin-stack'></i>
                          {formatCurrency(booking.travelSurchargeAmount)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Mini Map - Always Visible */}
                  {(businessCoordinates || booking.homeVisitCoordinates) ? (
                    <div style={{ minHeight: '250px' }} className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                      <RouteMiniMap
                        origin={businessCoordinates}
                        destination={booking.homeVisitCoordinates}
                        route={booking.travelRoute}
                        height={250}
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                      <i className='bx bx-map-alt text-3xl text-txt-muted mb-2'></i>
                      <p className="text-sm text-txt-muted">Map tidak dapat ditampilkan - koordinat tidak tersedia</p>
                    </div>
                  )}
                </div>

                {/* Amount Breakdown */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-txt-primary flex items-center gap-2">
                    <i className='bx bx-receipt text-info'></i>
                    Breakdown Biaya
                  </h4>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-txt-secondary">Base Service</span>
                      <span className="font-medium text-txt-primary">{formatCurrency(service?.price)}</span>
                    </div>
                    {service?.homeVisitSurcharge && (
                      <div className="flex justify-between text-txt-secondary">
                        <span>Home Visit Surcharge</span>
                        <span>{formatCurrency(service.homeVisitSurcharge)}</span>
                      </div>
                    )}
                    {booking.travelSurchargeAmount && (
                      <div className="flex justify-between text-txt-secondary">
                        <span>Travel Surcharge</span>
                        <span>{formatCurrency(booking.travelSurchargeAmount)}</span>
                      </div>
                    )}
                    {booking.taxPercentage && (
                      <div className="flex justify-between text-txt-secondary">
                        <span>Tax ({booking.taxPercentage}%)</span>
                        <span>—</span>
                      </div>
                    )}
                    <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-base">
                      <span className="text-txt-primary">Total Amount</span>
                      <span className="text-primary">{formatCurrency(booking.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Status */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-txt-primary flex items-center gap-2">
                    <i className='bx bx-wallet text-success'></i>
                    Status Pembayaran
                  </h4>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-txt-secondary text-sm">Total Tagihan:</span>
                      <span className="font-bold text-txt-primary">{formatCurrency(booking.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-txt-secondary text-sm">Sudah Dibayar:</span>
                      <span className="font-bold text-success">{formatCurrency(booking.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-warning mt-2 pt-2 border-t border-gray-100">
                      <span className="text-txt-secondary text-sm">Sisa Tagihan:</span>
                      <span className="font-bold">{formatCurrency(booking.remainingBalance)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {booking.notes && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-txt-primary flex items-center gap-2">
                      <i className='bx bx-note text-secondary'></i>
                      Catatan
                    </h4>
                    <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-sm text-txt-primary">
                      {booking.notes}
                    </div>
                  </div>
                )}

                {/* Customer Contact */}
                {booking.customer && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-txt-primary flex items-center gap-2">
                      <i className='bx bx-user-circle text-primary'></i>
                      Informasi Pelanggan
                    </h4>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 space-y-2 text-sm">
                      <p className="flex items-center gap-2 text-txt-primary">
                        <i className='bx bx-phone text-txt-muted'></i>
                        {booking.customer.phone}
                      </p>
                      {booking.customer.email && (
                        <p className="flex items-center gap-2 text-txt-primary">
                          <i className='bx bx-envelope text-txt-muted'></i>
                          {booking.customer.email}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 border-gray-200 text-txt-secondary hover:text-primary hover:border-primary">
                    <i className='bx bx-edit-alt mr-2'></i>
                    Edit Booking
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
