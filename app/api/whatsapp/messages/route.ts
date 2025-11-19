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
  customerPhone?: string; // can be MSISDN or chatJid
  message?: string; // text content or caption
  deviceId?: string;
  type?: 'text' | 'image' | 'audio' | 'video' | 'document';
  filename?: string;
  mimeType?: string;
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
    const contentType = request.headers.get('content-type') || '';
    let tenantId: string | undefined;
    let customerPhone: string | undefined;
    let deviceId: string | undefined;
    let type: SendMessageBody['type'] = 'text';
    let messageContent = '';
    let filename: string | undefined;
    let mimeType: string | undefined;
    let fileData: Uint8Array | undefined;

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      tenantId = String(form.get('tenantId') || '').trim();
      customerPhone = String(form.get('customerPhone') || '').trim();
      deviceId = String(form.get('deviceId') || '').trim() || undefined;
      type = (String(form.get('type') || 'text') as SendMessageBody['type']) || 'text';
      messageContent = String(form.get('message') || form.get('caption') || '').trim();
      filename = String(form.get('filename') || '').trim() || undefined;
      mimeType = String(form.get('mimeType') || '').trim() || undefined;

      const file = form.get('file');
      if (file && typeof file === 'object' && 'arrayBuffer' in file) {
        const buf = await file.arrayBuffer();
        fileData = new Uint8Array(buf);
        filename = filename || (file as File).name;
        mimeType = mimeType || (file as File).type;
      }
    } else {
      const body: SendMessageBody = await request.json();
      tenantId = body.tenantId?.trim();
      customerPhone = body.customerPhone?.trim();
      messageContent = body.message?.trim() || '';
      deviceId = body.deviceId?.trim() || undefined;
      type = body.type || 'text';
      filename = body.filename;
      mimeType = body.mimeType;
      // Note: for JSON uploads, fileData is not supported here for safety
    }

    if (!tenantId || !customerPhone || (type === 'text' && !messageContent)) {
      return NextResponse.json(
        { error: 'tenantId, customerPhone, and message (for text) are required' },
        { status: 400 }
      );
    }

    if (type !== 'text' && !fileData) {
      return NextResponse.json(
        { error: 'Attachment (file) is required for non-text messages' },
        { status: 400 }
      );
    }

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
      type: type || 'text',
      content: messageContent,
      filename,
      mimeType,
      fileData,
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
