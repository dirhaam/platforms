'use client';

import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Send,
  MoreVertical,
  Phone,
  CheckCheck,
  Clock,
  AlertCircle,
  Loader2,
  FileText,
  MessageSquarePlus,
} from 'lucide-react';
import { Conversation, Message, QuickReply, quickReplies } from './types';

interface MessageThreadProps {
  conversation: Conversation;
  messages: Message[];
  messagesLoading: boolean;
  loadingHistory: boolean;
  hasHistoricalData: boolean;
  sending: boolean;
  messageInput: string;
  attachment: File | null;
  attachmentPreview: string | null;
  onMessageInputChange: (value: string) => void;
  onSendMessage: () => void;
  onLoadHistory: () => void;
  onShowLogs: () => void;
  onShowNewChatDialog: () => void;
  onAttachmentChange: (file: File | null) => void;
  onAttachmentPreviewChange: (preview: string | null) => void;
}

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

export function MessageThread({
  conversation,
  messages,
  messagesLoading,
  loadingHistory,
  hasHistoricalData,
  sending,
  messageInput,
  attachment,
  attachmentPreview,
  onMessageInputChange,
  onSendMessage,
  onLoadHistory,
  onShowLogs,
  onShowNewChatDialog,
  onAttachmentChange,
  onAttachmentPreviewChange,
}: MessageThreadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleQuickReply = (template: QuickReply) => {
    onMessageInputChange(template.message);
  };

  const handlePickAttachment: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onAttachmentChange(file);
    try {
      if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
    } catch { }
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      onAttachmentPreviewChange(url);
    } else {
      onAttachmentPreviewChange(null);
    }
  };

  const handleRemoveAttachment = () => {
    onAttachmentChange(null);
    if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
    onAttachmentPreviewChange(null);
  };

  return (
    <Card className="col-span-1 lg:col-span-2 flex flex-col min-h-0 overflow-hidden border-none shadow-sm">
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>{conversation.customerName}</CardTitle>
              <Badge
                variant={conversation.kind === 'group' ? 'default' : 'secondary'}
                className="text-[10px] px-1.5 py-0.5"
              >
                {conversation.kind === 'group' ? 'Group' : 'P2P'}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <Phone className="w-3 h-3" />
              {conversation.phone}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onLoadHistory} disabled={loadingHistory || hasHistoricalData}>
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
              <DropdownMenuItem onClick={onShowLogs}>
                <FileText className="w-4 h-4 mr-2" />
                View Logs
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShowNewChatDialog}>
                <MessageSquarePlus className="w-4 h-4 mr-2" />
                Start New Chat
              </DropdownMenuItem>
              <DropdownMenuItem>Archive</DropdownMenuItem>
              <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
              <DropdownMenuItem>Clear History</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden flex flex-col gap-4 py-4 min-h-0">
        {messagesLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500 px-1">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span>Loading messages...</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0">
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
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder={attachment ? 'Add a caption (optional)...' : 'Type your message...'}
                value={messageInput}
                onChange={(e) => onMessageInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSendMessage();
                  }
                }}
                className="resize-none h-20"
              />
              {attachment && (
                <div className="flex items-center gap-3 border rounded p-2 bg-gray-50">
                  {attachmentPreview ? (
                    <img src={attachmentPreview} alt="preview" className="w-12 h-12 object-cover rounded" />
                  ) : (
                    <FileText className="w-6 h-6 text-gray-500" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.name}</p>
                    <p className="text-xs text-gray-500">
                      {attachment.type || 'file'} • {(attachment.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleRemoveAttachment}>
                    Remove
                  </Button>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="inline-flex">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handlePickAttachment}
                  accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  Attach
                </Button>
              </label>
              <Button
                onClick={onSendMessage}
                disabled={(attachment ? false : !messageInput.trim()) || sending}
                className="gap-2"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
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
  );
}
