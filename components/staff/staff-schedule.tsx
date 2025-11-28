'use client';

import React, { useState, useEffect } from 'react';
import { TimePicker } from '@/components/ui/time-picker';

interface ScheduleItem {
  id?: string;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  breakStart?: string;
  breakEnd?: string;
  notes?: string;
}

interface HomeVisitConfig {
  canDoHomeVisit: boolean;
  maxDailyHomeVisits: number;
  maxTravelDistanceKm: number;
  preferredAreas: string[];
}

const DAYS = [
  { value: 1, label: 'Senin', labelEn: 'Monday' },
  { value: 2, label: 'Selasa', labelEn: 'Tuesday' },
  { value: 3, label: 'Rabu', labelEn: 'Wednesday' },
  { value: 4, label: 'Kamis', labelEn: 'Thursday' },
  { value: 5, label: 'Jumat', labelEn: 'Friday' },
  { value: 6, label: 'Sabtu', labelEn: 'Saturday' },
  { value: 0, label: 'Minggu', labelEn: 'Sunday' },
];

interface Props {
  staffId: string;
  tenantId: string;
  staffName?: string;
}

export function StaffSchedule({ staffId, tenantId, staffName }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<Record<number, ScheduleItem>>({});
  const [homeVisitConfig, setHomeVisitConfig] = useState<HomeVisitConfig>({
    canDoHomeVisit: true,
    maxDailyHomeVisits: 3,
    maxTravelDistanceKm: 20,
    preferredAreas: [],
  });
  const [activeTab, setActiveTab] = useState<'schedule' | 'homevisit'>('schedule');

  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;

  useEffect(() => {
    if (!staffId || !tenantId) return;
    
    let isMounted = true;
    const controller = new AbortController();
    
    const fetchSchedule = async () => {
      try {
        setFetchError(null);
        const response = await fetch(`/api/staff/${staffId}/schedule`, {
          headers: { 'X-Tenant-ID': tenantId },
          signal: controller.signal,
        });
        
        if (!response.ok) {
          if (response.status === 503 && retryCount < MAX_RETRIES) {
            // Retry after delay for 503 errors
            setTimeout(() => {
              if (isMounted) setRetryCount(prev => prev + 1);
            }, 1000 * (retryCount + 1));
            return;
          }
          throw new Error(`Failed to fetch schedule (${response.status})`);
        }
        
        const data = await response.json();

        if (!isMounted) return;

        // Initialize all days
        const scheduleMap: Record<number, ScheduleItem> = {};
        DAYS.forEach((day) => {
          const existing = data.schedule?.find(
            (s: ScheduleItem) => s.dayOfWeek === day.value
          );
          scheduleMap[day.value] = existing || {
            dayOfWeek: day.value,
            dayName: day.label,
            startTime: '08:00',
            endTime: '17:00',
            isAvailable: day.value !== 0, // Default: Sunday off
          };
        });
        setSchedule(scheduleMap);

        // Load home visit config if exists
        if (data.homeVisitConfig) {
          setHomeVisitConfig(data.homeVisitConfig);
        }
      } catch (err) {
        if (!isMounted) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Error fetching schedule:', err);
        setFetchError(err instanceof Error ? err.message : 'Gagal memuat jadwal');
        // Initialize default schedule on error
        const defaultSchedule: Record<number, ScheduleItem> = {};
        DAYS.forEach((day) => {
          defaultSchedule[day.value] = {
            dayOfWeek: day.value,
            dayName: day.label,
            startTime: '08:00',
            endTime: '17:00',
            isAvailable: day.value !== 0,
          };
        });
        setSchedule(defaultSchedule);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSchedule();
    
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [staffId, tenantId, retryCount]);

  const handleSaveDay = async (dayOfWeek: number) => {
    const item = schedule[dayOfWeek];
    if (!item) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/staff/${staffId}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
        },
        body: JSON.stringify({
          dayOfWeek,
          startTime: item.startTime,
          endTime: item.endTime,
          isAvailable: item.isAvailable,
          breakStart: item.breakStart,
          breakEnd: item.breakEnd,
          notes: item.notes,
        }),
      });

      if (!response.ok) throw new Error('Gagal menyimpan jadwal');

      const dayLabel = DAYS.find(d => d.value === dayOfWeek)?.label;
      setSuccess(`Jadwal ${dayLabel} berhasil disimpan`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setSavingAll(true);
    setError(null);
    setSuccess(null);

    try {
      const scheduleArray = Object.values(schedule).map(item => ({
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        isAvailable: item.isAvailable,
        breakStart: item.breakStart,
        breakEnd: item.breakEnd,
      }));

      const response = await fetch(`/api/staff/${staffId}/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
        },
        body: JSON.stringify({ 
          schedule: scheduleArray,
          homeVisitConfig 
        }),
      });

      if (!response.ok) throw new Error('Gagal menyimpan jadwal');

      setSuccess('Semua jadwal berhasil disimpan');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSavingAll(false);
    }
  };

  const updateScheduleItem = (dayOfWeek: number, field: string, value: any) => {
    setSchedule((prev) => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        [field]: value,
      },
    }));
  };

  const workingDays = Object.values(schedule).filter(s => s.isAvailable).length;

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#2b2c40] rounded-lg shadow-card p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-10 h-10 rounded-lg bg-primary-light dark:bg-[#35365f] flex items-center justify-center mb-3">
            <i className='bx bx-loader-alt text-xl text-primary dark:text-[#a5a7ff] animate-spin'></i>
          </div>
          <p className="text-sm text-txt-muted dark:text-[#7e7f96]">Memuat jadwal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#2b2c40] rounded-lg shadow-card border border-gray-100 dark:border-[#4e4f6c]">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 dark:border-[#4e4f6c]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
              <i className='bx bx-calendar-check text-xl text-primary dark:text-[#a5a7ff]'></i>
            </div>
            <div>
              <h5 className="text-lg font-semibold text-txt-primary dark:text-[#d5d5e2]">
                Jadwal Kerja {staffName && `- ${staffName}`}
              </h5>
              <p className="text-xs text-txt-muted dark:text-[#7e7f96]">
                Atur jam kerja khusus untuk staff ini
              </p>
            </div>
          </div>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary-light dark:bg-[#35365f] text-primary dark:text-[#a5a7ff]">
            {workingDays} Hari Kerja
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'schedule'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-[#35365f] text-txt-secondary dark:text-[#b2b2c4] hover:bg-gray-200 dark:hover:bg-[#4e4f6c]'
            }`}
          >
            <i className='bx bx-time-five mr-2'></i>
            Jam Kerja
          </button>
          <button
            onClick={() => setActiveTab('homevisit')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'homevisit'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-[#35365f] text-txt-secondary dark:text-[#b2b2c4] hover:bg-gray-200 dark:hover:bg-[#4e4f6c]'
            }`}
          >
            <i className='bx bx-home-heart mr-2'></i>
            Home Visit
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-[#4d2f3a] border border-red-200 dark:border-red-800/50 rounded-lg">
            <i className='bx bx-error-circle text-xl text-danger'></i>
            <p className="text-sm text-danger flex-1">{error}</p>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors">
              <i className='bx bx-x text-lg text-danger'></i>
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-[#36483f] border border-green-200 dark:border-green-800/50 rounded-lg">
            <i className='bx bx-check-circle text-xl text-success'></i>
            <p className="text-sm text-success flex-1">{success}</p>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-3">
            {DAYS.map((day) => {
              const item = schedule[day.value];
              if (!item) return null;

              return (
                <div 
                  key={day.value} 
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    item.isAvailable 
                      ? 'bg-gray-50 dark:bg-[#232333] border-gray-200 dark:border-[#4e4f6c]' 
                      : 'bg-gray-100 dark:bg-[#232333]/50 border-gray-200 dark:border-[#4e4f6c]/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded flex items-center justify-center ${
                        item.isAvailable 
                          ? 'bg-primary-light dark:bg-[#35365f] text-primary dark:text-[#a5a7ff]' 
                          : 'bg-gray-200 dark:bg-[#4e4f6c] text-txt-muted dark:text-[#7e7f96]'
                      }`}>
                        <i className={`bx ${item.isAvailable ? 'bx-check' : 'bx-x'} text-lg`}></i>
                      </div>
                      <div>
                        <span className="font-medium text-txt-primary dark:text-[#d5d5e2]">{day.label}</span>
                        {item.isAvailable && (
                          <span className="ml-2 text-xs text-txt-muted dark:text-[#7e7f96]">
                            {item.startTime} - {item.endTime}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.isAvailable && (
                        <div className="hidden sm:flex items-center gap-2">
                          <TimePicker
                            value={item.startTime}
                            onChange={(value) => updateScheduleItem(day.value, 'startTime', value)}
                            className="w-28"
                          />
                          <span className="text-txt-muted dark:text-[#7e7f96]">-</span>
                          <TimePicker
                            value={item.endTime}
                            onChange={(value) => updateScheduleItem(day.value, 'endTime', value)}
                            className="w-28"
                          />
                        </div>
                      )}

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.isAvailable}
                          onChange={(e) => updateScheduleItem(day.value, 'isAvailable', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-[#4e4f6c] peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:bg-primary transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-200 peer-checked:after:translate-x-5"></div>
                      </label>
                    </div>
                  </div>

                  {/* Mobile time pickers */}
                  {item.isAvailable && (
                    <div className="sm:hidden mt-3 flex items-center gap-2">
                      <TimePicker
                        value={item.startTime}
                        onChange={(value) => updateScheduleItem(day.value, 'startTime', value)}
                        className="flex-1"
                      />
                      <span className="text-txt-muted dark:text-[#7e7f96]">-</span>
                      <TimePicker
                        value={item.endTime}
                        onChange={(value) => updateScheduleItem(day.value, 'endTime', value)}
                        className="flex-1"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Home Visit Tab */}
        {activeTab === 'homevisit' && (
          <div className="space-y-4">
            {/* Enable Home Visit */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#232333] rounded-lg border border-gray-200 dark:border-[#4e4f6c]">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  homeVisitConfig.canDoHomeVisit 
                    ? 'bg-success/10 dark:bg-success/20 text-success' 
                    : 'bg-gray-200 dark:bg-[#4e4f6c] text-txt-muted dark:text-[#7e7f96]'
                }`}>
                  <i className='bx bx-home-heart text-xl'></i>
                </div>
                <div>
                  <p className="font-medium text-txt-primary dark:text-[#d5d5e2]">Layanan Home Visit</p>
                  <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Staff dapat melakukan kunjungan ke rumah pelanggan</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={homeVisitConfig.canDoHomeVisit}
                  onChange={(e) => setHomeVisitConfig(prev => ({ ...prev, canDoHomeVisit: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-[#4e4f6c] peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:bg-primary transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-200 peer-checked:after:translate-x-5"></div>
              </label>
            </div>

            {homeVisitConfig.canDoHomeVisit && (
              <>
                {/* Max Daily Home Visits */}
                <div className="p-4 bg-gray-50 dark:bg-[#232333] rounded-lg border border-gray-200 dark:border-[#4e4f6c]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded bg-info/10 dark:bg-info/20 flex items-center justify-center">
                      <i className='bx bx-calendar-event text-info'></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-txt-primary dark:text-[#d5d5e2]">Kuota Harian</p>
                      <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Maksimal home visit per hari</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setHomeVisitConfig(prev => ({ 
                        ...prev, 
                        maxDailyHomeVisits: Math.max(1, prev.maxDailyHomeVisits - 1) 
                      }))}
                      className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-[#4e4f6c] text-txt-primary dark:text-[#d5d5e2] hover:bg-gray-300 dark:hover:bg-[#5e5f7c] transition-colors"
                    >
                      <i className='bx bx-minus'></i>
                    </button>
                    <span className="w-16 text-center text-2xl font-bold text-txt-primary dark:text-[#d5d5e2]">
                      {homeVisitConfig.maxDailyHomeVisits}
                    </span>
                    <button
                      type="button"
                      onClick={() => setHomeVisitConfig(prev => ({ 
                        ...prev, 
                        maxDailyHomeVisits: Math.min(10, prev.maxDailyHomeVisits + 1) 
                      }))}
                      className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-[#4e4f6c] text-txt-primary dark:text-[#d5d5e2] hover:bg-gray-300 dark:hover:bg-[#5e5f7c] transition-colors"
                    >
                      <i className='bx bx-plus'></i>
                    </button>
                  </div>
                </div>

                {/* Max Travel Distance */}
                <div className="p-4 bg-gray-50 dark:bg-[#232333] rounded-lg border border-gray-200 dark:border-[#4e4f6c]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded bg-warning/10 dark:bg-warning/20 flex items-center justify-center">
                      <i className='bx bx-map text-warning'></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-txt-primary dark:text-[#d5d5e2]">Jarak Maksimal</p>
                      <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Radius layanan dari lokasi bisnis</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      value={homeVisitConfig.maxTravelDistanceKm}
                      onChange={(e) => setHomeVisitConfig(prev => ({ 
                        ...prev, 
                        maxTravelDistanceKm: parseInt(e.target.value) 
                      }))}
                      className="flex-1 h-2 bg-gray-200 dark:bg-[#4e4f6c] rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <span className="w-20 text-right font-bold text-txt-primary dark:text-[#d5d5e2]">
                      {homeVisitConfig.maxTravelDistanceKm} km
                    </span>
                  </div>
                </div>

                {/* Info Box */}
                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-[#25445c]/30 rounded-lg">
                  <i className='bx bx-info-circle text-xl text-info flex-shrink-0 mt-0.5'></i>
                  <p className="text-sm text-txt-secondary dark:text-[#b2b2c4]">
                    Staff akan otomatis di-assign ke booking home visit jika jadwal tersedia dan kuota harian belum penuh.
                    Sistem akan mempertimbangkan jarak dan waktu perjalanan.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Save All Button */}
        <div className="pt-4 border-t border-gray-100 dark:border-[#4e4f6c]">
          <button
            onClick={handleSaveAll}
            disabled={savingAll}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-md shadow-md shadow-primary/20 transition-all duration-200 ease-in-out hover:bg-[#5f61e6] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingAll ? (
              <>
                <i className='bx bx-loader-alt animate-spin'></i>
                Menyimpan...
              </>
            ) : (
              <>
                <i className='bx bx-save'></i>
                Simpan Semua Pengaturan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
