'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BoxIcon } from '@/components/ui/box-icon';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Tenant {
  id: string;
  subdomain: string;
  business_name: string;
  emoji: string;
}

interface EndpointStatus {
  id: string;
  name: string;
  apiUrl: string;
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  isActive: boolean;
  lastHealthCheck: string;
}

interface TenantWhatsAppStatus {
  tenant: Tenant;
  endpoint: EndpointStatus | null;
  deviceCount: number;
}

export function WhatsAppManagement() {
  const [tenants, setTenants] = useState<TenantWhatsAppStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalDevices, setTotalDevices] = useState(0);
  const [totalEndpoints, setTotalEndpoints] = useState(0);
  const [healthyEndpoints, setHealthyEndpoints] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const tenantsRes = await fetch('/api/admin/tenants');
        if (!tenantsRes.ok) return;

        const tenantsData = await tenantsRes.json();
        const tenantsList = tenantsData.tenants || [];

        const statusPromises = tenantsList.map(async (tenant: Tenant) => {
          try {
            const endpointRes = await fetch(`/api/whatsapp/endpoints/${tenant.id}`);
            const endpointData = endpointRes.ok ? await endpointRes.json() : null;

            const devicesRes = await fetch(`/api/whatsapp/devices?tenantId=${tenant.id}`);
            const devicesData = devicesRes.ok ? await devicesRes.json() : { devices: [] };

            return {
              tenant,
              endpoint: endpointData?.endpoint || null,
              deviceCount: devicesData.devices?.length || 0,
            };
          } catch {
            return {
              tenant,
              endpoint: null,
              deviceCount: 0,
            };
          }
        });

        const statuses = await Promise.all(statusPromises);
        setTenants(statuses);

        const devices = statuses.reduce((sum, s) => sum + s.deviceCount, 0);
        const endpoints = statuses.filter(s => s.endpoint).length;
        const healthy = statuses.filter(s => s.endpoint?.healthStatus === 'healthy').length;

        setTotalDevices(devices);
        setTotalEndpoints(endpoints);
        setHealthyEndpoints(healthy);
      } catch (error) {
        console.error('Error fetching WhatsApp data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredTenants = tenants.filter(t => 
    searchQuery === '' ||
    t.tenant.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.tenant.subdomain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unhealthyCount = tenants.filter(s => s.endpoint?.healthStatus === 'unhealthy').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-[#36483f] flex items-center justify-center">
            <BoxIcon name="whatsapp" type="logos" size={28} className="text-green-600 dark:text-[#aaeb87]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-[#d5d5e2]">WhatsApp Integration</h1>
            <p className="text-sm text-gray-500 dark:text-[#7e7f96]">
              Kelola integrasi WhatsApp API untuk semua tenant
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="dark:border-[#4e4f6c] dark:hover:bg-[#4e4f6c]">
          <Link href="/admin/whatsapp/health" className="flex items-center gap-2">
            <BoxIcon name="pulse" size={18} />
            Health Monitor
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="dark:bg-[#2b2c40] dark:border-[#4e4f6c]">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-[#25445c] flex items-center justify-center">
                <BoxIcon name="building-house" size={24} className="text-blue-600 dark:text-[#68dbf4]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-[#d5d5e2]">{totalEndpoints}</p>
                <p className="text-sm text-gray-500 dark:text-[#7e7f96]">Tenant Terkonfigurasi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-[#2b2c40] dark:border-[#4e4f6c]">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-[#36483f] flex items-center justify-center">
                <BoxIcon name="check-circle" size={24} className="text-green-600 dark:text-[#aaeb87]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-[#aaeb87]">{healthyEndpoints}</p>
                <p className="text-sm text-gray-500 dark:text-[#7e7f96]">Endpoint Sehat</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-[#2b2c40] dark:border-[#4e4f6c]">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-[#3a3361] flex items-center justify-center">
                <BoxIcon name="devices" size={24} className="text-purple-600 dark:text-[#c4a5ff]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600 dark:text-[#c4a5ff]">{totalDevices}</p>
                <p className="text-sm text-gray-500 dark:text-[#7e7f96]">Device Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-[#2b2c40] dark:border-[#4e4f6c]">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-[#4d2f3a] flex items-center justify-center">
                <BoxIcon name="error-circle" size={24} className="text-red-600 dark:text-[#ff8b77]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-[#ff8b77]">{unhealthyCount}</p>
                <p className="text-sm text-gray-500 dark:text-[#7e7f96]">Endpoint Bermasalah</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="dark:bg-[#2b2c40] dark:border-[#4e4f6c]">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <BoxIcon name="search" size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Cari tenant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 dark:bg-[#35365f] dark:border-[#4e4f6c] dark:text-[#d5d5e2]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card className="dark:bg-[#2b2c40] dark:border-[#4e4f6c]">
        <CardHeader className="border-b dark:border-[#4e4f6c]">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-[#d5d5e2]">
            <BoxIcon name="list-ul" size={20} />
            Status WhatsApp per Tenant
          </CardTitle>
          <CardDescription className="dark:text-[#7e7f96]">
            Konfigurasi endpoint WhatsApp untuk setiap tenant
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <BoxIcon name="loader-alt" size={32} className="animate-spin text-primary dark:text-[#a5a7ff]" />
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="text-center py-12">
              <BoxIcon name="inbox" size={48} className="mx-auto mb-4 text-gray-300 dark:text-[#4e4f6c]" />
              <p className="text-gray-500 dark:text-[#7e7f96]">
                {searchQuery ? `Tidak ada tenant yang cocok dengan "${searchQuery}"` : 'Tidak ada tenant'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-[#4e4f6c] bg-gray-50 dark:bg-[#35365f]">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-[#b2b2c4]">Tenant</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-[#b2b2c4]">Endpoint</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-[#b2b2c4]">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-[#b2b2c4]">Device</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-[#b2b2c4]">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map((status) => (
                    <tr key={status.tenant.id} className="border-b dark:border-[#4e4f6c] hover:bg-gray-50 dark:hover:bg-[#35365f] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{status.tenant.emoji}</span>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-[#d5d5e2]">{status.tenant.business_name}</p>
                            <p className="text-xs text-gray-500 dark:text-[#7e7f96]">{status.tenant.subdomain}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {status.endpoint ? (
                          <div>
                            <p className="font-medium text-gray-900 dark:text-[#d5d5e2]">{status.endpoint.name}</p>
                            <p className="text-xs text-gray-500 dark:text-[#7e7f96] truncate max-w-[200px]">{status.endpoint.apiUrl}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-[#7e7f96] italic flex items-center gap-1">
                            <BoxIcon name="minus" size={14} />
                            Belum dikonfigurasi
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {status.endpoint ? (
                          <StatusBadge status={status.endpoint.healthStatus} />
                        ) : (
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
                            "bg-gray-100 text-gray-600 dark:bg-[#3b3c52] dark:text-[#b2b2c4]"
                          )}>
                            <BoxIcon name="time" size={12} />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <BoxIcon name="devices" size={16} className="text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-[#d5d5e2]">{status.deviceCount}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="dark:border-[#4e4f6c] dark:hover:bg-[#4e4f6c]"
                        >
                          <Link href={`/admin/tenants/${status.tenant.id}/whatsapp`} className="flex items-center gap-1.5">
                            <BoxIcon name="cog" size={14} />
                            Konfigurasi
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-[#25445c] border-blue-200 dark:border-[#3a5a7c]">
        <CardHeader className="pb-2">
          <CardTitle className="text-blue-900 dark:text-[#68dbf4] flex items-center gap-2">
            <BoxIcon name="info-circle" size={20} />
            Cara Konfigurasi WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 dark:text-[#a5d8f4] space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-200 dark:bg-[#3a5a7c] flex items-center justify-center text-blue-900 dark:text-[#68dbf4] font-bold text-xs flex-shrink-0">1</span>
            <p>Klik <strong>"Konfigurasi"</strong> pada tenant yang ingin diatur</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-200 dark:bg-[#3a5a7c] flex items-center justify-center text-blue-900 dark:text-[#68dbf4] font-bold text-xs flex-shrink-0">2</span>
            <p>Masukkan detail endpoint WhatsApp API (Nama, URL, API Key)</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-200 dark:bg-[#3a5a7c] flex items-center justify-center text-blue-900 dark:text-[#68dbf4] font-bold text-xs flex-shrink-0">3</span>
            <p>Tenant dapat mengelola device WhatsApp dari dashboard admin mereka</p>
          </div>
          <div className="mt-4 p-3 bg-blue-100 dark:bg-[#2a4a6c] rounded-lg">
            <p className="flex items-center gap-2">
              <BoxIcon name="info-circle" size={16} />
              Setiap tenant hanya dapat mengkonfigurasi <strong>SATU</strong> endpoint WhatsApp
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: 'healthy' | 'unhealthy' | 'unknown' }) {
  const config = {
    healthy: {
      bg: 'bg-green-100 dark:bg-[#36483f]',
      text: 'text-green-700 dark:text-[#aaeb87]',
      icon: 'check-circle',
      label: 'Sehat',
    },
    unhealthy: {
      bg: 'bg-red-100 dark:bg-[#4d2f3a]',
      text: 'text-red-700 dark:text-[#ff8b77]',
      icon: 'error-circle',
      label: 'Bermasalah',
    },
    unknown: {
      bg: 'bg-gray-100 dark:bg-[#3b3c52]',
      text: 'text-gray-700 dark:text-[#b2b2c4]',
      icon: 'help-circle',
      label: 'Unknown',
    },
  };

  const c = config[status];

  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium", c.bg, c.text)}>
      <BoxIcon name={c.icon} size={12} />
      {c.label}
    </span>
  );
}
