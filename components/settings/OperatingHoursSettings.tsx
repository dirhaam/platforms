'use client';

import { useEffect, useState } from 'react';
import { Service } from '@/types/booking';

interface ServiceConfig {
  id: string;
  name: string;
  slotDurationMinutes: number;
  hourlyQuota: number;
}

interface BusinessHours {
  [day: string]: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
}

interface OperatingHoursSettingsProps {
  tenantId: string;
}

export default function OperatingHoursSettings({ tenantId }: OperatingHoursSettingsProps) {
  const [services, setServices] = useState<ServiceConfig[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setSubdomain(params.get('subdomain'));
    }
  }, []);

  useEffect(() => {
    if (!subdomain) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const servicesResponse = await fetch('/api/services', {
          headers: { 'x-tenant-id': subdomain }
        });

        if (!servicesResponse.ok) throw new Error('Gagal memuat layanan');

        const servicesData = await servicesResponse.json();
        const servicesList = (servicesData.services || []).map((service: Service) => ({
          id: service.id,
          name: service.name,
          slotDurationMinutes: service.slotDurationMinutes || 30,
          hourlyQuota: service.hourlyQuota || 10,
        }));
        setServices(servicesList);

        const hoursResponse = await fetch(`/api/settings/business-hours?tenantId=${tenantId}`);
        if (hoursResponse.ok) {
          const hoursData = await hoursResponse.json();
          setBusinessHours(hoursData.schedule);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [subdomain, tenantId]);

  const updateServiceField = (serviceId: string, field: string, value: any) => {
    setServices(services.map(s =>
      s.id === serviceId ? { ...s, [field]: value } : s
    ));
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setError(null);

      const savePromises = services.map(service =>
        fetch(`/api/services/${service.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': subdomain!
          },
          body: JSON.stringify({
            slotDurationMinutes: service.slotDurationMinutes,
            hourlyQuota: service.hourlyQuota
          })
        })
      );

      const results = await Promise.all(savePromises);

      if (results.some(r => !r.ok)) {
        throw new Error('Gagal menyimpan beberapa layanan');
      }

      setSuccess('Semua konfigurasi layanan berhasil diperbarui!');
      setHasChanges(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan');
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
          <p className="text-sm text-txt-muted dark:text-[#7e7f96]">Memuat pengaturan slot...</p>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="bg-white dark:bg-[#2b2c40] rounded-card shadow-card overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-[#4e4f6c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
              <i className='bx bx-timer text-xl text-primary dark:text-[#a5a7ff]'></i>
            </div>
            <div>
              <h5 className="text-lg font-semibold text-txt-primary dark:text-[#d5d5e2]">Slot & Kuota Layanan</h5>
              <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Atur durasi slot dan batas booking per jam</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg">
            <i className='bx bx-info-circle text-xl text-amber-600'></i>
            <p className="text-sm text-amber-800 dark:text-amber-200">Belum ada layanan. Silakan buat layanan terlebih dahulu.</p>
          </div>
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
              <i className='bx bx-timer text-xl text-primary dark:text-[#a5a7ff]'></i>
            </div>
            <div>
              <h5 className="text-lg font-semibold text-txt-primary dark:text-[#d5d5e2]">Slot & Kuota Layanan</h5>
              <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Atur durasi slot dan batas booking per jam</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-primary-light dark:bg-[#35365f] text-primary dark:text-[#a5a7ff] text-xs font-bold rounded">
            {services.length} Layanan
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

        {/* Info: Global Hours Reference */}
        {businessHours && (
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-[#25445c]/30 rounded-lg">
            <i className='bx bx-time-five text-xl text-info flex-shrink-0 mt-0.5'></i>
            <div>
              <p className="text-sm font-semibold text-info mb-1">Jam Operasional Global</p>
              <p className="text-xs text-txt-secondary dark:text-[#b2b2c4]">
                Semua layanan beroperasi dalam jam operasional global. Kelola jam operasional di pengaturan Jam Operasional.
              </p>
            </div>
          </div>
        )}

        {/* Services Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-[#4e4f6c]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#232333]">
                <th className="text-left py-3 px-4 font-semibold text-txt-primary dark:text-[#d5d5e2]">Nama Layanan</th>
                <th className="text-left py-3 px-4 font-semibold text-txt-primary dark:text-[#d5d5e2]">Durasi Slot</th>
                <th className="text-left py-3 px-4 font-semibold text-txt-primary dark:text-[#d5d5e2]">Kuota per Jam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#4e4f6c]">
              {services.map((service) => (
                <tr key={service.id} className="bg-white dark:bg-[#2b2c40] hover:bg-gray-50 dark:hover:bg-[#232333] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
                        <i className='bx bx-cut text-primary dark:text-[#a5a7ff]'></i>
                      </div>
                      <span className="font-medium text-txt-primary dark:text-[#d5d5e2]">{service.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={service.slotDurationMinutes}
                      onChange={(e) => updateServiceField(service.id, 'slotDurationMinutes', parseInt(e.target.value))}
                      disabled={saving}
                      className="h-9 px-3 py-1 bg-white dark:bg-[#232333] border border-gray-200 dark:border-[#4e4f6c] rounded-md text-sm text-txt-primary dark:text-[#d5d5e2] focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value={15}>15 menit</option>
                      <option value={30}>30 menit</option>
                      <option value={60}>60 menit</option>
                      <option value={90}>90 menit</option>
                      <option value={120}>120 menit</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      min="1"
                      value={service.hourlyQuota}
                      onChange={(e) => updateServiceField(service.id, 'hourlyQuota', parseInt(e.target.value) || 1)}
                      disabled={saving}
                      className="w-20 h-9 px-3 py-1 bg-white dark:bg-[#232333] border border-gray-200 dark:border-[#4e4f6c] rounded-md text-sm text-txt-primary dark:text-[#d5d5e2] focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Info Box */}
        <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-[#232333] rounded-lg">
          <i className='bx bx-bulb text-xl text-warning flex-shrink-0 mt-0.5'></i>
          <p className="text-sm text-txt-secondary dark:text-[#b2b2c4]">
            <strong>Contoh:</strong> Jika durasi slot 30 menit dan kuota 3, pelanggan dapat booking 3 slot 30 menit per jam (total kapasitas 1.5 jam per jam).
          </p>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-100 dark:border-[#4e4f6c] flex items-center gap-3">
          <button
            onClick={handleSaveAll}
            disabled={saving || !hasChanges}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-md shadow-md shadow-primary/20 transition-all duration-200 ease-in-out hover:bg-[#5f61e6] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <i className='bx bx-loader-alt animate-spin'></i>
                Menyimpan...
              </>
            ) : (
              <>
                <i className='bx bx-save'></i>
                Simpan Semua Perubahan
              </>
            )}
          </button>
          {hasChanges && (
            <span className="text-sm text-warning flex items-center gap-1">
              <i className='bx bx-error'></i>
              Ada perubahan yang belum disimpan
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
