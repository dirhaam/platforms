import { WhatsAppWebhookPayload, WhatsAppMessage, WhatsAppConversation, WhatsAppEvent } from '@/types/whatsapp';
import { WhatsAppEndpointManager } from './simplified-endpoint-manager';
import { computeHmacSha256Hex, timingSafeEqual, encoder } from './utils/crypto';
import { determineEventType, resolveDeviceId, resolveTimestamp } from './utils/message-parser';
import { MessageWebhookHandler } from './handlers/message-webhook-handler';
import { StatusWebhookHandler } from './handlers/status-webhook-handler';
import { DeviceWebhookHandler } from './handlers/device-webhook-handler';
import { ConversationStore } from './stores/conversation-store';
import { MessageStore } from './stores/message-store';
import { EventStore } from './stores/event-store';

export class WhatsAppWebhookHandler {
  private static instance: WhatsAppWebhookHandler;
  private endpointManager: WhatsAppEndpointManager;
  private messageHandler: MessageWebhookHandler;
  private statusHandler: StatusWebhookHandler;
  private deviceHandler: DeviceWebhookHandler;
  private conversationStore: ConversationStore;
  private messageStore: MessageStore;
  private eventStore: EventStore;

  constructor() {
    this.endpointManager = WhatsAppEndpointManager.getInstance();
    this.messageHandler = MessageWebhookHandler.getInstance();
    this.statusHandler = StatusWebhookHandler.getInstance();
    this.deviceHandler = DeviceWebhookHandler.getInstance();
    this.conversationStore = ConversationStore.getInstance();
    this.messageStore = MessageStore.getInstance();
    this.eventStore = EventStore.getInstance();
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
      if (signature) {
        const isValid = await this.verifyWebhookSignature(tenantId, endpointId, payload, signature);
        if (!isValid) {
          return { success: false, message: 'Invalid webhook signature' };
        }
      }

      const eventType = determineEventType(payload);
      const eventData = this.normalizeEventData(payload, eventType);
      const deviceId = resolveDeviceId(payload, eventData);
      const timestamp = resolveTimestamp(payload, eventData);

      const webhookPayload: WhatsAppWebhookPayload = {
        tenantId,
        endpointId,
        deviceId,
        event: eventType,
        data: eventData,
        timestamp,
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

  private normalizeEventData(
    raw: Record<string, any>,
    eventType: WhatsAppWebhookPayload['event']
  ): Record<string, any> {
    if (eventType === 'status' && raw?.payload) {
      return raw;
    }
    return raw;
  }

  private async routeWebhook(payload: WhatsAppWebhookPayload): Promise<void> {
    switch (payload.event) {
      case 'message':
        await this.messageHandler.handle(payload);
        break;
      case 'status':
        await this.statusHandler.handle(payload);
        break;
      case 'device_status':
        await this.deviceHandler.handleDeviceStatus(payload);
        break;
      case 'qr_code':
        await this.deviceHandler.handleQRCode(payload);
        break;
      case 'pairing_code':
        await this.deviceHandler.handlePairingCode(payload);
        break;
      case 'group':
        await this.deviceHandler.handleGroup(payload);
        break;
      default:
        console.warn('Unknown webhook event type:', payload.event);
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
      if (!config || !config.endpoint) {
        return false;
      }

      if (config.endpoint.id !== endpointId || !config.endpoint.webhookSecret) {
        return false;
      }

      const endpoint = config.endpoint;

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

  // Public API methods
  async getTenantConversations(tenantId: string): Promise<WhatsAppConversation[]> {
    return this.conversationStore.getByTenant(tenantId);
  }

  async getConversationMessages(
    tenantId: string,
    conversationId: string,
    limit = 100,
    offset = 0
  ): Promise<WhatsAppMessage[]> {
    return this.messageStore.getByConversation(tenantId, conversationId, limit, offset);
  }

  async getHistoricalMessages(
    tenantId: string,
    conversationId: string,
    limit = 100,
    offset = 0
  ): Promise<WhatsAppMessage[]> {
    return this.messageStore.getHistorical(tenantId, conversationId, limit, offset);
  }

  async markConversationRead(tenantId: string, conversationId: string): Promise<void> {
    return this.conversationStore.markRead(tenantId, conversationId);
  }

  async recordOutgoingMessage(
    tenantId: string,
    deviceId: string,
    customerPhone: string,
    options: {
      id: string;
      content: string;
      type?: WhatsAppMessage['type'];
      mediaUrl?: string;
      mediaCaption?: string;
      sentAt?: Date;
      metadata?: Record<string, any>;
      customerName?: string;
    }
  ): Promise<WhatsAppMessage> {
    return this.messageHandler.recordOutgoing(tenantId, deviceId, customerPhone, options);
  }

  async getTenantEvents(tenantId: string, limit = 100): Promise<WhatsAppEvent[]> {
    return this.eventStore.getByTenant(tenantId, limit);
  }

  async retryFailedWebhook(
    tenantId: string,
    endpointId: string,
    payload: WhatsAppWebhookPayload,
    attempt = 1
  ): Promise<void> {
    const maxRetries = 3;
    const retryDelay = Math.pow(2, attempt) * 1000;

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
