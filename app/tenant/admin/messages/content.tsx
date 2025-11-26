'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { AdminPageHeader } from '@/components/tenant/AdminPageHeader';
import { MessageCircle } from 'lucide-react';

import {
  Conversation,
  useConversations,
  useMessages,
  useSendMessage,
  ConversationList,
  MessageThread,
  LogsDialog,
  NewChatDialog,
} from './components';

export function MessagesContent() {
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain');

  const [tenantId, setTenantId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [logFilter, setLogFilter] = useState('all');
  const [logCategories, setLogCategories] = useState<Record<string, number>>({});
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState('');

  const {
    conversations,
    selectedConversation,
    setSelectedConversation,
    loading,
    error: conversationsError,
    setError: setConversationsError,
    fetchConversations,
    updateConversationUnread,
    addOrUpdateConversation,
  } = useConversations();

  const {
    messages,
    messagesLoading,
    loadingHistory,
    hasHistoricalData,
    error: messagesError,
    fetchMessages,
    loadHistory,
    addMessage,
    resetHistoricalData,
  } = useMessages();

  const {
    sending,
    error: sendError,
    setError: setSendError,
    sendMessage,
    startNewChat,
  } = useSendMessage();

  const error = conversationsError || messagesError || sendError;

  const setError = useCallback((msg: string | null) => {
    setConversationsError(msg);
  }, [setConversationsError]);

  // Reset historical data when switching conversations
  useEffect(() => {
    resetHistoricalData();
  }, [selectedConversation?.id, resetHistoricalData]);

  // Resolve tenant
  useEffect(() => {
    if (!subdomain) return;

    const resolveTenant = async () => {
      try {
        setError(null);
        const response = await fetch(`/api/tenants/${subdomain}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || 'Tenant not found.');
        }
        const data = await response.json();
        setTenantId(data.id);
        await fetchConversations(data.id);
      } catch (err) {
        console.error('Error resolving tenant:', err);
        setTenantId('');
        setError(err instanceof Error ? err.message : 'Failed to resolve tenant.');
      }
    };

    resolveTenant();
  }, [subdomain, fetchConversations, setError]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!tenantId || !selectedConversation?.id) return;
    const jid = selectedConversation.chatId || selectedConversation.id;
    fetchMessages(tenantId, jid).then((result) => {
      if (result?.conversationId) {
        updateConversationUnread(result.conversationId, 0);
      }
    });
  }, [tenantId, selectedConversation?.id, selectedConversation?.chatId, fetchMessages, updateConversationUnread]);

  const handleSelectConversation = useCallback((conv: Conversation) => {
    setSelectedConversation(conv);
    const jid = conv.chatId || conv.id;
    if (tenantId && jid) {
      fetchMessages(tenantId, jid);
    }
  }, [setSelectedConversation, tenantId, fetchMessages]);

  const handleSendMessage = useCallback(async () => {
    if (!selectedConversation || !tenantId) return;

    const newMessage = await sendMessage({
      tenantId,
      conversation: selectedConversation,
      messageInput,
      attachment,
    });

    if (newMessage) {
      addMessage(newMessage);

      const recipientJid = selectedConversation.chatId
        || (selectedConversation.phone.includes('@')
          ? selectedConversation.phone
          : `${selectedConversation.phone}@s.whatsapp.net`);
      const kind = recipientJid.toLowerCase().endsWith('@g.us') ? 'group' : 'p2p';
      const nowStr = new Date().toLocaleString();

      const updatedConv: Conversation = {
        id: recipientJid,
        phone: selectedConversation.phone,
        chatId: recipientJid,
        kind,
        customerName: selectedConversation.customerName || selectedConversation.phone,
        lastMessage: newMessage.content,
        lastMessageTime: nowStr,
        unreadCount: 0,
        status: 'active',
        metadata: { ...(selectedConversation.metadata || {}), chatId: recipientJid },
      };

      addOrUpdateConversation(updatedConv);
      setSelectedConversation(updatedConv);
      setMessageInput('');
      if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
      setAttachment(null);
      setAttachmentPreview(null);

      fetchConversations(tenantId, { silent: true });
      fetchMessages(tenantId, recipientJid);
    }
  }, [
    selectedConversation, tenantId, messageInput, attachment, attachmentPreview,
    sendMessage, addMessage, addOrUpdateConversation, setSelectedConversation,
    fetchConversations, fetchMessages
  ]);

  const handleLoadHistory = useCallback(() => {
    if (!selectedConversation || !tenantId) return;
    loadHistory(tenantId, selectedConversation.id);
  }, [selectedConversation, tenantId, loadHistory]);

  const handleShowLogs = useCallback(async () => {
    if (!tenantId) return;
    try {
      setError(null);
      const response = await fetch(`/api/whatsapp/logs?tenantId=${tenantId}&filter=${logFilter}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to fetch logs');
      }
      const data = await response.json();
      setLogs(data.logs || []);
      setLogCategories(data.categories || {});
      setShowLogs(true);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load logs.');
    }
  }, [tenantId, logFilter, setError]);

  const handleLogFilterChange = useCallback(async (newFilter: string) => {
    setLogFilter(newFilter);
    if (!tenantId) return;
    try {
      setError(null);
      const response = await fetch(`/api/whatsapp/logs?tenantId=${tenantId}&filter=${newFilter}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to fetch logs');
      }
      const data = await response.json();
      setLogs(data.logs || []);
      setLogCategories(data.categories || {});
    } catch (err) {
      console.error('Error filtering logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to filter logs.');
    }
  }, [tenantId, setError]);

  const handleStartNewChat = useCallback(async () => {
    if (!newChatPhone.trim() || !tenantId) return;

    const success = await startNewChat(tenantId, newChatPhone);
    if (success) {
      setShowNewChatDialog(false);
      const jid = newChatPhone.includes('@')
        ? newChatPhone.trim()
        : `${newChatPhone.trim()}@s.whatsapp.net`;
      const kind = jid.toLowerCase().endsWith('@g.us') ? 'group' : 'p2p';

      const newConv: Conversation = {
        id: jid,
        phone: newChatPhone.trim(),
        chatId: jid,
        kind,
        customerName: newChatPhone.trim(),
        lastMessage: 'Hello! How can we help you today?',
        lastMessageTime: new Date().toLocaleString(),
        unreadCount: 0,
        status: 'active',
        metadata: { chatId: jid },
      };

      addOrUpdateConversation(newConv);
      setSelectedConversation(newConv);
      setNewChatPhone('');
      fetchConversations(tenantId, { silent: true });
      fetchMessages(tenantId, jid);
    }
  }, [newChatPhone, tenantId, startNewChat, addOrUpdateConversation, setSelectedConversation, fetchConversations, fetchMessages]);

  if (!subdomain) return null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Messages"
        description="WhatsApp conversations and communications"
      />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100dvh-140px)] overflow-hidden">
        <ConversationList
          conversations={conversations}
          selectedConversation={selectedConversation}
          searchQuery={searchQuery}
          loading={loading}
          onSearchChange={setSearchQuery}
          onSelectConversation={handleSelectConversation}
        />

        {selectedConversation ? (
          <MessageThread
            conversation={selectedConversation}
            messages={messages}
            messagesLoading={messagesLoading}
            loadingHistory={loadingHistory}
            hasHistoricalData={hasHistoricalData}
            sending={sending}
            messageInput={messageInput}
            attachment={attachment}
            attachmentPreview={attachmentPreview}
            onMessageInputChange={setMessageInput}
            onSendMessage={handleSendMessage}
            onLoadHistory={handleLoadHistory}
            onShowLogs={handleShowLogs}
            onShowNewChatDialog={() => setShowNewChatDialog(true)}
            onAttachmentChange={setAttachment}
            onAttachmentPreviewChange={setAttachmentPreview}
          />
        ) : (
          <Card className="col-span-1 lg:col-span-2 flex items-center justify-center border-none shadow-sm">
            <CardContent className="text-center">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Select a conversation to start messaging</p>
            </CardContent>
          </Card>
        )}

        <LogsDialog
          open={showLogs}
          logs={logs}
          logFilter={logFilter}
          logCategories={logCategories}
          onClose={() => setShowLogs(false)}
          onFilterChange={handleLogFilterChange}
        />

        <NewChatDialog
          open={showNewChatDialog}
          phone={newChatPhone}
          onClose={() => setShowNewChatDialog(false)}
          onPhoneChange={setNewChatPhone}
          onStartChat={handleStartNewChat}
        />
      </div>
    </div>
  );
}
