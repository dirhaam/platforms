export interface Conversation {
  id: string;
  phone: string;
  chatId?: string;
  kind: 'p2p' | 'group';
  customerName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'active' | 'inactive' | 'archived' | 'blocked';
  metadata?: Record<string, any>;
}

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  isFromMe: boolean;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contact' | 'sticker';
  mediaUrl?: string;
  mediaCaption?: string;
}

export interface QuickReply {
  id: string;
  label: string;
  message: string;
}

export const quickReplies: QuickReply[] = [
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
