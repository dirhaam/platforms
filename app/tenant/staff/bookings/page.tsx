'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  scheduledAt: string;
  duration: number;
  status: string;
  isHomeVisit: boolean;
  homeVisitAddress?: string;
  homeVisitLatitude?: number;
  homeVisitLongitude?: number;
  notes?: string;
}

export default function StaffBookingsPage() {
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain') || '';
  
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [subdomain, dateFilter, statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let url = '/api/staff/my-bookings?all=true&';
      if (dateFilter) url += `date=${dateFilter}&`;
      if (statusFilter !== 'all') url += `status=${statusFilter}&`;

      const response = await fetch(url, {
        headers: { 'X-Tenant-ID': subdomain },
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (dateStr: string) => {
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

  // Group bookings by date
  const groupedBookings = bookings.reduce((acc, booking) => {
    const date = new Date(booking.scheduledAt).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-txt-primary dark:text-[#d5d5e2]">Semua Booking</h1>
          <p className="text-sm text-txt-muted dark:text-[#7e7f96]">Daftar booking yang ditugaskan kepada Anda</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-[#2b2c40] border border-gray-200 dark:border-[#4e4f6c] rounded-lg text-sm text-txt-primary dark:text-[#d5d5e2] focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-[#2b2c40] border border-gray-200 dark:border-[#4e4f6c] rounded-lg text-sm text-txt-primary dark:text-[#d5d5e2] focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="pending">Menunggu</option>
            <option value="confirmed">Dikonfirmasi</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
          {(dateFilter || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setDateFilter('');
                setStatusFilter('all');
              }}
              className="px-3 py-2 text-sm text-txt-muted dark:text-[#7e7f96] hover:text-txt-primary dark:hover:text-[#d5d5e2] transition-colors"
            >
              <i className='bx bx-x mr-1'></i>
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-10 h-10 rounded-lg bg-primary-light dark:bg-[#35365f] flex items-center justify-center mb-3">
            <i className='bx bx-loader-alt text-xl text-primary dark:text-[#a5a7ff] animate-spin'></i>
          </div>
          <p className="text-sm text-txt-muted dark:text-[#7e7f96]">Memuat booking...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white dark:bg-[#2b2c40] rounded-lg border border-gray-100 dark:border-[#4e4f6c] p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#35365f] flex items-center justify-center mb-4">
              <i className='bx bx-calendar-x text-3xl text-txt-muted dark:text-[#7e7f96]'></i>
            </div>
            <p className="text-txt-muted dark:text-[#7e7f96]">Tidak ada booking ditemukan</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedBookings).map(([date, dateBookings]) => (
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
                    onClick={() => setSelectedBooking(booking)}
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
                              {booking.customerName}
                            </p>
                            {booking.isHomeVisit && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-info/10 dark:bg-info/20 text-info">
                                <i className='bx bx-home-heart mr-1'></i>
                                Home Visit
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-txt-secondary dark:text-[#b2b2c4]">
                            {booking.serviceName}
                          </p>
                          {booking.isHomeVisit && booking.homeVisitAddress && (
                            <p className="text-xs text-txt-muted dark:text-[#7e7f96] mt-1 truncate">
                              <i className='bx bx-map mr-1'></i>
                              {booking.homeVisitAddress}
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
                              openGoogleMaps(booking.homeVisitLatitude, booking.homeVisitLongitude, booking.homeVisitAddress);
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
          ))}
        </div>
      )}

      {/* Booking Detail Modal - Same as dashboard */}
      {selectedBooking && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setSelectedBooking(null)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto bg-white dark:bg-[#2b2c40] rounded-xl shadow-xl z-50 max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 dark:border-[#4e4f6c] flex items-center justify-between">
              <h3 className="font-semibold text-lg text-txt-primary dark:text-[#d5d5e2]">Detail Booking</h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#35365f] rounded-lg transition-colors"
              >
                <i className='bx bx-x text-xl text-txt-muted dark:text-[#7e7f96]'></i>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Date & Time */}
              <div className="p-4 bg-primary-light dark:bg-[#35365f] rounded-lg text-center">
                <p className="text-sm text-primary dark:text-[#a5a7ff]">
                  {formatDate(selectedBooking.scheduledAt)}
                </p>
                <p className="text-2xl font-bold text-primary dark:text-[#a5a7ff]">
                  {formatTime(selectedBooking.scheduledAt)}
                </p>
              </div>

              {/* Customer Info */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#232333] rounded-lg">
                <div className="w-12 h-12 rounded-full bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
                  <i className='bx bx-user text-xl text-primary dark:text-[#a5a7ff]'></i>
                </div>
                <div>
                  <p className="font-medium text-txt-primary dark:text-[#d5d5e2]">{selectedBooking.customerName}</p>
                  <a 
                    href={`tel:${selectedBooking.customerPhone}`}
                    className="text-sm text-primary dark:text-[#a5a7ff] hover:underline"
                  >
                    {selectedBooking.customerPhone}
                  </a>
                </div>
              </div>

              {/* Service */}
              <div className="p-3 bg-gray-50 dark:bg-[#232333] rounded-lg">
                <p className="text-xs text-txt-muted dark:text-[#7e7f96] mb-1">Layanan</p>
                <p className="font-medium text-txt-primary dark:text-[#d5d5e2]">
                  {selectedBooking.serviceName} ({selectedBooking.duration} menit)
                </p>
              </div>

              {/* Status */}
              <div className="p-3 bg-gray-50 dark:bg-[#232333] rounded-lg">
                <p className="text-xs text-txt-muted dark:text-[#7e7f96] mb-1">Status</p>
                {getStatusBadge(selectedBooking.status)}
              </div>

              {/* Home Visit Address */}
              {selectedBooking.isHomeVisit && selectedBooking.homeVisitAddress && (
                <div className="p-4 bg-info/5 dark:bg-info/10 rounded-lg border border-info/20">
                  <div className="flex items-center gap-2 mb-2">
                    <i className='bx bx-home-heart text-info'></i>
                    <p className="text-sm font-medium text-info">Alamat Home Visit</p>
                  </div>
                  <p className="text-sm text-txt-secondary dark:text-[#b2b2c4]">{selectedBooking.homeVisitAddress}</p>
                  <button
                    onClick={() => openGoogleMaps(
                      selectedBooking.homeVisitLatitude, 
                      selectedBooking.homeVisitLongitude, 
                      selectedBooking.homeVisitAddress
                    )}
                    className="mt-3 w-full py-2 bg-primary text-white rounded-lg font-medium hover:bg-[#5f61e6] transition-colors flex items-center justify-center gap-2"
                  >
                    <i className='bx bx-navigation'></i>
                    Buka di Google Maps
                  </button>
                </div>
              )}

              {/* Notes */}
              {selectedBooking.notes && (
                <div className="p-3 bg-gray-50 dark:bg-[#232333] rounded-lg">
                  <p className="text-xs text-txt-muted dark:text-[#7e7f96] mb-1">Catatan</p>
                  <p className="text-sm text-txt-secondary dark:text-[#b2b2c4]">{selectedBooking.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <a
                  href={`tel:${selectedBooking.customerPhone}`}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-[#4e4f6c] text-txt-secondary dark:text-[#b2b2c4] rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-[#232333] transition-colors flex items-center justify-center gap-2"
                >
                  <i className='bx bx-phone'></i>
                  Telepon
                </a>
                <a
                  href={`https://wa.me/${selectedBooking.customerPhone?.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-success text-white rounded-lg font-medium hover:bg-success/90 transition-colors flex items-center justify-center gap-2"
                >
                  <i className='bx bxl-whatsapp'></i>
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
