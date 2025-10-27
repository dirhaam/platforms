export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp/whatsapp-service';

interface ConversationResponse {
  id: string;
  customerPhone: string;
  customerName?: string;
  lastMessagePreview: string;
  lastMessageAt: string;
  unreadCount: number;
  status: string;
  metadata?: Record<string, unknown>;
}

interface SendMessageBody {
  tenantId?: string;
  customerPhone?: string;
  message?: string;
  deviceId?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId parameter' },
        { status: 400 }
      );
    }

    // First try to get from local database (cached conversations)
    let conversations = await whatsappService.getConversations(tenantId);

    // If no conversations in database, fetch from WhatsApp API
    if (conversations.length === 0) {
      try {
        const client = await whatsappService.getWhatsAppClient(tenantId);
        if (client) {
          const chats = await client.getConversations(25, 0);
          // Convert chats to conversation format and cache them
          conversations = chats.map((chat: any) => ({
            id: chat.chatJid || chat.id,
            tenantId,
            customerPhone: chat.chatJid?.replace('@s.whatsapp.net', '') || '',
            customerName: chat.name || 'Unknown',
            lastMessagePreview: chat.lastMessage || '',
            lastMessageAt: chat.timestamp ? new Date(chat.timestamp * 1000) : new Date(),
            unreadCount: chat.unreadCount || 0,
            assignedTo: undefined,
            status: 'active' as const,
            tags: [],
            metadata: {
              chatJid: chat.chatJid,
              isGroup: chat.isGroup,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          }));
        }
      } catch (apiError) {
        console.error('Error fetching from WhatsApp API:', apiError);
        // Continue with whatever is in database
      }
    }

    const response: ConversationResponse[] = conversations.map((conversation: any) => ({
      id: conversation.id,
      customerPhone: conversation.customerPhone,
      customerName: conversation.customerName,
      lastMessagePreview: conversation.lastMessagePreview,
      lastMessageAt: conversation.lastMessageAt?.toISOString?.() || new Date().toISOString(),
      unreadCount: conversation.unreadCount || 0,
      status: conversation.status || 'active',
      metadata: conversation.metadata,
    }));

    return NextResponse.json({ conversations: response });
  } catch (error) {
    console.error('Error fetching WhatsApp conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SendMessageBody = await request.json();
    const tenantId = body.tenantId?.trim();
    const customerPhone = body.customerPhone?.trim();
    const messageContent = body.message?.trim();

    if (!tenantId || !customerPhone || !messageContent) {
      return NextResponse.json(
        { error: 'tenantId, customerPhone, and message are required' },
        { status: 400 }
      );
    }

    let deviceId = body.deviceId?.trim();
    if (!deviceId) {
      const devices = await whatsappService.getTenantDevices(tenantId);
      const connectedDevice = devices.find((device) => device.status === 'connected');
      const fallbackDevice = devices[0];

      if (!connectedDevice && !fallbackDevice) {
        return NextResponse.json(
          { error: 'No WhatsApp devices available for this tenant' },
          { status: 503 }
        );
      }

      deviceId = (connectedDevice ?? fallbackDevice).id;
    }

    const recipient = customerPhone.includes('@')
      ? customerPhone
      : `${customerPhone}@s.whatsapp.net`;

    const message = await whatsappService.sendMessage(tenantId, deviceId, recipient, {
      type: 'text',
      content: messageContent,
    });

    const responseMessage = {
      id: message.id,
      conversationId: message.conversationId,
      tenantId: message.tenantId,
      deviceId: message.deviceId,
      type: message.type,
      content: message.content,
      mediaUrl: message.mediaUrl,
      mediaCaption: message.mediaCaption,
      isFromCustomer: message.isFromCustomer,
      customerPhone: message.customerPhone,
      deliveryStatus: message.deliveryStatus,
      sentAt: message.sentAt.toISOString(),
      deliveredAt: message.deliveredAt ? message.deliveredAt.toISOString() : null,
      readAt: message.readAt ? message.readAt.toISOString() : null,
      metadata: message.metadata || {},
    };

    return NextResponse.json({ message: responseMessage }, { status: 201 });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send message' },
      { status: 500 }
    );
  }
}
