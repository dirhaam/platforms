import {
  WhatsAppEndpoint,
  WhatsAppDevice,
  WhatsAppConfiguration,
  WhatsAppMessage,
  WhatsAppMessageData,
  WhatsAppConversation,
  WhatsAppEvent,
} from '@/types/whatsapp';
import { WhatsAppEndpointManager } from './endpoint-manager';
import { WhatsAppDeviceManager } from './device-manager';
import { WhatsAppWebhookHandler } from './webhook-handler';
import { kvGet } from '@/lib/cache/key-value-store';

export class WhatsAppService {
  private static instance: WhatsAppService;
  private endpointManager: WhatsAppEndpointManager;
  private deviceManager: WhatsAppDeviceManager;
  private webhookHandler: WhatsAppWebhookHandler;

  constructor() {
    this.endpointManager = WhatsAppEndpointManager.getInstance();
    this.deviceManager = WhatsAppDeviceManager.getInstance();
    this.webhookHandler = WhatsAppWebhookHandler.getInstance();
  }

  static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  // Configuration Management
  async getTenantConfiguration(tenantId: string): Promise<WhatsAppConfiguration | null> {
    return await this.endpointManager.getConfiguration(tenantId);
  }

  async updateTenantConfiguration(config: WhatsAppConfiguration): Promise<void> {
    await this.endpointManager.saveConfiguration(config);
  }

  async initializeTenant(tenantId: string): Promise<void> {
    await this.endpointManager.initializeTenant(tenantId);
  }

  // Endpoint Management
  async addEndpoint(
    tenantId: string, 
    endpointData: Omit<WhatsAppEndpoint, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<WhatsAppEndpoint> {
    return await this.endpointManager.addEndpoint(tenantId, endpointData);
  }

  async updateEndpoint(
    tenantId: string, 
    endpointId: string, 
    updates: Partial<WhatsAppEndpoint>
  ): Promise<WhatsAppEndpoint> {
    return await this.endpointManager.updateEndpoint(tenantId, endpointId, updates);
  }

  async removeEndpoint(tenantId: string, endpointId: string): Promise<void> {
    await this.endpointManager.removeEndpoint(tenantId, endpointId);
  }

  async getEndpoints(tenantId: string): Promise<WhatsAppEndpoint[]> {
    const config = await this.endpointManager.getConfiguration(tenantId);
    return config?.endpoints || [];
  }

  async testEndpointHealth(tenantId: string, endpointId: string): Promise<boolean> {
    const config = await this.endpointManager.getConfiguration(tenantId);
    if (!config) return false;

    const endpoint = config.endpoints.find(ep => ep.id === endpointId);
    if (!endpoint) return false;

    const healthCheck = await this.endpointManager.performHealthCheck(endpoint);
    return healthCheck.status === 'healthy';
  }

  // Device Management
  async createDevice(tenantId: string, endpointId: string, deviceName: string): Promise<WhatsAppDevice> {
    return await this.deviceManager.createDevice(tenantId, endpointId, deviceName);
  }

  async getDevice(deviceId: string): Promise<WhatsAppDevice | null> {
    return await this.deviceManager.getDevice(deviceId);
  }

  async getTenantDevices(tenantId: string): Promise<WhatsAppDevice[]> {
    return await this.deviceManager.getTenantDevices(tenantId);
  }

  async updateDevice(deviceId: string, updates: Partial<WhatsAppDevice>): Promise<WhatsAppDevice> {
    return await this.deviceManager.updateDevice(deviceId, updates);
  }

  async deleteDevice(deviceId: string): Promise<void> {
    await this.deviceManager.deleteDevice(deviceId);
  }

  async connectDevice(deviceId: string): Promise<{ qrCode?: string; pairingCode?: string }> {
    return await this.deviceManager.connectDevice(deviceId);
  }

  async disconnectDevice(deviceId: string): Promise<void> {
    await this.deviceManager.disconnectDevice(deviceId);
  }

  async refreshDeviceStatus(deviceId: string): Promise<WhatsAppDevice> {
    return await this.deviceManager.refreshDeviceStatus(deviceId);
  }

  // Messaging
  async sendMessage(
    tenantId: string, 
    deviceId: string, 
    to: string, 
    message: WhatsAppMessageData
  ): Promise<WhatsAppMessage> {
    const device = await this.deviceManager.getDevice(deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    if (device.status !== 'connected') {
      throw new Error('Device is not connected');
    }

    const client = await this.endpointManager.getHealthyClient(tenantId);
    if (!client) {
      throw new Error('No healthy WhatsApp client available');
    }

    return await client.sendMessage(deviceId, to, message);
  }

  async getConversations(tenantId: string): Promise<WhatsAppConversation[]> {
    const client = await this.endpointManager.getHealthyClient(tenantId);
    if (!client) {
      return [];
    }

    return await client.getConversations(tenantId);
  }

  async getMessages(conversationId: string, limit?: number): Promise<WhatsAppMessage[]> {
    // Extract tenant ID from conversation ID or get it another way
    // This is a simplified approach - in production you'd want a more robust way
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) {
      return [];
    }

    const client = await this.endpointManager.getHealthyClient(conversation.tenantId);
    if (!client) {
      return [];
    }

    return await client.getMessages(conversationId, limit);
  }

  async markMessageAsRead(messageId: string, tenantId: string): Promise<void> {
    const client = await this.endpointManager.getHealthyClient(tenantId);
    if (!client) {
      throw new Error('No healthy WhatsApp client available');
    }

    await client.markAsRead(messageId);
  }

  // Webhook Handling
  async handleWebhook(
    tenantId: string, 
    endpointId: string, 
    payload: any, 
    signature?: string
  ): Promise<{ success: boolean; message: string }> {
    return await this.webhookHandler.handleWebhook(tenantId, endpointId, payload, signature);
  }

  async getTenantEvents(tenantId: string, limit?: number): Promise<WhatsAppEvent[]> {
    return await this.webhookHandler.getTenantEvents(tenantId, limit);
  }

  // Health and Monitoring
  async getTenantHealthStatus(tenantId: string): Promise<{
    overallHealth: 'healthy' | 'degraded' | 'unhealthy';
    endpoints: Array<{
      id: string;
      name: string;
      status: 'healthy' | 'unhealthy' | 'unknown';
      lastCheck: Date;
    }>;
    devices: Array<{
      id: string;
      name: string;
      status: WhatsAppDevice['status'];
      lastSeen?: Date;
    }>;
  }> {
    const config = await this.endpointManager.getConfiguration(tenantId);
    const devices = await this.deviceManager.getTenantDevices(tenantId);

    if (!config) {
      return {
        overallHealth: 'unhealthy',
        endpoints: [],
        devices: []
      };
    }

    const endpointStatuses = config.endpoints.map(endpoint => ({
      id: endpoint.id,
      name: endpoint.name,
      status: endpoint.healthStatus,
      lastCheck: endpoint.lastHealthCheck
    }));

    const deviceStatuses = devices.map(device => ({
      id: device.id,
      name: device.deviceName,
      status: device.status,
      lastSeen: device.lastSeen
    }));

    // Determine overall health
    const healthyEndpoints = endpointStatuses.filter(ep => ep.status === 'healthy').length;
    const totalEndpoints = endpointStatuses.length;
    const connectedDevices = deviceStatuses.filter(dev => dev.status === 'connected').length;

    let overallHealth: 'healthy' | 'degraded' | 'unhealthy';
    
    if (totalEndpoints === 0) {
      overallHealth = 'unhealthy';
    } else if (healthyEndpoints === totalEndpoints && connectedDevices > 0) {
      overallHealth = 'healthy';
    } else if (healthyEndpoints > 0) {
      overallHealth = 'degraded';
    } else {
      overallHealth = 'unhealthy';
    }

    return {
      overallHealth,
      endpoints: endpointStatuses,
      devices: deviceStatuses
    };
  }

  async getSystemHealthStatus(): Promise<{
    totalTenants: number;
    healthyTenants: number;
    totalEndpoints: number;
    healthyEndpoints: number;
    totalDevices: number;
    connectedDevices: number;
  }> {
    // This would require iterating through all tenants
    // For now, return a placeholder implementation
    return {
      totalTenants: 0,
      healthyTenants: 0,
      totalEndpoints: 0,
      healthyEndpoints: 0,
      totalDevices: 0,
      connectedDevices: 0
    };
  }

  // Utility Methods
  private async getConversationById(conversationId: string): Promise<WhatsAppConversation | null> {
    try {
      const indexKey = `whatsapp:conversation:index:${conversationId}`;
      const conversationKey = await kvGet<string>(indexKey);
      if (!conversationKey) {
        return null;
      }

      const conversation = await kvGet<WhatsAppConversation>(conversationKey);
      if (!conversation) {
        return null;
      }

      return {
        ...conversation,
        lastMessageAt: new Date(conversation.lastMessageAt),
        createdAt: new Date(conversation.createdAt),
        updatedAt: new Date(conversation.updatedAt),
      };
    } catch (error) {
      console.error('Error getting conversation by ID:', error);
      return null;
    }
  }

  // Cleanup and Shutdown
  async shutdown(): Promise<void> {
    await this.endpointManager.shutdown();
  }
}

// Export singleton instance
export const whatsappService = WhatsAppService.getInstance();