import { WhatsAppMessage } from '@/types/whatsapp';
import {
  kvGet,
  kvGetList,
  kvPushToList,
  kvSet,
} from '@/lib/cache/key-value-store';
import { normalizeMessage } from '../utils/normalizers';
import { ConversationStore } from './conversation-store';

export class MessageStore {
  private static instance: MessageStore;
  private conversationStore: ConversationStore;

  constructor() {
    this.conversationStore = ConversationStore.getInstance();
  }

  static getInstance(): MessageStore {
    if (!MessageStore.instance) {
      MessageStore.instance = new MessageStore();
    }
    return MessageStore.instance;
  }

  async store(message: WhatsAppMessage): Promise<void> {
    try {
      const messageKey = `whatsapp:message:${message.id}`;
      await kvSet(messageKey, message);

      const conversationMessagesKey = `whatsapp:messages:${message.conversationId}`;
      await kvPushToList(conversationMessagesKey, message.id, 1000);
    } catch (error) {
      console.error('Error storing message:', error);
    }
  }

  async updateStatus(
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

  async getByConversation(
    tenantId: string,
    conversationId: string,
    limit = 100,
    offset = 0
  ): Promise<WhatsAppMessage[]> {
    try {
      const conversation = await this.conversationStore.getById(conversationId);
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

  async getHistorical(
    tenantId: string,
    conversationId: string,
    limit = 100,
    offset = 0
  ): Promise<WhatsAppMessage[]> {
    try {
      const historicalEventsKey = `whatsapp:historical:events:${tenantId}:${conversationId}`;
      const eventIds = await kvGetList<string>(historicalEventsKey, offset, limit + offset - 1);

      if (eventIds.length === 0) {
        return await this.loadLegacy(tenantId, conversationId, limit, offset);
      }

      const messages = await Promise.all(
        eventIds.map(async (eventId: string) => {
          const eventData = await kvGet<any>(`whatsapp:historical:event:${eventId}`);
          if (eventData && eventData.type === 'message') {
            return this.convertEventToMessage(eventData, conversationId);
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

  private async loadLegacy(
    tenantId: string,
    conversationId: string,
    _limit = 100,
    _offset = 0
  ): Promise<WhatsAppMessage[]> {
    try {
      console.log(`Loading legacy messages for tenant ${tenantId}, conversation ${conversationId}`);
      return [];
    } catch (error) {
      console.error('Error loading legacy messages:', error);
      return [];
    }
  }

  private convertEventToMessage(eventData: any, conversationId: string): WhatsAppMessage | null {
    try {
      const { resolveChatIdentifier, isMessageFromMe, extractMessageDetails, resolveMessageId, resolveMessageTimestamp } = require('../utils/message-parser');
      const { normalizePhone } = require('../utils/normalizers');

      const messageData = eventData.data || eventData;
      const identifiers = resolveChatIdentifier(messageData);

      if (!identifiers) {
        return null;
      }

      const normalizedPhone = normalizePhone(identifiers.chatId);
      const fromMe = isMessageFromMe(messageData);
      const messageDetails = extractMessageDetails(messageData);
      const messageId = resolveMessageId(messageData);
      const sentAt = resolveMessageTimestamp(messageData, new Date(eventData.timestamp));

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
}
