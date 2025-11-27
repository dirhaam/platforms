'use client';

import { useState, useEffect } from 'react';

interface BlockedDate {
  id: string;
  date: string;
  reason?: string;
  isRecurring: boolean;
  recurringPattern?: string;
  recurringEndDate?: string;
}

interface BlockedDatesManagerProps {
  tenantId: string;
  month?: string;
}

export function BlockedDatesManager({ tenantId, month }: BlockedDatesManagerProps) {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newReason, setNewReason] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load blocked dates
  useEffect(() => {
    fetchBlockedDates();
  }, [tenantId, month]);

  const fetchBlockedDates = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/bookings/blocked-dates', window.location.origin);
      url.searchParams.set('tenantId', tenantId);
      if (month) {
        url.searchParams.set('month', month);
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch blocked dates');

      const data = await response.json();
      setBlockedDates(data.blockedDates || []);
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlockedDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;

    try {
      setSubmitting(true);
      const response = await fetch('/api/bookings/blocked-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          date: newDate,
          reason: newReason || undefined,
          isRecurring,
          recurringPattern: isRecurring ? recurringPattern : undefined,
          recurringEndDate: isRecurring && recurringEndDate ? recurringEndDate : undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to create blocked date');

      // Reset form and refresh
      setNewDate('');
      setNewReason('');
      setIsRecurring(false);
      setRecurringEndDate('');
      setIsOpen(false);

      await fetchBlockedDates();
    } catch (error) {
      console.error('Error creating blocked date:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBlockedDate = async (id: string) => {
    try {
      setDeleting(id);
      const response = await fetch(`/api/bookings/blocked-dates?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete blocked date');

      await fetchBlockedDates();
    } catch (error) {
      console.error('Error deleting blocked date:', error);
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const patternLabels: Record<string, string> = {
    daily: 'Harian',
    weekly: 'Mingguan',
    monthly: 'Bulanan',
    yearly: 'Tahunan',
  };

  return (
    <div className="bg-white dark:bg-[#2b2c40] rounded-lg shadow-card border border-gray-100 dark:border-[#4e4f6c]">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 dark:border-[#4e4f6c]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-danger/10 dark:bg-danger/20 flex items-center justify-center">
              <i className='bx bx-calendar-x text-xl text-danger'></i>
            </div>
            <div>
              <h5 className="text-lg font-semibold text-txt-primary dark:text-[#d5d5e2]">
                Tanggal Libur
              </h5>
              <p className="text-sm text-txt-secondary dark:text-[#b2b2c4]">
                Kelola tanggal yang tidak tersedia untuk booking
              </p>
            </div>
          </div>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-danger/10 text-danger dark:bg-danger/20">
            {blockedDates.length} Tanggal
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Add Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md transition-all duration-200 hover:bg-[#5f61e6] hover:shadow-md"
        >
          <i className='bx bx-plus'></i>
          Tambah Tanggal Libur
        </button>

        {/* Modal Dialog */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Modal Content */}
            <div className="relative bg-white dark:bg-[#2b2c40] rounded-lg shadow-xl w-full max-w-md mx-4 transform transition-all duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-[#4e4f6c]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-danger/10 dark:bg-danger/20 flex items-center justify-center">
                    <i className='bx bx-calendar-x text-xl text-danger'></i>
                  </div>
                  <div>
                    <h5 className="font-semibold text-txt-primary dark:text-[#d5d5e2]">
                      Tambah Tanggal Libur
                    </h5>
                    <p className="text-xs text-txt-secondary dark:text-[#b2b2c4]">
                      Tanggal ini tidak akan tersedia untuk booking
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-md text-txt-muted hover:text-txt-primary hover:bg-gray-100 dark:hover:bg-[#4e4f6c] transition-colors"
                >
                  <i className='bx bx-x text-xl'></i>
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleCreateBlockedDate} className="p-4 space-y-4">
                {/* Date Input */}
                <div>
                  <label className="block text-sm font-medium text-txt-primary dark:text-[#d5d5e2] mb-2">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#232333] border border-gray-200 dark:border-[#4e4f6c] rounded-md text-txt-primary dark:text-[#d5d5e2] transition-all duration-150 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>

                {/* Reason Input */}
                <div>
                  <label className="block text-sm font-medium text-txt-primary dark:text-[#d5d5e2] mb-2">
                    Alasan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Libur Nasional, Maintenance, Cuti"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#232333] border border-gray-200 dark:border-[#4e4f6c] rounded-md text-txt-primary dark:text-[#d5d5e2] placeholder:text-txt-muted dark:placeholder:text-[#7e7f96] transition-all duration-150 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>

                {/* Recurring Toggle */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#232333] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-info/10 dark:bg-info/20 flex items-center justify-center">
                      <i className='bx bx-repeat text-info'></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-txt-primary dark:text-[#d5d5e2]">Berulang</p>
                      <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Aktifkan untuk libur berulang</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-[#4e4f6c] peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:bg-primary transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-200 peer-checked:after:translate-x-5"></div>
                  </label>
                </div>

                {/* Recurring Options */}
                {isRecurring && (
                  <div className="space-y-4 p-4 border border-gray-200 dark:border-[#4e4f6c] rounded-lg bg-gray-50/50 dark:bg-[#232333]/50">
                    {/* Pattern Select */}
                    <div>
                      <label className="block text-sm font-medium text-txt-primary dark:text-[#d5d5e2] mb-2">
                        Pola Pengulangan
                      </label>
                      <select
                        value={recurringPattern}
                        onChange={(e) => setRecurringPattern(e.target.value as any)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-[#2b2c40] border border-gray-200 dark:border-[#4e4f6c] rounded-md text-txt-primary dark:text-[#d5d5e2] transition-all duration-150 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      >
                        <option value="daily">Harian</option>
                        <option value="weekly">Mingguan</option>
                        <option value="monthly">Bulanan</option>
                        <option value="yearly">Tahunan</option>
                      </select>
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="block text-sm font-medium text-txt-primary dark:text-[#d5d5e2] mb-2">
                        Tanggal Berakhir
                      </label>
                      <input
                        type="date"
                        value={recurringEndDate}
                        onChange={(e) => setRecurringEndDate(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-[#2b2c40] border border-gray-200 dark:border-[#4e4f6c] rounded-md text-txt-primary dark:text-[#d5d5e2] transition-all duration-150 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-md transition-all duration-200 hover:bg-[#5f61e6] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <i className='bx bx-loader-alt animate-spin'></i>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <i className='bx bx-save'></i>
                      Simpan
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <i className='bx bx-loader-alt text-3xl text-primary animate-spin'></i>
            <p className="mt-2 text-sm text-txt-secondary dark:text-[#b2b2c4]">Memuat data...</p>
          </div>
        ) : blockedDates.length === 0 ? (
          <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-success/10 rounded-lg">
            <i className='bx bx-check-circle text-xl text-success flex-shrink-0 mt-0.5'></i>
            <p className="text-sm text-txt-secondary dark:text-[#b2b2c4]">
              Tidak ada tanggal libur. Semua tanggal tersedia untuk booking.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {blockedDates.map((blocked) => (
              <div
                key={blocked.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#232333] rounded-lg border border-gray-100 dark:border-[#4e4f6c] transition-all duration-200 hover:border-gray-200 dark:hover:border-[#5e5f7c]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-danger/10 dark:bg-danger/20 flex items-center justify-center">
                    <i className='bx bx-calendar-x text-danger'></i>
                  </div>
                  <div>
                    <p className="font-medium text-txt-primary dark:text-[#d5d5e2]">
                      {formatDate(blocked.date)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm text-txt-secondary dark:text-[#b2b2c4]">
                        {blocked.reason || 'Tidak ada alasan'}
                      </span>
                      {blocked.isRecurring && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-info/10 text-info dark:bg-info/20">
                          <i className='bx bx-repeat mr-1'></i>
                          {patternLabels[blocked.recurringPattern || 'daily']}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteBlockedDate(blocked.id)}
                  disabled={deleting === blocked.id}
                  className="p-2 rounded-md text-danger hover:bg-danger/10 dark:hover:bg-danger/20 transition-colors disabled:opacity-50"
                >
                  {deleting === blocked.id ? (
                    <i className='bx bx-loader-alt animate-spin'></i>
                  ) : (
                    <i className='bx bx-trash'></i>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
