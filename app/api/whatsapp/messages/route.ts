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

    console.log(`[WhatsApp] Fetching conversations for tenant: ${tenantId}`);

    // First try to get from local database (cached conversations)
    let conversations = await whatsappService.getConversations(tenantId);
    console.log(`[WhatsApp] Found ${conversations.length} cached conversations in database`);

    // If no conversations in database, fetch from WhatsApp API
    if (conversations.length === 0) {
      try {
        console.log(`[WhatsApp] No cached conversations, fetching from WhatsApp API...`);
        const client = await whatsappService.getWhatsAppClient(tenantId);
        
        if (!client) {
          console.warn(`[WhatsApp] No WhatsApp client available for tenant ${tenantId}.`);
          console.warn(`[WhatsApp] Setup required: Configure WHATSAPP_ENDPOINTS env variable with your WhatsApp API server.`);
          console.warn(`[WhatsApp] Example: WHATSAPP_ENDPOINTS=[{"name":"primary","apiUrl":"http://wa.example.com","username":"admin","password":"pass"}]`);
        } else {
          console.log(`[WhatsApp] Client found, calling getConversations...`);
          conversations = await client.getConversations(tenantId);
          console.log(`[WhatsApp] Fetched ${conversations.length} conversations from WhatsApp API`);
        }
      } catch (apiError) {
        console.error('[WhatsApp] Error fetching from WhatsApp API:', apiError);
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

    console.log(`[WhatsApp] Returning ${response.length} conversations to client`);
    return NextResponse.json({ conversations: response });
  } catch (error) {
    console.error('[WhatsApp] Error fetching WhatsApp conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations', details: error instanceof Error ? error.message : 'Unknown error' },
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
