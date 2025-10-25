import {
  WhatsAppWebhookPayload,
  WhatsAppMessage,
  WhatsAppConversation,
  WhatsAppEvent,
} from '@/types/whatsapp';
import { WhatsAppDeviceManager } from './device-manager';
import { WhatsAppEndpointManager } from './simplified-endpoint-manager';
import {
  kvAddToSet,
  kvExpire,
  kvGet,
  kvGetList,
  kvGetSet,
  kvPushToList,
  kvSet,
} from '@/lib/cache/key-value-store';

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

const normalizeConversation = (data: WhatsAppConversation | null): WhatsAppConversation | null => {
  if (!data) {
    return null;
  }

  return {
    ...data,
    lastMessageAt: new Date(data.lastMessageAt),
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
};

const normalizeMessage = (data: WhatsAppMessage | null): WhatsAppMessage | null => {
  if (!data) {
    return null;
  }

  return {
    ...data,
    sentAt: new Date(data.sentAt),
    deliveredAt: data.deliveredAt ? new Date(data.deliveredAt) : undefined,
    readAt: data.readAt ? new Date(data.readAt) : undefined,
  };
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

      const eventType = this.determineEventType(payload);
      const eventData = this.normalizeEventData(payload, eventType);
      const deviceId = this.resolveDeviceId(payload, eventData);
      const timestamp = this.resolveTimestamp(payload, eventData);

      // Route webhook based on event type
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

  private determineEventType(raw: Record<string, any>): WhatsAppWebhookPayload['event'] {
    const explicitEvent = raw?.event || raw?.type;
    if (explicitEvent === 'message.ack') {
      return 'status';
    }
    if (explicitEvent === 'group.participants') {
      return 'group';
    }
    if (explicitEvent === 'device_status') {
      return 'device_status';
    }
    if (explicitEvent === 'qr_code') {
      return 'qr_code';
    }
    if (explicitEvent === 'pairing_code') {
      return 'pairing_code';
    }

    if (raw?.receipt_type || raw?.payload?.receipt_type) {
      return 'status';
    }

    if (raw?.qrCode || raw?.qr_code) {
      return 'qr_code';
    }

    if (raw?.pairingCode || raw?.pairing_code) {
      return 'pairing_code';
    }

    if (raw?.status === 'connected' || raw?.status === 'disconnected') {
      return 'device_status';
    }

    if (
      raw?.message ||
      raw?.text ||
      raw?.image ||
      raw?.video ||
      raw?.audio ||
      raw?.document ||
      raw?.sticker ||
      raw?.location ||
      raw?.contact ||
      raw?.reaction ||
      raw?.forwarded ||
      raw?.action
    ) {
      return 'message';
    }

    return 'message';
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

  private resolveDeviceId(raw: Record<string, any>, data: Record<string, any>): string {
    const candidates = [
      raw?.deviceId,
      raw?.device_id,
      data?.deviceId,
      data?.device_id,
      data?.payload?.deviceId,
      data?.payload?.device_id,
    ];

    const deviceId = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
    return deviceId ? String(deviceId) : 'unknown-device';
  }

  private resolveTimestamp(raw: Record<string, any>, data: Record<string, any>): Date {
    const timestampValue =
      raw?.timestamp ||
      data?.timestamp ||
      data?.payload?.timestamp;

    if (typeof timestampValue === 'string' || typeof timestampValue === 'number') {
      const parsed = new Date(timestampValue);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return new Date();
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
      case 'group':
        await this.handleGroupWebhook(payload);
        break;
      default:
        console.warn('Unknown webhook event type:', payload.event);
    }
  }

  private async handleMessageWebhook(payload: WhatsAppWebhookPayload): Promise<void> {
    try {
      const messageData = payload.data;
      const identifiers = this.resolveChatIdentifier(messageData);

      if (!identifiers) {
        console.warn('Message webhook missing chat identifier');
        return;
      }

      const normalizedPhone = this.normalizePhone(identifiers.chatId);
      const fromMe = this.isMessageFromMe(messageData);
      const conversation = await this.createOrUpdateConversation(
        payload.tenantId,
        normalizedPhone,
        identifiers.customerName
      );

      const messageDetails = this.extractMessageDetails(messageData);
      const messageId = this.resolveMessageId(messageData);
      const sentAt = this.resolveMessageTimestamp(messageData, payload.timestamp);

      const message: WhatsAppMessage = {
        id: messageId,
        tenantId: payload.tenantId,
        deviceId: payload.deviceId,
        conversationId: conversation.id,
        type: messageDetails.type,
        content: messageDetails.content,
        mediaUrl: messageDetails.mediaUrl,
        mediaCaption: messageDetails.mediaCaption,
        isFromCustomer: !fromMe,
        customerPhone: normalizedPhone,
        deliveryStatus: fromMe ? 'sent' : 'delivered',
        metadata: {
          ...messageDetails.metadata,
          raw: messageData,
        },
        sentAt,
      };

      await this.storeMessage(message);

      const conversationMetadata = {
        ...(conversation.metadata || {}),
        chatId: identifiers.chatId,
        senderId: identifiers.senderId || (conversation.metadata?.senderId as string | undefined),
        pushname: identifiers.customerName || conversation.metadata?.pushname,
      };

      const unreadCount = !fromMe ? conversation.unreadCount + 1 : conversation.unreadCount;

      await this.updateConversation(conversation.id, {
        customerName: identifiers.customerName || conversation.customerName,
        lastMessageAt: message.sentAt,
        lastMessagePreview: this.getMessagePreview(message),
        unreadCount,
        metadata: conversationMetadata,
      });

      await this.emitEvent({
        type: fromMe ? 'message_sent' : 'message_received',
        tenantId: payload.tenantId,
        deviceId: payload.deviceId,
        data: {
          messageId: message.id,
          conversationId: conversation.id,
          customerPhone: message.customerPhone,
          content: message.content,
          type: message.type,
        },
        timestamp: message.sentAt,
      });
    } catch (error) {
      console.error('Error handling message webhook:', error);
    }
  }

  private async handleStatusWebhook(payload: WhatsAppWebhookPayload): Promise<void> {
    try {
      const statusSource = payload.data?.payload ? payload.data.payload : payload.data;
      const messageIds: string[] = Array.isArray(statusSource?.ids)
        ? statusSource.ids.filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
        : [];

      const fallbackId = statusSource?.id || statusSource?.messageId || payload.data?.messageId || payload.data?.id;
      if (!messageIds.length && typeof fallbackId === 'string') {
        messageIds.push(fallbackId);
      }

      if (!messageIds.length) {
        console.warn('Status webhook missing message IDs');
        return;
      }

      const receiptType = statusSource?.receipt_type || statusSource?.status;
      let normalizedStatus: WhatsAppMessage['deliveryStatus'] = 'sent';
      if (receiptType === 'delivered') {
        normalizedStatus = 'delivered';
      } else if (receiptType === 'read') {
        normalizedStatus = 'read';
      }

      const timestamp = statusSource?.timestamp
        ? new Date(statusSource.timestamp)
        : payload.timestamp;

      await Promise.all(
        messageIds.map((id: string) => this.updateMessageStatus(id, normalizedStatus, timestamp))
      );

      const eventType: WhatsAppEvent['type'] =
        normalizedStatus === 'delivered'
          ? 'message_delivered'
          : normalizedStatus === 'read'
            ? 'message_read'
            : 'message_sent';

      await this.emitEvent({
        type: eventType,
        tenantId: payload.tenantId,
        deviceId: payload.deviceId,
        data: {
          messageIds,
          status: normalizedStatus,
          timestamp,
        },
        timestamp,
      });
    } catch (error) {
      console.error('Error handling status webhook:', error);
    }
  }

  private resolveChatIdentifier(messageData: Record<string, any>): {
    chatId: string;
    senderId?: string;
    customerName?: string;
  } | null {
    const chatId = messageData?.chat_id || messageData?.chatId || messageData?.from || messageData?.sender_id;
    if (!chatId) {
      return null;
    }

    return {
      chatId: String(chatId),
      senderId: messageData?.sender_id ? String(messageData.sender_id) : undefined,
      customerName:
        messageData?.pushname ||
        messageData?.fromName ||
        messageData?.customerName ||
        undefined,
    };
  }

  private normalizePhone(identifier: string): string {
    const trimmed = identifier.trim();
    const withoutDomain = trimmed.replace(/@.+$/, '');
    return withoutDomain || trimmed;
  }

  private isMessageFromMe(messageData: Record<string, any>): boolean {
    return (
      messageData?.from_me === true ||
      messageData?.fromMe === true ||
      messageData?.message?.from_me === true ||
      messageData?.message?.fromMe === true
    );
  }

  private extractMessageDetails(messageData: Record<string, any>): {
    type: WhatsAppMessage['type'];
    content: string;
    mediaUrl?: string;
    mediaCaption?: string;
    metadata: Record<string, any>;
  } {
    const metadata: Record<string, any> = {};
    let type: WhatsAppMessage['type'] = 'text';
    let content = '';
    let mediaUrl: string | undefined;
    let mediaCaption: string | undefined;

    const textContent =
      messageData?.message?.text ||
      messageData?.text ||
      messageData?.body ||
      '';

    if (messageData?.image) {
      type = 'image';
      mediaUrl = messageData.image.media_path || messageData.image.url;
      mediaCaption = messageData.image.caption;
      content = mediaCaption || '[Image]';
      metadata.image = messageData.image;
    } else if (messageData?.video) {
      type = 'video';
      mediaUrl = messageData.video.media_path || messageData.video.url;
      mediaCaption = messageData.video.caption;
      content = mediaCaption || '[Video]';
      metadata.video = messageData.video;
    } else if (messageData?.audio) {
      type = 'audio';
      mediaUrl = messageData.audio.media_path || messageData.audio.url;
      content = messageData.audio.caption || '[Audio]';
      metadata.audio = messageData.audio;
    } else if (messageData?.document) {
      type = 'document';
      mediaUrl = messageData.document.media_path || messageData.document.url;
      mediaCaption = messageData.document.caption;
      content = mediaCaption || '[Document]';
      metadata.document = messageData.document;
    } else if (messageData?.sticker) {
      type = 'sticker';
      mediaUrl = messageData.sticker.media_path || messageData.sticker.url;
      content = '[Sticker]';
      metadata.sticker = messageData.sticker;
    } else if (messageData?.location) {
      type = 'location';
      const name = messageData.location.name || messageData.location.address;
      content = name ? `Location: ${name}` : 'Location shared';
      metadata.location = messageData.location;
    } else if (messageData?.contact) {
      type = 'contact';
      const displayName = messageData.contact.displayName || messageData.contact.name;
      content = displayName ? `Contact: ${displayName}` : 'Contact shared';
      metadata.contact = messageData.contact;
    } else if (messageData?.reaction) {
      type = 'text';
      content = `Reaction: ${messageData.reaction.message || ''}`.trim();
      metadata.reaction = messageData.reaction;
    } else if (textContent) {
      type = 'text';
      content = textContent;
    } else if (messageData?.action) {
      type = 'text';
      content = `[Action] ${messageData.action}`;
    } else {
      content = '[Message]';
    }

    if (!content) {
      content = '[Message]';
    }

    return {
      type,
      content,
      mediaUrl,
      mediaCaption,
      metadata,
    };
  }

  private resolveMessageId(messageData: Record<string, any>): string {
    return (
      messageData?.message?.id ||
      messageData?.id ||
      messageData?.message_id ||
      `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    );
  }

  private resolveMessageTimestamp(
    messageData: Record<string, any>,
    fallback: Date
  ): Date {
    const candidate =
      messageData?.timestamp ||
      messageData?.message?.timestamp;

    if (typeof candidate === 'string' || typeof candidate === 'number') {
      const parsed = new Date(candidate);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return fallback;
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

  private async handleGroupWebhook(payload: WhatsAppWebhookPayload): Promise<void> {
    try {
      await this.emitEvent({
        type: 'message_received',
        tenantId: payload.tenantId,
        deviceId: payload.deviceId,
        data: {
          event: 'group',
          payload: payload.data,
        },
        timestamp: payload.timestamp,
      });
    } catch (error) {
      console.error('Error handling group webhook:', error);
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
      if (!config || !config.endpoint) {
        return false;
      }

      // Simplified: each tenant has exactly one endpoint
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

  private async getConversationById(conversationId: string): Promise<WhatsAppConversation | null> {
    try {
      const indexKey = `whatsapp:conversation:index:${conversationId}`;
      const conversationKey = await kvGet<string>(indexKey);
      if (!conversationKey) {
        return null;
      }

      const conversation = await kvGet<WhatsAppConversation>(conversationKey);
      return normalizeConversation(conversation);
    } catch (error) {
      console.error('Error getting conversation by ID:', error);
      return null;
    }
  }

  private async createOrUpdateConversation(
    tenantId: string, 
    customerPhone: string, 
    customerName?: string
  ): Promise<WhatsAppConversation> {
    try {
      const conversationKey = `whatsapp:conversation:${tenantId}:${customerPhone}`;
      const existingData = await kvGet<WhatsAppConversation>(conversationKey);

      if (existingData) {
        const conversation = normalizeConversation(existingData);
        if (conversation) {
          const indexKey = `whatsapp:conversation:index:${conversation.id}`;
          await kvSet(indexKey, conversationKey);
          return conversation;
        }
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

      await kvSet(conversationKey, conversation);
      const indexKey = `whatsapp:conversation:index:${conversation.id}`;
      await kvSet(indexKey, conversationKey);
      
      // Add to tenant conversations list
      const conversationsKey = `whatsapp:conversations:${tenantId}`;
      await kvAddToSet(conversationsKey, conversation.id);

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
      const indexKey = `whatsapp:conversation:index:${conversationId}`;
      const conversationKey = await kvGet<string>(indexKey);

      if (!conversationKey) {
        return;
      }

      const existing = await kvGet<WhatsAppConversation>(conversationKey);
      if (!existing) {
        return;
      }

      const updatedConversation: WhatsAppConversation = {
        ...existing,
        ...updates,
        updatedAt: new Date(),
      };

      await kvSet(conversationKey, updatedConversation);
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
  }

  private async storeMessage(message: WhatsAppMessage): Promise<void> {
    try {
      const messageKey = `whatsapp:message:${message.id}`;
      await kvSet(messageKey, message);

      // Add to conversation messages list
      const conversationMessagesKey = `whatsapp:messages:${message.conversationId}`;
      await kvPushToList(conversationMessagesKey, message.id, 1000);
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
      const messageData = await kvGet<WhatsAppMessage>(messageKey);

      const message = normalizeMessage(messageData);
      if (!message) {
        return;
      }

      const updates: Partial<WhatsAppMessage> = {
        deliveryStatus: status as WhatsAppMessage['deliveryStatus'],
      };

      if (status === 'delivered') {
        updates.deliveredAt = timestamp;
      } else if (status === 'read') {
        updates.readAt = timestamp;
      }

      const updatedMessage: WhatsAppMessage = {
        ...message,
        ...updates,
      };

      await kvSet(messageKey, updatedMessage);
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  }

  async getTenantConversations(tenantId: string): Promise<WhatsAppConversation[]> {
    try {
      const conversationsKey = `whatsapp:conversations:${tenantId}`;
      const conversationIds = await kvGetSet(conversationsKey);

      const conversations = await Promise.all(
        conversationIds.map((id: string) => this.getConversationById(id))
      );

      return conversations
        .filter((conv: WhatsAppConversation | null): conv is WhatsAppConversation => conv !== null)
        .sort(
          (a: WhatsAppConversation, b: WhatsAppConversation) =>
            b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
        );
    } catch (error) {
      console.error('Error getting tenant conversations:', error);
      return [];
    }
  }

  async getConversationMessages(
    tenantId: string,
    conversationId: string,
    limit = 100,
    offset = 0
  ): Promise<WhatsAppMessage[]> {
    try {
      const conversation = await this.getConversationById(conversationId);
      if (!conversation || conversation.tenantId !== tenantId) {
        return [];
      }

      const messagesKey = `whatsapp:messages:${conversationId}`;
      const messageIds = await kvGetList<string>(messagesKey, offset, limit + offset - 1);

      const messages = await Promise.all(
        messageIds.map(async (id: string) => {
          const messageData = await kvGet<WhatsAppMessage>(`whatsapp:message:${id}`);
          return normalizeMessage(messageData);
        })
      );

      return messages
        .filter((msg): msg is WhatsAppMessage => msg !== null)
        .sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      return [];
    }
  }

  async getHistoricalMessages(
    tenantId: string,
    conversationId: string,
    limit = 100,
    offset = 0
  ): Promise<WhatsAppMessage[]> {
    try {
      // Try to load from legacy webhook events or stored historical data
      const historicalEventsKey = `whatsapp:historical:events:${tenantId}:${conversationId}`;
      const eventIds = await kvGetList<string>(historicalEventsKey, offset, limit + offset - 1);

      if (eventIds.length === 0) {
        // If no historical events found, try to load from legacy database
        return await this.loadLegacyMessages(tenantId, conversationId, limit, offset);
      }

      const messages = await Promise.all(
        eventIds.map(async (eventId: string) => {
          const eventData = await kvGet<any>(`whatsapp:historical:event:${eventId}`);
          if (eventData && eventData.type === 'message') {
            return this.convertWebhookEventToMessage(eventData, conversationId);
          }
          return null;
        })
      );

      return messages
        .filter((msg): msg is WhatsAppMessage => msg !== null)
        .sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
    } catch (error) {
      console.error('Error getting historical messages:', error);
      return [];
    }
  }

  private async loadLegacyMessages(
    tenantId: string,
    conversationId: string,
    limit = 100,
    offset = 0
  ): Promise<WhatsAppMessage[]> {
    try {
      // This would integrate with the migration script to load legacy messages
      // For now, return empty array as placeholder
      console.log(`Loading legacy messages for tenant ${tenantId}, conversation ${conversationId}`);
      return [];
    } catch (error) {
      console.error('Error loading legacy messages:', error);
      return [];
    }
  }

  private convertWebhookEventToMessage(eventData: any, conversationId: string): WhatsAppMessage | null {
    try {
      const messageData = eventData.data || eventData;
      const identifiers = this.resolveChatIdentifier(messageData);
      
      if (!identifiers) {
        return null;
      }

      const normalizedPhone = this.normalizePhone(identifiers.chatId);
      const fromMe = this.isMessageFromMe(messageData);
      const messageDetails = this.extractMessageDetails(messageData);
      const messageId = this.resolveMessageId(messageData);
      const sentAt = this.resolveMessageTimestamp(messageData, new Date(eventData.timestamp));

      return {
        id: messageId,
        tenantId: eventData.tenantId,
        deviceId: eventData.deviceId || 'historical-device',
        conversationId,
        type: messageDetails.type,
        content: messageDetails.content,
        mediaUrl: messageDetails.mediaUrl,
        mediaCaption: messageDetails.mediaCaption,
        isFromCustomer: !fromMe,
        customerPhone: normalizedPhone,
        deliveryStatus: fromMe ? 'sent' : 'delivered',
        metadata: {
          ...messageDetails.metadata,
          historical: true,
          raw: messageData,
        },
        sentAt,
      };
    } catch (error) {
      console.error('Error converting webhook event to message:', error);
      return null;
    }
  }

  async markConversationRead(tenantId: string, conversationId: string): Promise<void> {
    try {
      const conversation = await this.getConversationById(conversationId);
      if (!conversation || conversation.tenantId !== tenantId) {
        return;
      }

      await this.updateConversation(conversationId, {
        unreadCount: 0,
      });
    } catch (error) {
      console.error('Error marking conversation read:', error);
    }
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
    const normalizedPhone = this.normalizePhone(customerPhone);
    const conversation = await this.createOrUpdateConversation(
      tenantId,
      normalizedPhone,
      options.customerName
    );

    const sentAt = options.sentAt ?? new Date();

    const message: WhatsAppMessage = {
      id: options.id,
      tenantId,
      deviceId,
      conversationId: conversation.id,
      type: options.type ?? 'text',
      content: options.content,
      mediaUrl: options.mediaUrl,
      mediaCaption: options.mediaCaption,
      isFromCustomer: false,
      customerPhone: normalizedPhone,
      deliveryStatus: 'sent',
      metadata: options.metadata ?? {},
      sentAt,
    };

    await this.storeMessage(message);

    await this.updateConversation(conversation.id, {
      customerName: options.customerName || conversation.customerName,
      lastMessageAt: sentAt,
      lastMessagePreview: this.getMessagePreview(message),
      unreadCount: conversation.unreadCount,
      metadata: {
        ...(conversation.metadata || {}),
        chatId: customerPhone,
      },
    });

    await this.emitEvent({
      type: 'message_sent',
      tenantId,
      deviceId,
      data: {
        messageId: message.id,
        conversationId: conversation.id,
        customerPhone: normalizedPhone,
        content: message.content,
        type: message.type,
      },
      timestamp: sentAt,
    });

    return message;
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
      await kvPushToList(eventKey, event, 1000);
      await kvExpire(eventKey, 3600); // 1 hour TTL

      // Also store in global events for platform monitoring
      const globalEventKey = 'whatsapp:events:global';
      await kvPushToList(globalEventKey, event, 10000);
    } catch (error) {
      console.error('Error emitting WhatsApp event:', error);
    }
  }

  async getTenantEvents(tenantId: string, limit = 100): Promise<WhatsAppEvent[]> {
    try {
      const eventKey = `whatsapp:events:${tenantId}`;
      const events = await kvGetList<WhatsAppEvent>(eventKey, 0, limit - 1);

      return events.map(event => ({
        ...event,
        timestamp: new Date(event.timestamp),
      }));
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