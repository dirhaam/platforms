'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AdminPageHeader } from '@/components/tenant/AdminPageHeader';
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
      <AdminPageHeader
        title="Profile"
        description="Informasi akun dan langganan website Anda"
      />

      {/* Subscription Alert */}
      {isExpiringSoon && (
        <Alert className="bg-amber-50 border-amber-200">
          <BoxIcon name="error-circle" className="text-amber-600" size={20} />
          <AlertDescription className="text-amber-800">
            <strong>Perhatian!</strong> Langganan Anda akan berakhir dalam {daysUntilExpiry} hari.
            Silakan perpanjang untuk menghindari gangguan layanan.
          </AlertDescription>
        </Alert>
      )}

      {isExpired && (
        <Alert variant="destructive">
          <BoxIcon name="error-circle" size={20} />
          <AlertDescription>
            <strong>Langganan Expired!</strong> Layanan Anda telah berakhir. 
            Silakan hubungi admin untuk memperpanjang.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Account Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <BoxIcon name="user" className="text-primary" size={24} />
              </div>
              <div>
                <CardTitle>Akun Pengguna</CardTitle>
                <CardDescription>Informasi login Anda</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Nama</span>
                <span className="font-medium">{session?.name || '-'}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="font-medium">{session?.email || '-'}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Role</span>
                <Badge variant="outline" className="capitalize">
                  {session?.role || '-'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <BoxIcon name="credit-card" className="text-primary" size={24} />
              </div>
              <div>
                <CardTitle>Langganan</CardTitle>
                <CardDescription>Status subscription website</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Paket</span>
                <Badge variant="secondary" className="capitalize">
                  {tenant?.subscriptionPlan || 'basic'}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={getSubscriptionBadgeVariant(tenant?.subscriptionStatus || 'active')}>
                  {tenant?.subscriptionStatus === 'active' ? 'Aktif' : 
                   tenant?.subscriptionStatus === 'trial' ? 'Trial' :
                   tenant?.subscriptionStatus === 'suspended' ? 'Ditangguhkan' :
                   tenant?.subscriptionStatus === 'cancelled' ? 'Dibatalkan' : 
                   tenant?.subscriptionStatus || '-'}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Berlaku Hingga</span>
                <span className={`font-medium ${isExpired ? 'text-destructive' : isExpiringSoon ? 'text-amber-600' : ''}`}>
                  {formatDate(tenant?.subscriptionExpiresAt)}
                </span>
              </div>
              {daysUntilExpiry !== null && !isExpired && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Sisa Waktu</span>
                    <span className={`font-medium ${isExpiringSoon ? 'text-amber-600' : 'text-green-600'}`}>
                      {daysUntilExpiry} hari lagi
                    </span>
                  </div>
                </>
              )}
            </div>

            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => window.location.href = 'mailto:support@booqing.my.id?subject=Perpanjang Subscription'}
            >
              <BoxIcon name="envelope" className="mr-2" size={16} />
              Hubungi untuk Perpanjang
            </Button>
          </CardContent>
        </Card>

        {/* Business Info Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                {tenant?.logo ? (
                  <img src={tenant.logo} alt="Logo" className="w-8 h-8 object-contain rounded" />
                ) : (
                  <BoxIcon name="building" className="text-primary" size={24} />
                )}
              </div>
              <div>
                <CardTitle>Informasi Bisnis</CardTitle>
                <CardDescription>Detail website dan bisnis Anda</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Nama Bisnis</span>
                  <p className="font-medium">{tenant?.businessName || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Kategori</span>
                  <p className="font-medium capitalize">{tenant?.businessCategory || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Pemilik</span>
                  <p className="font-medium">{tenant?.ownerName || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">URL Website</span>
                  <p className="font-medium text-primary">
                    <a 
                      href={`https://${tenant?.subdomain}.booqing.my.id`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {tenant?.subdomain}.booqing.my.id
                    </a>
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Email</span>
                  <p className="font-medium">{tenant?.email || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Telepon</span>
                  <p className="font-medium">{tenant?.phone || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Alamat</span>
                  <p className="font-medium">{tenant?.address || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Terdaftar Sejak</span>
                  <p className="font-medium">{formatDate(tenant?.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Features */}
            <Separator className="my-6" />
            <div>
              <span className="text-sm text-muted-foreground mb-3 block">Fitur Aktif</span>
              <div className="flex flex-wrap gap-2">
                <Badge variant={tenant?.whatsappEnabled ? 'default' : 'outline'}>
                  <BoxIcon name="whatsapp" type="logos" size={14} className="mr-1" />
                  WhatsApp {tenant?.whatsappEnabled ? 'Aktif' : 'Nonaktif'}
                </Badge>
                <Badge variant={tenant?.homeVisitEnabled ? 'default' : 'outline'}>
                  <BoxIcon name="home" size={14} className="mr-1" />
                  Home Visit {tenant?.homeVisitEnabled ? 'Aktif' : 'Nonaktif'}
                </Badge>
                <Badge variant={tenant?.analyticsEnabled ? 'default' : 'outline'}>
                  <BoxIcon name="bar-chart" size={14} className="mr-1" />
                  Analytics {tenant?.analyticsEnabled ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logout Button */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-destructive">Keluar dari Akun</h3>
              <p className="text-sm text-muted-foreground">
                Anda akan dialihkan ke halaman login
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? (
                <>
                  <BoxIcon name="loader-alt" className="mr-2 animate-spin" size={16} />
                  Logging out...
                </>
              ) : (
                <>
                  <BoxIcon name="log-out" className="mr-2" size={16} />
                  Logout
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
