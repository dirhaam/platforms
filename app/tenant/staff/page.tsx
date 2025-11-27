'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

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

interface StaffStats {
  todayTotal: number;
  todayCompleted: number;
  todayPending: number;
  todayHomeVisit: number;
}

export default function StaffDashboard() {
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain') || '';
  
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<StaffStats>({
    todayTotal: 0,
    todayCompleted: 0,
    todayPending: 0,
    todayHomeVisit: 0,
  });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchTodayBookings();
  }, [subdomain]);

  const fetchTodayBookings = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/staff/my-bookings?date=${today}`, {
        headers: { 'X-Tenant-ID': subdomain },
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
        setStats({
          todayTotal: data.bookings?.length || 0,
          todayCompleted: data.bookings?.filter((b: Booking) => b.status === 'completed').length || 0,
          todayPending: data.bookings?.filter((b: Booking) => ['pending', 'confirmed'].includes(b.status)).length || 0,
          todayHomeVisit: data.bookings?.filter((b: Booking) => b.isHomeVisit).length || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-10 h-10 rounded-lg bg-primary-light dark:bg-[#35365f] flex items-center justify-center mb-3">
          <i className='bx bx-loader-alt text-xl text-primary dark:text-[#a5a7ff] animate-spin'></i>
        </div>
        <p className="text-sm text-txt-muted dark:text-[#7e7f96]">Memuat jadwal...</p>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-txt-primary dark:text-[#d5d5e2]">Jadwal Hari Ini</h1>
        <p className="text-sm text-txt-muted dark:text-[#7e7f96]">{today}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#2b2c40] rounded-lg p-4 border border-gray-100 dark:border-[#4e4f6c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
              <i className='bx bx-calendar text-xl text-primary dark:text-[#a5a7ff]'></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-txt-primary dark:text-[#d5d5e2]">{stats.todayTotal}</p>
              <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Total Booking</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#2b2c40] rounded-lg p-4 border border-gray-100 dark:border-[#4e4f6c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 dark:bg-warning/20 flex items-center justify-center">
              <i className='bx bx-time-five text-xl text-warning'></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-txt-primary dark:text-[#d5d5e2]">{stats.todayPending}</p>
              <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Menunggu</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#2b2c40] rounded-lg p-4 border border-gray-100 dark:border-[#4e4f6c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 dark:bg-success/20 flex items-center justify-center">
              <i className='bx bx-check-circle text-xl text-success'></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-txt-primary dark:text-[#d5d5e2]">{stats.todayCompleted}</p>
              <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Selesai</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#2b2c40] rounded-lg p-4 border border-gray-100 dark:border-[#4e4f6c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 dark:bg-info/20 flex items-center justify-center">
              <i className='bx bx-home-heart text-xl text-info'></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-txt-primary dark:text-[#d5d5e2]">{stats.todayHomeVisit}</p>
              <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Home Visit</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white dark:bg-[#2b2c40] rounded-lg border border-gray-100 dark:border-[#4e4f6c]">
        <div className="p-4 border-b border-gray-100 dark:border-[#4e4f6c]">
          <h2 className="font-semibold text-txt-primary dark:text-[#d5d5e2]">Daftar Booking</h2>
        </div>

        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#35365f] flex items-center justify-center mb-4">
              <i className='bx bx-calendar-x text-3xl text-txt-muted dark:text-[#7e7f96]'></i>
            </div>
            <p className="text-txt-muted dark:text-[#7e7f96]">Tidak ada booking hari ini</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-[#4e4f6c]">
            {bookings.map((booking) => (
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
        )}
      </div>

      {/* Booking Detail Modal */}
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

              {/* Service & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-[#232333] rounded-lg">
                  <p className="text-xs text-txt-muted dark:text-[#7e7f96] mb-1">Layanan</p>
                  <p className="font-medium text-txt-primary dark:text-[#d5d5e2]">{selectedBooking.serviceName}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-[#232333] rounded-lg">
                  <p className="text-xs text-txt-muted dark:text-[#7e7f96] mb-1">Waktu</p>
                  <p className="font-medium text-txt-primary dark:text-[#d5d5e2]">
                    {formatTime(selectedBooking.scheduledAt)} ({selectedBooking.duration} menit)
                  </p>
                </div>
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
