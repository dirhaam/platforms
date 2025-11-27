'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PermissionGate } from '@/components/tenant/permission-gate';

export default function StaffPageContent() {
  return (
    <PermissionGate feature="staff">
      <StaffPageInner />
    </PermissionGate>
  );
}

function StaffPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain');
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  useEffect(() => {
    if (!subdomain) {
      router.push('/tenant/login');
      return;
    }
    fetchStaff();
  }, [subdomain, router]);

  const fetchStaff = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/admin/staff', {
        credentials: 'include',
        headers: {
          'x-tenant-id': subdomain!,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        router.push(`/tenant/login?subdomain=${subdomain}&redirect=/tenant/admin/staff`);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      setStaff(data.staff || []);
    } catch (error) {
      console.error('[StaffPage] Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (staffId: string, staffName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ${staffName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/staff/${staffId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'x-tenant-id': subdomain!,
        }
      });

      if (response.ok) {
        setStaff(staff.filter(s => s.id !== staffId));
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
    }
  };

  // Get unique roles
  const roles = ['all', ...new Set(staff.map(s => s.role || 'staff').filter(Boolean))];

  // Filter staff
  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || (member.role || 'staff') === filterRole;
    return matchesSearch && matchesRole;
  });

  // Stats
  const activeStaff = staff.filter(s => s.is_active).length;
  const adminCount = staff.filter(s => s.role === 'admin').length;
  const ownerCount = staff.filter(s => s.role === 'owner').length;

  // Role badge colors
  const getRoleBadgeClass = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'owner':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
      case 'admin':
        return 'bg-blue-100 dark:bg-[#25445c] text-info';
      case 'staff':
      default:
        return 'bg-gray-100 dark:bg-[#35365f] text-txt-secondary dark:text-[#b2b2c4]';
    }
  };

  if (!subdomain) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h4 className="text-xl font-bold text-txt-primary dark:text-[#d5d5e2]">Staff</h4>
          <p className="text-sm text-txt-secondary dark:text-[#b2b2c4]">Kelola anggota tim dan hak akses</p>
        </div>
        <button
          onClick={() => router.push(`/tenant/admin/staff/create?subdomain=${subdomain}`)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-md shadow-md shadow-primary/20 transition-all duration-200 ease-in-out hover:bg-[#5f61e6] hover:shadow-lg"
        >
          <i className='bx bx-plus text-lg'></i>
          Tambah Staff
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#2b2c40] rounded-card shadow-card p-5 transition-all duration-200 ease-in-out hover:shadow-lg hover:-translate-y-0.5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
              <i className='bx bx-group text-2xl text-primary dark:text-[#a5a7ff]'></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-txt-primary dark:text-[#d5d5e2]">{staff.length}</p>
              <p className="text-sm text-txt-muted dark:text-[#7e7f96]">Total Staff</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#2b2c40] rounded-card shadow-card p-5 transition-all duration-200 ease-in-out hover:shadow-lg hover:-translate-y-0.5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-green-100 dark:bg-[#36483f] flex items-center justify-center">
              <i className='bx bx-check-circle text-2xl text-success'></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-txt-primary dark:text-[#d5d5e2]">{activeStaff}</p>
              <p className="text-sm text-txt-muted dark:text-[#7e7f96]">Staff Aktif</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#2b2c40] rounded-card shadow-card p-5 transition-all duration-200 ease-in-out hover:shadow-lg hover:-translate-y-0.5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <i className='bx bx-crown text-2xl text-purple-600 dark:text-purple-400'></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-txt-primary dark:text-[#d5d5e2]">{ownerCount}</p>
              <p className="text-sm text-txt-muted dark:text-[#7e7f96]">Owner</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#2b2c40] rounded-card shadow-card p-5 transition-all duration-200 ease-in-out hover:shadow-lg hover:-translate-y-0.5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-blue-100 dark:bg-[#25445c] flex items-center justify-center">
              <i className='bx bx-shield-quarter text-2xl text-info'></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-txt-primary dark:text-[#d5d5e2]">{adminCount}</p>
              <p className="text-sm text-txt-muted dark:text-[#7e7f96]">Admin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-[#2b2c40] rounded-card shadow-card overflow-hidden">
        {/* Card Header with Search & Filter */}
        <div className="p-6 border-b border-gray-100 dark:border-[#4e4f6c]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
                <i className='bx bx-user text-xl text-primary dark:text-[#a5a7ff]'></i>
              </div>
              <div>
                <h5 className="text-lg font-semibold text-txt-primary dark:text-[#d5d5e2]">Daftar Staff</h5>
                <p className="text-xs text-txt-muted dark:text-[#7e7f96]">{filteredStaff.length} anggota tim</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <i className='bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted dark:text-[#7e7f96]'></i>
                <input
                  type="text"
                  placeholder="Cari staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#232333] border border-transparent dark:border-[#4e4f6c] rounded-md text-sm text-txt-primary dark:text-[#d5d5e2] placeholder:text-txt-muted dark:placeholder:text-[#7e7f96] transition-all duration-150 ease-in-out focus:bg-white dark:focus:bg-[#2b2c40] focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
              </div>
              
              {/* Role Filter */}
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 bg-gray-50 dark:bg-[#232333] border border-transparent dark:border-[#4e4f6c] rounded-md text-sm text-txt-primary dark:text-[#d5d5e2] transition-all duration-150 ease-in-out focus:bg-white dark:focus:bg-[#2b2c40] focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none capitalize"
              >
                {roles.map(role => (
                  <option key={role} value={role}>
                    {role === 'all' ? 'Semua Role' : role}
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
              <p className="text-txt-secondary dark:text-[#b2b2c4]">Memuat data staff...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-[#35365f] flex items-center justify-center mb-4">
                <i className='bx bx-user-x text-3xl text-txt-muted dark:text-[#7e7f96]'></i>
              </div>
              <p className="text-txt-secondary dark:text-[#b2b2c4] mb-2">
                {searchQuery || filterRole !== 'all' 
                  ? 'Tidak ada staff yang cocok dengan filter' 
                  : 'Belum ada anggota tim. Tambahkan staff pertama Anda.'}
              </p>
              {!searchQuery && filterRole === 'all' && (
                <button
                  onClick={() => router.push(`/tenant/admin/staff/create?subdomain=${subdomain}`)}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-sm text-primary dark:text-[#a5a7ff] hover:bg-primary-light dark:hover:bg-[#35365f] rounded-md transition-colors duration-150"
                >
                  <i className='bx bx-plus'></i>
                  Tambah Staff
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-[#4e4f6c]">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-txt-muted dark:text-[#7e7f96] uppercase tracking-wider">Staff</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-txt-muted dark:text-[#7e7f96] uppercase tracking-wider">Email</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-txt-muted dark:text-[#7e7f96] uppercase tracking-wider">Role</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-txt-muted dark:text-[#7e7f96] uppercase tracking-wider">Status</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-txt-muted dark:text-[#7e7f96] uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-[#4e4f6c]/50">
                  {filteredStaff.map((member) => (
                    <tr 
                      key={member.id} 
                      className="group transition-colors duration-150 ease-in-out hover:bg-gray-50 dark:hover:bg-[#35365f]/50"
                    >
                      {/* Staff Name & Avatar */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-light dark:bg-[#35365f] flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-primary dark:text-[#a5a7ff]">
                              {member.name?.charAt(0)?.toUpperCase() || 'S'}
                            </span>
                          </div>
                          <div>
                            <button
                              onClick={() => router.push(`/tenant/admin/staff/${member.id}?subdomain=${subdomain}`)}
                              className="text-sm font-semibold text-txt-primary dark:text-[#d5d5e2] hover:text-primary dark:hover:text-[#a5a7ff] transition-colors duration-150"
                            >
                              {member.name}
                            </button>
                            {member.phone && (
                              <p className="text-xs text-txt-muted dark:text-[#7e7f96]">{member.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {/* Email */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-sm text-txt-secondary dark:text-[#b2b2c4]">
                          <i className='bx bx-envelope text-txt-muted dark:text-[#7e7f96]'></i>
                          {member.email}
                        </div>
                      </td>
                      
                      {/* Role */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded capitalize ${getRoleBadgeClass(member.role)}`}>
                          {member.role === 'owner' && <i className='bx bx-crown mr-1'></i>}
                          {member.role === 'admin' && <i className='bx bx-shield-quarter mr-1'></i>}
                          {member.role || 'staff'}
                        </span>
                      </td>
                      
                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase ${
                          member.is_active
                            ? 'bg-green-100 dark:bg-[#36483f] text-success'
                            : 'bg-gray-100 dark:bg-[#35365f] text-txt-muted dark:text-[#7e7f96]'
                        }`}>
                          {member.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      
                      {/* Actions */}
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => router.push(`/tenant/admin/staff/${member.id}?subdomain=${subdomain}`)}
                            className="p-2 text-txt-muted dark:text-[#7e7f96] hover:text-primary dark:hover:text-[#a5a7ff] hover:bg-primary-light dark:hover:bg-[#35365f] rounded-md transition-all duration-150 ease-in-out"
                            title="Lihat Detail"
                          >
                            <i className='bx bx-show text-lg'></i>
                          </button>
                          <button
                            onClick={() => router.push(`/tenant/admin/staff/${member.id}?subdomain=${subdomain}`)}
                            className="p-2 text-txt-muted dark:text-[#7e7f96] hover:text-info hover:bg-blue-100 dark:hover:bg-[#25445c] rounded-md transition-all duration-150 ease-in-out"
                            title="Edit"
                          >
                            <i className='bx bx-edit-alt text-lg'></i>
                          </button>
                          {member.role !== 'owner' && (
                            <button
                              onClick={() => handleDelete(member.id, member.name)}
                              className="p-2 text-txt-muted dark:text-[#7e7f96] hover:text-danger hover:bg-red-100 dark:hover:bg-[#4d2f3a] rounded-md transition-all duration-150 ease-in-out"
                              title="Hapus"
                            >
                              <i className='bx bx-trash text-lg'></i>
                            </button>
                          )}
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
