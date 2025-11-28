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
  staffId?: string;
}

interface StaffStats {
  total: number;
  completed: number;
  pending: number;
  homeVisit: number;
}

type ViewMode = 'today' | 'week';

export default function StaffDashboard() {
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain') || '';
  
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<StaffStats>({
    total: 0,
    completed: 0,
    pending: 0,
    homeVisit: 0,
  });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [userRole, setUserRole] = useState<string>('staff');
  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [homeVisitOnly, setHomeVisitOnly] = useState(false);

  useEffect(() => {
    checkUserRole();
  }, []);

  useEffect(() => {
    if (subdomain) {
      fetchBookings();
    }
  }, [subdomain, viewMode, homeVisitOnly]);

  const checkUserRole = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        setUserRole(data.session?.role || 'staff');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const isAdmin = userRole === 'admin' || userRole === 'owner';

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let url = '/api/staff/my-bookings?';
      
      if (viewMode === 'today') {
        const today = new Date().toISOString().split('T')[0];
        url += `date=${today}`;
      } else {
        // Last 7 days for admin
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        url += `startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`;
      }

      if (isAdmin) {
        url += '&all=true';
      }

      const response = await fetch(url, {
        headers: { 'X-Tenant-ID': subdomain },
      });

      if (response.ok) {
        const data = await response.json();
        let filteredBookings = data.bookings || [];
        
        if (homeVisitOnly) {
          filteredBookings = filteredBookings.filter((b: Booking) => b.isHomeVisit);
        }

        // Sort by scheduledAt descending (newest first)
        filteredBookings.sort((a: Booking, b: Booking) => 
          new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
        );

        setBookings(filteredBookings);
        setStats({
          total: filteredBookings.length,
          completed: filteredBookings.filter((b: Booking) => b.status === 'completed').length,
          pending: filteredBookings.filter((b: Booking) => ['pending', 'confirmed'].includes(b.status)).length,
          homeVisit: filteredBookings.filter((b: Booking) => b.isHomeVisit).length,
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const today = new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="space-y-4">
      {/* Header - Compact for mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-txt-primary dark:text-[#d5d5e2]">
            {viewMode === 'today' ? 'Jadwal Hari Ini' : 'Jadwal 7 Hari Terakhir'}
          </h1>
          <p className="text-xs sm:text-sm text-txt-muted dark:text-[#7e7f96]">{today}</p>
        </div>
        
        {/* Admin Controls */}
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-[#4e4f6c]">
              <button
                onClick={() => setViewMode('today')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === 'today'
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-[#2b2c40] text-txt-secondary dark:text-[#b2b2c4]'
                }`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === 'week'
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-[#2b2c40] text-txt-secondary dark:text-[#b2b2c4]'
                }`}
              >
                7 Hari
              </button>
            </div>
            <button
              onClick={() => setHomeVisitOnly(!homeVisitOnly)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                homeVisitOnly
                  ? 'bg-info text-white border-info'
                  : 'bg-white dark:bg-[#2b2c40] text-txt-secondary dark:text-[#b2b2c4] border-gray-200 dark:border-[#4e4f6c]'
              }`}
            >
              <i className='bx bx-home-heart mr-1'></i>
              Home Visit
            </button>
          </div>
        )}
      </div>

      {/* Stats - Horizontal scroll on mobile */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4">
        <div className="flex-shrink-0 w-[140px] sm:w-auto bg-white dark:bg-[#2b2c40] rounded-lg p-3 border border-gray-100 dark:border-[#4e4f6c]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
              <i className='bx bx-calendar text-lg text-primary dark:text-[#a5a7ff]'></i>
            </div>
            <div>
              <p className="text-xl font-bold text-txt-primary dark:text-[#d5d5e2]">{stats.total}</p>
              <p className="text-[10px] text-txt-muted dark:text-[#7e7f96]">Total</p>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 w-[140px] sm:w-auto bg-white dark:bg-[#2b2c40] rounded-lg p-3 border border-gray-100 dark:border-[#4e4f6c]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-warning/10 dark:bg-warning/20 flex items-center justify-center">
              <i className='bx bx-time-five text-lg text-warning'></i>
            </div>
            <div>
              <p className="text-xl font-bold text-txt-primary dark:text-[#d5d5e2]">{stats.pending}</p>
              <p className="text-[10px] text-txt-muted dark:text-[#7e7f96]">Menunggu</p>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 w-[140px] sm:w-auto bg-white dark:bg-[#2b2c40] rounded-lg p-3 border border-gray-100 dark:border-[#4e4f6c]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-success/10 dark:bg-success/20 flex items-center justify-center">
              <i className='bx bx-check-circle text-lg text-success'></i>
            </div>
            <div>
              <p className="text-xl font-bold text-txt-primary dark:text-[#d5d5e2]">{stats.completed}</p>
              <p className="text-[10px] text-txt-muted dark:text-[#7e7f96]">Selesai</p>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 w-[140px] sm:w-auto bg-white dark:bg-[#2b2c40] rounded-lg p-3 border border-gray-100 dark:border-[#4e4f6c]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-info/10 dark:bg-info/20 flex items-center justify-center">
              <i className='bx bx-home-heart text-lg text-info'></i>
            </div>
            <div>
              <p className="text-xl font-bold text-txt-primary dark:text-[#d5d5e2]">{stats.homeVisit}</p>
              <p className="text-[10px] text-txt-muted dark:text-[#7e7f96]">Home Visit</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <i className='bx bx-loader-alt text-2xl text-primary dark:text-[#a5a7ff] animate-spin'></i>
          <span className="ml-2 text-sm text-txt-muted dark:text-[#7e7f96]">Memuat...</span>
        </div>
      )}

      {/* Bookings List - Card style for mobile */}
      {!loading && (
        <div className="bg-white dark:bg-[#2b2c40] rounded-lg border border-gray-100 dark:border-[#4e4f6c]">
          <div className="p-3 border-b border-gray-100 dark:border-[#4e4f6c] flex items-center justify-between">
            <h2 className="font-semibold text-sm text-txt-primary dark:text-[#d5d5e2]">Daftar Booking</h2>
            <span className="text-xs text-txt-muted dark:text-[#7e7f96]">{bookings.length} booking</span>
          </div>

        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#35365f] flex items-center justify-center mb-4">
              <i className='bx bx-calendar-x text-3xl text-txt-muted dark:text-[#7e7f96]'></i>
            </div>
            <p className="text-txt-muted dark:text-[#7e7f96]">
              {viewMode === 'today' ? 'Tidak ada booking hari ini' : 'Tidak ada booking dalam 7 hari terakhir'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-[#4e4f6c]">
            {bookings.map((booking) => (
              <div 
                key={booking.id} 
                className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-[#232333] transition-colors cursor-pointer"
                onClick={() => setSelectedBooking(booking)}
              >
                <div className="flex items-start justify-between gap-2 sm:gap-4">
                  <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                    {/* Time & Date */}
                    <div className="flex-shrink-0 w-14 sm:w-16 text-center">
                      {viewMode === 'week' && (
                        <p className="text-[10px] text-txt-muted dark:text-[#7e7f96] mb-0.5">
                          {formatDate(booking.scheduledAt)}
                        </p>
                      )}
                      <p className="text-base sm:text-lg font-bold text-primary dark:text-[#a5a7ff]">
                        {formatTime(booking.scheduledAt)}
                      </p>
                      <p className="text-[10px] sm:text-xs text-txt-muted dark:text-[#7e7f96]">
                        {booking.duration}m
                      </p>
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-medium text-sm sm:text-base text-txt-primary dark:text-[#d5d5e2] truncate">
                          {booking.customerName}
                        </p>
                        {booking.isHomeVisit && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-info/10 dark:bg-info/20 text-info whitespace-nowrap">
                            <i className='bx bx-home-heart'></i>
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-txt-secondary dark:text-[#b2b2c4] truncate">
                        {booking.serviceName}
                      </p>
                      {booking.isHomeVisit && booking.homeVisitAddress && (
                        <p className="text-[10px] sm:text-xs text-txt-muted dark:text-[#7e7f96] mt-0.5 truncate">
                          <i className='bx bx-map mr-0.5'></i>
                          {booking.homeVisitAddress}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {getStatusBadge(booking.status)}
                    {booking.isHomeVisit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openGoogleMaps(booking.homeVisitLatitude, booking.homeVisitLongitude, booking.homeVisitAddress);
                        }}
                        className="p-1.5 sm:p-2 rounded-lg bg-primary-light dark:bg-[#35365f] text-primary dark:text-[#a5a7ff] hover:bg-primary hover:text-white transition-colors"
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
      )}

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
