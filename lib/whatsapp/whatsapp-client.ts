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
      const response = await this.makeRequest('/api/send-message', {
        method: 'POST',
        body: JSON.stringify({
          deviceId,
          to,
          type: message.type,
          content: message.content,
          mediaUrl: message.mediaUrl,
          caption: message.caption,
          filename: message.filename
        })
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to send message');
      }

      return {
        id: response.data.messageId,
        tenantId: this.tenantId,
        deviceId,
        conversationId: response.data.conversationId,
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
      const response = await this.makeRequest(`/api/device/${deviceId}/status`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to get device status');
      }

      return {
        id: deviceId,
        tenantId: this.tenantId,
        endpointId: this.endpointId,
        deviceName: response.data.deviceName,
        phoneNumber: response.data.phoneNumber,
        status: response.data.status,
        lastSeen: response.data.lastSeen ? new Date(response.data.lastSeen) : undefined,
        reconnectAttempts: response.data.reconnectAttempts || 0,
        maxReconnectAttempts: 5,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt)
      };
    } catch (error) {
      console.error('Error getting device status:', error);
      throw error;
    }
  }

  async generateQRCode(deviceId: string): Promise<string> {
    try {
      const response = await this.makeRequest(`/api/device/${deviceId}/qr-code`, {
        method: 'POST'
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to generate QR code');
      }

      return response.data.qrCode;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  async generatePairingCode(deviceId: string): Promise<string> {
    try {
      const response = await this.makeRequest(`/api/device/${deviceId}/pairing-code`, {
        method: 'POST'
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to generate pairing code');
      }

      return response.data.pairingCode;
    } catch (error) {
      console.error('Error generating pairing code:', error);
      throw error;
    }
  }

  async disconnectDevice(deviceId: string): Promise<void> {
    try {
      const response = await this.makeRequest(`/api/device/${deviceId}/disconnect`, {
        method: 'POST'
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to disconnect device');
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