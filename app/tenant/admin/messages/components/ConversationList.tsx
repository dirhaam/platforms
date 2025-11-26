'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Search, Loader2 } from 'lucide-react';
import { Conversation } from './types';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  searchQuery: string;
  loading: boolean;
  onSearchChange: (query: string) => void;
  onSelectConversation: (conversation: Conversation) => void;
}

export function ConversationList({
  conversations,
  selectedConversation,
  searchQuery,
  loading,
  onSearchChange,
  onSelectConversation,
}: ConversationListProps) {
  const filteredConversations = conversations.filter(
    (conv) =>
      conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.phone.includes(searchQuery)
  );

  return (
    <Card className="col-span-1 flex flex-col min-h-0 overflow-hidden border-none shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Conversations
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 min-h-0">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            </div>
          ) : filteredConversations.length ? (
            <div className="space-y-2 pr-4">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => onSelectConversation(conv)}
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
                        <Badge
                          variant={conv.kind === 'group' ? 'default' : 'secondary'}
                          className="text-[10px] px-1.5 py-0.5"
                        >
                          {conv.kind === 'group' ? 'Group' : 'P2P'}
                        </Badge>
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
  );
}
