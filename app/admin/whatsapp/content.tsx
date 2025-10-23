'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Smartphone, Activity, Settings, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all tenants
        const tenantsRes = await fetch('/api/admin/tenants');
        if (!tenantsRes.ok) return;

        const tenantsData = await tenantsRes.json();
        const tenantsList = tenantsData.tenants || [];

        // Fetch WhatsApp status for each tenant
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

        // Calculate stats
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

  const getHealthColor = (status?: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'unhealthy':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">WhatsApp Integration</h1>
        <p className="text-gray-600 mt-2">
          Manage WhatsApp API integrations across all tenants
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Configured Tenants</p>
                <p className="text-2xl font-bold text-gray-900">{totalEndpoints}</p>
              </div>
              <Smartphone className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Healthy Endpoints</p>
                <p className="text-2xl font-bold text-green-600">{healthyEndpoints}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Devices</p>
                <p className="text-2xl font-bold text-purple-600">{totalDevices}</p>
              </div>
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                <p className="text-2xl font-bold text-orange-600">{tenants.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tenant WhatsApp Status</CardTitle>
          <CardDescription>
            WhatsApp endpoint configuration for each tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No tenants found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Tenant</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Endpoint</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Devices</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((status) => (
                    <tr key={status.tenant.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{status.tenant.emoji}</span>
                          <div>
                            <p className="font-medium text-gray-900">{status.tenant.business_name}</p>
                            <p className="text-xs text-gray-500">{status.tenant.subdomain}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {status.endpoint ? (
                          <div>
                            <p className="font-medium text-gray-900">{status.endpoint.name}</p>
                            <p className="text-xs text-gray-500">{status.endpoint.apiUrl}</p>
                          </div>
                        ) : (
                          <span className="text-gray-500 italic">Not configured</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {status.endpoint ? (
                          <div className="flex items-center gap-2">
                            {status.endpoint.healthStatus === 'healthy' ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                              </>
                            ) : status.endpoint.healthStatus === 'unhealthy' ? (
                              <>
                                <AlertCircle className="w-4 h-4 text-red-600" />
                                <Badge className="bg-red-100 text-red-800">Unhealthy</Badge>
                              </>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
                            )}
                          </div>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">Pending</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">{status.deviceCount}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Link href={`/admin/tenants/${status.tenant.id}/whatsapp`}>
                            <Settings className="w-4 h-4" />
                            Configure
                            <ExternalLink className="w-3 h-3" />
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

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">How to Configure</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-2">
          <p>
            <strong>Step 1:</strong> Click "Configure" for any tenant in the table above
          </p>
          <p>
            <strong>Step 2:</strong> Enter WhatsApp API endpoint details (Name, URL, API Key)
          </p>
          <p>
            <strong>Step 3:</strong> Tenant users can then create and manage WhatsApp devices from their admin dashboard
          </p>
          <p className="text-sm mt-3">
            Each tenant can configure exactly ONE WhatsApp endpoint. Devices are created and managed by tenant admins from their WhatsApp page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
