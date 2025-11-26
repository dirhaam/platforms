import { WhatsAppMessage, WhatsAppWebhookPayload, WhatsAppEvent } from '@/types/whatsapp';
import { ConversationStore } from '../stores/conversation-store';
import { MessageStore } from '../stores/message-store';
import { EventStore } from '../stores/event-store';
import { normalizePhone, getMessagePreview } from '../utils/normalizers';
import {
  resolveChatIdentifier,
  isMessageFromMe,
  extractMessageDetails,
  resolveMessageId,
  resolveMessageTimestamp,
} from '../utils/message-parser';

export class MessageWebhookHandler {
  private static instance: MessageWebhookHandler;
  private conversationStore: ConversationStore;
  private messageStore: MessageStore;
  private eventStore: EventStore;

  constructor() {
    this.conversationStore = ConversationStore.getInstance();
    this.messageStore = MessageStore.getInstance();
    this.eventStore = EventStore.getInstance();
  }

  static getInstance(): MessageWebhookHandler {
    if (!MessageWebhookHandler.instance) {
      MessageWebhookHandler.instance = new MessageWebhookHandler();
    }
    return MessageWebhookHandler.instance;
  }

  async handle(payload: WhatsAppWebhookPayload): Promise<void> {
    try {
      const messageData = payload.data;
      const identifiers = resolveChatIdentifier(messageData);

      if (!identifiers) {
        console.warn('Message webhook missing chat identifier');
        return;
      }

      const normalizedPhone = normalizePhone(identifiers.chatId);
      const fromMe = isMessageFromMe(messageData);
      const conversation = await this.conversationStore.createOrUpdate(
        payload.tenantId,
        normalizedPhone,
        identifiers.customerName
      );

      const messageDetails = extractMessageDetails(messageData);
      const messageId = resolveMessageId(messageData);
      const sentAt = resolveMessageTimestamp(messageData, payload.timestamp);

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

      await this.messageStore.store(message);

      const conversationMetadata = {
        ...(conversation.metadata || {}),
        chatId: identifiers.chatId,
        senderId: identifiers.senderId || (conversation.metadata?.senderId as string | undefined),
        pushname: identifiers.customerName || conversation.metadata?.pushname,
      };

      const unreadCount = !fromMe ? conversation.unreadCount + 1 : conversation.unreadCount;

      await this.conversationStore.update(conversation.id, {
        customerName: identifiers.customerName || conversation.customerName,
        lastMessageAt: message.sentAt,
        lastMessagePreview: getMessagePreview(message),
        unreadCount,
        metadata: conversationMetadata,
      });

      await this.eventStore.emit({
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

  async recordOutgoing(
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
    const normalizedPhone = normalizePhone(customerPhone);
    const conversation = await this.conversationStore.createOrUpdate(
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

    await this.messageStore.store(message);

    await this.conversationStore.update(conversation.id, {
      customerName: options.customerName || conversation.customerName,
      lastMessageAt: sentAt,
      lastMessagePreview: getMessagePreview(message),
      unreadCount: conversation.unreadCount,
      metadata: {
        ...(conversation.metadata || {}),
        chatId: customerPhone,
      },
    });

    await this.eventStore.emit({
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
}
