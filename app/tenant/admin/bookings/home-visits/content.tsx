'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  isAvailable: boolean;
}

interface HomeVisitBooking {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  serviceDuration: number;
  scheduledAt: string;
  status: string;
  staffId: string | null;
  staffName: string | null;
  homeVisitAddress: string;
  homeVisitLatitude?: number;
  homeVisitLongitude?: number;
  notes?: string;
  createdAt: string;
}

interface Stats {
  total: number;
  assigned: number;
  unassigned: number;
  completed: number;
}

export default function HomeVisitAssignmentContent() {
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain') || '';
  
  // Debug log
  console.log('[HomeVisit] subdomain:', subdomain);

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<HomeVisitBooking[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, assigned: 0, unassigned: 0, completed: 0 });
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('active');
  const [assignmentFilter, setAssignmentFilter] = useState('all');

  // Reassign modal state
  const [selectedBooking, setSelectedBooking] = useState<HomeVisitBooking | null>(null);
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [reassigning, setReassigning] = useState(false);

  useEffect(() => {
    if (subdomain) {
      fetchBookings();
    }
  }, [subdomain, dateFilter, statusFilter, assignmentFilter]);

  const fetchBookings = async () => {
    if (!subdomain) {
      console.log('[HomeVisit] No subdomain, skipping fetch');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Use regular bookings API and filter on frontend
      // Don't filter by date initially to see all data
      let url = `/api/bookings?limit=100`;
      // Skip status filter for now to debug

      console.log('[HomeVisit] Fetching:', url, 'subdomain:', subdomain);
      
      const response = await fetch(url, {
        headers: { 'x-tenant-id': subdomain },
      });

      console.log('[HomeVisit] Response status:', response.status);
      
      const data = await response.json();
      console.log('[HomeVisit] Response data:', data);
      
      if (response.ok) {
        const allBookings = data.bookings || [];
        console.log('[HomeVisit] Total bookings:', allBookings.length);
        console.log('[HomeVisit] Sample booking:', allBookings[0]);
        console.log('[HomeVisit] Home visit bookings:', allBookings.filter((b: any) => b.isHomeVisit).length);
        
        // Filter home visit bookings on frontend
        let homeVisitBookings = allBookings
          .filter((b: any) => b.isHomeVisit)
          .map((b: any) => ({
            id: b.id,
            customerName: b.customer?.name || b.customerName || 'Unknown',
            customerPhone: b.customer?.phone || b.customerPhone || '',
            serviceName: b.service?.name || b.serviceName || 'Service',
            serviceDuration: b.service?.duration || b.duration || 60,
            scheduledAt: b.scheduledAt,
            status: b.status,
            staffId: b.staffId || null,
            staffName: b.staff?.name || b.staffName || null,
            homeVisitAddress: b.homeVisitAddress || '',
            homeVisitLatitude: b.homeVisitLatitude,
            homeVisitLongitude: b.homeVisitLongitude,
            notes: b.notes,
            createdAt: b.createdAt,
          }));

        // Filter by assignment
        if (assignmentFilter === 'assigned') {
          homeVisitBookings = homeVisitBookings.filter((b: any) => b.staffId);
        } else if (assignmentFilter === 'unassigned') {
          homeVisitBookings = homeVisitBookings.filter((b: any) => !b.staffId);
        }

        setBookings(homeVisitBookings);
        setStats({
          total: homeVisitBookings.length,
          assigned: homeVisitBookings.filter((b: any) => b.staffId).length,
          unassigned: homeVisitBookings.filter((b: any) => !b.staffId).length,
          completed: homeVisitBookings.filter((b: any) => b.status === 'completed').length,
        });
      } else {
        console.error('[HomeVisit] Failed to fetch bookings:', response.status, data);
      }
    } catch (error) {
      console.error('[HomeVisit] Error fetching home visit bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const openReassignModal = async (booking: HomeVisitBooking) => {
    setSelectedBooking(booking);
    setLoadingStaff(true);

    try {
      const response = await fetch(
        `/api/bookings/${booking.id}/available-staff`,
        { headers: { 'X-Tenant-ID': subdomain } }
      );

      if (response.ok) {
        const data = await response.json();
        setAvailableStaff(data.staff || []);
      }
    } catch (error) {
      console.error('Error fetching available staff:', error);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleReassign = async (staffId: string) => {
    if (!selectedBooking) return;
    setReassigning(true);

    try {
      const response = await fetch(`/api/bookings/${selectedBooking.id}/assign-staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': subdomain,
        },
        body: JSON.stringify({ staffId }),
      });

      if (response.ok) {
        setSelectedBooking(null);
        fetchBookings();
      } else {
        const data = await response.json();
        alert(data.error || 'Gagal assign staff');
      }
    } catch (error) {
      console.error('Error reassigning staff:', error);
      alert('Terjadi kesalahan');
    } finally {
      setReassigning(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-warning/10 dark:bg-warning/20', text: 'text-warning', label: 'Menunggu' },
      confirmed: { bg: 'bg-info/10 dark:bg-info/20', text: 'text-info', label: 'Dikonfirmasi' },
      completed: { bg: 'bg-success/10 dark:bg-success/20', text: 'text-success', label: 'Selesai' },
      cancelled: { bg: 'bg-danger/10 dark:bg-danger/20', text: 'text-danger', label: 'Dibatalkan' },
    };
    const c = config[status] || config.pending;
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${c.bg} ${c.text}`}>{c.label}</span>;
  };

  const openGoogleMaps = (lat?: number, lng?: number, address?: string) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
    } else if (address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-txt-primary dark:text-[#d5d5e2]">
            <i className='bx bx-home-heart mr-2 text-primary dark:text-[#a5a7ff]'></i>
            Home Visit Assignment
          </h1>
          <p className="text-sm text-txt-muted dark:text-[#7e7f96]">
            Kelola penugasan staff untuk layanan home visit
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#2b2c40] rounded-lg p-4 border border-gray-100 dark:border-[#4e4f6c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
              <i className='bx bx-calendar text-xl text-primary dark:text-[#a5a7ff]'></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-txt-primary dark:text-[#d5d5e2]">{stats.total}</p>
              <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#2b2c40] rounded-lg p-4 border border-gray-100 dark:border-[#4e4f6c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 dark:bg-success/20 flex items-center justify-center">
              <i className='bx bx-user-check text-xl text-success'></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-txt-primary dark:text-[#d5d5e2]">{stats.assigned}</p>
              <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Assigned</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#2b2c40] rounded-lg p-4 border border-gray-100 dark:border-[#4e4f6c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 dark:bg-warning/20 flex items-center justify-center">
              <i className='bx bx-user-x text-xl text-warning'></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-txt-primary dark:text-[#d5d5e2]">{stats.unassigned}</p>
              <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Unassigned</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#2b2c40] rounded-lg p-4 border border-gray-100 dark:border-[#4e4f6c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 dark:bg-info/20 flex items-center justify-center">
              <i className='bx bx-check-double text-xl text-info'></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-txt-primary dark:text-[#d5d5e2]">{stats.completed}</p>
              <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Selesai</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#2b2c40] rounded-lg p-4 border border-gray-100 dark:border-[#4e4f6c]">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-txt-muted dark:text-[#7e7f96]">Tanggal:</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-[#232333] border border-gray-200 dark:border-[#4e4f6c] rounded-lg text-sm text-txt-primary dark:text-[#d5d5e2] focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-txt-muted dark:text-[#7e7f96]">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-[#232333] border border-gray-200 dark:border-[#4e4f6c] rounded-lg text-sm text-txt-primary dark:text-[#d5d5e2] focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Semua</option>
              <option value="active">Aktif</option>
              <option value="pending">Menunggu</option>
              <option value="confirmed">Dikonfirmasi</option>
              <option value="completed">Selesai</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-txt-muted dark:text-[#7e7f96]">Assignment:</label>
            <select
              value={assignmentFilter}
              onChange={(e) => setAssignmentFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-[#232333] border border-gray-200 dark:border-[#4e4f6c] rounded-lg text-sm text-txt-primary dark:text-[#d5d5e2] focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Semua</option>
              <option value="assigned">Sudah Assign</option>
              <option value="unassigned">Belum Assign</option>
            </select>
          </div>

          <button
            onClick={fetchBookings}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-[#5f61e6] transition-colors flex items-center gap-2"
          >
            <i className='bx bx-refresh'></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white dark:bg-[#2b2c40] rounded-lg border border-gray-100 dark:border-[#4e4f6c] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-10 h-10 rounded-lg bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
              <i className='bx bx-loader-alt text-xl text-primary dark:text-[#a5a7ff] animate-spin'></i>
            </div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#35365f] flex items-center justify-center mb-4">
              <i className='bx bx-home-heart text-3xl text-txt-muted dark:text-[#7e7f96]'></i>
            </div>
            <p className="text-txt-muted dark:text-[#7e7f96]">Tidak ada home visit booking</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#232333] border-b border-gray-100 dark:border-[#4e4f6c]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-txt-muted dark:text-[#7e7f96] uppercase">Waktu</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-txt-muted dark:text-[#7e7f96] uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-txt-muted dark:text-[#7e7f96] uppercase">Layanan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-txt-muted dark:text-[#7e7f96] uppercase">Alamat</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-txt-muted dark:text-[#7e7f96] uppercase">Staff</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-txt-muted dark:text-[#7e7f96] uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-txt-muted dark:text-[#7e7f96] uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#4e4f6c]">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-[#232333] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-primary dark:text-[#a5a7ff]">{formatTime(booking.scheduledAt)}</p>
                      <p className="text-xs text-txt-muted dark:text-[#7e7f96]">{formatDate(booking.scheduledAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-txt-primary dark:text-[#d5d5e2]">{booking.customerName}</p>
                      <p className="text-xs text-txt-muted dark:text-[#7e7f96]">{booking.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-txt-secondary dark:text-[#b2b2c4]">{booking.serviceName}</p>
                      <p className="text-xs text-txt-muted dark:text-[#7e7f96]">{booking.serviceDuration} menit</p>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="text-sm text-txt-secondary dark:text-[#b2b2c4] truncate" title={booking.homeVisitAddress}>
                        {booking.homeVisitAddress}
                      </p>
                      <button
                        onClick={() => openGoogleMaps(booking.homeVisitLatitude, booking.homeVisitLongitude, booking.homeVisitAddress)}
                        className="text-xs text-primary dark:text-[#a5a7ff] hover:underline flex items-center gap-1 mt-1"
                      >
                        <i className='bx bx-map'></i>
                        Lihat Map
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {booking.staffName ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-success/10 dark:bg-success/20 flex items-center justify-center">
                            <span className="text-xs font-medium text-success">{booking.staffName.charAt(0)}</span>
                          </div>
                          <span className="text-sm text-txt-primary dark:text-[#d5d5e2]">{booking.staffName}</span>
                        </div>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-warning/10 dark:bg-warning/20 text-warning">
                          Belum Assign
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openReassignModal(booking)}
                          className="p-2 rounded-lg bg-primary-light dark:bg-[#35365f] text-primary dark:text-[#a5a7ff] hover:bg-primary hover:text-white transition-colors"
                          title={booking.staffId ? 'Ganti Staff' : 'Assign Staff'}
                        >
                          <i className='bx bx-user-plus'></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reassign Modal */}
      {selectedBooking && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setSelectedBooking(null)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto bg-white dark:bg-[#2b2c40] rounded-xl shadow-xl z-50 max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 dark:border-[#4e4f6c] flex items-center justify-between">
              <h3 className="font-semibold text-lg text-txt-primary dark:text-[#d5d5e2]">
                {selectedBooking.staffId ? 'Ganti Staff' : 'Assign Staff'}
              </h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#35365f] rounded-lg transition-colors"
              >
                <i className='bx bx-x text-xl text-txt-muted dark:text-[#7e7f96]'></i>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Booking Info */}
              <div className="p-4 bg-gray-50 dark:bg-[#232333] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-txt-muted dark:text-[#7e7f96]">Customer</span>
                  <span className="font-medium text-txt-primary dark:text-[#d5d5e2]">{selectedBooking.customerName}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-txt-muted dark:text-[#7e7f96]">Waktu</span>
                  <span className="font-medium text-primary dark:text-[#a5a7ff]">
                    {formatDate(selectedBooking.scheduledAt)} {formatTime(selectedBooking.scheduledAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-txt-muted dark:text-[#7e7f96]">Layanan</span>
                  <span className="text-sm text-txt-secondary dark:text-[#b2b2c4]">{selectedBooking.serviceName}</span>
                </div>
              </div>

              {/* Current Staff */}
              {selectedBooking.staffName && (
                <div className="p-3 bg-info/5 dark:bg-info/10 rounded-lg border border-info/20">
                  <p className="text-xs text-info mb-1">Staff Saat Ini</p>
                  <p className="font-medium text-txt-primary dark:text-[#d5d5e2]">{selectedBooking.staffName}</p>
                </div>
              )}

              {/* Available Staff List */}
              <div>
                <p className="text-sm font-medium text-txt-primary dark:text-[#d5d5e2] mb-3">Pilih Staff</p>
                {loadingStaff ? (
                  <div className="flex items-center justify-center py-8">
                    <i className='bx bx-loader-alt text-xl text-primary dark:text-[#a5a7ff] animate-spin'></i>
                  </div>
                ) : availableStaff.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#35365f] flex items-center justify-center mx-auto mb-3">
                      <i className='bx bx-user-x text-xl text-txt-muted dark:text-[#7e7f96]'></i>
                    </div>
                    <p className="text-sm text-txt-muted dark:text-[#7e7f96]">Tidak ada staff tersedia</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {availableStaff.map((staff) => (
                      <button
                        key={staff.id}
                        onClick={() => handleReassign(staff.id)}
                        disabled={reassigning}
                        className="w-full p-3 rounded-lg border text-left transition-colors border-gray-200 dark:border-[#4e4f6c] hover:border-primary dark:hover:border-[#a5a7ff] hover:bg-primary/5 dark:hover:bg-[#35365f]"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-success/10 dark:bg-success/20">
                              <span className="text-sm font-medium text-success">
                                {staff.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-txt-primary dark:text-[#d5d5e2]">{staff.name}</p>
                              <p className="text-xs text-txt-muted dark:text-[#7e7f96] capitalize">{staff.role}</p>
                            </div>
                          </div>
                          <i className='bx bx-chevron-right text-txt-muted dark:text-[#7e7f96]'></i>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
