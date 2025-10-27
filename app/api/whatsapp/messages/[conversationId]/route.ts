export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp/whatsapp-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const limit = parseInt(searchParams.get('limit') || '200', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const loadHistory = searchParams.get('loadHistory') === 'true';

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId parameter' },
        { status: 400 }
      );
    }

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    let messages: any[] = [];

    // Try to fetch from WhatsApp API if loadHistory is requested
    if (loadHistory) {
      try {
        const client = await whatsappService.getWhatsAppClient(tenantId);
        if (client) {
          // conversationId should be chatJid (e.g., phone@s.whatsapp.net)
          const apiMessages = await client.getMessages(conversationId, limit);
          messages = apiMessages.map((msg: any) => ({
            id: msg.id,
            type: msg.type,
            content: msg.content,
            mediaUrl: msg.mediaUrl,
            mediaCaption: msg.mediaCaption,
            isFromCustomer: msg.isFromCustomer,
            customerPhone: msg.customerPhone,
            deliveryStatus: msg.deliveryStatus,
            sentAt: msg.sentAt,
            deliveredAt: msg.deliveredAt,
            readAt: msg.readAt,
          }));
        }
      } catch (apiError) {
        console.error('Error fetching messages from WhatsApp API:', apiError);
        // Continue with database fetch
      }
    }

    // If no messages from API, try database
    if (messages.length === 0) {
      messages = await whatsappService.getMessages(conversationId, limit, offset);
    }

    const response = messages.map((message) => ({
      id: message.id,
      type: message.type,
      content: message.content,
      mediaUrl: message.mediaUrl,
      mediaCaption: message.mediaCaption,
      isFromCustomer: message.isFromCustomer,
      customerPhone: message.customerPhone,
      deliveryStatus: message.deliveryStatus,
      sentAt: message.sentAt?.toISOString?.() || new Date().toISOString(),
      deliveredAt: message.deliveredAt?.toISOString?.() || null,
      readAt: message.readAt?.toISOString?.() || null,
    }));

    return NextResponse.json({ messages: response });
  } catch (error) {
    console.error('Error fetching WhatsApp messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
