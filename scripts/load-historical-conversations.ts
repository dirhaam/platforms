import { createClient, PostgrestError } from '@supabase/supabase-js';
import {
  kvAddToSet,
  kvGet,
  kvGetList,
  kvPushToList,
  kvSet,
} from '../lib/cache/key-value-store';
import type { WhatsAppConversation, WhatsAppMessage } from '../types/whatsapp';

interface LegacyConversationRow {
  id: string;
  tenant_id: string;
  customer_id: string | null;
  phone: string;
  customer_name: string | null;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface LegacyMessageRow {
  id: string;
  conversation_id: string;
  tenant_id: string;
  content: string | null;
  type: string | null;
  media_url: string | null;
  is_from_me: boolean | null;
  status: string | null;
  message_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const MESSAGE_TYPES: Array<WhatsAppMessage['type']> = [
  'text',
  'image',
  'audio',
  'video',
  'document',
  'location',
  'contact',
  'sticker',
];

const DELIVERY_STATUSES: Array<WhatsAppMessage['deliveryStatus']> = [
  'pending',
  'sent',
  'delivered',
  'read',
  'failed',
];

function normalizePhone(phone: string): string {
  return phone.trim().replace(/@.+$/, '');
}

function mapConversationStatus(rawStatus: string | null): WhatsAppConversation['status'] {
  if (!rawStatus) {
    return 'active';
  }

  const normalized = rawStatus.toLowerCase();
  if (normalized === 'archived' || normalized === 'blocked') {
    return normalized;
  }

  if (normalized === 'inactive') {
    return 'archived';
  }

  return 'active';
}

function mapMessageType(rawType: string | null): WhatsAppMessage['type'] {
  if (!rawType) {
    return 'text';
  }

  const normalized = rawType.toLowerCase();
  if (MESSAGE_TYPES.includes(normalized as WhatsAppMessage['type'])) {
    return normalized as WhatsAppMessage['type'];
  }

  if (normalized === 'file') {
    return 'document';
  }

  return 'text';
}

function mapDeliveryStatus(rawStatus: string | null): WhatsAppMessage['deliveryStatus'] {
  if (!rawStatus) {
    return 'sent';
  }

  const normalized = rawStatus.toLowerCase();
  if (DELIVERY_STATUSES.includes(normalized as WhatsAppMessage['deliveryStatus'])) {
    return normalized as WhatsAppMessage['deliveryStatus'];
  }

  return 'sent';
}

async function fetchConversations(): Promise<LegacyConversationRow[]> {
  const { data, error } = await supabase
    .from<LegacyConversationRow>('conversations')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function fetchMessages(conversationId: string): Promise<LegacyMessageRow[]> {
  const { data, error } = await supabase
    .from<LegacyMessageRow>('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

function parseDate(value: string | null, fallback: Date = new Date()): Date {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

async function loadConversation(conversationRow: LegacyConversationRow): Promise<{ migrated: number; conversationId: string }> {
  const normalizedPhone = normalizePhone(conversationRow.phone);
  const conversationKey = `whatsapp:conversation:${conversationRow.tenant_id}:${normalizedPhone}`;

  const existingRaw = await kvGet<WhatsAppConversation>(conversationKey);
  const existingConversation = existingRaw
    ? {
        ...existingRaw,
        lastMessageAt: new Date(existingRaw.lastMessageAt),
        createdAt: new Date(existingRaw.createdAt),
        updatedAt: new Date(existingRaw.updatedAt),
      }
    : null;

  const conversationId = existingConversation?.id ?? conversationRow.id;

  const createdAt = parseDate(conversationRow.created_at);
  const updatedAt = parseDate(conversationRow.updated_at, createdAt);
  const lastMessageAtFromRow = conversationRow.last_message_time
    ? parseDate(conversationRow.last_message_time, updatedAt)
    : updatedAt;

  const conversation: WhatsAppConversation = {
    id: conversationId,
    tenantId: existingConversation?.tenantId ?? conversationRow.tenant_id,
    customerPhone: existingConversation?.customerPhone ?? normalizedPhone,
    customerName: existingConversation?.customerName ?? conversationRow.customer_name ?? undefined,
    lastMessageAt: existingConversation?.lastMessageAt ?? lastMessageAtFromRow,
    lastMessagePreview: existingConversation?.lastMessagePreview ?? conversationRow.last_message ?? '',
    unreadCount: existingConversation?.unreadCount ?? conversationRow.unread_count ?? 0,
    status: mapConversationStatus(existingConversation?.status ?? conversationRow.status),
    assignedTo: existingConversation?.assignedTo,
    tags: existingConversation?.tags ?? [],
    metadata: {
      ...(existingConversation?.metadata ?? {}),
      legacyConversationId: conversationRow.id,
      ...(conversationRow.customer_id ? { legacyCustomerId: conversationRow.customer_id } : {}),
    },
    createdAt: existingConversation?.createdAt ?? createdAt,
    updatedAt: new Date(),
  };

  if (!conversation.metadata?.chatId) {
    const metadata = conversation.metadata ?? {};
    metadata.chatId = normalizedPhone.includes('@')
      ? normalizedPhone
      : `${normalizedPhone}@s.whatsapp.net`;
    conversation.metadata = metadata;
  }

  // Store conversation
  await kvSet(conversationKey, conversation);
  await kvSet(`whatsapp:conversation:index:${conversation.id}`, conversationKey);
  await kvAddToSet(`whatsapp:conversations:${conversation.tenantId}`, conversation.id);

  // Load messages
  const messageRows = await fetchMessages(conversationRow.id);
  const conversationMessagesKey = `whatsapp:messages:${conversation.id}`;
  const existingMessageIds = new Set(await kvGetList<string>(conversationMessagesKey));

  let migratedMessages = 0;
  let latestMessageAt = conversation.lastMessageAt;
  let latestPreview = conversation.lastMessagePreview;

  for (const messageRow of messageRows) {
    const messageId = (messageRow.message_id && messageRow.message_id.trim()) || messageRow.id;
    if (!messageId || existingMessageIds.has(messageId)) {
      continue;
    }

    const sentAt = parseDate(messageRow.created_at);
    const updatedMessageAt = parseDate(messageRow.updated_at, sentAt);
    const deliveryStatus = mapDeliveryStatus(messageRow.status);

    const message: WhatsAppMessage = {
      id: messageId,
      tenantId: messageRow.tenant_id,
      deviceId: 'legacy-device',
      conversationId: conversation.id,
      type: mapMessageType(messageRow.type),
      content: messageRow.content ?? '',
      mediaUrl: messageRow.media_url ?? undefined,
      mediaCaption: undefined,
      isFromCustomer: !(messageRow.is_from_me ?? false),
      customerPhone: conversation.customerPhone,
      deliveryStatus,
      metadata: {
        legacyMessageId: messageRow.id,
        ...(messageRow.message_id ? { legacyMessageRef: messageRow.message_id } : {}),
        historical: true,
      },
      sentAt,
      deliveredAt: deliveryStatus === 'delivered' || deliveryStatus === 'read' ? updatedMessageAt : undefined,
      readAt: deliveryStatus === 'read' ? updatedMessageAt : undefined,
    };

    await kvSet(`whatsapp:message:${message.id}`, message);
    await kvPushToList(conversationMessagesKey, message.id, 1000);
    existingMessageIds.add(message.id);
    migratedMessages += 1;

    if (message.sentAt > latestMessageAt) {
      latestMessageAt = message.sentAt;
      latestPreview = message.content;
    }
  }

  if (latestMessageAt > conversation.lastMessageAt) {
    conversation.lastMessageAt = latestMessageAt;
    conversation.lastMessagePreview = latestPreview;
  }

  conversation.updatedAt = new Date();
  await kvSet(conversationKey, conversation);

  return { migrated: migratedMessages, conversationId: conversation.id };
}

async function main() {
  console.log('Loading historical WhatsApp conversations...');

  try {
    const conversations = await fetchConversations();
    if (conversations.length === 0) {
      console.log('No conversations found in database. Nothing to load.');
      return;
    }

    let totalMessages = 0;
    let processedConversations = 0;

    for (const conversationRow of conversations) {
      try {
        const result = await loadConversation(conversationRow);
        processedConversations += 1;
        totalMessages += result.migrated;

        console.log(
          `Conversation ${result.conversationId} loaded (${result.migrated} messages migrated)`
        );
      } catch (conversationError) {
        console.error('Failed to load conversation:', {
          conversationId: conversationRow.id,
          error: conversationError,
        });
      }
    }

    console.log('Load complete:', {
      conversations: processedConversations,
      messages: totalMessages,
    });
  } catch (error) {
    if ((error as PostgrestError)?.message) {
      console.error('Supabase error during load:', error);
    } else {
      console.error('Unexpected load failure:', error);
    }
    process.exitCode = 1;
  }
}

void main();
