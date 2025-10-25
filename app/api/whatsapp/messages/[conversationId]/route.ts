export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp/whatsapp-service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await context.params;
    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId parameter' }, { status: 400 });
    }

    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

    const messages = await whatsappService.getMessages(conversationId, limit);

    await whatsappService.markConversationRead(tenantId, conversationId);

    const responseMessages = messages.map((message) => ({
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
    }));

    return NextResponse.json({ messages: responseMessages });
  } catch (error) {
    console.error('Error fetching WhatsApp messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
