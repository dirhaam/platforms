"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  Edit, 
  Trash2, 
  Eye, 
  Loader2,
  Globe,
  Users,
  Search,
  CreditCard,
  ExternalLink,
  LayoutGrid,
  List,
  Filter,
  MessageSquare,
  MapPin,
  BarChart3,
  Smartphone,
  Ban,
  CheckCircle,
  Power
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

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
      toast.error('Failed to load tenants');
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
    const action = newStatus === 'suspended' ? 'suspend' : 'activate';
    if (!confirm(`${action === 'suspend' ? 'Suspend' : 'Aktifkan'} "${tenantName}"?`)) return;
    
    setIsUpdatingStatus(tenantId);
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update status');
      
      toast.success(data.message || `Tenant "${tenantName}" berhasil di-${action}`);
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
    const isLocalhost = window.location.hostname === 'localhost';
    if (isLocalhost) return `http://${subdomain}.localhost:3000`;
    const hostname = window.location.hostname.replace(/^www\./, '');
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
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-500">Memuat data tenant...</p>
        </div>
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
        <Building2 className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Tenant</h3>
        <p className="text-gray-500 mb-6 text-center max-w-md">
          Buat tenant pertama untuk memulai platform multi-tenant Anda.
        </p>
        <Button asChild size="lg">
          <Link href="/admin/tenants/create">
            <Building2 className="w-5 h-5 mr-2" />
            Buat Tenant Pertama
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <button 
          onClick={() => { setFilterStatus('all'); setFilterPlan('all'); }}
          className={`p-4 rounded-xl border transition-all ${filterStatus === 'all' && filterPlan === 'all' ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-gray-50'}`}
        >
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500">Total Tenant</p>
        </button>
        <button 
          onClick={() => { setFilterStatus('active'); setFilterPlan('all'); }}
          className={`p-4 rounded-xl border transition-all ${filterStatus === 'active' ? 'bg-green-50 border-green-200' : 'bg-white hover:bg-gray-50'}`}
        >
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          <p className="text-xs text-gray-500">Aktif</p>
        </button>
        <button 
          onClick={() => { setFilterStatus('suspended'); setFilterPlan('all'); }}
          className={`p-4 rounded-xl border transition-all ${filterStatus === 'suspended' ? 'bg-red-50 border-red-200' : 'bg-white hover:bg-gray-50'}`}
        >
          <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
          <p className="text-xs text-gray-500">Suspended</p>
        </button>
        <button 
          onClick={() => { setFilterPlan('basic'); setFilterStatus('all'); }}
          className={`p-4 rounded-xl border transition-all ${filterPlan === 'basic' ? 'bg-gray-100 border-gray-300' : 'bg-white hover:bg-gray-50'}`}
        >
          <p className="text-2xl font-bold text-gray-600">{stats.basic}</p>
          <p className="text-xs text-gray-500">Basic</p>
        </button>
        <button 
          onClick={() => { setFilterPlan('premium'); setFilterStatus('all'); }}
          className={`p-4 rounded-xl border transition-all ${filterPlan === 'premium' ? 'bg-purple-50 border-purple-200' : 'bg-white hover:bg-gray-50'}`}
        >
          <p className="text-2xl font-bold text-purple-600">{stats.premium}</p>
          <p className="text-xs text-gray-500">Premium</p>
        </button>
        <button 
          onClick={() => { setFilterPlan('enterprise'); setFilterStatus('all'); }}
          className={`p-4 rounded-xl border transition-all ${filterPlan === 'enterprise' ? 'bg-amber-50 border-amber-200' : 'bg-white hover:bg-gray-50'}`}
        >
          <p className="text-2xl font-bold text-amber-600">{stats.enterprise}</p>
          <p className="text-xs text-gray-500">Enterprise</p>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Cari tenant, subdomain, owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          {(filterStatus !== 'all' || filterPlan !== 'all') && (
            <Button variant="ghost" size="sm" onClick={() => { setFilterStatus('all'); setFilterPlan('all'); }}>
              <Filter className="w-4 h-4 mr-1" />
              Clear Filter
            </Button>
          )}
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      {searchQuery && (
        <p className="text-sm text-gray-500">
          Menampilkan {filteredTenants.length} dari {tenants.length} tenant
        </p>
      )}

      {/* Tenant Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Tidak ada tenant yang cocok dengan pencarian "{searchQuery}"</p>
        </div>
      )}
    </div>
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
  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    suspended: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-700',
  };
  const planColors: Record<string, string> = {
    basic: 'bg-gray-100 text-gray-700',
    premium: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-amber-100 text-amber-700',
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{tenant.emoji}</span>
              <div>
                <h3 className="font-semibold text-gray-900 line-clamp-1">{tenant.businessName}</h3>
                <a 
                  href={getTenantUrl(tenant.subdomain)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  {tenant.subdomain}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[tenant.subscriptionStatus]}`}>
                {tenant.subscriptionStatus}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${planColors[tenant.subscriptionPlan]}`}>
                {tenant.subscriptionPlan}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Owner Info */}
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{tenant.ownerName}</span>
          </div>
          <div className="text-xs text-gray-500 pl-6">{tenant.email}</div>

          {/* Features */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {tenant.whatsappEnabled && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                <MessageSquare className="w-3 h-3" /> WA
              </span>
            )}
            {tenant.homeVisitEnabled && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                <MapPin className="w-3 h-3" /> Visit
              </span>
            )}
            {tenant.analyticsEnabled && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">
                <BarChart3 className="w-3 h-3" /> Stats
              </span>
            )}
            {tenant.multiStaffEnabled && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-xs">
                <Users className="w-3 h-3" /> Staff
              </span>
            )}
          </div>

          {/* Date */}
          <div className="text-xs text-gray-400 pt-1">
            Dibuat {formatDate(tenant.createdAt)}
          </div>
        </div>

        {/* Actions */}
        <div className="p-3 border-t bg-gray-50 flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" asChild className="flex-1">
            <Link href={`/admin/tenants/${tenant.id}`}>
              <Eye className="w-4 h-4 mr-1" />
              Detail
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="flex-1">
            <Link href={`/admin/tenants/${tenant.id}/edit`}>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Link>
          </Button>
          {/* Suspend/Activate Button */}
          {tenant.subscriptionStatus === 'active' ? (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onStatusChange(tenant.id, tenant.businessName, 'suspended')}
              disabled={isUpdatingStatus}
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              title="Suspend Tenant"
            >
              {isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onStatusChange(tenant.id, tenant.businessName, 'active')}
              disabled={isUpdatingStatus}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
              title="Activate Tenant"
            >
              {isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onDelete(tenant.id, tenant.businessName)}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Delete Tenant"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    suspended: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-700',
  };
  const planColors: Record<string, string> = {
    basic: 'bg-gray-100 text-gray-700',
    premium: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-amber-100 text-amber-700',
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Emoji & Name */}
          <span className="text-2xl">{tenant.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 truncate">{tenant.businessName}</h3>
              <a 
                href={getTenantUrl(tenant.subdomain)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
              >
                {tenant.subdomain}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
              <span>{tenant.ownerName}</span>
              <span className="hidden sm:inline">{tenant.email}</span>
            </div>
          </div>

          {/* Status & Plan */}
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[tenant.subscriptionStatus]}`}>
              {tenant.subscriptionStatus}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${planColors[tenant.subscriptionPlan]}`}>
              {tenant.subscriptionPlan}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild title="View Details">
              <Link href={`/admin/tenants/${tenant.id}`}>
                <Eye className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild title="Edit">
              <Link href={`/admin/tenants/${tenant.id}/edit`}>
                <Edit className="w-4 h-4" />
              </Link>
            </Button>
            {/* Suspend/Activate Button */}
            {tenant.subscriptionStatus === 'active' ? (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onStatusChange(tenant.id, tenant.businessName, 'suspended')}
                disabled={isUpdatingStatus}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                title="Suspend Tenant"
              >
                {isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onStatusChange(tenant.id, tenant.businessName, 'active')}
                disabled={isUpdatingStatus}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                title="Activate Tenant"
              >
                {isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onDelete(tenant.id, tenant.businessName)}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Delete Tenant"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
