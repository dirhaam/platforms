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
      // Media sending (image, video, audio, document)
      if (message.type !== 'text') {
        if (!message.fileData) {
          throw new Error(`${message.type} message requires file data`);
        }

        const formData = new FormData();
        formData.append('phone', to);

        const caption = message.caption ?? message.content;
        if (caption) formData.append('caption', caption);

        const uint8 = message.fileData instanceof Uint8Array
          ? message.fileData
          : new Uint8Array(message.fileData);

        const normalizedData = new Uint8Array(uint8.byteLength);
        normalizedData.set(uint8);

        const defaultName =
          message.type === 'image' ? 'image.jpg' :
          message.type === 'video' ? 'video.mp4' :
          message.type === 'audio' ? 'audio.m4a' : 'document.pdf';

        const defaultMime =
          message.type === 'image' ? 'image/jpeg' :
          message.type === 'video' ? 'video/mp4' :
          message.type === 'audio' ? 'audio/mpeg' : 'application/pdf';

        const blob = new Blob([normalizedData.buffer.slice(0)], {
          type: message.mimeType || defaultMime,
        });

        formData.append('file', blob, message.filename || defaultName);

        const response = await this.makeRequest('/send/file', {
        const endpoint =
          message.type === 'image' ? '/send/image' :
          message.type === 'video' ? '/send/video' :
          message.type === 'audio' ? '/send/audio' :
          '/send/file';

        const response = await this.makeRequest(endpoint, {
          body: formData,
          isFormData: true,
        });

        if (response.code !== 'SUCCESS') {
          throw new Error(response.message || `Failed to send ${message.type}`);
        }

        return {
          id: response.results?.message_id || randomUUID(),
          tenantId: this.tenantId,
          deviceId,
          conversationId: response.results?.conversation_id || '',
          type: message.type,
          content: message.content,
          mediaUrl: response.results?.media_url || message.mediaUrl,
          mediaCaption: caption,
          isFromCustomer: false,
          customerPhone: to,
          deliveryStatus: 'sent',
          sentAt: new Date(),
        };
      }

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

  async getDevices(): Promise<WhatsAppDevice[]> {
    try {
      const response = await this.makeRequest('/app/devices');
      const devices = Array.isArray(response?.results) ? response.results : [];

      if (!devices.length) {
        return [];
      }

      return devices.map((entry: any, idx: number) => ({
        id: entry?.id || `device_${idx}`,
        tenantId: this.tenantId,
        endpointId: this.endpointId,
        deviceName: entry?.name || `Device ${idx + 1}`,
        phoneNumber: entry?.device,
        status: entry ? 'connected' as const : 'disconnected',
        lastSeen: new Date(),
        reconnectAttempts: 0,
        maxReconnectAttempts: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
    } catch (error) {
      console.error('Error listing devices:', error);
      return [];
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
      // Call actual WhatsApp API endpoint: GET /chats
      const response = await this.makeRequest(`/chats?limit=50&offset=0`);

      // Normalize response shape from different providers
      const raw = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.results)
        ? response.results
        : Array.isArray(response?.data?.chats)
        ? response.data.chats
        : Array.isArray(response?.chats)
        ? response.chats
        : [];
      
      const chats = Array.isArray(raw) ? raw : [];

      return chats.map((chat: any) => {
        const chatJid = chat.chat_jid || chat.chatJid || chat.jid || chat.id || '';
        const phone = typeof chatJid === 'string' && chatJid.includes('@')
          ? chatJid.replace(/@.+$/, '')
          : chat.phone || chat.number || chatJid || '';

        const ts = chat.timestamp ?? chat.last_message_time ?? chat.lastMessageTime;
        // detect seconds vs milliseconds
        const dateMs = typeof ts === 'number' && ts > 0
          ? (ts > 1e12 ? ts : ts * 1000)
          : Date.now();

        return {
          id: chatJid || (phone ? `${phone}@s.whatsapp.net` : `chat_${Math.random().toString(36).slice(2)}`),
          tenantId,
          customerPhone: phone,
          customerName: chat.name || chat.display_name || phone || 'Unknown',
          lastMessageAt: new Date(dateMs),
          lastMessagePreview: chat.last_message || chat.lastMessage || chat.preview || '',
          unreadCount: chat.unread_count || chat.unreadCount || 0,
          status: 'active' as const,
          tags: [],
          metadata: {
            chatJid,
            isGroup: chat.is_group ?? chat.isGroup,
            isBroadcast: chat.is_broadcast ?? chat.isBroadcast,
            raw: chat,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as WhatsAppConversation;
      });
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  }

  async getMessages(conversationId: string, limit = 50): Promise<WhatsAppMessage[]> {
    try {
      // Call actual WhatsApp API endpoint: GET /chat/{chat_jid}/messages
      const response = await this.makeRequest(`/chat/${encodeURIComponent(conversationId)}/messages?limit=${limit}&offset=0`);

      const raw = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.results)
        ? response.results
        : Array.isArray(response?.messages)
        ? response.messages
        : [];

      const messages = Array.isArray(raw) ? raw : [];

      return messages.map((msg: any) => {
        const type = (msg.type || (msg.media_type ? String(msg.media_type).toLowerCase() : 'text')) as WhatsAppMessage['type'];
        const fromMe = msg.from_me ?? msg.fromMe ?? msg.is_outgoing ?? false;
        const timestamp = msg.timestamp ?? msg.sent_at ?? msg.time;
        const tsDate = typeof timestamp === 'number' && timestamp > 0 ? new Date((timestamp > 1e12 ? timestamp : timestamp * 1000)) : new Date();

        return {
          id: msg.id || msg.message_id || `msg_${Math.random().toString(36).slice(2)}`,
          tenantId: this.tenantId,
          deviceId: '',
          conversationId,
          type,
          content: msg.content || msg.body || msg.text || '',
          mediaUrl: msg.media_url || msg.mediaUrl,
          mediaCaption: msg.media_caption || msg.mediaCaption || msg.caption,
          isFromCustomer: !fromMe,
          customerPhone: msg.from || msg.sender || '',
          deliveryStatus: (msg.delivery_status || msg.status || 'sent') as WhatsAppMessage['deliveryStatus'],
          errorMessage: msg.error_message,
          metadata: msg.metadata || { raw: msg },
          sentAt: tsDate,
          deliveredAt: msg.delivered_at ? new Date((msg.delivered_at > 1e12 ? msg.delivered_at : msg.delivered_at * 1000)) : undefined,
          readAt: msg.read_at ? new Date((msg.read_at > 1e12 ? msg.read_at : msg.read_at * 1000)) : undefined
        } as WhatsAppMessage;
      });
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

  private async makeRequest(endpoint: string, options: RequestInit & { timeout?: number; isFormData?: boolean } = {}): Promise<any> {
    const { timeout = this.config.timeout, isFormData = false, ...fetchOptions } = options;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const { headers: overrideHeaders, ...restFetchOptions } = fetchOptions;

      const response = await fetch(`${this.config.apiUrl}${endpoint}`, {
        ...restFetchOptions,
        headers: this.buildHeaders(overrideHeaders, isFormData),
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
  private buildHeaders(override?: HeadersInit, isFormData = false): Headers {
    const headers = new Headers();

    if (!isFormData) {
      headers.set('Content-Type', 'application/json');
    }
    headers.set('Accept', 'application/json');
    headers.set('X-Requested-With', 'XMLHttpRequest');

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