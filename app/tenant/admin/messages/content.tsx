'use client';

import { useState, useEffect } from 'react';
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
  customerName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'active' | 'inactive';
}

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isFromMe: boolean;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  type: 'text' | 'image' | 'media';
}

interface QuickReply {
  id: string;
  label: string;
  message: string;
}

const QUICK_REPLIES: QuickReply[] = [
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
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, [subdomain]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockConversations: Conversation[] = [
        {
          id: '1',
          phone: '+62 812 1234567',
          customerName: 'John Doe',
          lastMessage: 'Thank you for the booking!',
          lastMessageTime: '2 hours ago',
          unreadCount: 0,
          status: 'active',
        },
        {
          id: '2',
          phone: '+62 821 9876543',
          customerName: 'Jane Smith',
          lastMessage: 'Can I reschedule my appointment?',
          lastMessageTime: '5 hours ago',
          unreadCount: 2,
          status: 'active',
        },
        {
          id: '3',
          phone: '+62 815 5555555',
          customerName: 'Bob Johnson',
          lastMessage: 'When is the salon open tomorrow?',
          lastMessageTime: '1 day ago',
          unreadCount: 1,
          status: 'inactive',
        },
      ];
      setConversations(mockConversations);
      if (mockConversations.length > 0) {
        setSelectedConversation(mockConversations[0]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      // Mock data for now - replace with actual API call
      const mockMessages: Message[] = [
        {
          id: '1',
          content: 'Hi, I want to book an appointment',
          timestamp: '10:30 AM',
          isFromMe: false,
          status: 'read',
          type: 'text',
        },
        {
          id: '2',
          content: 'Sure! What service would you like?',
          timestamp: '10:31 AM',
          isFromMe: true,
          status: 'read',
          type: 'text',
        },
        {
          id: '3',
          content: 'Hair cut and styling please',
          timestamp: '10:32 AM',
          isFromMe: false,
          status: 'read',
          type: 'text',
        },
        {
          id: '4',
          content: 'Perfect! I have availability tomorrow at 2 PM. Does that work?',
          timestamp: '10:33 AM',
          isFromMe: true,
          status: 'delivered',
          type: 'text',
        },
      ];
      setMessages(mockMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    try {
      setSending(true);

      // Mock send - replace with actual API call
      const newMessage: Message = {
        id: `msg_${Date.now()}`,
        content: messageInput,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFromMe: true,
        status: 'sent',
        type: 'text',
      };

      setMessages([...messages, newMessage]);
      setMessageInput('');

      // Simulate delivery status update
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newMessage.id ? { ...msg, status: 'delivered' as const } : msg
          )
        );
      }, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleQuickReply = (template: QuickReply) => {
    setMessageInput(template.message);
  };

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
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
                          {conv.lastMessage}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{conv.lastMessageTime}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
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
                    <DropdownMenuItem>Archive</DropdownMenuItem>
                    <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
                    <DropdownMenuItem>Clear History</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
              <div className="flex-1 overflow-y-auto">
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
                        <p className="text-sm">{msg.content}</p>
                        <div
                          className={`flex items-center justify-between gap-2 mt-1 text-xs ${
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
              </div>

              {/* Message Input */}
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
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {/* Quick Replies */}
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_REPLIES.map((reply) => (
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
