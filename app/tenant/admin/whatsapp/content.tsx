'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Plus,
  RefreshCw,
  Smartphone,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  Zap,
} from 'lucide-react';

interface WhatsAppEndpoint {
  id: string;
  name: string;
  apiUrl: string;
  isActive: boolean;
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  lastHealthCheck: string;
}

interface WhatsAppDevice {
  id: string;
  deviceName: string;
  phoneNumber?: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'pairing' | 'error';
  qrCode?: string;
  pairingCode?: string;
  lastSeen?: string;
}

export function WhatsAppContent() {
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain') || '';
  
  const [endpoint, setEndpoint] = useState<WhatsAppEndpoint | null>(null);
  const [devices, setDevices] = useState<WhatsAppDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [connectionResult, setConnectionResult] = useState<{ qrCode?: string; pairingCode?: string } | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<WhatsAppDevice | null>(null);
  const [tenantId, setTenantId] = useState<string>('');

  // Fetch endpoint and devices
  useEffect(() => {
    if (!subdomain) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // First get tenant ID from subdomain
        const tenantRes = await fetch(`/api/tenants/by-subdomain?subdomain=${subdomain}`);
        if (!tenantRes.ok) {
          setError('Tenant not found');
          setLoading(false);
          return;
        }
        const tenantData = await tenantRes.json();
        const newTenantId = tenantData.id;
        setTenantId(newTenantId);

        // Fetch endpoint
        const endpointRes = await fetch(`/api/whatsapp/endpoints/${newTenantId}`);
        if (endpointRes.ok) {
          const endpointData = await endpointRes.json();
          setEndpoint(endpointData.endpoint);
        }

        // Fetch devices
        const devicesRes = await fetch(`/api/whatsapp/devices?tenantId=${newTenantId}`);
        if (devicesRes.ok) {
          const devicesData = await devicesRes.json();
          setDevices(devicesData.devices || []);
        }
      } catch (error) {
        console.error('Error fetching WhatsApp data:', error);
        setError('Failed to load WhatsApp data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [subdomain]);

  const handleCreateDevice = async () => {
    if (!newDeviceName || !endpoint) return;

    try {
      const response = await fetch('/api/whatsapp/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          endpointId: endpoint.id,
          deviceName: newDeviceName,
        }),
      });

      if (response.ok) {
        const newDevice = await response.json();
        setDevices([...devices, newDevice]);
        setNewDeviceName('');
        setShowAddDevice(false);
      }
    } catch (error) {
      console.error('Error creating device:', error);
    }
  };

  const handleConnectDevice = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/whatsapp/devices/${deviceId}?action=connect`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        setConnectionResult(result);
        setSelectedDevice(devices.find(d => d.id === deviceId) || null);
      }
    } catch (error) {
      console.error('Error connecting device:', error);
    }
  };

  const handleRefreshStatus = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/whatsapp/devices/${deviceId}?action=refresh-status`, {
        method: 'POST',
      });

      if (response.ok) {
        const updatedDevice = await response.json();
        setDevices(devices.map(d => (d.id === deviceId ? updatedDevice : d)));
      }
    } catch (error) {
      console.error('Error refreshing device status:', error);
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('Delete this device?')) return;

    try {
      const response = await fetch(`/api/whatsapp/devices/${deviceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDevices(devices.filter(d => d.id !== deviceId));
      }
    } catch (error) {
      console.error('Error deleting device:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'connecting':
      case 'pairing':
        return 'bg-yellow-100 text-yellow-800';
      case 'disconnected':
        return 'bg-gray-100 text-gray-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'unhealthy':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Integration</h1>
          <p className="text-gray-600 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Integration</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">WhatsApp Integration</h1>
        <p className="text-gray-600 mt-2">Manage WhatsApp endpoint and devices</p>
      </div>

      {/* Endpoint Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Endpoint Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {endpoint ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-gray-900">{endpoint.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1 flex items-center gap-2">
                    {endpoint.healthStatus === 'healthy' ? (
                      <>
                        <CheckCircle className={`w-4 h-4 ${getHealthColor(endpoint.healthStatus)}`} />
                        <span className="text-green-600 font-medium">Healthy</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className={`w-4 h-4 ${getHealthColor(endpoint.healthStatus)}`} />
                        <span className="text-red-600 font-medium">
                          {endpoint.healthStatus === 'unhealthy' ? 'Unhealthy' : 'Unknown'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">API URL</label>
                <p className="mt-1 text-gray-900 font-mono text-sm">{endpoint.apiUrl}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Health Check</label>
                <p className="mt-1 text-gray-600 text-sm">
                  {new Date(endpoint.lastHealthCheck).toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
              <p className="text-gray-600">No endpoint configured yet</p>
              <p className="text-gray-500 text-sm mt-1">Configure WhatsApp endpoint in settings</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Devices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            WhatsApp Devices ({devices.length})
          </CardTitle>
          {endpoint && (
            <Button size="sm" onClick={() => setShowAddDevice(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Device
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!endpoint ? (
            <div className="text-center py-6">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
              <p className="text-gray-600">Configure endpoint first</p>
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-6">
              <Smartphone className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600">No devices yet</p>
              <Button size="sm" variant="outline" onClick={() => setShowAddDevice(true)} className="mt-2">
                Create your first device
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {devices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{device.deviceName}</p>
                      <Badge className={getStatusColor(device.status)}>
                        {device.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Phone: {device.phoneNumber || 'Not connected'}
                    </p>
                    {device.lastSeen && (
                      <p className="text-xs text-gray-500 mt-1">
                        Last seen: {new Date(device.lastSeen).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {device.status === 'disconnected' ? (
                      <Button
                        size="sm"
                        onClick={() => handleConnectDevice(device.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Connect
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRefreshStatus(device.id)}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteDevice(device.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Device Form */}
          {showAddDevice && (
            <div className="mt-4 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium text-gray-900 mb-3">Create New Device</h3>
              <div className="space-y-3">
                <Input
                  placeholder="Device name (e.g., Main Phone)"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleCreateDevice}
                    disabled={!newDeviceName}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Create
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowAddDevice(false);
                      setNewDeviceName('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* QR Code Display */}
          {connectionResult && selectedDevice && (
            <div className="mt-4 p-4 border rounded-lg bg-blue-50">
              <h3 className="font-medium text-gray-900 mb-3">
                Connect {selectedDevice.deviceName}
              </h3>
              {connectionResult.qrCode && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Scan with WhatsApp on your phone:</p>
                  <img
                    src={connectionResult.qrCode}
                    alt="QR Code"
                    className="w-64 h-64"
                  />
                </div>
              )}
              {connectionResult.pairingCode && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Or use pairing code:</p>
                  <p className="text-lg font-mono font-bold text-gray-900">
                    {connectionResult.pairingCode}
                  </p>
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setConnectionResult(null);
                  setSelectedDevice(null);
                }}
              >
                Close
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
