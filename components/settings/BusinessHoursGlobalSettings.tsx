'use client';

import { useEffect, useState } from 'react';
import { TimePicker } from '@/components/ui/time-picker';

interface BusinessHours {
  [day: string]: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
}

interface BusinessHoursGlobalSettingsProps {
  tenantId: string;
}

const DAYS = [
  { key: 'monday', label: 'Senin' },
  { key: 'tuesday', label: 'Selasa' },
  { key: 'wednesday', label: 'Rabu' },
  { key: 'thursday', label: 'Kamis' },
  { key: 'friday', label: 'Jumat' },
  { key: 'saturday', label: 'Sabtu' },
  { key: 'sunday', label: 'Minggu' },
];

export default function BusinessHoursGlobalSettings({ tenantId }: BusinessHoursGlobalSettingsProps) {
  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    monday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
    tuesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
    wednesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
    thursday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
    friday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
    saturday: { isOpen: false, openTime: '09:00', closeTime: '14:00' },
    sunday: { isOpen: false, openTime: '09:00', closeTime: '14:00' },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusinessHours = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/settings/business-hours?tenantId=${tenantId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.schedule) {
            setBusinessHours(data.schedule);
          }
        }
      } catch (err) {
        console.error('Error fetching business hours:', err);
      } finally {
        setLoading(false);
      }
    };

    if (tenantId) {
      fetchBusinessHours();
    }
  }, [tenantId]);

  const handleDayChange = (day: string, field: string, value: any) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
    setError(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      for (const [day, hours] of Object.entries(businessHours)) {
        if (hours.isOpen && hours.openTime >= hours.closeTime) {
          setError(`${day}: Jam buka harus sebelum jam tutup`);
          return;
        }
      }

      const response = await fetch('/api/settings/business-hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          schedule: businessHours,
          timezone: 'Asia/Jakarta',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Jam operasional berhasil disimpan!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Gagal menyimpan jam operasional');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const openDays = DAYS.filter(d => businessHours[d.key]?.isOpen).length;

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#2b2c40] rounded-card shadow-card p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-10 h-10 rounded-lg bg-primary-light dark:bg-[#35365f] flex items-center justify-center mb-3">
            <i className='bx bx-loader-alt text-xl text-primary dark:text-[#a5a7ff] animate-spin'></i>
          </div>
          <p className="text-sm text-txt-muted dark:text-[#7e7f96]">Memuat jam operasional...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#2b2c40] rounded-card shadow-card overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-[#4e4f6c]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
              <i className='bx bx-time-five text-xl text-primary dark:text-[#a5a7ff]'></i>
            </div>
            <div>
              <h5 className="text-lg font-semibold text-txt-primary dark:text-[#d5d5e2]">Jam Operasional</h5>
              <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Atur jam buka untuk seluruh bisnis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-primary-light dark:bg-[#35365f] text-primary dark:text-[#a5a7ff] text-xs font-bold rounded">
              {openDays} Hari Buka
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-100 dark:bg-[#4d2f3a] border border-red-200 dark:border-red-800/50 rounded-lg">
            <i className='bx bx-error-circle text-xl text-danger'></i>
            <p className="text-sm text-danger flex-1">{error}</p>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-200 dark:hover:bg-red-900/30 rounded transition-colors">
              <i className='bx bx-x text-lg text-danger'></i>
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-100 dark:bg-[#36483f] border border-green-200 dark:border-green-800/50 rounded-lg">
            <i className='bx bx-check-circle text-xl text-success'></i>
            <p className="text-sm text-success flex-1">{success}</p>
          </div>
        )}

        {/* Days Grid */}
        <div className="space-y-3">
          {DAYS.map(({ key, label }) => {
            const hours = businessHours[key];

            return (
              <div 
                key={key} 
                className={`p-4 rounded-lg border transition-all duration-200 ${
                  hours.isOpen 
                    ? 'bg-gray-50 dark:bg-[#232333] border-gray-200 dark:border-[#4e4f6c]' 
                    : 'bg-gray-100 dark:bg-[#232333]/50 border-gray-200 dark:border-[#4e4f6c]/50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded flex items-center justify-center ${
                      hours.isOpen 
                        ? 'bg-primary-light dark:bg-[#35365f] text-primary dark:text-[#a5a7ff]' 
                        : 'bg-gray-200 dark:bg-[#4e4f6c] text-txt-muted dark:text-[#7e7f96]'
                    }`}>
                      <i className={`bx ${hours.isOpen ? 'bx-store' : 'bx-moon'} text-lg`}></i>
                    </div>
                    <span className="font-medium text-txt-primary dark:text-[#d5d5e2]">{label}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    {hours.isOpen && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-txt-muted dark:text-[#7e7f96]">Buka</span>
                          <TimePicker
                            value={hours.openTime}
                            onChange={(value) => handleDayChange(key, 'openTime', value)}
                            disabled={saving}
                            className="w-28"
                          />
                        </div>
                        <span className="text-txt-muted dark:text-[#7e7f96]">-</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-txt-muted dark:text-[#7e7f96]">Tutup</span>
                          <TimePicker
                            value={hours.closeTime}
                            onChange={(value) => handleDayChange(key, 'closeTime', value)}
                            disabled={saving}
                            className="w-28"
                          />
                        </div>
                      </div>
                    )}

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hours.isOpen}
                        onChange={(e) => handleDayChange(key, 'isOpen', e.target.checked)}
                        disabled={saving}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-[#4e4f6c] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-[#25445c]/30 rounded-lg">
          <i className='bx bx-info-circle text-xl text-info flex-shrink-0 mt-0.5'></i>
          <p className="text-sm text-txt-secondary dark:text-[#b2b2c4]">
            Jam operasional ini berlaku untuk semua layanan. Setiap layanan dapat memiliki durasi slot dan kuota berbeda, 
            namun tetap beroperasi dalam jam operasional global ini.
          </p>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-100 dark:border-[#4e4f6c]">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-md shadow-md shadow-primary/20 transition-all duration-200 ease-in-out hover:bg-[#5f61e6] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <i className='bx bx-loader-alt animate-spin'></i>
                Menyimpan...
              </>
            ) : (
              <>
                <i className='bx bx-save'></i>
                Simpan Jam Operasional
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
