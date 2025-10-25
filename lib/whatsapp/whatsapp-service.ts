import {
  WhatsAppEndpoint,
  WhatsAppDevice,
  WhatsAppConfiguration,
  WhatsAppMessage,
  WhatsAppMessageData,
  WhatsAppConversation,
  WhatsAppEvent,
} from '@/types/whatsapp';
import { WhatsAppEndpointManager } from './simplified-endpoint-manager';
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
  // Simplified: 1 Tenant = 1 Endpoint
  async addEndpoint(
    tenantId: string, 
    endpointData: Omit<WhatsAppEndpoint, 'createdAt' | 'updatedAt'>
  ): Promise<WhatsAppEndpoint> {
    return await this.endpointManager.setEndpoint(tenantId, endpointData);
  }

  async updateEndpoint(
    tenantId: string, 
    updates: Partial<WhatsAppEndpoint>
  ): Promise<WhatsAppEndpoint> {
    const existing = await this.endpointManager.getEndpoint(tenantId);
    if (!existing) {
      throw new Error('Endpoint not found');
    }
    return await this.endpointManager.setEndpoint(tenantId, {
      ...existing,
      ...updates,
    });
  }

  async removeEndpoint(tenantId: string): Promise<void> {
    await this.endpointManager.deleteEndpoint(tenantId);
  }

  async getEndpoint(tenantId: string): Promise<WhatsAppEndpoint | null> {
    return await this.endpointManager.getEndpoint(tenantId);
  }

  async testEndpointHealth(tenantId: string): Promise<boolean> {
    return await this.endpointManager.testEndpointHealth(tenantId);
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
  // Simplified: Each tenant has 1 endpoint
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

    const client = await this.endpointManager.getClient(tenantId);
    if (!client) {
      throw new Error('WhatsApp endpoint not configured or unavailable');
    }

    const sentMessage = await client.sendMessage(deviceId, to, message);

    const recorded = await this.webhookHandler.recordOutgoingMessage(tenantId, deviceId, to, {
      id: sentMessage.id,
      content: sentMessage.content,
      type: sentMessage.type,
      mediaUrl: sentMessage.mediaUrl,
      mediaCaption: sentMessage.mediaCaption,
      sentAt: sentMessage.sentAt,
      metadata: sentMessage.metadata,
    });

    return recorded;
  }

  async getConversations(tenantId: string): Promise<WhatsAppConversation[]> {
    return await this.webhookHandler.getTenantConversations(tenantId);
  }

  async getMessages(conversationId: string, limit?: number, offset?: number): Promise<WhatsAppMessage[]> {
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) {
      return [];
    }

    return await this.webhookHandler.getConversationMessages(
      conversation.tenantId,
      conversationId,
      limit,
      offset
    );
  }

  async getHistoricalMessages(
    tenantId: string, 
    conversationId: string, 
    limit?: number, 
    offset?: number
  ): Promise<WhatsAppMessage[]> {
    return await this.webhookHandler.getHistoricalMessages(
      tenantId,
      conversationId,
      limit,
      offset
    );
  }

  async markMessageAsRead(messageId: string, tenantId: string): Promise<void> {
    const client = await this.endpointManager.getClient(tenantId);
    if (!client) {
      throw new Error('No healthy WhatsApp client available');
    }

    await client.markAsRead(messageId);
  }

  async markConversationRead(tenantId: string, conversationId: string): Promise<void> {
    await this.webhookHandler.markConversationRead(tenantId, conversationId);
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
    endpoint: {
      id: string;
      name: string;
      status: 'healthy' | 'unhealthy' | 'unknown';
      lastCheck: Date;
    } | null;
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
        endpoint: null,
        devices: []
      };
    }

    const endpointStatus = config.endpoint ? {
      id: config.endpoint.id,
      name: config.endpoint.name,
      status: config.endpoint.healthStatus,
      lastCheck: config.endpoint.lastHealthCheck
    } : null;

    const deviceStatuses = devices.map(device => ({
      id: device.id,
      name: device.deviceName,
      status: device.status,
      lastSeen: device.lastSeen
    }));

    // Determine overall health
    const endpointHealthy = endpointStatus?.status === 'healthy';
    const connectedDevices = deviceStatuses.filter(dev => dev.status === 'connected').length;

    let overallHealth: 'healthy' | 'degraded' | 'unhealthy';
    
    if (!endpointStatus) {
      overallHealth = 'unhealthy';
    } else if (endpointHealthy && connectedDevices > 0) {
      overallHealth = 'healthy';
    } else if (endpointHealthy || connectedDevices > 0) {
      overallHealth = 'degraded';
    } else {
      overallHealth = 'unhealthy';
    }

    return {
      overallHealth,
      endpoint: endpointStatus,
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