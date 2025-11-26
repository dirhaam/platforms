'use client';

import { useState, useCallback } from 'react';
import { Message } from '../types';

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [hasHistoricalData, setHasHistoricalData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async (
    tenantId: string,
    conversationId: string,
    loadHistory = false
  ) => {
    if (!tenantId) return;

    try {
      setMessagesLoading(true);
      setError(null);

      const params = new URLSearchParams({
        tenantId,
        loadHistory: loadHistory.toString(),
        limit: '100'
      });

      const response = await fetch(
        `/api/whatsapp/messages/${encodeURIComponent(conversationId)}?${params}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to fetch messages');
      }

      const data = await response.json();

      const mapped: Message[] = (data.messages || []).map((message: any) => {
        const sentAt = message.sentAt ? new Date(message.sentAt) : new Date();
        return {
          id: message.id,
          content: message.content || `[${message.type}]`,
          timestamp: sentAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isFromMe: !message.isFromCustomer,
          status: (message.deliveryStatus as Message['status']) || 'sent',
          type: message.type as Message['type'],
          mediaUrl: message.mediaUrl || undefined,
          mediaCaption: message.mediaCaption || undefined,
        };
      });

      setMessages((prev) => (mapped.length > 0 ? mapped : prev));

      if (data.hasHistoricalData && data.totalMessages > mapped.length) {
        console.log(`Loaded ${mapped.length} messages with historical data`);
      }

      return { conversationId };
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages.');
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async (tenantId: string, conversationId: string) => {
    try {
      setLoadingHistory(true);
      setError(null);
      await fetchMessages(tenantId, conversationId, true);
      setHasHistoricalData(true);
    } catch (err) {
      console.error('Error loading historical messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load historical messages.');
    } finally {
      setLoadingHistory(false);
    }
  }, [fetchMessages]);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const resetHistoricalData = useCallback(() => {
    setHasHistoricalData(false);
  }, []);

  return {
    messages,
    messagesLoading,
    loadingHistory,
    hasHistoricalData,
    error,
    setError,
    fetchMessages,
    loadHistory,
    addMessage,
    resetHistoricalData,
  };
}
