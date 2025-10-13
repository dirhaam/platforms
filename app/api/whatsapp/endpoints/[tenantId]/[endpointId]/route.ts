export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp/whatsapp-service';

export async function PUT(
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

    const updates = await request.json();
    
    const endpoint = await whatsappService.updateEndpoint(tenantId, endpointId, updates);

    // Sanitize response
    const sanitizedEndpoint = {
      ...endpoint,
      apiKey: endpoint.apiKey ? '***' : undefined,
      webhookSecret: endpoint.webhookSecret ? '***' : undefined
    };

    return NextResponse.json(sanitizedEndpoint);
  } catch (error) {
    console.error('Error updating WhatsApp endpoint:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await whatsappService.removeEndpoint(tenantId, endpointId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting WhatsApp endpoint:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Test endpoint health
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

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'test-health') {
      const isHealthy = await whatsappService.testEndpointHealth(tenantId, endpointId);
      
      return NextResponse.json({
        healthy: isHealthy,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error testing WhatsApp endpoint health:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}