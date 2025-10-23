'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CheckCircle,
  Smartphone,
  Save,
  Trash2,
  Lock,
} from 'lucide-react';

interface WhatsAppConfig {
  endpoint_name: string;
  is_configured: boolean;
  health_status: 'healthy' | 'unhealthy' | 'unknown';
  auto_reconnect: boolean;
}

interface Tenant {
  id: string;
  subdomain: string;
  business_name: string;
}

interface Props {
  tenant: Tenant;
}

export function WhatsAppConfig({ tenant }: Props) {
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [availableEndpoints, setAvailableEndpoints] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get available endpoints (from ENV, no credentials exposed)
        const endpointsRes = await fetch('/api/whatsapp/available-endpoints');
        if (endpointsRes.ok) {
          const data = await endpointsRes.json();
          setAvailableEndpoints(data.endpoints || []);
        }

        // Get current tenant config
        const configRes = await fetch(`/api/whatsapp/tenant-config/${tenant.id}`);
        if (configRes.ok) {
          const data = await configRes.json();
          if (data.config) {
            setConfig(data.config);
            setSelectedEndpoint(data.config.endpoint_name || '');
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load WhatsApp configuration');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenant.id]);

  const handleAssignEndpoint = async () => {
    if (!selectedEndpoint) {
      setError('Please select an endpoint');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await fetch(`/api/whatsapp/tenant-config/${tenant.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint_name: selectedEndpoint }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to assign endpoint');
      }

      const data = await res.json();
      setConfig(data.config);
      setSuccess('Endpoint assigned successfully!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveEndpoint = async () => {
    if (!confirm('Remove WhatsApp endpoint from this tenant?')) return;

    try {
      setError(null);
      const res = await fetch(`/api/whatsapp/tenant-config/${tenant.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to remove endpoint');

      setConfig(null);
      setSelectedEndpoint('');
      setSuccess('Endpoint removed successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">WhatsApp Configuration</h1>
        <Card>
          <CardContent className="pt-6">
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">WhatsApp Configuration</h1>
        <p className="text-gray-600 mt-2">{tenant.business_name}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Assign Endpoint Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Assign WhatsApp Endpoint
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {availableEndpoints.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 text-sm">
                  No endpoints available. Please configure endpoints in environment variables (WHATSAPP_ENDPOINTS).
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Endpoints
                  </label>
                  <Select value={selectedEndpoint} onValueChange={setSelectedEndpoint}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an endpoint..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEndpoints.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Button
                    onClick={handleAssignEndpoint}
                    disabled={saving || !selectedEndpoint}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Assigning...' : 'Assign Endpoint'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Config */}
      {config && config.is_configured && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              Current Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Endpoint Name</label>
                <p className="mt-1 text-gray-900 font-semibold">{config.endpoint_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1 flex items-center gap-2">
                  {config.health_status === 'healthy' ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 font-semibold">Healthy</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span className="text-amber-600 font-semibold">
                        {config.health_status === 'unhealthy' ? 'Unhealthy' : 'Unknown'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={config.auto_reconnect}
                  disabled
                  className="w-4 h-4"
                />
                Auto-reconnect enabled
              </label>
            </div>

            <Button
              variant="destructive"
              onClick={handleRemoveEndpoint}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Remove Endpoint
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Security Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Lock className="w-5 h-5" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-2 text-sm">
          <p>
            ✓ <strong>WhatsApp credentials are stored securely</strong> in server environment variables
          </p>
          <p>
            ✓ Frontend only handles endpoint assignment, not credentials
          </p>
          <p>
            ✓ API keys never exposed to browser or client-side code
          </p>
          <p className="mt-3">
            <strong>Endpoint Configuration:</strong> Update <code className="bg-blue-100 px-2 py-1 rounded text-xs">WHATSAPP_ENDPOINTS</code> environment variable to add/modify endpoints.
          </p>
        </CardContent>
      </Card>

      {/* Tenant Info */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Tenant Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Subdomain:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{tenant.subdomain}.booqing.my.id</code>
          </p>
          <p>
            <strong>WhatsApp Page:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{tenant.subdomain}.booqing.my.id/admin/whatsapp</code>
          </p>
          <p className="text-gray-600 mt-3">
            After assigning endpoint, tenant users can create and manage WhatsApp devices from their admin panel.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
