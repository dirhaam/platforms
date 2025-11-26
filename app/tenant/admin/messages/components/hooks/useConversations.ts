'use client';

import { useState, useCallback } from 'react';
import { Conversation } from '../types';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async (tenantId: string, options?: { silent?: boolean }) => {
    if (!tenantId) return;

    const silent = options?.silent ?? false;

    try {
      if (!silent) setLoading(true);
      setError(null);

      const response = await fetch(`/api/whatsapp/messages?tenantId=${tenantId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to fetch conversations');
      }

      const data = await response.json();
      const mapped: Conversation[] = (data.conversations || []).map((conversation: any) => {
        const lastMessageAt = conversation.lastMessageAt
          ? new Date(conversation.lastMessageAt)
          : null;

        const jid = conversation.metadata?.chatId || (conversation.id?.includes('@')
          ? conversation.id
          : (conversation.customerPhone ? `${conversation.customerPhone}@s.whatsapp.net` : conversation.id));
        const lower = (jid || '').toLowerCase();
        const kind: Conversation['kind'] = lower.endsWith('@g.us') ? 'group' : 'p2p';

        return {
          id: jid,
          phone: conversation.customerPhone,
          chatId: jid,
          kind,
          customerName: conversation.customerName || conversation.customerPhone,
          lastMessage: conversation.lastMessagePreview || '',
          lastMessageTime: lastMessageAt ? lastMessageAt.toLocaleString() : '',
          unreadCount: conversation.unreadCount ?? 0,
          status: (conversation.status as Conversation['status']) || 'active',
          metadata: conversation.metadata,
        };
      });

      setConversations(mapped);
      setSelectedConversation((previous) => {
        if (!mapped.length) return null;
        if (!previous) return mapped[0];
        const existing = mapped.find((c) => c.id === previous.id);
        return existing ?? mapped[0];
      });
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversations.');
      setConversations([]);
      setSelectedConversation(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const updateConversationUnread = useCallback((conversationId: string, unreadCount: number) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unreadCount } : c))
    );
    setSelectedConversation((prev) =>
      prev && prev.id === conversationId ? { ...prev, unreadCount } : prev
    );
  }, []);

  const addOrUpdateConversation = useCallback((conv: Conversation) => {
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === conv.id || c.chatId === conv.chatId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...conv };
        return copy;
      }
      return [conv, ...prev];
    });
  }, []);

  return {
    conversations,
    selectedConversation,
    setSelectedConversation,
    loading,
    error,
    setError,
    fetchConversations,
    updateConversationUnread,
    addOrUpdateConversation,
    setConversations,
  };
}
