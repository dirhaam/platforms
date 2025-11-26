import { WhatsAppConversation } from '@/types/whatsapp';
import {
  kvAddToSet,
  kvGet,
  kvGetSet,
  kvSet,
} from '@/lib/cache/key-value-store';
import { normalizeConversation } from '../utils/normalizers';

export class ConversationStore {
  private static instance: ConversationStore;

  static getInstance(): ConversationStore {
    if (!ConversationStore.instance) {
      ConversationStore.instance = new ConversationStore();
    }
    return ConversationStore.instance;
  }

  async getById(conversationId: string): Promise<WhatsAppConversation | null> {
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

  async createOrUpdate(
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

      const conversationsKey = `whatsapp:conversations:${tenantId}`;
      await kvAddToSet(conversationsKey, conversation.id);

      return conversation;
    } catch (error) {
      console.error('Error creating/updating conversation:', error);
      throw error;
    }
  }

  async update(
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

  async getByTenant(tenantId: string): Promise<WhatsAppConversation[]> {
    try {
      const conversationsKey = `whatsapp:conversations:${tenantId}`;
      const conversationIds = await kvGetSet(conversationsKey);

      const conversations = await Promise.all(
        conversationIds.map((id: string) => this.getById(id))
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

  async markRead(tenantId: string, conversationId: string): Promise<void> {
    try {
      const conversation = await this.getById(conversationId);
      if (!conversation || conversation.tenantId !== tenantId) {
        return;
      }

      await this.update(conversationId, {
        unreadCount: 0,
      });
    } catch (error) {
      console.error('Error marking conversation read:', error);
    }
  }
}
