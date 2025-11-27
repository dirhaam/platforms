'use client';

import { useEffect, useState } from 'react';

interface HomeVisitConfig {
  enabled: boolean;
  dailyQuota: number;
  timeSlots: string[];
  requireAddress: boolean;
  calculateTravelSurcharge: boolean;
}

interface HomeVisitSettingsProps {
  tenantId: string;
}

const DEFAULT_TIME_SLOTS = ['09:00', '13:00', '16:00'];

export default function HomeVisitSettings({ tenantId }: HomeVisitSettingsProps) {
  const [config, setConfig] = useState<HomeVisitConfig>({
    enabled: true,
    dailyQuota: 3,
    timeSlots: DEFAULT_TIME_SLOTS,
    requireAddress: true,
    calculateTravelSurcharge: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newSlot, setNewSlot] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/settings/home-visit?tenantId=${tenantId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.config) {
            setConfig(data.config);
          }
        }
      } catch (err) {
        console.error('Error fetching home visit settings:', err);
      } finally {
        setLoading(false);
      }
    };

    if (tenantId) {
      fetchSettings();
    }
  }, [tenantId]);

  const handleAddSlot = () => {
    if (!newSlot || !/^\d{2}:\d{2}$/.test(newSlot)) {
      setError('Masukkan waktu yang valid (format HH:MM)');
      return;
    }
    if (config.timeSlots.includes(newSlot)) {
      setError('Slot waktu ini sudah ada');
      return;
    }
    setConfig(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, newSlot].sort()
    }));
    setNewSlot('');
    setError(null);
  };

  const handleRemoveSlot = (slot: string) => {
    setConfig(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter(s => s !== slot)
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (config.dailyQuota < 1) {
        setError('Kuota harian minimal 1');
        return;
      }

      if (config.timeSlots.length === 0) {
        setError('Minimal satu slot waktu diperlukan');
        return;
      }

      const response = await fetch('/api/settings/home-visit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          config,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal menyimpan pengaturan');
      }

      setSuccess('Pengaturan home visit berhasil disimpan');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#2b2c40] rounded-card shadow-card p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-10 h-10 rounded-lg bg-primary-light dark:bg-[#35365f] flex items-center justify-center mb-3">
            <i className='bx bx-loader-alt text-xl text-primary dark:text-[#a5a7ff] animate-spin'></i>
          </div>
          <p className="text-sm text-txt-muted dark:text-[#7e7f96]">Memuat pengaturan home visit...</p>
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
              <i className='bx bx-home-heart text-xl text-primary dark:text-[#a5a7ff]'></i>
            </div>
            <div>
              <h5 className="text-lg font-semibold text-txt-primary dark:text-[#d5d5e2]">Home Visit</h5>
              <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Atur opsi booking kunjungan rumah</p>
            </div>
          </div>
          <span className={`px-3 py-1 text-xs font-bold rounded ${config.enabled ? 'bg-primary-light dark:bg-[#35365f] text-primary dark:text-[#a5a7ff]' : 'bg-gray-200 dark:bg-[#4e4f6c] text-txt-muted dark:text-[#7e7f96]'}`}>
            {config.enabled ? 'Aktif' : 'Nonaktif'}
          </span>
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

        {/* Enable Home Visit Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-[#232333] border border-gray-200 dark:border-[#4e4f6c]">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded flex items-center justify-center ${config.enabled ? 'bg-primary-light dark:bg-[#35365f] text-primary dark:text-[#a5a7ff]' : 'bg-gray-200 dark:bg-[#4e4f6c] text-txt-muted dark:text-[#7e7f96]'}`}>
              <i className={`bx ${config.enabled ? 'bx-check' : 'bx-power-off'} text-lg`}></i>
            </div>
            <div>
              <p className="font-medium text-txt-primary dark:text-[#d5d5e2]">Aktifkan Home Visit</p>
              <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Izinkan pelanggan booking layanan kunjungan rumah</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 dark:bg-[#4e4f6c] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {config.enabled && (
          <div className="space-y-4">
            {/* Daily Quota */}
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#232333] border border-gray-200 dark:border-[#4e4f6c]">
              <div className="flex items-center gap-2 mb-3">
                <i className='bx bx-calendar-check text-primary dark:text-[#a5a7ff]'></i>
                <label className="font-semibold text-txt-primary dark:text-[#d5d5e2]">Kuota Harian</label>
              </div>
              <input
                type="number"
                min="1"
                max="20"
                value={config.dailyQuota}
                onChange={(e) => setConfig(prev => ({ ...prev, dailyQuota: parseInt(e.target.value) || 1 }))}
                className="w-32 h-10 px-3 py-2 bg-white dark:bg-[#2b2c40] border border-gray-200 dark:border-[#4e4f6c] rounded-md text-txt-primary dark:text-[#d5d5e2] focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
              />
              <p className="text-xs text-txt-muted dark:text-[#7e7f96] mt-2">Maksimal booking home visit per hari</p>
            </div>

            {/* Time Slots */}
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#232333] border border-gray-200 dark:border-[#4e4f6c]">
              <div className="flex items-center gap-2 mb-3">
                <i className='bx bx-time text-primary dark:text-[#a5a7ff]'></i>
                <label className="font-semibold text-txt-primary dark:text-[#d5d5e2]">Slot Waktu Tersedia</label>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {config.timeSlots.map((slot) => (
                  <span key={slot} className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-light dark:bg-[#35365f] text-primary dark:text-[#a5a7ff] text-sm font-medium rounded">
                    {slot}
                    <button type="button" onClick={() => handleRemoveSlot(slot)} className="ml-1 hover:text-danger transition-colors">
                      <i className='bx bx-x'></i>
                    </button>
                  </span>
                ))}
                {config.timeSlots.length === 0 && (
                  <span className="text-sm text-txt-muted dark:text-[#7e7f96] italic">Belum ada slot waktu</span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="time"
                  value={newSlot}
                  onChange={(e) => setNewSlot(e.target.value)}
                  className="h-10 px-3 py-2 bg-white dark:bg-[#2b2c40] border border-gray-200 dark:border-[#4e4f6c] rounded-md text-txt-primary dark:text-[#d5d5e2] focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddSlot}
                  className="inline-flex items-center gap-1 px-4 py-2 border border-primary text-primary hover:bg-primary-light dark:hover:bg-[#35365f] rounded-md transition-colors"
                >
                  <i className='bx bx-plus'></i>
                  Tambah
                </button>
              </div>
              <p className="text-xs text-txt-muted dark:text-[#7e7f96] mt-2">Slot waktu tetap untuk booking home visit</p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {/* Require Address */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-[#232333] border border-gray-200 dark:border-[#4e4f6c]">
                <div>
                  <p className="font-medium text-txt-primary dark:text-[#d5d5e2]">Wajib Alamat</p>
                  <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Pelanggan harus memberikan alamat</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.requireAddress}
                    onChange={(e) => setConfig(prev => ({ ...prev, requireAddress: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-[#4e4f6c] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Calculate Travel Surcharge */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-[#232333] border border-gray-200 dark:border-[#4e4f6c]">
                <div>
                  <p className="font-medium text-txt-primary dark:text-[#d5d5e2]">Hitung Travel Surcharge</p>
                  <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Otomatis hitung biaya perjalanan berdasarkan jarak</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.calculateTravelSurcharge}
                    onChange={(e) => setConfig(prev => ({ ...prev, calculateTravelSurcharge: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-[#4e4f6c] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>
        )}

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
                Simpan Pengaturan Home Visit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
