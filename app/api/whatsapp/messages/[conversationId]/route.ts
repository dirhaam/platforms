export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp/whatsapp-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');
  
  try {
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

    const client = await whatsappService.getWhatsAppClient(tenantId);
    if (!client) {
      return NextResponse.json(
        { error: 'WhatsApp endpoint not configured or unavailable for this tenant' },
        { status: 503 }
      );
    }

    // Always fetch from provider (API-only mode)
    // conversationId should be chat JID (e.g., 62xxxx@s.whatsapp.net or group@g.us)
    const chatJid = conversationId.includes('@') ? conversationId : `${conversationId}@s.whatsapp.net`;

    // Exclude unsupported JID categories to avoid 500s from provider
    const lower = chatJid.toLowerCase();
    if (lower.endsWith('@broadcast') || lower.endsWith('@newsletter')) {
      return NextResponse.json({ messages: [] });
    }

    const apiMessages = await client.getMessages(chatJid, limit);
    
    const messages = apiMessages.map((msg: any) => ({
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

    const debugResponse = {
        messages: response,
        debug: {
          conversationId,
          tenantId,
          apiMessagesCount: apiMessages.length,
          note: 'Debug info included - check browser console'
        }
      };
      return NextResponse.json(debugResponse);
  } catch (error) {
    console.error('Error fetching WhatsApp messages:', {
      conversationId,
      tenantId,
      errorMessage: error instanceof Error ? error.message : error,
      errorStack: error instanceof Error ? error.stack : undefined
    });
    // Don't break the UI on provider failure; return empty list gracefully
    return NextResponse.json({ 
      messages: [], 
      error: 'provider_error',
      debug: {
        conversationId,
        tenantId,
        errorMessage: error instanceof Error ? error.message : error
      }
    });
  }
}
