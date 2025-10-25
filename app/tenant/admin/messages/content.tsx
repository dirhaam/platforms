'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Send,
  Search,
  MoreVertical,
  Phone,
  CheckCheck,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';

interface Conversation {
  id: string;
  phone: string;
  chatId?: string;
  customerName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'active' | 'inactive' | 'archived' | 'blocked';
  metadata?: Record<string, any>;
}

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isFromMe: boolean;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contact' | 'sticker';
  mediaUrl?: string;
  mediaCaption?: string;
}

interface QuickReply {
  id: string;
  label: string;
  message: string;
}

const quickReplies: QuickReply[] = [
  {
    id: '1',
    label: 'Booking Confirmed',
    message: 'Thank you! Your booking has been confirmed. We look forward to serving you.',
  },
  {
    id: '2',
    label: 'Reminder',
    message: 'This is a reminder about your upcoming appointment. Please let us know if you need to reschedule.',
  },
  {
    id: '3',
    label: 'Follow Up',
    message: 'Thank you for visiting us! We hope you had a great experience. Your feedback is valuable to us.',
  },
  {
    id: '4',
    label: 'Cancellation',
    message: 'We understand. Your booking has been cancelled. Feel free to reach out if you change your mind.',
  },
];

export function MessagesContent() {
  const searchParams = useSearchParams();
  const subdomain = searchParams.get('subdomain');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [hasHistoricalData, setHasHistoricalData] = useState(false);

  const fetchConversations = useCallback(async (tenant: string, options?: { silent?: boolean }) => {
    if (!tenant) return;

    const silent = options?.silent ?? false;

    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(`/api/whatsapp/messages?tenantId=${tenant}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to fetch conversations');
      }

      const data = await response.json();
      const mapped: Conversation[] = (data.conversations || []).map((conversation: any) => {
        const lastMessageAt = conversation.lastMessageAt
          ? new Date(conversation.lastMessageAt)
          : null;

        return {
          id: conversation.id,
          phone: conversation.customerPhone,
          chatId: conversation.metadata?.chatId || conversation.customerPhone,
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
        if (!mapped.length) {
          return null;
        }

        if (!previous) {
          return mapped[0];
        }

        const existing = mapped.find((conversation) => conversation.id === previous.id);
        return existing ?? mapped[0];
      });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError(error instanceof Error ? error.message : 'Failed to load conversations.');
      setConversations([]);
      setSelectedConversation(null);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  const fetchMessages = useCallback(async (tenant: string, conversationId: string, loadHistory = false) => {
    if (!tenant) return;

    try {
      setMessagesLoading(true);
      setError(null);

      const params = new URLSearchParams({
        tenantId: tenant,
        loadHistory: loadHistory.toString(),
        limit: '200'
      });

      const response = await fetch(
        `/api/whatsapp/messages/${conversationId}?${params}`
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

      setMessages(mapped);
      setConversations((previous) =>
        previous.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, unreadCount: 0 }
            : conversation
        )
      );
      setSelectedConversation((previous) =>
        previous && previous.id === conversationId
          ? { ...previous, unreadCount: 0 }
          : previous
      );

      // If historical data was loaded, show a notification
      if (data.hasHistoricalData && data.totalMessages > mapped.length) {
        console.log(`Loaded ${mapped.length} messages with historical data`);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError(error instanceof Error ? error.message : 'Failed to load messages.');
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !tenantId) return;

    try {
      setSending(true);
      setError(null);

      const payload = {
        tenantId,
        customerPhone: selectedConversation.chatId || selectedConversation.phone,
        message: messageInput.trim(),
      };

      const response = await fetch('/api/whatsapp/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to send message');
      }

      const data = await response.json();
      const message = data.message;
      const sentAt = message.sentAt ? new Date(message.sentAt) : new Date();

      const newMessage: Message = {
        id: message.id,
        content: message.content || payload.message,
        timestamp: sentAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFromMe: !message.isFromCustomer,
        status: (message.deliveryStatus as Message['status']) || 'sent',
        type: message.type as Message['type'],
        mediaUrl: message.mediaUrl || undefined,
        mediaCaption: message.mediaCaption || undefined,
      };

      setMessages((previous) => [...previous, newMessage]);
      setMessageInput('');
      await fetchConversations(tenantId, { silent: true });
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleQuickReply = (template: QuickReply) => {
    setError(null);
    setMessageInput(template.message);
  };

  // Reset historical data state when switching conversations
  useEffect(() => {
    setHasHistoricalData(false);
  }, [selectedConversation?.id]);

  const handleLoadHistory = async () => {
    if (!selectedConversation || !tenantId) return;

    try {
      setLoadingHistory(true);
      setError(null);
      
      await fetchMessages(tenantId, selectedConversation.id, true);
      setHasHistoricalData(true);
    } catch (error) {
      console.error('Error loading historical messages:', error);
      setError(error instanceof Error ? error.message : 'Failed to load historical messages.');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (!subdomain) {
      return;
    }

    const resolveTenant = async () => {
      try {
        setError(null);
        setLoading(true);

        const tenantResponse = await fetch(`/api/tenants/${subdomain}`);
        if (!tenantResponse.ok) {
          const errorData = await tenantResponse.json().catch(() => null);
          throw new Error(errorData?.error || 'Tenant not found. Please contact support.');
        }

        const tenantData = await tenantResponse.json();
        setTenantId(tenantData.id);
        await fetchConversations(tenantData.id);
      } catch (error) {
        console.error('Error resolving tenant for messages:', error);
        setTenantId('');
        setConversations([]);
        setSelectedConversation(null);
        setMessages([]);
        setError(error instanceof Error ? error.message : 'Failed to resolve tenant.');
      } finally {
        setLoading(false);
      }
    };

    resolveTenant();
  }, [subdomain, fetchConversations]);

  useEffect(() => {
    if (!tenantId || !selectedConversation?.id) {
      return;
    }

    fetchMessages(tenantId, selectedConversation.id);
  }, [tenantId, selectedConversation?.id, fetchMessages]);

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'pending':
      case 'sent':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
    }
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.phone.includes(searchQuery)
  );

  if (!subdomain) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600 mt-2">WhatsApp conversations and communications</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="col-span-1 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                </div>
              ) : filteredConversations.length ? (
                <div className="space-y-2 pr-4">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedConversation?.id === conv.id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{conv.customerName}</p>
                            {conv.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1 truncate">
                            {conv.lastMessage || 'No messages yet'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{conv.lastMessageTime}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                  No conversations found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Message Thread */}
        {selectedConversation ? (
          <Card className="col-span-1 lg:col-span-2 flex flex-col">
            <CardHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedConversation.customerName}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                    <Phone className="w-3 h-3" />
                    {selectedConversation.phone}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleLoadHistory} disabled={loadingHistory || hasHistoricalData}>
                      {loadingHistory ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading History...
                        </>
                      ) : hasHistoricalData ? (
                        <>
                          <CheckCheck className="w-4 h-4 mr-2" />
                          History Loaded
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 mr-2" />
                          Load History
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem>Archive</DropdownMenuItem>
                    <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
                    <DropdownMenuItem>Clear History</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
              {messagesLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-500 px-1">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span>Loading messages...</span>
                </div>
              )}

              <div className="flex-1 overflow-y-auto">
                {messages.length ? (
                  <div className="space-y-3 pr-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isFromMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            msg.isFromMe
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-line">{msg.content}</p>
                          {msg.mediaCaption && (
                            <p className="mt-2 text-xs opacity-80">{msg.mediaCaption}</p>
                          )}
                          {msg.mediaUrl && (
                            <a
                              href={msg.mediaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`mt-2 block text-xs underline ${
                                msg.isFromMe ? 'text-blue-100' : 'text-blue-600'
                              }`}
                            >
                              View {msg.type}
                            </a>
                          )}
                          <div
                            className={`flex items-center justify-between gap-2 mt-2 text-xs ${
                              msg.isFromMe ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
                            <span>{msg.timestamp}</span>
                            {msg.isFromMe && getStatusIcon(msg.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-500">
                    {messagesLoading ? '' : 'No messages yet.'}
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t pt-3">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="resize-none h-20"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sending}
                    className="gap-2"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {quickReplies.map((reply) => (
                    <Button
                      key={reply.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickReply(reply)}
                      className="text-xs h-auto py-2 text-left whitespace-normal"
                    >
                      {reply.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="col-span-1 lg:col-span-2 flex items-center justify-center">
            <CardContent className="text-center">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Select a conversation to start messaging</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
