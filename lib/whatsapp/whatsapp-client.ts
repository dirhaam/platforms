import { randomUUID } from 'crypto';
import { 
  WhatsAppApiClient, 
  WhatsAppMessage, 
  WhatsAppMessageData, 
  WhatsAppDevice, 
  WhatsAppConversation,
  WhatsAppEndpointConfig 
} from '@/types/whatsapp';

export class WhatsAppClient implements WhatsAppApiClient {
  private config: WhatsAppEndpointConfig;
  private tenantId: string;
  private endpointId: string;

  constructor(config: WhatsAppEndpointConfig, tenantId: string, endpointId: string) {
    this.config = config;
    this.tenantId = tenantId;
    this.endpointId = endpointId;
  }

  async sendMessage(deviceId: string, to: string, message: WhatsAppMessageData): Promise<WhatsAppMessage> {
    try {
      const response = await this.makeRequest('/send/message', {
        method: 'POST',
        body: JSON.stringify({
          phone: to,
          message: message.content,
          is_forwarded: false,
          reply_message_id: undefined
        })
      });

      if (response.code !== 'SUCCESS') {
        throw new Error(response.message || 'Failed to send message');
      }

      return {
        id: response.results?.message_id || randomUUID(),
        tenantId: this.tenantId,
        deviceId,
        conversationId: response.results?.conversation_id || '',
        type: message.type,
        content: message.content,
        mediaUrl: message.mediaUrl,
        mediaCaption: message.caption,
        isFromCustomer: false,
        customerPhone: to,
        deliveryStatus: 'sent',
        sentAt: new Date()
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  async getDeviceStatus(deviceId: string): Promise<WhatsAppDevice> {
    try {
      const response = await this.makeRequest('/app/devices');
      const devices = Array.isArray(response?.results) ? response.results : [];
      const primary = devices.find((entry: any) => typeof entry?.device === 'string') || null;
      const isConnected = devices.length > 0;

      return {
        id: deviceId,
        tenantId: this.tenantId,
        endpointId: this.endpointId,
        deviceName: primary?.name || deviceId,
        phoneNumber: primary?.device,
        status: isConnected ? 'connected' : 'disconnected',
        lastSeen: new Date(),
        reconnectAttempts: 0,
        maxReconnectAttempts: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error getting device status:', error);
      throw error;
    }
  }

  async generateQRCode(deviceId: string): Promise<string> {
    try {
      const response = await this.makeRequest('/app/login');

      const qrLink = response?.results?.qr_link;
      if (!qrLink) {
        throw new Error(response?.message || 'Failed to generate QR code');
      }

      return qrLink;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  async generatePairingCode(deviceId: string, phone?: string): Promise<string> {
    try {
      if (!phone) {
        throw new Error('Phone number required to generate pairing code');
      }

      const params = new URLSearchParams({ phone });
      const response = await this.makeRequest(`/app/login-with-code?${params.toString()}`);

      const pairCode = response?.results?.pair_code;
      if (!pairCode) {
        throw new Error(response?.message || 'Failed to generate pairing code');
      }

      return pairCode;
    } catch (error) {
      console.error('Error generating pairing code:', error);
      throw error;
    }
  }

  async disconnectDevice(deviceId: string): Promise<void> {
    try {
      const response = await this.makeRequest('/app/logout');

      if (response?.code !== 'SUCCESS') {
        throw new Error(response?.message || 'Failed to disconnect device');
      }
    } catch (error) {
      console.error('Error disconnecting device:', error);
      throw error;
    }
  }

  async getConversations(tenantId: string): Promise<WhatsAppConversation[]> {
    try {
      const response = await this.makeRequest(`/api/conversations?tenantId=${tenantId}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to get conversations');
      }

      return response.data.conversations.map((conv: any) => ({
        id: conv.id,
        tenantId: conv.tenantId,
        customerPhone: conv.customerPhone,
        customerName: conv.customerName,
        lastMessageAt: new Date(conv.lastMessageAt),
        lastMessagePreview: conv.lastMessagePreview,
        unreadCount: conv.unreadCount,
        assignedTo: conv.assignedTo,
        status: conv.status,
        tags: conv.tags || [],
        metadata: conv.metadata,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt)
      }));
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  }

  async getMessages(conversationId: string, limit = 50): Promise<WhatsAppMessage[]> {
    try {
      const response = await this.makeRequest(`/api/conversations/${conversationId}/messages?limit=${limit}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to get messages');
      }

      return response.data.messages.map((msg: any) => ({
        id: msg.id,
        tenantId: msg.tenantId,
        deviceId: msg.deviceId,
        conversationId: msg.conversationId,
        type: msg.type,
        content: msg.content,
        mediaUrl: msg.mediaUrl,
        mediaCaption: msg.mediaCaption,
        isFromCustomer: msg.isFromCustomer,
        customerPhone: msg.customerPhone,
        deliveryStatus: msg.deliveryStatus,
        errorMessage: msg.errorMessage,
        metadata: msg.metadata,
        sentAt: new Date(msg.sentAt),
        deliveredAt: msg.deliveredAt ? new Date(msg.deliveredAt) : undefined,
        readAt: msg.readAt ? new Date(msg.readAt) : undefined
      }));
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      const response = await this.makeRequest(`/api/messages/${messageId}/read`, {
        method: 'POST'
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to mark message as read');
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/api/health', {
        timeout: 5000 // 5 second timeout for health checks
      });

      return response.success && response.data.status === 'healthy';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit & { timeout?: number } = {}): Promise<any> {
    const { timeout = this.config.timeout, ...fetchOptions } = options;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.config.apiUrl}${endpoint}`, {
        ...fetchOptions,
        headers: this.buildHeaders(fetchOptions.headers),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();

      if (!response.ok) {
        const trimmed = responseText.trim();
        throw new Error(
          `HTTP ${response.status}: ${response.statusText}${trimmed ? ` - ${trimmed}` : ''}`
        );
      }

      if (!responseText) {
        return {};
      }

      try {
        return JSON.parse(responseText);
      } catch (jsonError) {
        throw new Error(
          `Failed to parse JSON response from ${endpoint}: ${(jsonError as Error).message} | Body: ${responseText}`
        );
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }
  private buildHeaders(override?: HeadersInit): Headers {
    const headers = new Headers({ 'Content-Type': 'application/json' });

    if (this.config.headers) {
      Object.entries(this.config.headers).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }

    if (override) {
      new Headers(override).forEach((value, key) => {
        headers.set(key, value);
      });
    }

    if (!headers.has('Authorization')) {
      const authorization = this.buildAuthorizationHeader();
      if (authorization) {
        headers.set('Authorization', authorization);
      }
    }

    return headers;
  }

  private buildAuthorizationHeader(): string | undefined {
    const apiKey = this.config.apiKey;
    if (!apiKey) {
      return undefined;
    }

    if (/^(basic|bearer)\s/i.test(apiKey)) {
      return apiKey;
    }

    return `Bearer ${apiKey}`;
  }
}