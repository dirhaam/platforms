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
    const offsetParam = searchParams.get('offset');
    const loadHistoryParam = searchParams.get('loadHistory');
    
    const limit = limitParam ? Number.parseInt(limitParam, 10) : 100;
    const offset = offsetParam ? Number.parseInt(offsetParam, 10) : 0;
    const loadHistory = loadHistoryParam === 'true';

    const messages = await whatsappService.getMessages(conversationId, limit, offset);

    // If loadHistory is true, also try to load historical messages from webhook data
    let historicalMessages: any[] = [];
    if (loadHistory) {
      try {
        historicalMessages = await whatsappService.getHistoricalMessages(tenantId, conversationId, limit, offset);
      } catch (historyError) {
        console.warn('Failed to load historical messages:', historyError);
        // Continue with current messages even if historical loading fails
      }
    }

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
      source: 'current'
    }));

    // Combine current and historical messages
    const allMessages = [...responseMessages, ...historicalMessages.map(msg => ({ ...msg, source: 'historical' }))]
      .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());

    return NextResponse.json({ 
      messages: allMessages,
      hasHistoricalData: historicalMessages.length > 0,
      totalMessages: allMessages.length
    });
  } catch (error) {
    console.error('Error fetching WhatsApp messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
