"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle, Plus, Smartphone, Zap } from 'lucide-react';
import { MessagesContent } from '../messages/content';

// Re-use the interfaces from the original components
interface Conversation {
  id: string;
  phone: string;
  chatId?: string;
  customerName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'active' | 'inactive' | 'archived' | 'blocked';
  metadata?: Record<string, any>;
}

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isFromMe: boolean;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contact' | 'sticker';
  mediaUrl?: string;
  mediaCaption?: string;
}

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
  lastError?: string;
  lastSeen?: string;
}

export function WhatsAppUnifiedContent() {
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain') || '';

  const [tenantId, setTenantId] = useState('');
  const [endpoint, setEndpoint] = useState<{ id: string; name: string; healthStatus: 'healthy' | 'unhealthy' | 'unknown' } | null>(null);
  const [devices, setDevices] = useState<Array<{ id: string; status: string; phoneNumber?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');

  useEffect(() => {
    if (!subdomain) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // Resolve tenant id
        const tenantRes = await fetch(`/api/tenants/${subdomain}`);
        if (!tenantRes.ok) throw new Error('Tenant not found');
        const tenant = await tenantRes.json();
        setTenantId(tenant.id);

        // Load endpoint
        const epRes = await fetch(`/api/whatsapp/endpoints/${tenant.id}`);
        if (epRes.ok) {
          const epData = await epRes.json();
          setEndpoint(epData.endpoint ? { id: epData.endpoint.id, name: epData.endpoint.name, healthStatus: epData.endpoint.healthStatus } : null);
        }

        // Load devices
        const devRes = await fetch(`/api/whatsapp/devices?tenantId=${tenant.id}`);
        if (devRes.ok) {
          const dev = await devRes.json();
          setDevices(dev.devices || []);
        } else {
          setDevices([]);
        }
      } catch (e) {
        console.error('Load WhatsApp header failed:', e);
        setError('Failed to load WhatsApp status');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [subdomain]);

  const connectedCount = devices.filter((d) => d.status === 'connected').length;

  const handleCreateDevice = async () => {
    if (!tenantId || !endpoint || !newDeviceName.trim()) return;
    try {
      const res = await fetch('/api/whatsapp/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, endpointId: endpoint.id, deviceName: newDeviceName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Failed to create device');
      }
      const dev = await res.json();
      setDevices((prev) => [...prev, dev]);
      setShowAddDevice(false);
      setNewDeviceName('');
    } catch (e) {
      console.error('Create device failed:', e);
      setError(e instanceof Error ? e.message : 'Failed to create device');
    }
  };

  const healthColor = (status: string) =>
    status === 'healthy' ? 'text-green-600' : status === 'unhealthy' ? 'text-red-600' : 'text-gray-600';

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">WhatsApp</h1>
            <p className="text-gray-600 mt-1">Percakapan WhatsApp terpadu</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {endpoint ? (
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-gray-600" />
                <span className="font-medium">{endpoint.name}</span>
                {endpoint.healthStatus === 'healthy' ? (
                  <span className={`flex items-center gap-1 ${healthColor(endpoint.healthStatus)}`}>
                    <CheckCircle className="w-4 h-4" /> Healthy
                  </span>
                ) : (
                  <span className={`flex items-center gap-1 ${healthColor(endpoint.healthStatus)}`}>
                    <AlertCircle className="w-4 h-4" /> {endpoint.healthStatus === 'unhealthy' ? 'Unhealthy' : 'Unknown'}
                  </span>
                )}
                <span className="flex items-center gap-1 text-gray-700">
                  <Smartphone className="w-4 h-4" /> {connectedCount}/{devices.length} connected
                </span>
                {/* show up to 3 device chips */}
                {devices.slice(0, 3).map((d) => (
                  <Badge key={d.id} variant="secondary" className="text-xs">
                    {d.phoneNumber || d.id.slice(-6)} • {d.status}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <AlertCircle className="w-4 h-4" /> Endpoint not configured
              </div>
            )}
            {endpoint && (
              <Button size="sm" onClick={() => setShowAddDevice(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add Device
              </Button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">{error}</div>
      )}

      <MessagesContent />

      <Dialog open={showAddDevice} onOpenChange={setShowAddDevice}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add WhatsApp Device</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Device name (e.g., Front Desk)"
              value={newDeviceName}
              onChange={(e) => setNewDeviceName(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddDevice(false)}>Cancel</Button>
            <Button onClick={handleCreateDevice} disabled={!newDeviceName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
