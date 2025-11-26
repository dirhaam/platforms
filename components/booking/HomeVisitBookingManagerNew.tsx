'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Booking, Service } from '@/types/booking';
import { HomeVisitBookingList } from './HomeVisitBookingList';

interface HomeVisitBookingManagerProps {
  tenantId: string;
  bookings: Booking[];
  services: Service[];
  businessLocation?: string;
  businessCoordinates?: { lat: number; lng: number };
}

export function HomeVisitBookingManager({
  tenantId,
  bookings,
  services,
  businessLocation,
  businessCoordinates
}: HomeVisitBookingManagerProps) {
  const [homeVisitBookings, setHomeVisitBookings] = useState<Booking[]>([]);
  const [servicesMap, setServicesMap] = useState<Map<string, Service>>(new Map());
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    // Filter home visit bookings and sort by scheduled date
    const filtered = bookings
      .filter(booking => booking.isHomeVisit && booking.homeVisitAddress)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    setHomeVisitBookings(filtered);

    // Create services map for quick lookup
    const map = new Map<string, Service>();
    services.forEach(service => {
      map.set(service.id, service);
    });
    setServicesMap(map);
  }, [bookings, services]);

  // Stats calculations
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const totalDistance = homeVisitBookings.reduce((sum, b) => sum + (b.travelDistance || 0), 0);
    const totalRevenue = homeVisitBookings
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalTravelSurcharge = homeVisitBookings.reduce((sum, b) => sum + (b.travelSurchargeAmount || 0), 0);
    
    const todayBookings = homeVisitBookings.filter(b => {
      const bookingDate = new Date(b.scheduledAt);
      bookingDate.setHours(0, 0, 0, 0);
      return bookingDate.getTime() === today.getTime();
    });

    const upcomingBookings = homeVisitBookings.filter(b => {
      const bookingDate = new Date(b.scheduledAt);
      return bookingDate >= today && b.status !== 'cancelled' && b.status !== 'completed';
    });

    const completedBookings = homeVisitBookings.filter(b => b.status === 'completed');
    const pendingPayment = homeVisitBookings.filter(b => b.paymentStatus === 'pending' && b.status !== 'cancelled');

    return {
      total: homeVisitBookings.length,
      today: todayBookings.length,
      upcoming: upcomingBookings.length,
      completed: completedBookings.length,
      pendingPayment: pendingPayment.length,
      totalDistance: totalDistance.toFixed(1),
      totalRevenue,
      totalTravelSurcharge
    };
  }, [homeVisitBookings]);

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    if (statusFilter === 'all') return homeVisitBookings;
    if (statusFilter === 'pending-payment') {
      return homeVisitBookings.filter(b => b.paymentStatus === 'pending' && b.status !== 'cancelled');
    }
    return homeVisitBookings.filter(b => b.status === statusFilter);
  }, [homeVisitBookings, statusFilter]);

  // Check missing travel data
  const missingTravelData = homeVisitBookings.filter(b => !b.travelDistance || !b.travelDuration);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (homeVisitBookings.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-6">
            <i className='bx bx-map-pin text-4xl text-primary'></i>
          </div>
          <h3 className="text-xl font-semibold text-txt-primary mb-2">Tidak ada Home Visit</h3>
          <p className="text-txt-muted text-sm max-w-md mx-auto">
            Home visit bookings akan ditampilkan di sini setelah dibuat dari menu booking dengan opsi home visit aktif.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Home Visits */}
        <div className="bg-white rounded-card shadow-card p-5 border border-gray-100 hover:-translate-y-1 transition-all duration-300">
          <div className="w-10 h-10 rounded bg-primary-light flex items-center justify-center text-primary mb-3">
            <i className='bx bx-map-pin text-2xl'></i>
          </div>
          <span className="block text-txt-secondary text-sm mb-1">Total Home Visit</span>
          <h3 className="text-2xl font-bold text-txt-primary">{stats.total}</h3>
          <p className="text-xs text-txt-muted mt-1">Total {stats.totalDistance} km</p>
        </div>

        {/* Today's Visits */}
        <div className="bg-white rounded-card shadow-card p-5 border border-gray-100 hover:-translate-y-1 transition-all duration-300">
          <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center text-info mb-3">
            <i className='bx bx-calendar-event text-2xl'></i>
          </div>
          <span className="block text-txt-secondary text-sm mb-1">Hari Ini</span>
          <h3 className="text-2xl font-bold text-txt-primary">{stats.today}</h3>
          <p className="text-xs text-txt-muted mt-1">{stats.upcoming} mendatang</p>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-card shadow-card p-5 border border-gray-100 hover:-translate-y-1 transition-all duration-300">
          <div className="w-10 h-10 rounded bg-green-100 flex items-center justify-center text-success mb-3">
            <i className='bx bx-wallet text-2xl'></i>
          </div>
          <span className="block text-txt-secondary text-sm mb-1">Total Pendapatan</span>
          <h3 className="text-lg font-bold text-txt-primary">{formatCurrency(stats.totalRevenue)}</h3>
          <p className="text-xs text-success mt-1">+{formatCurrency(stats.totalTravelSurcharge)} travel</p>
        </div>

        {/* Pending Payment */}
        <div className="bg-white rounded-card shadow-card p-5 border border-gray-100 hover:-translate-y-1 transition-all duration-300">
          <div className="w-10 h-10 rounded bg-orange-100 flex items-center justify-center text-warning mb-3">
            <i className='bx bx-time-five text-2xl'></i>
          </div>
          <span className="block text-txt-secondary text-sm mb-1">Belum Bayar</span>
          <h3 className="text-2xl font-bold text-txt-primary">{stats.pendingPayment}</h3>
          <p className="text-xs text-txt-muted mt-1">{stats.completed} selesai</p>
        </div>
      </div>

      {/* Warning if missing travel data */}
      {missingTravelData.length > 0 && (
        <div className="bg-orange-50 rounded-card p-4 border border-orange-200 flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center flex-shrink-0">
            <i className='bx bx-error text-xl text-warning'></i>
          </div>
          <div>
            <p className="font-medium text-txt-primary text-sm">
              {missingTravelData.length} booking belum memiliki data travel
            </p>
            <p className="text-xs text-txt-secondary mt-0.5">
              Data travel akan dihitung otomatis saat membuat booking baru.
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-card shadow-card border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 px-4">
          <div className="flex gap-1 -mb-px overflow-x-auto">
            {[
              { id: 'all', label: 'Semua', count: homeVisitBookings.length },
              { id: 'confirmed', label: 'Confirmed', count: homeVisitBookings.filter(b => b.status === 'confirmed').length },
              { id: 'pending', label: 'Pending', count: homeVisitBookings.filter(b => b.status === 'pending').length },
              { id: 'completed', label: 'Completed', count: homeVisitBookings.filter(b => b.status === 'completed').length },
              { id: 'pending-payment', label: 'Belum Bayar', count: stats.pendingPayment },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  statusFilter === tab.id
                    ? 'border-primary text-primary bg-primary-light/30'
                    : 'border-transparent text-txt-secondary hover:text-txt-primary hover:bg-gray-50'
                }`}
              >
                {tab.label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  statusFilter === tab.id ? 'bg-primary text-white' : 'bg-gray-100 text-txt-muted'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* List Header */}
        <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className='bx bx-list-ul text-xl text-txt-muted'></i>
            <span className="text-sm text-txt-secondary">
              Menampilkan <strong className="text-txt-primary">{filteredBookings.length}</strong> home visit
            </span>
          </div>
          <div className="text-xs text-txt-muted flex items-center gap-1">
            <i className='bx bx-info-circle'></i>
            Klik untuk melihat detail & peta
          </div>
        </div>

        {/* Bookings List */}
        <div className="p-4">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <i className='bx bx-search text-2xl text-txt-muted'></i>
              </div>
              <p className="text-txt-muted text-sm">Tidak ada booking dengan filter ini</p>
            </div>
          ) : (
            <HomeVisitBookingList 
              bookings={filteredBookings} 
              services={servicesMap}
              businessCoordinates={businessCoordinates}
            />
          )}
        </div>
      </div>
    </div>
  );
}
