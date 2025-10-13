import { 
  WhatsAppWebhookPayload, 
  WhatsAppMessage, 
  WhatsAppConversation,
  WhatsAppEvent 
} from '@/types/whatsapp';
import { WhatsAppDeviceManager } from './device-manager';
import { WhatsAppEndpointManager } from './endpoint-manager';
import { redis } from '@/lib/redis';

const ensureCrypto = () => {
  if (typeof globalThis.crypto === 'undefined') {
    throw new Error('Web Crypto API is not available in this environment');
  }
  return globalThis.crypto;
};

const encoder = new TextEncoder();

const arrayBufferToHex = (buffer: ArrayBuffer | Uint8Array) => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const hexToUint8Array = (hex: string) => {
  const length = hex.length / 2;
  const result = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    result[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return result;
};

const timingSafeEqual = (a: Uint8Array, b: Uint8Array) => {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
};

const computeHmacSha256Hex = async (secret: string, payload: string) => {
  const cryptoObj = ensureCrypto();
  const key = await cryptoObj.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await cryptoObj.subtle.sign('HMAC', key, encoder.encode(payload));
  return arrayBufferToHex(signature);
};

export class WhatsAppWebhookHandler {
  private static instance: WhatsAppWebhookHandler;
  private deviceManager: WhatsAppDeviceManager;
  private endpointManager: WhatsAppEndpointManager;

  constructor() {
    this.deviceManager = WhatsAppDeviceManager.getInstance();
    this.endpointManager = WhatsAppEndpointManager.getInstance();
  }

  static getInstance(): WhatsAppWebhookHandler {
    if (!WhatsAppWebhookHandler.instance) {
      WhatsAppWebhookHandler.instance = new WhatsAppWebhookHandler();
    }
    return WhatsAppWebhookHandler.instance;
  }

  async handleWebhook(
    tenantId: string, 
    endpointId: string, 
    payload: any, 
    signature?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verify webhook signature
      if (signature) {
        const isValid = await this.verifyWebhookSignature(tenantId, endpointId, payload, signature);
        if (!isValid) {
          return { success: false, message: 'Invalid webhook signature' };
        }
      }

      // Route webhook based on event type
      const webhookPayload: WhatsAppWebhookPayload = {
        tenantId,
        endpointId,
        deviceId: payload.deviceId || payload.device_id,
        event: payload.event || payload.type,
        data: payload.data || payload,
        timestamp: new Date()
      };

      await this.routeWebhook(webhookPayload);

      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      console.error('Error handling WhatsApp webhook:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async routeWebhook(payload: WhatsAppWebhookPayload): Promise<void> {
    switch (payload.event) {
      case 'message':
        await this.handleMessageWebhook(payload);
        break;
      case 'status':
        await this.handleStatusWebhook(payload);
        break;
      case 'device_status':
        await this.handleDeviceStatusWebhook(payload);
        break;
      case 'qr_code':
        await this.handleQRCodeWebhook(payload);
        break;
      case 'pairing_code':
        await this.handlePairingCodeWebhook(payload);
        break;
      default:
        console.warn('Unknown webhook event type:', payload.event);
    }
  }

  private async handleMessageWebhook(payload: WhatsAppWebhookPayload): Promise<void> {
    try {
      const messageData = payload.data;
      
      // Create or update conversation
      const conversation = await this.createOrUpdateConversation(
        payload.tenantId,
        messageData.from || messageData.customerPhone,
        messageData.fromName || messageData.customerName
      );

      // Store the message
      const message: WhatsAppMessage = {
        id: messageData.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tenantId: payload.tenantId,
        deviceId: payload.deviceId,
        conversationId: conversation.id,
        type: messageData.type || 'text',
        content: messageData.body || messageData.content || '',
        mediaUrl: messageData.mediaUrl,
        mediaCaption: messageData.caption,
        isFromCustomer: messageData.isFromCustomer !== false, // Default to true for incoming
        customerPhone: messageData.from || messageData.customerPhone,
        deliveryStatus: 'delivered',
        sentAt: new Date(messageData.timestamp || Date.now())
      };

      await this.storeMessage(message);

      // Update conversation with latest message
      await this.updateConversation(conversation.id, {
        lastMessageAt: message.sentAt,
        lastMessagePreview: this.getMessagePreview(message),
        unreadCount: conversation.unreadCount + (message.isFromCustomer ? 1 : 0)
      });

      // Emit message received event
      await this.emitEvent({
        type: 'message_received',
        tenantId: payload.tenantId,
        deviceId: payload.deviceId,
        data: {
          messageId: message.id,
          conversationId: conversation.id,
          customerPhone: message.customerPhone,
          content: message.content,
          type: message.type
        },
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error handling message webhook:', error);
    }
  }

  private async handleStatusWebhook(payload: WhatsAppWebhookPayload): Promise<void> {
    try {
      const statusData = payload.data;
      const messageId = statusData.messageId || statusData.id;
      
      if (!messageId) {
        console.warn('Status webhook missing message ID');
        return;
      }

      // Update message delivery status
      await this.updateMessageStatus(
        messageId,
        statusData.status,
        statusData.timestamp ? new Date(statusData.timestamp) : new Date()
      );

      // Emit status event
      const eventType = statusData.status === 'delivered' ? 'message_delivered' : 
                       statusData.status === 'read' ? 'message_read' : 'message_sent';

      await this.emitEvent({
        type: eventType as WhatsAppEvent['type'],
        tenantId: payload.tenantId,
        deviceId: payload.deviceId,
        data: {
          messageId,
          status: statusData.status,
          timestamp: statusData.timestamp
        },
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error handling status webhook:', error);
    }
  }

  private async handleDeviceStatusWebhook(payload: WhatsAppWebhookPayload): Promise<void> {
    try {
      const statusData = payload.data;
      const deviceId = payload.deviceId;

      if (!deviceId) {
        console.warn('Device status webhook missing device ID');
        return;
      }

      switch (statusData.status) {
        case 'connected':
          await this.deviceManager.handleDeviceConnected(
            deviceId, 
            statusData.phoneNumber
          );
          break;
        case 'disconnected':
          await this.deviceManager.handleDeviceDisconnected(deviceId);
          break;
        default:
          await this.deviceManager.updateDevice(deviceId, {
            status: statusData.status,
            lastSeen: new Date()
          });
      }

    } catch (error) {
      console.error('Error handling device status webhook:', error);
    }
  }

  private async handleQRCodeWebhook(payload: WhatsAppWebhookPayload): Promise<void> {
    try {
      const qrData = payload.data;
      const deviceId = payload.deviceId;

      if (!deviceId || !qrData.qrCode) {
        console.warn('QR code webhook missing required data');
        return;
      }

      await this.deviceManager.updateDevice(deviceId, {
        qrCode: qrData.qrCode,
        status: 'pairing'
      });

      await this.emitEvent({
        type: 'qr_code_generated',
        tenantId: payload.tenantId,
        deviceId: deviceId,
        data: {
          qrCode: qrData.qrCode
        },
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error handling QR code webhook:', error);
    }
  }

  private async handlePairingCodeWebhook(payload: WhatsAppWebhookPayload): Promise<void> {
    try {
      const pairingData = payload.data;
      const deviceId = payload.deviceId;

      if (!deviceId || !pairingData.pairingCode) {
        console.warn('Pairing code webhook missing required data');
        return;
      }

      await this.deviceManager.updateDevice(deviceId, {
        pairingCode: pairingData.pairingCode,
        status: 'pairing'
      });

      await this.emitEvent({
        type: 'pairing_code_generated',
        tenantId: payload.tenantId,
        deviceId: deviceId,
        data: {
          pairingCode: pairingData.pairingCode
        },
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error handling pairing code webhook:', error);
    }
  }

  private async verifyWebhookSignature(
    tenantId: string, 
    endpointId: string, 
    payload: any, 
    signature: string
  ): Promise<boolean> {
    try {
      const config = await this.endpointManager.getConfiguration(tenantId);
      if (!config) {
        return false;
      }

      const endpoint = config.endpoints.find(ep => ep.id === endpointId);
      if (!endpoint || !endpoint.webhookSecret) {
        return false;
      }

      const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const expectedSignatureHex = await computeHmacSha256Hex(endpoint.webhookSecret, payloadString);
      const expectedHeaderValue = `sha256=${expectedSignatureHex}`;
      const providedBytes = encoder.encode(signature);
      const expectedBytes = encoder.encode(expectedHeaderValue);
      if (providedBytes.length !== expectedBytes.length) {
        return false;
      }
      return timingSafeEqual(providedBytes, expectedBytes);
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  private async createOrUpdateConversation(
    tenantId: string, 
    customerPhone: string, 
    customerName?: string
  ): Promise<WhatsAppConversation> {
    try {
      const conversationKey = `whatsapp:conversation:${tenantId}:${customerPhone}`;
      const existingData = await redis.get(conversationKey) as string | null;

      if (existingData) {
        const conversation = JSON.parse(existingData);
        return {
          ...conversation,
          lastMessageAt: new Date(conversation.lastMessageAt),
          createdAt: new Date(conversation.createdAt),
          updatedAt: new Date(conversation.updatedAt)
        };
      }

      // Create new conversation
      const conversation: WhatsAppConversation = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tenantId,
        customerPhone,
        customerName,
        lastMessageAt: new Date(),
        lastMessagePreview: '',
        unreadCount: 0,
        status: 'active',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await redis.set(conversationKey, JSON.stringify(conversation));
      
      // Add to tenant conversations list
      const conversationsKey = `whatsapp:conversations:${tenantId}`;
      await redis.sadd(conversationsKey, conversation.id);

      return conversation;
    } catch (error) {
      console.error('Error creating/updating conversation:', error);
      throw error;
    }
  }

  private async updateConversation(
    conversationId: string, 
    updates: Partial<WhatsAppConversation>
  ): Promise<void> {
    try {
      // Find conversation by ID (this is a simplified approach)
      const conversationsPattern = `whatsapp:conversation:*`;
      const keys = await redis.keys(conversationsPattern);
      
      for (const key of keys) {
        const data = await redis.get(key) as string | null;
        if (data) {
          const conversation = JSON.parse(data);
          if (conversation.id === conversationId) {
            const updatedConversation = {
              ...conversation,
              ...updates,
              updatedAt: new Date()
            };
            await redis.set(key, JSON.stringify(updatedConversation));
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
  }

  private async storeMessage(message: WhatsAppMessage): Promise<void> {
    try {
      const messageKey = `whatsapp:message:${message.id}`;
      await redis.set(messageKey, JSON.stringify(message));

      // Add to conversation messages list
      const conversationMessagesKey = `whatsapp:messages:${message.conversationId}`;
      await redis.lpush(conversationMessagesKey, message.id);
      
      // Keep only last 1000 messages per conversation
      await redis.ltrim(conversationMessagesKey, 0, 999);
    } catch (error) {
      console.error('Error storing message:', error);
    }
  }

  private async updateMessageStatus(
    messageId: string, 
    status: string, 
    timestamp: Date
  ): Promise<void> {
    try {
      const messageKey = `whatsapp:message:${messageId}`;
      const messageData = await redis.get(messageKey) as string | null;
      
      if (messageData) {
        const message = JSON.parse(messageData);
        const updates: Partial<WhatsAppMessage> = {
          deliveryStatus: status as any
        };

        if (status === 'delivered') {
          updates.deliveredAt = timestamp;
        } else if (status === 'read') {
          updates.readAt = timestamp;
        }

        const updatedMessage = { ...message, ...updates };
        await redis.set(messageKey, JSON.stringify(updatedMessage));
      }
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  }

  private getMessagePreview(message: WhatsAppMessage): string {
    switch (message.type) {
      case 'text':
        return message.content.substring(0, 100);
      case 'image':
        return '📷 Image' + (message.mediaCaption ? `: ${message.mediaCaption.substring(0, 50)}` : '');
      case 'audio':
        return '🎵 Audio message';
      case 'video':
        return '🎥 Video' + (message.mediaCaption ? `: ${message.mediaCaption.substring(0, 50)}` : '');
      case 'document':
        return '📄 Document';
      case 'location':
        return '📍 Location';
      case 'contact':
        return '👤 Contact';
      case 'sticker':
        return '😊 Sticker';
      default:
        return 'Message';
    }
  }

  private async emitEvent(event: WhatsAppEvent): Promise<void> {
    try {
      const eventKey = `whatsapp:events:${event.tenantId}`;
      await redis.lpush(eventKey, JSON.stringify(event));
      await redis.expire(eventKey, 3600); // 1 hour TTL

      // Also store in global events for platform monitoring
      const globalEventKey = 'whatsapp:events:global';
      await redis.lpush(globalEventKey, JSON.stringify(event));
      await redis.ltrim(globalEventKey, 0, 9999); // Keep last 10k events
    } catch (error) {
      console.error('Error emitting WhatsApp event:', error);
    }
  }

  async getTenantEvents(tenantId: string, limit = 100): Promise<WhatsAppEvent[]> {
    try {
      const eventKey = `whatsapp:events:${tenantId}`;
      const eventStrings = await redis.lrange(eventKey, 0, limit - 1);
      
      return eventStrings.map((eventStr: string) => {
        const event = JSON.parse(eventStr);
        return {
          ...event,
          timestamp: new Date(event.timestamp)
        };
      });
    } catch (error) {
      console.error('Error getting tenant events:', error);
      return [];
    }
  }

  async retryFailedWebhook(
    tenantId: string, 
    endpointId: string, 
    payload: WhatsAppWebhookPayload, 
    attempt = 1
  ): Promise<void> {
    const maxRetries = 3;
    const retryDelay = Math.pow(2, attempt) * 1000; // Exponential backoff

    if (attempt > maxRetries) {
      console.error('Max webhook retry attempts reached for:', payload);
      return;
    }

    setTimeout(async () => {
      try {
        await this.routeWebhook(payload);
      } catch (error) {
        console.error(`Webhook retry attempt ${attempt} failed:`, error);
        await this.retryFailedWebhook(tenantId, endpointId, payload, attempt + 1);
      }
    }, retryDelay);
  }
}