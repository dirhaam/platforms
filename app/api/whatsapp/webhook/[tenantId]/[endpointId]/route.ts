export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp/whatsapp-service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ tenantId: string; endpointId: string }> }
) {
  try {
    const { tenantId, endpointId } = await context.params;
    
    if (!tenantId || !endpointId) {
      return NextResponse.json(
        { error: 'Missing tenantId or endpointId' },
        { status: 400 }
      );
    }

    // Get webhook signature for verification
    const signature = request.headers.get('x-webhook-signature') || 
                     request.headers.get('x-hub-signature-256');

    // Parse webhook payload
    const payload = await request.json();

    // Handle the webhook
    const result = await whatsappService.handleWebhook(
      tenantId,
      endpointId,
      payload,
      signature || undefined
    );

    if (result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle webhook verification (GET request)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ tenantId: string; endpointId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    // Verify webhook subscription (common pattern for webhook verification)
    if (mode === 'subscribe' && token && challenge) {
      // In production, you'd verify the token against stored configuration
      const { tenantId, endpointId } = await context.params;
      const config = await whatsappService.getTenantConfiguration(tenantId);
      
      if (config && config.endpoint && config.endpoint.id === endpointId) {
        if (config.endpoint.webhookSecret === token) {
          return new NextResponse(challenge, { status: 200 });
        }
      }
    }

    return NextResponse.json(
      { error: 'Webhook verification failed' },
      { status: 403 }
    );
  } catch (error) {
    console.error('WhatsApp webhook verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}