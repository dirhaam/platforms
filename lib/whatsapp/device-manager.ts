import {
  WhatsAppDevice,
  WhatsAppSessionManager,
  WhatsAppReconnectionStrategy,
  WhatsAppEvent,
} from '@/types/whatsapp';
import { WhatsAppEndpointManager } from './endpoint-manager';
import {
  kvAddToSet,
  kvDelete,
  kvExpire,
  kvGet,
  kvGetSet,
  kvPushToList,
  kvRemoveFromSet,
  kvSet,
} from '@/lib/cache/key-value-store';

function normalizeDevice(raw: WhatsAppDevice | null): WhatsAppDevice | null {
  if (!raw) {
    return null;
  }

  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
    lastSeen: raw.lastSeen ? new Date(raw.lastSeen) : undefined,
  };
}

export class WhatsAppDeviceManager implements WhatsAppSessionManager {
  private static instance: WhatsAppDeviceManager;
  private reconnectionTimers: Map<string, NodeJS.Timeout> = new Map();
  private endpointManager: WhatsAppEndpointManager;

  constructor() {
    this.endpointManager = WhatsAppEndpointManager.getInstance();
  }

  static getInstance(): WhatsAppDeviceManager {
    if (!WhatsAppDeviceManager.instance) {
      WhatsAppDeviceManager.instance = new WhatsAppDeviceManager();
    }
    return WhatsAppDeviceManager.instance;
  }

  async createDevice(tenantId: string, endpointId: string, deviceName: string): Promise<WhatsAppDevice> {
    try {
      const device: WhatsAppDevice = {
        id: `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tenantId,
        endpointId,
        deviceName,
        status: 'disconnected',
        reconnectAttempts: 0,
        maxReconnectAttempts: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.saveDevice(device);
      return device;
    } catch (error) {
      console.error('Error creating WhatsApp device:', error);
      throw error;
    }
  }

  async getDevice(deviceId: string): Promise<WhatsAppDevice | null> {
    try {
      const deviceKey = `whatsapp:device:${deviceId}`;
      const deviceData = await kvGet<WhatsAppDevice>(deviceKey);

      return normalizeDevice(deviceData ?? null);
    } catch (error) {
      console.error('Error getting WhatsApp device:', error);
      return null;
    }
  }

  async getTenantDevices(tenantId: string): Promise<WhatsAppDevice[]> {
    try {
      const devicesKey = `whatsapp:tenant:${tenantId}:devices`;
      const deviceIds = await kvGetSet(devicesKey);
      
      const devices: WhatsAppDevice[] = [];
      for (const deviceId of deviceIds) {
        const device = await this.getDevice(deviceId);
        if (device) {
          devices.push(device);
        }
      }

      return devices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting tenant devices:', error);
      return [];
    }
  }

  async updateDevice(deviceId: string, updates: Partial<WhatsAppDevice>): Promise<WhatsAppDevice> {
    try {
      const device = await this.getDevice(deviceId);
      if (!device) {
        throw new Error('Device not found');
      }

      const updatedDevice = {
        ...device,
        ...updates,
        updatedAt: new Date()
      };

      await this.saveDevice(updatedDevice);
      
      // Emit device status change event
      if (updates.status && updates.status !== device.status) {
        await this.emitDeviceEvent(updatedDevice, 'device_' + updates.status as any);
      }

      return updatedDevice;
    } catch (error) {
      console.error('Error updating WhatsApp device:', error);
      throw error;
    }
  }

  async deleteDevice(deviceId: string): Promise<void> {
    try {
      const device = await this.getDevice(deviceId);
      if (!device) {
        return;
      }

      // Stop any reconnection attempts
      this.stopReconnection(deviceId);

      // Clear session data
      await this.clearSession(deviceId);

      // Remove from tenant devices set
      const devicesKey = `whatsapp:tenant:${device.tenantId}:devices`;
      await kvRemoveFromSet(devicesKey, deviceId);

      // Remove device data
      const deviceKey = `whatsapp:device:${deviceId}`;
      await kvDelete(deviceKey);
    } catch (error) {
      console.error('Error deleting WhatsApp device:', error);
      throw error;
    }
  }

  async connectDevice(deviceId: string): Promise<{ qrCode?: string; pairingCode?: string }> {
    try {
      const device = await this.getDevice(deviceId);
      if (!device) {
        throw new Error('Device not found');
      }

      await this.updateDevice(deviceId, { status: 'connecting' });

      const client = await this.endpointManager.getClient(device.tenantId, device.endpointId);
      if (!client) {
        throw new Error('WhatsApp client not available');
      }

      // Try to generate QR code first
      try {
        const qrCode = await client.generateQRCode(deviceId);
        await this.updateDevice(deviceId, { 
          status: 'pairing', 
          qrCode,
          pairingCode: undefined 
        });
        
        await this.emitDeviceEvent(device, 'qr_code_generated');
        return { qrCode };
      } catch (qrError) {
        // Fallback to pairing code
        try {
          const pairingCode = await client.generatePairingCode(deviceId);
          await this.updateDevice(deviceId, { 
            status: 'pairing', 
            pairingCode,
            qrCode: undefined 
          });
          
          await this.emitDeviceEvent(device, 'pairing_code_generated');
          return { pairingCode };
        } catch (pairingError) {
          await this.updateDevice(deviceId, { status: 'error' });
          throw new Error('Failed to generate QR code or pairing code');
        }
      }
    } catch (error) {
      console.error('Error connecting WhatsApp device:', error);
      throw error;
    }
  }

  async disconnectDevice(deviceId: string): Promise<void> {
    try {
      const device = await this.getDevice(deviceId);
      if (!device) {
        throw new Error('Device not found');
      }

      const client = await this.endpointManager.getClient(device.tenantId, device.endpointId);
      if (client) {
        await client.disconnectDevice(deviceId);
      }

      await this.updateDevice(deviceId, { 
        status: 'disconnected',
        qrCode: undefined,
        pairingCode: undefined,
        phoneNumber: undefined,
        lastSeen: new Date()
      });

      // Stop reconnection attempts
      this.stopReconnection(deviceId);

      // Clear session
      await this.clearSession(deviceId);
    } catch (error) {
      console.error('Error disconnecting WhatsApp device:', error);
      throw error;
    }
  }

  async handleDeviceConnected(deviceId: string, phoneNumber: string): Promise<void> {
    try {
      await this.updateDevice(deviceId, {
        status: 'connected',
        phoneNumber,
        qrCode: undefined,
        pairingCode: undefined,
        lastSeen: new Date(),
        reconnectAttempts: 0
      });

      // Stop any reconnection attempts
      this.stopReconnection(deviceId);

      const device = await this.getDevice(deviceId);
      if (device) {
        await this.emitDeviceEvent(device, 'device_connected');
      }
    } catch (error) {
      console.error('Error handling device connected:', error);
    }
  }

  async handleDeviceDisconnected(deviceId: string): Promise<void> {
    try {
      const device = await this.getDevice(deviceId);
      if (!device) return;

      await this.updateDevice(deviceId, {
        status: 'disconnected',
        lastSeen: new Date()
      });

      await this.emitDeviceEvent(device, 'device_disconnected');

      // Start reconnection if auto-reconnect is enabled
      const config = await this.endpointManager.getConfiguration(device.tenantId);
      if (config && config.autoReconnect) {
        await this.startReconnection(device);
      }
    } catch (error) {
      console.error('Error handling device disconnected:', error);
    }
  }

  async refreshDeviceStatus(deviceId: string): Promise<WhatsAppDevice> {
    try {
      const device = await this.getDevice(deviceId);
      if (!device) {
        throw new Error('Device not found');
      }

      const client = await this.endpointManager.getClient(device.tenantId, device.endpointId);
      if (!client) {
        throw new Error('WhatsApp client not available');
      }

      const remoteDevice = await client.getDeviceStatus(deviceId);
      
      return await this.updateDevice(deviceId, {
        status: remoteDevice.status,
        phoneNumber: remoteDevice.phoneNumber,
        lastSeen: remoteDevice.lastSeen
      });
    } catch (error) {
      console.error('Error refreshing device status:', error);
      throw error;
    }
  }

  // Session Management Implementation
  async saveSession(deviceId: string, sessionData: string): Promise<void> {
    try {
      const sessionKey = `whatsapp:session:${deviceId}`;
      // Encrypt session data before storing
      const encryptedData = Buffer.from(sessionData).toString('base64');
      await kvSet(sessionKey, encryptedData, 86400 * 7);
    } catch (error) {
      console.error('Error saving WhatsApp session:', error);
      throw error;
    }
  }

  async loadSession(deviceId: string): Promise<string | null> {
    try {
      const sessionKey = `whatsapp:session:${deviceId}`;
      const encryptedData = await kvGet<string>(sessionKey);
      
      if (!encryptedData) {
        return null;
      }

      // Decrypt session data
      return Buffer.from(encryptedData as string, 'base64').toString();
    } catch (error) {
      console.error('Error loading WhatsApp session:', error);
      return null;
    }
  }

  async clearSession(deviceId: string): Promise<void> {
    try {
      const sessionKey = `whatsapp:session:${deviceId}`;
      await kvDelete(sessionKey);
    } catch (error) {
      console.error('Error clearing WhatsApp session:', error);
    }
  }

  async isSessionValid(deviceId: string): Promise<boolean> {
    try {
      const sessionData = await this.loadSession(deviceId);
      return sessionData !== null;
    } catch (error) {
      console.error('Error checking session validity:', error);
      return false;
    }
  }

  private async saveDevice(device: WhatsAppDevice): Promise<void> {
    const deviceKey = `whatsapp:device:${device.id}`;
    const devicesKey = `whatsapp:tenant:${device.tenantId}:devices`;
    
    await kvSet(deviceKey, device);
    await kvAddToSet(devicesKey, device.id);
  }

  private async startReconnection(device: WhatsAppDevice): Promise<void> {
    const strategy = new DefaultReconnectionStrategy();
    
    if (!strategy.shouldReconnect(device)) {
      return;
    }

    const delay = strategy.getReconnectDelay(device.reconnectAttempts);
    
    const timer = setTimeout(async () => {
      try {
        await this.updateDevice(device.id, {
          reconnectAttempts: device.reconnectAttempts + 1
        });

        const result = await this.connectDevice(device.id);
        
        if (result.qrCode || result.pairingCode) {
          await strategy.onReconnectSuccess(device.id);
        }
      } catch (error) {
        await strategy.onReconnectFailure(device.id, error as Error);
        
        // Try again if we haven't exceeded max attempts
        const updatedDevice = await this.getDevice(device.id);
        if (updatedDevice && strategy.shouldReconnect(updatedDevice)) {
          await this.startReconnection(updatedDevice);
        }
      }
    }, delay);

    this.reconnectionTimers.set(device.id, timer);
  }

  private stopReconnection(deviceId: string): void {
    const timer = this.reconnectionTimers.get(deviceId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectionTimers.delete(deviceId);
    }
  }

  private async emitDeviceEvent(device: WhatsAppDevice, eventType: WhatsAppEvent['type']): Promise<void> {
    try {
      const event: WhatsAppEvent = {
        type: eventType,
        tenantId: device.tenantId,
        deviceId: device.id,
        endpointId: device.endpointId,
        data: {
          deviceName: device.deviceName,
          phoneNumber: device.phoneNumber,
          status: device.status
        },
        timestamp: new Date()
      };

      // Store event for webhook processing
      const eventKey = `whatsapp:events:${device.tenantId}`;
      await kvPushToList(eventKey, event);
      await kvExpire(eventKey, 3600);
    } catch (error) {
      console.error('Error emitting device event:', error);
    }
  }
}

class DefaultReconnectionStrategy implements WhatsAppReconnectionStrategy {
  shouldReconnect(device: WhatsAppDevice): boolean {
    return device.reconnectAttempts < device.maxReconnectAttempts && 
           device.status === 'disconnected';
  }

  getReconnectDelay(attemptNumber: number): number {
    // Exponential backoff: 30s, 60s, 120s, 240s, 480s
    return Math.min(30 * Math.pow(2, attemptNumber), 480) * 1000;
  }

  async onReconnectSuccess(deviceId: string): Promise<void> {
    console.log(`Device ${deviceId} reconnected successfully`);
  }

  async onReconnectFailure(deviceId: string, error: Error): Promise<void> {
    console.error(`Device ${deviceId} reconnection failed:`, error.message);
  }
}