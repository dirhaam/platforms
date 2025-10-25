import { createClient, PostgrestError } from '@supabase/supabase-js';
import {
  kvAddToSet,
  kvGet,
  kvGetList,
  kvPushToList,
  kvSet,
} from '../lib/cache/key-value-store';
import type { WhatsAppConversation, WhatsAppMessage } from '../types/whatsapp';

interface WebhookEvent {
  id: string;
  tenant_id: string;
  endpoint_id: string;
  device_id: string;
  event_type: string;
  payload: any;
  received_at: string;
  processed: boolean;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function normalizePhone(phone: string): string {
  return phone.trim().replace(/@.+$/, '');
}

function extractChatIdentifier(eventData: any): { chatId: string; customerName?: string } | null {
  const payload = eventData.payload || eventData;
  const chatId = payload?.chat_id || payload?.chatId || payload?.from || payload?.sender_id;
  
  if (!chatId) {
    return null;
  }

  return {
    chatId: String(chatId),
    customerName: payload?.pushname || payload?.fromName || payload?.customerName || undefined,
  };
}

function extractMessageDetails(payload: any): {
  type: WhatsAppMessage['type'];
  content: string;
  mediaUrl?: string;
  mediaCaption?: string;
} {
  let type: WhatsAppMessage['type'] = 'text';
  let content = '';
  let mediaUrl: string | undefined;
  let mediaCaption: string | undefined;

  const textContent = payload?.message?.text || payload?.text || payload?.body || '';

  if (payload?.image) {
    type = 'image';
    mediaUrl = payload.image.media_path || payload.image.url;
    mediaCaption = payload.image.caption;
    content = mediaCaption || '[Image]';
  } else if (payload?.video) {
    type = 'video';
    mediaUrl = payload.video.media_path || payload.video.url;
    mediaCaption = payload.video.caption;
    content = mediaCaption || '[Video]';
  } else if (payload?.audio) {
    type = 'audio';
    mediaUrl = payload.audio.media_path || payload.audio.url;
    content = payload.audio.caption || '[Audio]';
  } else if (payload?.document) {
    type = 'document';
    mediaUrl = payload.document.media_path || payload.document.url;
    mediaCaption = payload.document.caption;
    content = mediaCaption || '[Document]';
  } else if (payload?.sticker) {
    type = 'sticker';
    mediaUrl = payload.sticker.media_path || payload.sticker.url;
    content = '[Sticker]';
  } else if (payload?.location) {
    type = 'location';
    const name = payload.location.name || payload.location.address;
    content = name ? `Location: ${name}` : 'Location shared';
  } else if (payload?.contact) {
    type = 'contact';
    const displayName = payload.contact.displayName || payload.contact.name;
    content = displayName ? `Contact: ${displayName}` : 'Contact shared';
  } else if (payload?.reaction) {
    type = 'text';
    content = `Reaction: ${payload.reaction.message || ''}`.trim();
  } else if (textContent) {
    type = 'text';
    content = textContent;
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
  };
}

function isMessageFromMe(payload: any): boolean {
  return (
    payload?.from_me === true ||
    payload?.fromMe === true ||
    payload?.message?.from_me === true ||
    payload?.message?.fromMe === true
  );
}

async function fetchWebhookEvents(tenantId?: string): Promise<WebhookEvent[]> {
  let query = supabase
    .from<WebhookEvent>('whatsapp_webhook_events')
    .select('*')
    .eq('event_type', 'message')
    .order('received_at', { ascending: true });

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function processWebhookEvent(event: WebhookEvent): Promise<{ conversationId: string; messageId: string } | null> {
  try {
    const payload = event.payload;
    const identifiers = extractChatIdentifier({ payload });
    
    if (!identifiers) {
      console.warn(`Event ${event.id} missing chat identifier`);
      return null;
    }

    const normalizedPhone = normalizePhone(identifiers.chatId);
    const fromMe = isMessageFromMe(payload);
    
    // Create or get conversation
    const conversationKey = `whatsapp:conversation:${event.tenant_id}:${normalizedPhone}`;
    let conversation = await kvGet<WhatsAppConversation>(conversationKey);
    
    if (!conversation) {
      conversation = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tenantId: event.tenant_id,
        customerPhone: normalizedPhone,
        customerName: identifiers.customerName,
        lastMessageAt: new Date(event.received_at),
        lastMessagePreview: '',
        unreadCount: 0,
        status: 'active',
        tags: [],
        createdAt: new Date(event.received_at),
        updatedAt: new Date(),
      };

      await kvSet(conversationKey, conversation);
      await kvSet(`whatsapp:conversation:index:${conversation.id}`, conversationKey);
      await kvAddToSet(`whatsapp:conversations:${event.tenant_id}`, conversation.id);
    }

    // Extract message details
    const messageDetails = extractMessageDetails(payload);
    const messageId = payload?.message?.id || payload?.id || `msg_${event.id}`;
    const sentAt = new Date(event.received_at);

    // Create message
    const message: WhatsAppMessage = {
      id: messageId,
      tenantId: event.tenant_id,
      deviceId: event.device_id,
      conversationId: conversation.id,
      type: messageDetails.type,
      content: messageDetails.content,
      mediaUrl: messageDetails.mediaUrl,
      mediaCaption: messageDetails.mediaCaption,
      isFromCustomer: !fromMe,
      customerPhone: normalizedPhone,
      deliveryStatus: fromMe ? 'sent' : 'delivered',
      metadata: {
        historical: true,
        webhookEventId: event.id,
        raw: payload,
      },
      sentAt,
    };

    // Store message
    await kvSet(`whatsapp:message:${message.id}`, message);
    
    // Add to conversation messages
    const conversationMessagesKey = `whatsapp:messages:${conversation.id}`;
    await kvPushToList(conversationMessagesKey, message.id, 1000);

    // Store in historical events for easy retrieval
    const historicalEventKey = `whatsapp:historical:event:${event.id}`;
    await kvSet(historicalEventKey, {
      ...event,
      type: 'message',
      timestamp: event.received_at,
    });

    const historicalEventsKey = `whatsapp:historical:events:${event.tenant_id}:${conversation.id}`;
    await kvPushToList(historicalEventsKey, event.id, 1000);

    // Update conversation
    const updatedConversation: WhatsAppConversation = {
      ...conversation,
      customerName: identifiers.customerName || conversation.customerName,
      lastMessageAt: sentAt,
      lastMessagePreview: messageDetails.content.substring(0, 100),
      unreadCount: !fromMe ? conversation.unreadCount + 1 : conversation.unreadCount,
      updatedAt: new Date(),
      metadata: {
        ...(conversation.metadata || {}),
        chatId: identifiers.chatId,
        webhookEventId: event.id,
      },
    };

    await kvSet(conversationKey, updatedConversation);

    return {
      conversationId: conversation.id,
      messageId: message.id,
    };
  } catch (error) {
    console.error(`Error processing webhook event ${event.id}:`, error);
    return null;
  }
}

async function main() {
  console.log('Starting WhatsApp history import from webhook events...');

  try {
    const events = await fetchWebhookEvents();
    
    if (events.length === 0) {
      console.log('No webhook events found. Nothing to import.');
      return;
    }

    console.log(`Found ${events.length} webhook events to process`);

    let processedEvents = 0;
    let createdConversations = 0;
    let createdMessages = 0;

    for (const event of events) {
      try {
        const result = await processWebhookEvent(event);
        
        if (result) {
          processedEvents++;
          createdMessages++;
          
          console.log(`Processed event ${event.id}: Conversation ${result.conversationId}, Message ${result.messageId}`);
        }
      } catch (eventError) {
        console.error('Failed to process webhook event:', {
          eventId: event.id,
          error: eventError,
        });
      }
    }

    console.log('Import complete:', {
      processedEvents,
      createdConversations,
      createdMessages,
    });
  } catch (error) {
    if ((error as PostgrestError)?.message) {
      console.error('Supabase error during import:', error);
    } else {
      console.error('Unexpected import failure:', error);
    }
    process.exitCode = 1;
  }
}

void main();
