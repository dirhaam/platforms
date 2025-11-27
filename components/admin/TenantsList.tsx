"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BoxIcon } from '@/components/ui/box-icon';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Tenant {
  id: string;
  subdomain: string;
  businessName: string;
  businessCategory: string;
  ownerName: string;
  email: string;
  phone: string;
  address?: string;
  businessDescription?: string;
  emoji: string;
  website?: string;
  whatsappEnabled: boolean;
  homeVisitEnabled: boolean;
  analyticsEnabled: boolean;
  customTemplatesEnabled: boolean;
  multiStaffEnabled: boolean;
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionExpiresAt?: string;
  createdAt: number;
  updatedAt: string;
}

interface TenantsListProps {
  initialSession: any;
}

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'active' | 'suspended' | 'cancelled';
type FilterPlan = 'all' | 'basic' | 'premium' | 'enterprise';

export function TenantsList({ initialSession }: TenantsListProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterPlan, setFilterPlan] = useState<FilterPlan>('all');

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/tenants');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch tenants');
      setTenants(data.tenants || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast.error('Gagal memuat data tenant');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (tenantId: string, tenantName: string) => {
    if (!confirm(`Hapus "${tenantName}"? Aksi ini tidak dapat dibatalkan.`)) return;
    setIsDeleting(tenantId);
    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete tenant');
      toast.success(`Tenant "${tenantName}" berhasil dihapus`);
      setTenants(prev => prev.filter(t => t.id !== tenantId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus tenant');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleStatusChange = async (tenantId: string, tenantName: string, newStatus: 'active' | 'suspended') => {
    const action = newStatus === 'suspended' ? 'suspend' : 'aktifkan';
    if (!confirm(`${newStatus === 'suspended' ? 'Suspend' : 'Aktifkan'} "${tenantName}"?`)) return;
    
    setIsUpdatingStatus(tenantId);
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update status');
      
      toast.success(`Tenant "${tenantName}" berhasil di-${action}`);
      setTenants(prev => prev.map(t => 
        t.id === tenantId ? { ...t, subscriptionStatus: newStatus } : t
      ));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengubah status tenant');
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const filteredTenants = useMemo(() => {
    return tenants.filter(tenant => {
      const matchSearch = searchQuery === '' || 
        tenant.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === 'all' || tenant.subscriptionStatus === filterStatus;
      const matchPlan = filterPlan === 'all' || tenant.subscriptionPlan === filterPlan;
      return matchSearch && matchStatus && matchPlan;
    });
  }, [tenants, searchQuery, filterStatus, filterPlan]);

  const stats = useMemo(() => ({
    total: tenants.length,
    active: tenants.filter(t => t.subscriptionStatus === 'active').length,
    suspended: tenants.filter(t => t.subscriptionStatus === 'suspended').length,
    basic: tenants.filter(t => t.subscriptionPlan === 'basic').length,
    premium: tenants.filter(t => t.subscriptionPlan === 'premium').length,
    enterprise: tenants.filter(t => t.subscriptionPlan === 'enterprise').length,
  }), [tenants]);

  const getTenantUrl = (subdomain: string) => {
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    if (isLocalhost) return `http://${subdomain}.localhost:3000`;
    const hostname = typeof window !== 'undefined' ? window.location.hostname.replace(/^www\./, '') : 'booqing.my.id';
    return `https://${subdomain}.${hostname}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <BoxIcon name="loader-alt" size={40} className="animate-spin mx-auto mb-4 text-primary dark:text-[#a5a7ff]" />
          <p className="text-gray-500 dark:text-[#7e7f96]">Memuat data tenant...</p>
        </div>
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-[#2b2c40] rounded-xl border-2 border-dashed border-gray-200 dark:border-[#4e4f6c]">
        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-[#35365f] flex items-center justify-center mb-4">
          <BoxIcon name="building-house" size={40} className="text-gray-400 dark:text-[#7e7f96]" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-[#d5d5e2] mb-2">Belum Ada Tenant</h3>
        <p className="text-gray-500 dark:text-[#7e7f96] mb-6 text-center max-w-md">
          Buat tenant pertama untuk memulai platform multi-tenant Anda.
        </p>
        <Button asChild size="lg" className="bg-primary hover:bg-primary/90 dark:bg-[#7c7eff]">
          <Link href="/admin/tenants/create" className="flex items-center gap-2">
            <BoxIcon name="plus" size={20} />
            Buat Tenant Pertama
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          label="Total Tenant"
          value={stats.total}
          icon="building-house"
          color="primary"
          active={filterStatus === 'all' && filterPlan === 'all'}
          onClick={() => { setFilterStatus('all'); setFilterPlan('all'); }}
        />
        <StatCard
          label="Aktif"
          value={stats.active}
          icon="check-circle"
          color="success"
          active={filterStatus === 'active'}
          onClick={() => { setFilterStatus('active'); setFilterPlan('all'); }}
        />
        <StatCard
          label="Suspended"
          value={stats.suspended}
          icon="block"
          color="danger"
          active={filterStatus === 'suspended'}
          onClick={() => { setFilterStatus('suspended'); setFilterPlan('all'); }}
        />
        <StatCard
          label="Basic"
          value={stats.basic}
          icon="package"
          color="secondary"
          active={filterPlan === 'basic'}
          onClick={() => { setFilterPlan('basic'); setFilterStatus('all'); }}
        />
        <StatCard
          label="Premium"
          value={stats.premium}
          icon="crown"
          color="purple"
          active={filterPlan === 'premium'}
          onClick={() => { setFilterPlan('premium'); setFilterStatus('all'); }}
        />
        <StatCard
          label="Enterprise"
          value={stats.enterprise}
          icon="diamond"
          color="warning"
          active={filterPlan === 'enterprise'}
          onClick={() => { setFilterPlan('enterprise'); setFilterStatus('all'); }}
        />
      </div>

      {/* Search & Filters */}
      <Card className="dark:bg-[#2b2c40] dark:border-[#4e4f6c]">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <BoxIcon name="search" size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Cari tenant, subdomain, owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 dark:bg-[#35365f] dark:border-[#4e4f6c] dark:text-[#d5d5e2]"
              />
            </div>
            <div className="flex items-center gap-2">
              {(filterStatus !== 'all' || filterPlan !== 'all') && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setFilterStatus('all'); setFilterPlan('all'); }}
                  className="text-gray-500 dark:text-[#7e7f96]"
                >
                  <BoxIcon name="x" size={16} className="mr-1" />
                  Clear Filter
                </Button>
              )}
              <div className="flex border dark:border-[#4e4f6c] rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2 transition-colors",
                    viewMode === 'grid' 
                      ? 'bg-primary/10 text-primary dark:bg-[#35365f] dark:text-[#a5a7ff]' 
                      : 'bg-white dark:bg-[#2b2c40] hover:bg-gray-50 dark:hover:bg-[#35365f] text-gray-500'
                  )}
                >
                  <BoxIcon name="grid-alt" size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 transition-colors",
                    viewMode === 'list' 
                      ? 'bg-primary/10 text-primary dark:bg-[#35365f] dark:text-[#a5a7ff]' 
                      : 'bg-white dark:bg-[#2b2c40] hover:bg-gray-50 dark:hover:bg-[#35365f] text-gray-500'
                  )}
                >
                  <BoxIcon name="list-ul" size={18} />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      {searchQuery && (
        <p className="text-sm text-gray-500 dark:text-[#7e7f96]">
          Menampilkan {filteredTenants.length} dari {tenants.length} tenant
        </p>
      )}

      {/* Tenant Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTenants.map((tenant) => (
            <TenantCard 
              key={tenant.id} 
              tenant={tenant} 
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              isDeleting={isDeleting === tenant.id}
              isUpdatingStatus={isUpdatingStatus === tenant.id}
              getTenantUrl={getTenantUrl}
              formatDate={formatDate}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTenants.map((tenant) => (
            <TenantRow 
              key={tenant.id} 
              tenant={tenant} 
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              isDeleting={isDeleting === tenant.id}
              isUpdatingStatus={isUpdatingStatus === tenant.id}
              getTenantUrl={getTenantUrl}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}

      {filteredTenants.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <BoxIcon name="search-alt" size={48} className="text-gray-300 dark:text-[#4e4f6c] mx-auto mb-4" />
          <p className="text-gray-500 dark:text-[#7e7f96]">Tidak ada tenant yang cocok dengan pencarian "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color, active, onClick }: {
  label: string;
  value: number;
  icon: string;
  color: 'primary' | 'success' | 'danger' | 'warning' | 'secondary' | 'purple';
  active: boolean;
  onClick: () => void;
}) {
  const colorMap = {
    primary: {
      bg: 'bg-primary/10 dark:bg-[#35365f]',
      text: 'text-primary dark:text-[#a5a7ff]',
      activeBg: 'bg-primary/20 border-primary/30 dark:bg-[#35365f] dark:border-[#7c7eff]',
    },
    success: {
      bg: 'bg-green-100 dark:bg-[#36483f]',
      text: 'text-green-600 dark:text-[#aaeb87]',
      activeBg: 'bg-green-100 border-green-300 dark:bg-[#36483f] dark:border-[#aaeb87]',
    },
    danger: {
      bg: 'bg-red-100 dark:bg-[#4d2f3a]',
      text: 'text-red-600 dark:text-[#ff8b77]',
      activeBg: 'bg-red-100 border-red-300 dark:bg-[#4d2f3a] dark:border-[#ff8b77]',
    },
    warning: {
      bg: 'bg-amber-100 dark:bg-[#4d422f]',
      text: 'text-amber-600 dark:text-[#ffd377]',
      activeBg: 'bg-amber-100 border-amber-300 dark:bg-[#4d422f] dark:border-[#ffd377]',
    },
    secondary: {
      bg: 'bg-gray-100 dark:bg-[#3b3c52]',
      text: 'text-gray-600 dark:text-[#b2b2c4]',
      activeBg: 'bg-gray-200 border-gray-300 dark:bg-[#3b3c52] dark:border-[#7e7f96]',
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-[#3a3361]',
      text: 'text-purple-600 dark:text-[#c4a5ff]',
      activeBg: 'bg-purple-100 border-purple-300 dark:bg-[#3a3361] dark:border-[#c4a5ff]',
    },
  };

  const colors = colorMap[color];

  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border-2 transition-all text-left w-full",
        active 
          ? colors.activeBg
          : "bg-white dark:bg-[#2b2c40] border-transparent hover:border-gray-200 dark:hover:border-[#4e4f6c]"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colors.bg)}>
          <BoxIcon name={icon} size={20} className={colors.text} />
        </div>
        <div>
          <p className={cn("text-2xl font-bold", colors.text)}>{value}</p>
          <p className="text-xs text-gray-500 dark:text-[#7e7f96]">{label}</p>
        </div>
      </div>
    </button>
  );
}

function TenantCard({ tenant, onDelete, onStatusChange, isDeleting, isUpdatingStatus, getTenantUrl, formatDate }: {
  tenant: Tenant;
  onDelete: (id: string, name: string) => void;
  onStatusChange: (id: string, name: string, status: 'active' | 'suspended') => void;
  isDeleting: boolean;
  isUpdatingStatus: boolean;
  getTenantUrl: (subdomain: string) => string;
  formatDate: (timestamp: number) => string;
}) {
  const statusConfig: Record<string, { bg: string; text: string; icon: string }> = {
    active: { bg: 'bg-green-100 dark:bg-[#36483f]', text: 'text-green-700 dark:text-[#aaeb87]', icon: 'check-circle' },
    suspended: { bg: 'bg-red-100 dark:bg-[#4d2f3a]', text: 'text-red-700 dark:text-[#ff8b77]', icon: 'block' },
    cancelled: { bg: 'bg-gray-100 dark:bg-[#3b3c52]', text: 'text-gray-700 dark:text-[#b2b2c4]', icon: 'x-circle' },
  };
  const planConfig: Record<string, { bg: string; text: string; icon: string }> = {
    basic: { bg: 'bg-gray-100 dark:bg-[#3b3c52]', text: 'text-gray-700 dark:text-[#b2b2c4]', icon: 'package' },
    premium: { bg: 'bg-purple-100 dark:bg-[#3a3361]', text: 'text-purple-700 dark:text-[#c4a5ff]', icon: 'crown' },
    enterprise: { bg: 'bg-amber-100 dark:bg-[#4d422f]', text: 'text-amber-700 dark:text-[#ffd377]', icon: 'diamond' },
  };

  const status = statusConfig[tenant.subscriptionStatus] || statusConfig.active;
  const plan = planConfig[tenant.subscriptionPlan] || planConfig.basic;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 dark:bg-[#2b2c40] dark:border-[#4e4f6c] group">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 border-b dark:border-[#4e4f6c] bg-gradient-to-r from-gray-50 to-white dark:from-[#35365f] dark:to-[#2b2c40]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{tenant.emoji}</span>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-[#d5d5e2] line-clamp-1">{tenant.businessName}</h3>
                <a 
                  href={getTenantUrl(tenant.subdomain)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary dark:text-[#a5a7ff] hover:underline flex items-center gap-1"
                >
                  {tenant.subdomain}
                  <BoxIcon name="link-external" size={12} />
                </a>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className={cn("px-2 py-0.5 rounded-md text-xs font-medium flex items-center gap-1", status.bg, status.text)}>
                <BoxIcon name={status.icon} size={12} />
                {tenant.subscriptionStatus}
              </span>
              <span className={cn("px-2 py-0.5 rounded-md text-xs font-medium flex items-center gap-1", plan.bg, plan.text)}>
                <BoxIcon name={plan.icon} size={12} />
                {tenant.subscriptionPlan}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Owner Info */}
          <div className="flex items-center gap-2 text-sm">
            <BoxIcon name="user" size={16} className="text-gray-400 dark:text-[#7e7f96]" />
            <span className="text-gray-700 dark:text-[#b2b2c4]">{tenant.ownerName}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-[#7e7f96] pl-6">{tenant.email}</div>

          {/* Features */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {tenant.whatsappEnabled && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-[#36483f] text-green-700 dark:text-[#aaeb87] rounded text-xs">
                <BoxIcon name="message-rounded-dots" size={12} /> WA
              </span>
            )}
            {tenant.homeVisitEnabled && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-[#25445c] text-blue-700 dark:text-[#68dbf4] rounded text-xs">
                <BoxIcon name="map" size={12} /> Visit
              </span>
            )}
            {tenant.analyticsEnabled && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 dark:bg-[#3a3361] text-purple-700 dark:text-[#c4a5ff] rounded text-xs">
                <BoxIcon name="bar-chart-alt-2" size={12} /> Stats
              </span>
            )}
            {tenant.multiStaffEnabled && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 dark:bg-[#4d3d2f] text-orange-700 dark:text-[#ffaa77] rounded text-xs">
                <BoxIcon name="group" size={12} /> Staff
              </span>
            )}
          </div>

          {/* Date */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-[#7e7f96] pt-1">
            <BoxIcon name="calendar" size={12} />
            Dibuat {formatDate(tenant.createdAt)}
          </div>
        </div>

        {/* Actions */}
        <div className="p-3 border-t dark:border-[#4e4f6c] bg-gray-50 dark:bg-[#35365f]/50 flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="flex-1 dark:border-[#4e4f6c] dark:hover:bg-[#4e4f6c]">
            <Link href={`/admin/tenants/${tenant.id}`} className="flex items-center justify-center gap-1">
              <BoxIcon name="show" size={16} />
              Detail
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="flex-1 dark:border-[#4e4f6c] dark:hover:bg-[#4e4f6c]">
            <Link href={`/admin/tenants/${tenant.id}/edit`} className="flex items-center justify-center gap-1">
              <BoxIcon name="edit" size={16} />
              Edit
            </Link>
          </Button>
          {tenant.subscriptionStatus === 'active' ? (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onStatusChange(tenant.id, tenant.businessName, 'suspended')}
              disabled={isUpdatingStatus}
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-[#4d3d2f]"
              title="Suspend Tenant"
            >
              {isUpdatingStatus ? <BoxIcon name="loader-alt" size={16} className="animate-spin" /> : <BoxIcon name="block" size={16} />}
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onStatusChange(tenant.id, tenant.businessName, 'active')}
              disabled={isUpdatingStatus}
              className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-[#36483f]"
              title="Aktifkan Tenant"
            >
              {isUpdatingStatus ? <BoxIcon name="loader-alt" size={16} className="animate-spin" /> : <BoxIcon name="check-circle" size={16} />}
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onDelete(tenant.id, tenant.businessName)}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-[#4d2f3a]"
            title="Hapus Tenant"
          >
            {isDeleting ? <BoxIcon name="loader-alt" size={16} className="animate-spin" /> : <BoxIcon name="trash" size={16} />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TenantRow({ tenant, onDelete, onStatusChange, isDeleting, isUpdatingStatus, getTenantUrl, formatDate }: {
  tenant: Tenant;
  onDelete: (id: string, name: string) => void;
  onStatusChange: (id: string, name: string, status: 'active' | 'suspended') => void;
  isDeleting: boolean;
  isUpdatingStatus: boolean;
  getTenantUrl: (subdomain: string) => string;
  formatDate: (timestamp: number) => string;
}) {
  const statusConfig: Record<string, { bg: string; text: string }> = {
    active: { bg: 'bg-green-100 dark:bg-[#36483f]', text: 'text-green-700 dark:text-[#aaeb87]' },
    suspended: { bg: 'bg-red-100 dark:bg-[#4d2f3a]', text: 'text-red-700 dark:text-[#ff8b77]' },
    cancelled: { bg: 'bg-gray-100 dark:bg-[#3b3c52]', text: 'text-gray-700 dark:text-[#b2b2c4]' },
  };
  const planConfig: Record<string, { bg: string; text: string }> = {
    basic: { bg: 'bg-gray-100 dark:bg-[#3b3c52]', text: 'text-gray-700 dark:text-[#b2b2c4]' },
    premium: { bg: 'bg-purple-100 dark:bg-[#3a3361]', text: 'text-purple-700 dark:text-[#c4a5ff]' },
    enterprise: { bg: 'bg-amber-100 dark:bg-[#4d422f]', text: 'text-amber-700 dark:text-[#ffd377]' },
  };

  const status = statusConfig[tenant.subscriptionStatus] || statusConfig.active;
  const plan = planConfig[tenant.subscriptionPlan] || planConfig.basic;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow dark:bg-[#2b2c40] dark:border-[#4e4f6c]">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Emoji & Name */}
          <span className="text-2xl">{tenant.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-[#d5d5e2] truncate">{tenant.businessName}</h3>
              <a 
                href={getTenantUrl(tenant.subdomain)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary dark:text-[#a5a7ff] hover:underline flex items-center gap-1 text-sm"
              >
                {tenant.subdomain}
                <BoxIcon name="link-external" size={12} />
              </a>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-[#7e7f96] mt-1">
              <span className="flex items-center gap-1">
                <BoxIcon name="user" size={14} />
                {tenant.ownerName}
              </span>
              <span className="hidden sm:inline">{tenant.email}</span>
            </div>
          </div>

          {/* Status & Plan */}
          <div className="flex items-center gap-2">
            <span className={cn("px-2 py-0.5 rounded text-xs font-medium", status.bg, status.text)}>
              {tenant.subscriptionStatus}
            </span>
            <span className={cn("px-2 py-0.5 rounded text-xs font-medium", plan.bg, plan.text)}>
              {tenant.subscriptionPlan}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild title="Lihat Detail" className="dark:hover:bg-[#4e4f6c]">
              <Link href={`/admin/tenants/${tenant.id}`}>
                <BoxIcon name="show" size={18} />
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild title="Edit" className="dark:hover:bg-[#4e4f6c]">
              <Link href={`/admin/tenants/${tenant.id}/edit`}>
                <BoxIcon name="edit" size={18} />
              </Link>
            </Button>
            {tenant.subscriptionStatus === 'active' ? (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onStatusChange(tenant.id, tenant.businessName, 'suspended')}
                disabled={isUpdatingStatus}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-[#4d3d2f]"
                title="Suspend Tenant"
              >
                {isUpdatingStatus ? <BoxIcon name="loader-alt" size={18} className="animate-spin" /> : <BoxIcon name="block" size={18} />}
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onStatusChange(tenant.id, tenant.businessName, 'active')}
                disabled={isUpdatingStatus}
                className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-[#36483f]"
                title="Aktifkan Tenant"
              >
                {isUpdatingStatus ? <BoxIcon name="loader-alt" size={18} className="animate-spin" /> : <BoxIcon name="check-circle" size={18} />}
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onDelete(tenant.id, tenant.businessName)}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-[#4d2f3a]"
              title="Hapus Tenant"
            >
              {isDeleting ? <BoxIcon name="loader-alt" size={18} className="animate-spin" /> : <BoxIcon name="trash" size={18} />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
