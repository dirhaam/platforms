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
  X,
} from 'lucide-react';

interface WhatsAppConfig {
  id: string;
  endpoint_name: string;
  auto_reconnect: boolean;
  reconnect_interval: number;
  health_check_interval: number;
  webhook_retries: number;
  message_timeout: number;
  is_configured: boolean;
  health_status: 'healthy' | 'unhealthy' | 'unknown';
  lastHealthCheck: string;
}

interface Tenant {
  id: string;
  subdomain: string;
  business_name: string;
}

interface WhatsAppConfigProps {
  tenant: Tenant;
}

export function WhatsAppConfig({ tenant }: WhatsAppConfigProps) {
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [availableEndpoints, setAvailableEndpoints] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch configuration and available endpoints
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch available endpoints (from ENV)
        const endpointsRes = await fetch('/api/whatsapp/available-endpoints');
        if (endpointsRes.ok) {
          const endpointsData = await endpointsRes.json();
          setAvailableEndpoints(endpointsData.endpoints || []);
        }

        // Fetch current config
        const configRes = await fetch(`/api/whatsapp/tenant-config/${tenant.id}`);
        if (configRes.ok) {
          const configData = await configRes.json();
          if (configData.config) {
            setConfig(configData.config);
            setSelectedEndpoint(configData.config.endpoint_name || '');
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load configuration');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenant.id]);

  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!formData.name || !formData.apiUrl) {
        setError('Name and API URL are required');
        return;
      }

      const generateSecret = () => {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      };

      const payload: any = {
        id: endpoint?.id || `endpoint_${Date.now()}`,
        tenantId: tenant.id,
        name: formData.name,
        apiUrl: formData.apiUrl,
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://booqing.my.id'}/api/whatsapp/webhook/${tenant.id}`,
        webhookSecret: `secret_${generateSecret()}`,
        isActive: true,
        healthStatus: 'unknown',
        lastHealthCheck: new Date(),
      };

      // Only include apiKey if it was changed
      if (formData.apiKey && formData.apiKey !== '***') {
        payload.apiKey = formData.apiKey;
      }

      const response = await fetch(`/api/whatsapp/endpoints/${tenant.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setEndpoint(data.endpoint);
        setEditing(false);
        setSuccess('WhatsApp endpoint configured successfully!');
      } else {
        setError('Failed to save endpoint');
      }
    } catch (err) {
      console.error('Error saving endpoint:', err);
      setError('An error occurred while saving');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this WhatsApp endpoint?')) return;

    try {
      setError(null);
      const response = await fetch(`/api/whatsapp/endpoints/${tenant.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEndpoint(null);
        setFormData({ name: '', apiUrl: '', apiKey: '' });
        setSuccess('WhatsApp endpoint deleted');
      } else {
        setError('Failed to delete endpoint');
      }
    } catch (err) {
      console.error('Error deleting endpoint:', err);
      setError('An error occurred while deleting');
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
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Configuration</h1>
          <p className="text-gray-600 mt-2">{tenant.business_name}</p>
        </div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Configuration</h1>
          <p className="text-gray-600 mt-2">{tenant.business_name}</p>
        </div>
      </div>

      {/* Messages */}
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

      {/* Endpoint Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            WhatsApp Endpoint
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!editing && endpoint ? (
            // View Mode
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
                        <span className="text-gray-600">
                          {endpoint.healthStatus === 'unhealthy' ? 'Unhealthy' : 'Unknown'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">API URL</label>
                <p className="mt-1 text-gray-900 font-mono text-sm break-all">{endpoint.apiUrl}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Last Health Check</label>
                <p className="mt-1 text-gray-600 text-sm">
                  {new Date(endpoint.lastHealthCheck).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </div>
          ) : editing || !endpoint ? (
            // Edit/Create Mode
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endpoint Name
                </label>
                <Input
                  placeholder="e.g., Primary WhatsApp Server"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API URL
                </label>
                <Input
                  placeholder="https://api.whatsapp.example.com"
                  value={formData.apiUrl}
                  onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key {endpoint && '(leave blank to keep current)'}
                </label>
                <Input
                  type="password"
                  placeholder="Your WhatsApp API key"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Webhook URL:</strong>
                </p>
                <code className="text-xs text-blue-900 break-all">
                  {process.env.NEXT_PUBLIC_APP_URL || 'https://booqing.my.id'}/api/whatsapp/webhook/{tenant.id}
                </code>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Endpoint
                </Button>
                {editing && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(false);
                      if (endpoint) {
                        setFormData({
                          name: endpoint.name,
                          apiUrl: endpoint.apiUrl,
                          apiKey: '',
                        });
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ) : null}

          {!endpoint && !editing && (
            <div className="text-center py-6">
              <Smartphone className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600 mb-4">No WhatsApp endpoint configured</p>
              <Button onClick={() => setEditing(true)} className="flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" />
                Configure Endpoint
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Information</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-2">
          <p>
            <strong>Tenant Subdomain:</strong> <code className="bg-blue-100 px-2 py-1 rounded">{tenant.subdomain}.booqing.my.id</code>
          </p>
          <p>
            <strong>Tenant WhatsApp Page:</strong>{' '}
            <code className="bg-blue-100 px-2 py-1 rounded">{tenant.subdomain}.booqing.my.id/admin/whatsapp</code>
          </p>
          <p className="text-sm mt-3">
            After configuring the endpoint, users can create and manage WhatsApp devices from their tenant WhatsApp page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
