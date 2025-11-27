'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Service } from '@/types/booking';

export default function ServicesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain');

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    if (!subdomain) {
      router.push('/tenant/login');
      return;
    }

    fetchServices();
  }, [subdomain, router]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/services', {
        headers: {
          'x-tenant-id': subdomain!
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }

      const data = await response.json();
      setServices(data.services || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus layanan ini?')) {
      return;
    }

    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'x-tenant-id': subdomain!
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete service');
      }

      setServices(services.filter(s => s.id !== serviceId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete service');
    }
  };

  const handleToggleStatus = async (service: Service) => {
    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': subdomain!
        },
        body: JSON.stringify({
          name: service.name,
          description: service.description,
          duration: service.duration,
          price: service.price,
          category: service.category,
          isActive: !service.isActive,
          homeVisitAvailable: service.homeVisitAvailable,
          homeVisitSurcharge: service.homeVisitSurcharge || 0
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update service status');
      }

      const updated = await response.json();
      setServices(
        services.map(s =>
          s.id === service.id ? (updated.service || { ...s, isActive: !s.isActive }) : s
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  // Get unique categories
  const categories = ['all', ...new Set(services.map(s => s.category).filter(Boolean))];

  // Filter services
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (service.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || service.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Stats
  const activeServices = services.filter(s => s.isActive).length;
  const homeVisitServices = services.filter(s => s.homeVisitAvailable).length;

  if (!subdomain) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h4 className="text-xl font-bold text-txt-primary dark:text-[#d5d5e2]">Services</h4>
          <p className="text-sm text-txt-secondary dark:text-[#b2b2c4]">Kelola layanan dan harga bisnis Anda</p>
        </div>
        <button
          onClick={() => router.push(`/tenant/admin/services/create?subdomain=${subdomain}`)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-md shadow-md shadow-primary/20 transition-all duration-200 ease-in-out hover:bg-[#5f61e6] hover:shadow-lg"
        >
          <i className='bx bx-plus text-lg'></i>
          Tambah Layanan
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#2b2c40] rounded-card shadow-card p-5 transition-all duration-200 ease-in-out hover:shadow-lg hover:-translate-y-0.5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
              <i className='bx bx-briefcase text-2xl text-primary dark:text-[#a5a7ff]'></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-txt-primary dark:text-[#d5d5e2]">{services.length}</p>
              <p className="text-sm text-txt-muted dark:text-[#7e7f96]">Total Layanan</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#2b2c40] rounded-card shadow-card p-5 transition-all duration-200 ease-in-out hover:shadow-lg hover:-translate-y-0.5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-green-100 dark:bg-[#36483f] flex items-center justify-center">
              <i className='bx bx-check-circle text-2xl text-success'></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-txt-primary dark:text-[#d5d5e2]">{activeServices}</p>
              <p className="text-sm text-txt-muted dark:text-[#7e7f96]">Layanan Aktif</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#2b2c40] rounded-card shadow-card p-5 transition-all duration-200 ease-in-out hover:shadow-lg hover:-translate-y-0.5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-blue-100 dark:bg-[#25445c] flex items-center justify-center">
              <i className='bx bx-home text-2xl text-info'></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-txt-primary dark:text-[#d5d5e2]">{homeVisitServices}</p>
              <p className="text-sm text-txt-muted dark:text-[#7e7f96]">Home Visit</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#2b2c40] rounded-card shadow-card p-5 transition-all duration-200 ease-in-out hover:shadow-lg hover:-translate-y-0.5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-amber-100 dark:bg-[#4d4036] flex items-center justify-center">
              <i className='bx bx-category text-2xl text-warning'></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-txt-primary dark:text-[#d5d5e2]">{categories.length - 1}</p>
              <p className="text-sm text-txt-muted dark:text-[#7e7f96]">Kategori</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-100 dark:bg-[#4d2f3a] border border-red-200 dark:border-red-800/50 rounded-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-red-200 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <i className='bx bx-error-circle text-xl text-danger'></i>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-danger">{error}</p>
          </div>
          <button 
            onClick={() => setError(null)}
            className="p-1 text-danger hover:bg-red-200 dark:hover:bg-red-900/30 rounded transition-colors duration-150"
          >
            <i className='bx bx-x text-xl'></i>
          </button>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white dark:bg-[#2b2c40] rounded-card shadow-card overflow-hidden">
        {/* Card Header with Search & Filter */}
        <div className="p-6 border-b border-gray-100 dark:border-[#4e4f6c]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
                <i className='bx bx-list-ul text-xl text-primary dark:text-[#a5a7ff]'></i>
              </div>
              <div>
                <h5 className="text-lg font-semibold text-txt-primary dark:text-[#d5d5e2]">Daftar Layanan</h5>
                <p className="text-xs text-txt-muted dark:text-[#7e7f96]">{filteredServices.length} layanan ditemukan</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <i className='bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted dark:text-[#7e7f96]'></i>
                <input
                  type="text"
                  placeholder="Cari layanan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#232333] border border-transparent dark:border-[#4e4f6c] rounded-md text-sm text-txt-primary dark:text-[#d5d5e2] placeholder:text-txt-muted dark:placeholder:text-[#7e7f96] transition-all duration-150 ease-in-out focus:bg-white dark:focus:bg-[#2b2c40] focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
              </div>
              
              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 bg-gray-50 dark:bg-[#232333] border border-transparent dark:border-[#4e4f6c] rounded-md text-sm text-txt-primary dark:text-[#d5d5e2] transition-all duration-150 ease-in-out focus:bg-white dark:focus:bg-[#2b2c40] focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'Semua Kategori' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 rounded-lg bg-primary-light dark:bg-[#35365f] flex items-center justify-center mb-4">
                <i className='bx bx-loader-alt text-2xl text-primary dark:text-[#a5a7ff] animate-spin'></i>
              </div>
              <p className="text-txt-secondary dark:text-[#b2b2c4]">Memuat layanan...</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-[#35365f] flex items-center justify-center mb-4">
                <i className='bx bx-package text-3xl text-txt-muted dark:text-[#7e7f96]'></i>
              </div>
              <p className="text-txt-secondary dark:text-[#b2b2c4] mb-2">
                {searchQuery || filterCategory !== 'all' 
                  ? 'Tidak ada layanan yang cocok dengan filter' 
                  : 'Belum ada layanan. Buat layanan pertama Anda.'}
              </p>
              {!searchQuery && filterCategory === 'all' && (
                <button
                  onClick={() => router.push(`/tenant/admin/services/create?subdomain=${subdomain}`)}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-sm text-primary dark:text-[#a5a7ff] hover:bg-primary-light dark:hover:bg-[#35365f] rounded-md transition-colors duration-150"
                >
                  <i className='bx bx-plus'></i>
                  Tambah Layanan
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-[#4e4f6c]">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-txt-muted dark:text-[#7e7f96] uppercase tracking-wider">Layanan</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-txt-muted dark:text-[#7e7f96] uppercase tracking-wider">Kategori</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-txt-muted dark:text-[#7e7f96] uppercase tracking-wider">Durasi</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-txt-muted dark:text-[#7e7f96] uppercase tracking-wider">Harga</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-txt-muted dark:text-[#7e7f96] uppercase tracking-wider">Status</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-txt-muted dark:text-[#7e7f96] uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-[#4e4f6c]/50">
                  {filteredServices.map((service) => (
                    <tr 
                      key={service.id} 
                      className="group transition-colors duration-150 ease-in-out hover:bg-gray-50 dark:hover:bg-[#35365f]/50"
                    >
                      {/* Service Name & Description */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-primary-light dark:bg-[#35365f] flex items-center justify-center flex-shrink-0">
                            <i className='bx bx-cut text-lg text-primary dark:text-[#a5a7ff]'></i>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-txt-primary dark:text-[#d5d5e2]">{service.name}</p>
                            {service.description && (
                              <p className="text-xs text-txt-muted dark:text-[#7e7f96] line-clamp-1 max-w-[200px]">{service.description}</p>
                            )}
                            {service.homeVisitAvailable && (
                              <span className="inline-flex items-center gap-1 mt-1 text-xs text-info">
                                <i className='bx bx-home text-xs'></i>
                                Home Visit +Rp {(service.homeVisitSurcharge || 0).toLocaleString('id-ID')}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {/* Category */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 dark:bg-[#35365f] text-txt-secondary dark:text-[#b2b2c4] text-xs font-medium rounded">
                          {service.category || '-'}
                        </span>
                      </td>
                      
                      {/* Duration */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-sm text-txt-secondary dark:text-[#b2b2c4]">
                          <i className='bx bx-time-five text-txt-muted dark:text-[#7e7f96]'></i>
                          {service.duration} menit
                        </div>
                      </td>
                      
                      {/* Price */}
                      <td className="py-4 px-4">
                        <span className="text-sm font-semibold text-txt-primary dark:text-[#d5d5e2]">
                          Rp {service.price.toLocaleString('id-ID')}
                        </span>
                      </td>
                      
                      {/* Status */}
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleToggleStatus(service)}
                          className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase transition-all duration-200 ease-in-out cursor-pointer ${
                            service.isActive
                              ? 'bg-green-100 dark:bg-[#36483f] text-success hover:bg-green-200 dark:hover:bg-[#3d5347]'
                              : 'bg-gray-100 dark:bg-[#35365f] text-txt-muted dark:text-[#7e7f96] hover:bg-gray-200 dark:hover:bg-[#4e4f6c]'
                          }`}
                        >
                          {service.isActive ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      
                      {/* Actions */}
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => router.push(`/tenant/admin/services/${service.id}/edit?subdomain=${subdomain}`)}
                            className="p-2 text-txt-muted dark:text-[#7e7f96] hover:text-primary dark:hover:text-[#a5a7ff] hover:bg-primary-light dark:hover:bg-[#35365f] rounded-md transition-all duration-150 ease-in-out"
                            title="Edit"
                          >
                            <i className='bx bx-edit-alt text-lg'></i>
                          </button>
                          <button
                            onClick={() => handleDelete(service.id)}
                            className="p-2 text-txt-muted dark:text-[#7e7f96] hover:text-danger hover:bg-red-100 dark:hover:bg-[#4d2f3a] rounded-md transition-all duration-150 ease-in-out"
                            title="Hapus"
                          >
                            <i className='bx bx-trash text-lg'></i>
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
      </div>
    </div>
  );
}
