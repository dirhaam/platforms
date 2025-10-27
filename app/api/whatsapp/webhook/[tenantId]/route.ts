export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp/whatsapp-service';

interface WebhookPayload {
  event?: string;
  data?: {
    message?: {
      id?: string;
      body?: string;
      timestamp?: number;
      from?: string;
      fromMe?: boolean;
      from_me?: boolean;
      type?: string;
      mediaUrl?: string;
      media_url?: string;
    };
    chat?: {
      id?: string;
      name?: string;
    };
  };
  messages?: Array<any>;
  [key: string]: any;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json() as WebhookPayload;

    // Handle incoming message webhook
    if (body.event === 'message' || body.data?.message) {
      const message = body.data?.message || body.messages?.[0];
      
      if (message) {
        await whatsappService.handleWebhook(tenantId, '', {
          type: 'incoming_message',
          message: {
            id: message.id,
            content: message.body || message.content,
            timestamp: message.timestamp,
            from: message.from,
            isFromCustomer: !message.fromMe && !message.from_me,
            type: message.type || 'text',
            mediaUrl: message.mediaUrl || message.media_url,
          },
        });
      }
    }

    // Handle message status webhook (delivered, read, etc.)
    if (body.event === 'message.status' || body.data?.message?.type === 'status') {
      const message = body.data?.message || body.messages?.[0];
      
      if (message) {
        await whatsappService.handleWebhook(tenantId, '', {
          type: 'message_status',
          message: {
            id: message.id,
            status: body.event?.split('.')?.[1] || 'delivered',
            timestamp: message.timestamp,
          },
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook received' });
  } catch (error) {
    console.error('Error handling WhatsApp webhook:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to handle webhook' },
      { status: 500 }
    );
  }
}

// GET for testing/health check
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;

  if (!tenantId) {
    return NextResponse.json(
      { error: 'Tenant ID is required' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'WhatsApp webhook endpoint is ready',
    tenantId,
  });
}
