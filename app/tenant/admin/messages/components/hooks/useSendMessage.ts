'use client';

import { useState, useCallback } from 'react';
import { Message, Conversation } from '../types';

interface SendMessageOptions {
  tenantId: string;
  conversation: Conversation;
  messageInput: string;
  attachment: File | null;
}

export function useSendMessage() {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async ({
    tenantId,
    conversation,
    messageInput,
    attachment,
  }: SendMessageOptions): Promise<Message | null> => {
    const isTextOnly = !attachment;
    if (isTextOnly && !messageInput.trim()) return null;

    try {
      setSending(true);
      setError(null);

      let response: Response;
      if (attachment) {
        const form = new FormData();
        form.append('tenantId', tenantId);
        form.append('customerPhone', conversation.chatId || conversation.phone);
        const mime = attachment.type || '';
        const type = mime.startsWith('image/')
          ? 'image'
          : mime.startsWith('video/')
            ? 'video'
            : mime.startsWith('audio/')
              ? 'audio'
              : 'document';
        form.append('type', type);
        if (messageInput.trim()) form.append('caption', messageInput.trim());
        form.append('filename', attachment.name);
        form.append('mimeType', attachment.type);
        form.append('file', attachment);

        response = await fetch('/api/whatsapp/messages', {
          method: 'POST',
          body: form,
        });
      } else {
        const payload = {
          tenantId,
          customerPhone: conversation.chatId || conversation.phone,
          message: messageInput.trim(),
          type: 'text' as const,
        };
        response = await fetch('/api/whatsapp/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to send message');
      }

      const data = await response.json();
      const message = data.message;
      const sentAt = message.sentAt ? new Date(message.sentAt) : new Date();

      return {
        id: message.id,
        content: message.content || messageInput.trim() || `[${message.type}]`,
        timestamp: sentAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFromMe: !message.isFromCustomer,
        status: (message.deliveryStatus as Message['status']) || 'sent',
        type: message.type as Message['type'],
        mediaUrl: message.mediaUrl || undefined,
        mediaCaption: message.mediaCaption || undefined,
      };
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message.');
      return null;
    } finally {
      setSending(false);
    }
  }, []);

  const startNewChat = useCallback(async (tenantId: string, phone: string) => {
    try {
      setError(null);
      const payload = {
        tenantId,
        customerPhone: phone.trim(),
        message: 'Hello! How can we help you today?',
      };

      const response = await fetch('/api/whatsapp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to start new chat');
      }

      return true;
    } catch (err) {
      console.error('Error starting new chat:', err);
      setError(err instanceof Error ? err.message : 'Failed to start new chat.');
      return false;
    }
  }, []);

  return {
    sending,
    error,
    setError,
    sendMessage,
    startNewChat,
  };
}
