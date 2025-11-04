'use client';

import { useState } from 'react';
import { Booking, Service } from '@/types/booking';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, MapPin, Clock, DollarSign, Navigation } from 'lucide-react';
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
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (bookings.length === 0) {
    return (
      <Card className="p-6 text-center">
        <MapPin className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">Tidak ada home visit bookings</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {bookings.map((booking) => {
        const isExpanded = expandedId === booking.id;
        const service = services.get(booking.serviceId);

        return (
          <Card key={booking.id} className="overflow-hidden hover:shadow-md transition-shadow">
            {/* Collapsible Header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : booking.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 text-left space-y-2">
                {/* Top Row: Name and Status */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-lg">
                      {booking.customer?.name || 'Unknown Customer'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {service?.name || 'Unknown Service'}
                    </p>
                  </div>
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status.toUpperCase()}
                  </Badge>
                </div>

                {/* Bottom Row: Quick Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    📅 {formatDate(booking.scheduledAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDuration(booking.travelDuration)} travel
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {formatCurrency(booking.travelSurchargeAmount)}
                  </span>
                </div>
              </div>

              {/* Expand/Collapse Icon */}
              <div className="ml-4 flex-shrink-0">
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-600" />
                )}
              </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t bg-gradient-to-b from-gray-50 to-white px-6 py-4 space-y-4">
                {/* Address Section */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    Alamat Home Visit
                  </h4>
                  <div className="bg-white border rounded-lg p-3 space-y-1">
                    <p className="font-medium">{booking.homeVisitAddress}</p>
                    {booking.homeVisitCoordinates && (
                      <p className="text-xs text-gray-500">
                        📍 {booking.homeVisitCoordinates.lat.toFixed(6)}, {booking.homeVisitCoordinates.lng.toFixed(6)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Travel Information & Mini Map */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-orange-600" />
                    Informasi Perjalanan & Rute
                  </h4>

                  {/* Travel Stats */}
                  {booking.travelDistance && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white border rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-600 mb-1">Jarak</p>
                        <p className="font-bold text-blue-600">
                          {booking.travelDistance.toFixed(1)} km
                        </p>
                      </div>
                      <div className="bg-white border rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-600 mb-1">Waktu Tempuh</p>
                        <p className="font-bold text-green-600">
                          {formatDuration(booking.travelDuration)}
                        </p>
                      </div>
                      <div className="bg-white border rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-600 mb-1">Travel Surcharge</p>
                        <p className="font-bold text-orange-600">
                          {formatCurrency(booking.travelSurchargeAmount)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Mini Map - Always Visible */}
                  {(businessCoordinates || booking.homeVisitCoordinates) ? (
                    <div style={{ minHeight: '250px' }} className="rounded-lg overflow-hidden border bg-gray-50">
                      <RouteMiniMap
                        origin={businessCoordinates || { lat: -6.2088, lng: 106.8456 }}
                        destination={booking.homeVisitCoordinates}
                        route={booking.travelRoute}
                        height={250}
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <div className="rounded-lg border bg-blue-50 p-4 text-center text-sm text-blue-700">
                      📍 Map tidak dapat ditampilkan - koordinat tidak tersedia
                    </div>
                  )}
                </div>

                {/* Amount Breakdown */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Breakdown Biaya</h4>
                  <div className="bg-white border rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Service</span>
                      <span className="font-medium">{formatCurrency(service?.price)}</span>
                    </div>
                    {service?.homeVisitSurcharge && (
                      <div className="flex justify-between text-gray-600">
                        <span>Home Visit Surcharge</span>
                        <span>{formatCurrency(service.homeVisitSurcharge)}</span>
                      </div>
                    )}
                    {booking.travelSurchargeAmount && (
                      <div className="flex justify-between text-gray-600">
                        <span>Travel Surcharge</span>
                        <span>{formatCurrency(booking.travelSurchargeAmount)}</span>
                      </div>
                    )}
                    {booking.taxPercentage && (
                      <div className="flex justify-between text-gray-600">
                        <span>Tax ({booking.taxPercentage}%)</span>
                        <span>—</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total Amount</span>
                      <span className="text-green-600">{formatCurrency(booking.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Status */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Status Pembayaran</h4>
                  <div className="bg-white border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-bold">{formatCurrency(booking.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Dibayar:</span>
                      <span className="font-bold text-green-600">{formatCurrency(booking.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-orange-600 mt-2 pt-2 border-t">
                      <span className="text-gray-600">Sisa:</span>
                      <span className="font-bold">{formatCurrency(booking.remainingBalance)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {booking.notes && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Catatan</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-gray-700">
                      {booking.notes}
                    </div>
                  </div>
                )}

                {/* Customer Contact */}
                {booking.customer && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Informasi Pelanggan</h4>
                    <div className="bg-white border rounded-lg p-3 space-y-1 text-sm">
                      <p>📱 {booking.customer.phone}</p>
                      {booking.customer.email && <p>📧 {booking.customer.email}</p>}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Edit Booking
                  </Button>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
