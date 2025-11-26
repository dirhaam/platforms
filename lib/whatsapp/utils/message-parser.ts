import { WhatsAppMessage, WhatsAppWebhookPayload } from '@/types/whatsapp';

export const resolveChatIdentifier = (messageData: Record<string, any>): {
  chatId: string;
  senderId?: string;
  customerName?: string;
} | null => {
  const chatId = messageData?.chat_id || messageData?.chatId || messageData?.from || messageData?.sender_id;
  if (!chatId) {
    return null;
  }

  return {
    chatId: String(chatId),
    senderId: messageData?.sender_id ? String(messageData.sender_id) : undefined,
    customerName:
      messageData?.pushname ||
      messageData?.fromName ||
      messageData?.customerName ||
      undefined,
  };
};

export const isMessageFromMe = (messageData: Record<string, any>): boolean => {
  return (
    messageData?.from_me === true ||
    messageData?.fromMe === true ||
    messageData?.message?.from_me === true ||
    messageData?.message?.fromMe === true
  );
};

export const extractMessageDetails = (messageData: Record<string, any>): {
  type: WhatsAppMessage['type'];
  content: string;
  mediaUrl?: string;
  mediaCaption?: string;
  metadata: Record<string, any>;
} => {
  const metadata: Record<string, any> = {};
  let type: WhatsAppMessage['type'] = 'text';
  let content = '';
  let mediaUrl: string | undefined;
  let mediaCaption: string | undefined;

  const textContent =
    messageData?.message?.text ||
    messageData?.text ||
    messageData?.body ||
    '';

  if (messageData?.image) {
    type = 'image';
    mediaUrl = messageData.image.media_path || messageData.image.url;
    mediaCaption = messageData.image.caption;
    content = mediaCaption || '[Image]';
    metadata.image = messageData.image;
  } else if (messageData?.video) {
    type = 'video';
    mediaUrl = messageData.video.media_path || messageData.video.url;
    mediaCaption = messageData.video.caption;
    content = mediaCaption || '[Video]';
    metadata.video = messageData.video;
  } else if (messageData?.audio) {
    type = 'audio';
    mediaUrl = messageData.audio.media_path || messageData.audio.url;
    content = messageData.audio.caption || '[Audio]';
    metadata.audio = messageData.audio;
  } else if (messageData?.document) {
    type = 'document';
    mediaUrl = messageData.document.media_path || messageData.document.url;
    mediaCaption = messageData.document.caption;
    content = mediaCaption || '[Document]';
    metadata.document = messageData.document;
  } else if (messageData?.sticker) {
    type = 'sticker';
    mediaUrl = messageData.sticker.media_path || messageData.sticker.url;
    content = '[Sticker]';
    metadata.sticker = messageData.sticker;
  } else if (messageData?.location) {
    type = 'location';
    const name = messageData.location.name || messageData.location.address;
    content = name ? `Location: ${name}` : 'Location shared';
    metadata.location = messageData.location;
  } else if (messageData?.contact) {
    type = 'contact';
    const displayName = messageData.contact.displayName || messageData.contact.name;
    content = displayName ? `Contact: ${displayName}` : 'Contact shared';
    metadata.contact = messageData.contact;
  } else if (messageData?.reaction) {
    type = 'text';
    content = `Reaction: ${messageData.reaction.message || ''}`.trim();
    metadata.reaction = messageData.reaction;
  } else if (textContent) {
    type = 'text';
    content = textContent;
  } else if (messageData?.action) {
    type = 'text';
    content = `[Action] ${messageData.action}`;
  } else {
    content = '[Message]';
  }

  if (!content) {
    content = '[Message]';
  }

  return {
    type,
    content,
    mediaUrl,
    mediaCaption,
    metadata,
  };
};

export const resolveMessageId = (messageData: Record<string, any>): string => {
  return (
    messageData?.message?.id ||
    messageData?.id ||
    messageData?.message_id ||
    `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );
};

export const resolveMessageTimestamp = (
  messageData: Record<string, any>,
  fallback: Date
): Date => {
  const candidate =
    messageData?.timestamp ||
    messageData?.message?.timestamp;

  if (typeof candidate === 'string' || typeof candidate === 'number') {
    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return fallback;
};

export const determineEventType = (raw: Record<string, any>): WhatsAppWebhookPayload['event'] => {
  const explicitEvent = raw?.event || raw?.type;
  if (explicitEvent === 'message.ack') {
    return 'status';
  }
  if (explicitEvent === 'group.participants') {
    return 'group';
  }
  if (explicitEvent === 'device_status') {
    return 'device_status';
  }
  if (explicitEvent === 'qr_code') {
    return 'qr_code';
  }
  if (explicitEvent === 'pairing_code') {
    return 'pairing_code';
  }

  if (raw?.receipt_type || raw?.payload?.receipt_type) {
    return 'status';
  }

  if (raw?.qrCode || raw?.qr_code) {
    return 'qr_code';
  }

  if (raw?.pairingCode || raw?.pairing_code) {
    return 'pairing_code';
  }

  if (raw?.status === 'connected' || raw?.status === 'disconnected') {
    return 'device_status';
  }

  if (
    raw?.message ||
    raw?.text ||
    raw?.image ||
    raw?.video ||
    raw?.audio ||
    raw?.document ||
    raw?.sticker ||
    raw?.location ||
    raw?.contact ||
    raw?.reaction ||
    raw?.forwarded ||
    raw?.action
  ) {
    return 'message';
  }

  return 'message';
};

export const resolveDeviceId = (raw: Record<string, any>, data: Record<string, any>): string => {
  const candidates = [
    raw?.deviceId,
    raw?.device_id,
    data?.deviceId,
    data?.device_id,
    data?.payload?.deviceId,
    data?.payload?.device_id,
  ];

  const deviceId = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
  return deviceId ? String(deviceId) : 'unknown-device';
};

export const resolveTimestamp = (raw: Record<string, any>, data: Record<string, any>): Date => {
  const timestampValue =
    raw?.timestamp ||
    data?.timestamp ||
    data?.payload?.timestamp;

  if (typeof timestampValue === 'string' || typeof timestampValue === 'number') {
    const parsed = new Date(timestampValue);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
};
