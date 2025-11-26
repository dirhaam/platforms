'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BoxIcon } from '@/components/ui/box-icon';

interface TenantData {
  id: string;
  subdomain: string;
  businessName: string;
  businessCategory: string;
  ownerName: string;
  email: string;
  phone: string;
  address?: string;
  businessDescription?: string;
  logo?: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionExpiresAt?: string;
  createdAt: string;
  whatsappEnabled?: boolean;
  homeVisitEnabled?: boolean;
  analyticsEnabled?: boolean;
}

interface SessionData {
  userId: string;
  tenantId: string;
  name: string;
  email: string;
  role: string;
}

export default function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain') || '';
  
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!subdomain) return;

      try {
        // Fetch session
        const sessionRes = await fetch('/api/auth/session');
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          setSession(sessionData.session || sessionData);
        }

        // Fetch tenant data
        const tenantRes = await fetch(`/api/tenants/${subdomain}`);
        if (tenantRes.ok) {
          const tenantData = await tenantRes.json();
          setTenant(tenantData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [subdomain]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        router.push('/tenant/login');
      } else {
        console.error('Logout failed');
        setLoggingOut(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
      setLoggingOut(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDaysUntilExpiry = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getSubscriptionBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'trial':
        return 'secondary';
      case 'suspended':
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <BoxIcon name="loader-alt" className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const daysUntilExpiry = getDaysUntilExpiry(tenant?.subscriptionExpiresAt);
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white shadow-card rounded-card overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/80 h-32 relative">
          <div className="absolute -bottom-12 left-6">
            <div className="w-24 h-24 rounded-card bg-white shadow-card flex items-center justify-center border-4 border-white">
              {tenant?.logo ? (
                <img src={tenant.logo} alt="Logo" className="w-16 h-16 object-contain rounded-md" />
              ) : (
                <div className="w-16 h-16 rounded-md bg-primary-light flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary">
                    {tenant?.businessName?.charAt(0) || 'B'}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="absolute top-4 right-4">
            <span className={`px-3 py-1 rounded text-xs font-bold uppercase text-white ${tenant?.subscriptionStatus === 'active' ? 'bg-success' : 'bg-warning'}`}>
              {tenant?.subscriptionStatus === 'active' ? 'Aktif' : tenant?.subscriptionStatus || 'Trial'}
            </span>
          </div>
        </div>
        <div className="pt-16 pb-6 px-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h4 className="text-xl font-bold text-txt-primary">{tenant?.businessName || 'Bisnis Anda'}</h4>
              <p className="text-txt-muted flex items-center gap-2 mt-1 text-sm">
                <BoxIcon name="globe" size={16} />
                <a 
                  href={`https://${tenant?.subdomain}.booqing.my.id`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {tenant?.subdomain}.booqing.my.id
                </a>
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="border-gray-300 text-txt-secondary hover:bg-gray-50"
              onClick={() => router.push(`/tenant/admin/settings?subdomain=${subdomain}`)}
            >
              <BoxIcon name="edit" size={16} className="mr-2" />
              Edit Profil
            </Button>
          </div>
        </div>
      </div>

      {/* Subscription Alert */}
      {(isExpiringSoon || isExpired) && (
        <div className={`rounded-card p-4 flex items-start gap-3 ${isExpired ? 'bg-red-100' : 'bg-yellow-100'}`}>
          <div className={`w-10 h-10 rounded flex items-center justify-center flex-shrink-0 ${isExpired ? 'bg-red-200 text-danger' : 'bg-yellow-200 text-warning'}`}>
            <BoxIcon name="error-circle" size={24} />
          </div>
          <div>
            <p className={`font-semibold text-sm ${isExpired ? 'text-danger' : 'text-warning'}`}>
              {isExpired ? 'Langganan Expired!' : 'Langganan Segera Berakhir'}
            </p>
            <p className={`text-sm ${isExpired ? 'text-red-700' : 'text-yellow-700'}`}>
              {isExpired 
                ? 'Layanan Anda telah berakhir. Silakan hubungi admin untuk memperpanjang.'
                : `Langganan Anda akan berakhir dalam ${daysUntilExpiry} hari.`}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Account & Subscription */}
        <div className="space-y-6">
          {/* User Account */}
          <div className="bg-white shadow-card rounded-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded bg-primary-light flex items-center justify-center text-info">
                <BoxIcon name="user" size={20} />
              </div>
              <h5 className="text-lg font-semibold text-txt-primary">Akun Pengguna</h5>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                <BoxIcon name="user-circle" size={20} className="text-txt-muted" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-txt-muted">Nama</p>
                  <p className="font-medium text-txt-primary text-sm truncate">{session?.name || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                <BoxIcon name="envelope" size={20} className="text-txt-muted" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-txt-muted">Email</p>
                  <p className="font-medium text-txt-primary text-sm truncate">{session?.email || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                <BoxIcon name="shield" size={20} className="text-txt-muted" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-txt-muted">Role</p>
                  <span className="bg-primary-light text-primary px-2 py-0.5 rounded text-xs font-bold uppercase mt-1 inline-block">
                    {session?.role || '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div className="bg-white shadow-card rounded-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded bg-purple-100 flex items-center justify-center text-purple-600">
                <BoxIcon name="credit-card" size={20} />
              </div>
              <h5 className="text-lg font-semibold text-txt-primary">Langganan</h5>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <span className="text-sm text-txt-muted">Paket</span>
                <span className="bg-primary-light text-primary px-2 py-0.5 rounded text-xs font-bold uppercase">
                  {tenant?.subscriptionPlan || 'basic'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <span className="text-sm text-txt-muted">Status</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${tenant?.subscriptionStatus === 'active' ? 'bg-green-100 text-success' : 'bg-yellow-100 text-warning'}`}>
                  {tenant?.subscriptionStatus === 'active' ? 'Aktif' : tenant?.subscriptionStatus || '-'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <span className="text-sm text-txt-muted">Berlaku Hingga</span>
                <span className={`font-medium text-sm ${isExpired ? 'text-danger' : isExpiringSoon ? 'text-warning' : 'text-txt-primary'}`}>
                  {formatDate(tenant?.subscriptionExpiresAt)}
                </span>
              </div>
              {daysUntilExpiry !== null && !isExpired && (
                <div className="p-3 bg-green-50 rounded-md border border-green-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-success">Sisa Waktu</span>
                    <span className={`font-bold text-sm ${isExpiringSoon ? 'text-warning' : 'text-success'}`}>
                      {daysUntilExpiry} hari
                    </span>
                  </div>
                  <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isExpiringSoon ? 'bg-warning' : 'bg-success'}`}
                      style={{ width: `${Math.min(100, (daysUntilExpiry / 30) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4 border-primary text-primary hover:bg-primary hover:text-white"
              onClick={() => window.location.href = 'mailto:support@booqing.my.id?subject=Perpanjang Subscription'}
            >
              <BoxIcon name="envelope" size={16} className="mr-2" />
              Perpanjang Langganan
            </Button>
          </div>
        </div>

        {/* Right Column - Business Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Details */}
          <div className="bg-white shadow-card rounded-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded bg-green-100 flex items-center justify-center text-success">
                <BoxIcon name="store" size={20} />
              </div>
              <h5 className="text-lg font-semibold text-txt-primary">Informasi Bisnis</h5>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <BoxIcon name="building" size={16} className="text-txt-muted" />
                  <span className="text-xs text-txt-muted">Nama Bisnis</span>
                </div>
                <p className="font-semibold text-txt-primary text-sm">{tenant?.businessName || '-'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <BoxIcon name="category" size={16} className="text-txt-muted" />
                  <span className="text-xs text-txt-muted">Kategori</span>
                </div>
                <p className="font-semibold text-txt-primary text-sm capitalize">{tenant?.businessCategory || '-'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <BoxIcon name="user" size={16} className="text-txt-muted" />
                  <span className="text-xs text-txt-muted">Pemilik</span>
                </div>
                <p className="font-semibold text-txt-primary text-sm">{tenant?.ownerName || '-'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <BoxIcon name="calendar" size={16} className="text-txt-muted" />
                  <span className="text-xs text-txt-muted">Terdaftar Sejak</span>
                </div>
                <p className="font-semibold text-txt-primary text-sm">{formatDate(tenant?.createdAt)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <BoxIcon name="envelope" size={16} className="text-txt-muted" />
                  <span className="text-xs text-txt-muted">Email Bisnis</span>
                </div>
                <p className="font-semibold text-txt-primary text-sm">{tenant?.email || '-'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <BoxIcon name="phone" size={16} className="text-txt-muted" />
                  <span className="text-xs text-txt-muted">Telepon</span>
                </div>
                <p className="font-semibold text-txt-primary text-sm">{tenant?.phone || '-'}</p>
              </div>
              <div className="sm:col-span-2 p-4 bg-gray-50 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <BoxIcon name="map" size={16} className="text-txt-muted" />
                  <span className="text-xs text-txt-muted">Alamat</span>
                </div>
                <p className="font-semibold text-txt-primary text-sm">{tenant?.address || '-'}</p>
              </div>
            </div>
          </div>

          {/* Active Features */}
          <div className="bg-white shadow-card rounded-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded bg-orange-100 flex items-center justify-center text-warning">
                <BoxIcon name="cog" size={20} />
              </div>
              <h5 className="text-lg font-semibold text-txt-primary">Fitur Aktif</h5>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className={`p-4 rounded-md border-2 transition-all ${tenant?.whatsappEnabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`w-12 h-12 rounded flex items-center justify-center mb-3 ${tenant?.whatsappEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <BoxIcon name="whatsapp" type="logos" size={24} className={tenant?.whatsappEnabled ? 'text-green-600' : 'text-secondary'} />
                </div>
                <p className="font-semibold text-txt-primary text-sm">WhatsApp</p>
                <p className={`text-xs ${tenant?.whatsappEnabled ? 'text-success' : 'text-secondary'}`}>
                  {tenant?.whatsappEnabled ? 'Aktif' : 'Nonaktif'}
                </p>
              </div>
              <div className={`p-4 rounded-md border-2 transition-all ${tenant?.homeVisitEnabled ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`w-12 h-12 rounded flex items-center justify-center mb-3 ${tenant?.homeVisitEnabled ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <BoxIcon name="home" size={24} className={tenant?.homeVisitEnabled ? 'text-info' : 'text-secondary'} />
                </div>
                <p className="font-semibold text-txt-primary text-sm">Home Visit</p>
                <p className={`text-xs ${tenant?.homeVisitEnabled ? 'text-info' : 'text-secondary'}`}>
                  {tenant?.homeVisitEnabled ? 'Aktif' : 'Nonaktif'}
                </p>
              </div>
              <div className={`p-4 rounded-md border-2 transition-all ${tenant?.analyticsEnabled ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`w-12 h-12 rounded flex items-center justify-center mb-3 ${tenant?.analyticsEnabled ? 'bg-purple-100' : 'bg-gray-100'}`}>
                  <BoxIcon name="bar-chart" size={24} className={tenant?.analyticsEnabled ? 'text-purple-600' : 'text-secondary'} />
                </div>
                <p className="font-semibold text-txt-primary text-sm">Analytics</p>
                <p className={`text-xs ${tenant?.analyticsEnabled ? 'text-purple-600' : 'text-secondary'}`}>
                  {tenant?.analyticsEnabled ? 'Aktif' : 'Nonaktif'}
                </p>
              </div>
            </div>
          </div>

          {/* Logout Section */}
          <div className="bg-white shadow-card rounded-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-red-100 flex items-center justify-center text-danger">
                  <BoxIcon name="log-out" size={20} />
                </div>
                <div>
                  <h5 className="font-semibold text-txt-primary">Keluar dari Akun</h5>
                  <p className="text-sm text-txt-muted">Anda akan dialihkan ke halaman login</p>
                </div>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                disabled={loggingOut}
                className="sm:w-auto w-full bg-danger hover:bg-danger/90"
              >
                {loggingOut ? (
                  <>
                    <BoxIcon name="loader-alt" size={16} className="mr-2 animate-spin" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <BoxIcon name="log-out" size={16} className="mr-2" />
                    Logout
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
