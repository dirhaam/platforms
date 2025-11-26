import { WhatsAppConversation, WhatsAppMessage } from '@/types/whatsapp';

export const normalizeConversation = (data: WhatsAppConversation | null): WhatsAppConversation | null => {
  if (!data) {
    return null;
  }

  return {
    ...data,
    lastMessageAt: new Date(data.lastMessageAt),
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
};

export const normalizeMessage = (data: WhatsAppMessage | null): WhatsAppMessage | null => {
  if (!data) {
    return null;
  }

  return {
    ...data,
    sentAt: new Date(data.sentAt),
    deliveredAt: data.deliveredAt ? new Date(data.deliveredAt) : undefined,
    readAt: data.readAt ? new Date(data.readAt) : undefined,
  };
};

export const normalizePhone = (identifier: string): string => {
  const trimmed = identifier.trim();
  const withoutDomain = trimmed.replace(/@.+$/, '');
  return withoutDomain || trimmed;
};

export const getMessagePreview = (message: WhatsAppMessage): string => {
  switch (message.type) {
    case 'text':
      return message.content.substring(0, 100);
    case 'image':
      return '📷 Image' + (message.mediaCaption ? `: ${message.mediaCaption.substring(0, 50)}` : '');
    case 'audio':
      return '🎵 Audio message';
    case 'video':
      return '🎥 Video' + (message.mediaCaption ? `: ${message.mediaCaption.substring(0, 50)}` : '');
    case 'document':
      return '📄 Document';
    case 'location':
      return '📍 Location';
    case 'contact':
      return '👤 Contact';
    case 'sticker':
      return '😊 Sticker';
    default:
      return 'Message';
  }
};
