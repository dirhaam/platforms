'use client';

import { useState } from 'react';
import { Booking, Service } from '@/types/booking';
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
    if (amount === undefined) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDuration = (minutes: number | undefined) => {
    if (minutes === undefined) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}j ${mins}m`;
    }
    return `${mins} menit`;
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  };

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      confirmed: { bg: 'bg-green-100', text: 'text-success', label: 'CONFIRMED' },
      completed: { bg: 'bg-blue-100', text: 'text-info', label: 'COMPLETED' },
      cancelled: { bg: 'bg-red-100', text: 'text-danger', label: 'CANCELLED' },
      pending: { bg: 'bg-yellow-100', text: 'text-warning', label: 'PENDING' },
    };
    const style = styles[status] || { bg: 'bg-gray-100', text: 'text-txt-secondary', label: status.toUpperCase() };
    return (
      <span className={`${style.bg} ${style.text} px-2.5 py-1 rounded text-xs font-bold uppercase`}>
        {style.label}
      </span>
    );
  };

  const getPaymentBadge = (paymentStatus: string) => {
    if (paymentStatus === 'paid') {
      return (
        <span className="bg-green-100 text-success px-2 py-0.5 rounded text-xs font-medium">
          <i className='bx bx-check mr-1'></i>Lunas
        </span>
      );
    }
    if (paymentStatus === 'partial') {
      return (
        <span className="bg-blue-100 text-info px-2 py-0.5 rounded text-xs font-medium">
          <i className='bx bx-minus mr-1'></i>Sebagian
        </span>
      );
    }
    return (
      <span className="bg-orange-100 text-warning px-2 py-0.5 rounded text-xs font-medium">
        <i className='bx bx-time mr-1'></i>Belum Bayar
      </span>
    );
  };

  // Open navigation app (Google Maps / Apple Maps)
  const openNavigation = (address: string, coordinates?: { lat: number; lng: number }) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    let url: string;
    
    if (coordinates) {
      // Use coordinates if available (more accurate)
      if (isIOS) {
        // Apple Maps
        url = `maps://maps.apple.com/?daddr=${coordinates.lat},${coordinates.lng}&dirflg=d`;
      } else {
        // Google Maps
        url = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}&travelmode=driving`;
      }
    } else {
      // Fallback to address
      const encodedAddress = encodeURIComponent(address);
      if (isIOS) {
        url = `maps://maps.apple.com/?daddr=${encodedAddress}&dirflg=d`;
      } else {
        url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`;
      }
    }
    
    window.open(url, '_blank');
  };

  // Open phone dialer
  const openPhone = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  if (bookings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => {
        const isExpanded = expandedId === booking.id;
        const service = services.get(booking.serviceId);

        return (
          <div 
            key={booking.id} 
            className={`bg-white rounded-lg border transition-all duration-200 ${
              isExpanded ? 'border-primary shadow-md' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Card Header - Clickable */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : booking.id)}
              className="w-full p-4 flex items-start gap-4 text-left"
            >
              {/* Date Badge */}
              <div className="flex-shrink-0 w-14 text-center">
                <div className="bg-primary-light rounded-lg py-2 px-1">
                  <p className="text-xs text-primary font-medium">{formatDate(booking.scheduledAt).split(',')[0]}</p>
                  <p className="text-lg font-bold text-primary">{new Date(booking.scheduledAt).getDate()}</p>
                </div>
                <p className="text-xs text-txt-muted mt-1">{formatTime(booking.scheduledAt)}</p>
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-semibold text-txt-primary truncate">
                      {booking.customer?.name || 'Customer'}
                    </h4>
                    <p className="text-sm text-txt-secondary truncate">
                      {service?.name || 'Service'}
                    </p>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>

                {/* Quick Stats Row */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-txt-secondary bg-gray-50 px-2 py-1 rounded">
                    <i className='bx bx-map text-primary'></i>
                    {booking.travelDistance ? `${booking.travelDistance.toFixed(1)} km` : '-'}
                  </span>
                  <span className="flex items-center gap-1 text-txt-secondary bg-gray-50 px-2 py-1 rounded">
                    <i className='bx bx-car text-primary'></i>
                    {formatDuration(booking.travelDuration)}
                  </span>
                  <span className="flex items-center gap-1 text-txt-secondary bg-gray-50 px-2 py-1 rounded">
                    <i className='bx bx-money text-success'></i>
                    {formatCurrency(booking.totalAmount)}
                  </span>
                  {getPaymentBadge(booking.paymentStatus)}
                </div>
              </div>

              {/* Expand Icon */}
              <div className="flex-shrink-0 self-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isExpanded ? 'bg-primary text-white' : 'bg-gray-100 text-txt-muted'
                }`}>
                  <i className={`bx bx-chevron-${isExpanded ? 'up' : 'down'} text-xl`}></i>
                </div>
              </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left Column - Address & Map */}
                  <div className="space-y-4">
                    {/* Address */}
                    <div className="bg-white rounded-lg p-4 border border-gray-100">
                      <h5 className="text-xs font-semibold text-txt-muted uppercase tracking-wide mb-2 flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-primary-light flex items-center justify-center text-primary">
                          <i className='bx bx-map-pin text-sm'></i>
                        </div>
                        Alamat Tujuan
                      </h5>
                      <p className="text-sm text-txt-primary font-medium">{booking.homeVisitAddress}</p>
                      {booking.homeVisitCoordinates && (
                        <p className="text-xs text-txt-muted mt-1">
                          {booking.homeVisitCoordinates.lat.toFixed(5)}, {booking.homeVisitCoordinates.lng.toFixed(5)}
                        </p>
                      )}
                    </div>

                    {/* Mini Map */}
                    {(businessCoordinates || booking.homeVisitCoordinates) ? (
                      <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: '200px' }}>
                        <RouteMiniMap
                          origin={businessCoordinates}
                          destination={booking.homeVisitCoordinates}
                          route={booking.travelRoute}
                          height={200}
                          className="w-full"
                        />
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
                        <i className='bx bx-map-alt text-3xl text-txt-muted'></i>
                        <p className="text-xs text-txt-muted mt-2">Koordinat tidak tersedia</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Details */}
                  <div className="space-y-4">
                    {/* Travel Stats */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                        <div className="w-8 h-8 rounded bg-primary-light flex items-center justify-center text-primary mx-auto mb-1">
                          <i className='bx bx-ruler text-lg'></i>
                        </div>
                        <p className="text-sm font-bold text-txt-primary mt-1">
                          {booking.travelDistance ? `${booking.travelDistance.toFixed(1)} km` : '-'}
                        </p>
                        <p className="text-xs text-txt-muted">Jarak</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                        <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-info mx-auto mb-1">
                          <i className='bx bx-time-five text-lg'></i>
                        </div>
                        <p className="text-sm font-bold text-txt-primary mt-1">
                          {formatDuration(booking.travelDuration)}
                        </p>
                        <p className="text-xs text-txt-muted">Waktu</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                        <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center text-warning mx-auto mb-1">
                          <i className='bx bx-car text-lg'></i>
                        </div>
                        <p className="text-sm font-bold text-txt-primary mt-1">
                          {formatCurrency(booking.travelSurchargeAmount)}
                        </p>
                        <p className="text-xs text-txt-muted">Surcharge</p>
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="bg-white rounded-lg p-4 border border-gray-100">
                      <h5 className="text-xs font-semibold text-txt-muted uppercase tracking-wide mb-3 flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-info">
                          <i className='bx bx-receipt text-sm'></i>
                        </div>
                        Rincian Biaya
                      </h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-txt-secondary">Layanan</span>
                          <span className="text-txt-primary">{formatCurrency(service?.price)}</span>
                        </div>
                        {service?.homeVisitSurcharge && (
                          <div className="flex justify-between">
                            <span className="text-txt-secondary">Home Visit</span>
                            <span className="text-txt-primary">{formatCurrency(service.homeVisitSurcharge)}</span>
                          </div>
                        )}
                        {booking.travelSurchargeAmount && (
                          <div className="flex justify-between">
                            <span className="text-txt-secondary">Travel</span>
                            <span className="text-txt-primary">{formatCurrency(booking.travelSurchargeAmount)}</span>
                          </div>
                        )}
                        <div className="border-t border-gray-100 pt-2 flex justify-between font-semibold">
                          <span className="text-txt-primary">Total</span>
                          <span className="text-primary">{formatCurrency(booking.totalAmount)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment & Customer */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <h5 className="text-xs font-semibold text-txt-muted uppercase tracking-wide mb-2 flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center text-success">
                            <i className='bx bx-wallet text-sm'></i>
                          </div>
                          Pembayaran
                        </h5>
                        <p className="text-sm font-bold text-success">{formatCurrency(booking.paidAmount)}</p>
                        <p className="text-xs text-txt-muted">dari {formatCurrency(booking.totalAmount)}</p>
                        {(booking.remainingBalance ?? 0) > 0 && (
                          <p className="text-xs text-warning mt-1">Sisa: {formatCurrency(booking.remainingBalance)}</p>
                        )}
                      </div>
                      {booking.customer && (
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <h5 className="text-xs font-semibold text-txt-muted uppercase tracking-wide mb-2 flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-primary-light flex items-center justify-center text-primary">
                              <i className='bx bx-user text-sm'></i>
                            </div>
                            Kontak
                          </h5>
                          <p className="text-sm text-txt-primary truncate">{booking.customer.phone}</p>
                          {booking.customer.email && (
                            <p className="text-xs text-txt-muted truncate">{booking.customer.email}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {booking.notes && (
                      <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                        <p className="text-xs font-semibold text-warning mb-1 flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-yellow-100 flex items-center justify-center text-warning">
                            <i className='bx bx-note text-sm'></i>
                          </div>
                          Catatan
                        </p>
                        <p className="text-sm text-txt-primary">{booking.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-gray-200 text-txt-secondary hover:text-primary hover:border-primary"
                  >
                    <i className='bx bx-edit-alt mr-1'></i>
                    Edit
                  </Button>
                  {booking.customer?.phone && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-gray-200 text-txt-secondary hover:text-success hover:border-success"
                      onClick={() => openPhone(booking.customer!.phone)}
                    >
                      <i className='bx bx-phone mr-1'></i>
                      Hubungi
                    </Button>
                  )}
                  {booking.homeVisitAddress && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-gray-200 text-txt-secondary hover:text-info hover:border-info"
                      onClick={() => openNavigation(booking.homeVisitAddress!, booking.homeVisitCoordinates)}
                    >
                      <i className='bx bx-directions mr-1'></i>
                      Navigasi
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
