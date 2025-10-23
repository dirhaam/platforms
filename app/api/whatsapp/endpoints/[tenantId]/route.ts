export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { whatsappEndpointManager } from '@/lib/whatsapp/simplified-endpoint-manager';

/**
 * GET /api/whatsapp/endpoints/[tenantId]
 * Get tenant's WhatsApp endpoint (1 endpoint per tenant)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await context.params;
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId' },
        { status: 400 }
      );
    }

    const endpoint = await whatsappEndpointManager.getEndpoint(tenantId);
    
    if (!endpoint) {
      return NextResponse.json(
        { endpoint: null, message: 'No endpoint configured for this tenant' },
        { status: 200 }
      );
    }

    // Sanitize sensitive data
    const sanitized = {
      ...endpoint,
      apiKey: endpoint.apiKey ? '***' : undefined,
      webhookSecret: endpoint.webhookSecret ? '***' : undefined
    };

    return NextResponse.json({ endpoint: sanitized });
  } catch (error) {
    console.error('Error getting WhatsApp endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/whatsapp/endpoints/[tenantId]
 * Create or update tenant's WhatsApp endpoint (replaces existing)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await context.params;
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId' },
        { status: 400 }
      );
    }

    const endpointData = await request.json();
    
    // Validate required fields
    if (!endpointData.id || !endpointData.name || !endpointData.apiUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, apiUrl' },
        { status: 400 }
      );
    }

    // Ensure endpoint belongs to this tenant
    if (endpointData.tenantId && endpointData.tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Endpoint tenant ID mismatch' },
        { status: 400 }
      );
    }

    // Generate webhook URL if not provided
    const webhookUrl = endpointData.webhookUrl || 
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/whatsapp/webhook/${tenantId}/${endpointData.id}`;

    const endpoint = await whatsappEndpointManager.setEndpoint(tenantId, {
      ...endpointData,
      tenantId,
      webhookUrl,
      healthStatus: endpointData.healthStatus || 'unknown',
      lastHealthCheck: new Date(),
    });

    // Sanitize response
    const sanitized = {
      ...endpoint,
      apiKey: endpoint.apiKey ? '***' : undefined,
      webhookSecret: endpoint.webhookSecret ? '***' : undefined
    };

    return NextResponse.json({ endpoint: sanitized }, { status: 201 });
  } catch (error) {
    console.error('Error setting WhatsApp endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/whatsapp/endpoints/[tenantId]
 * Delete tenant's WhatsApp endpoint
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await context.params;
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId' },
        { status: 400 }
      );
    }

    await whatsappEndpointManager.deleteEndpoint(tenantId);
    
    return NextResponse.json({ message: 'Endpoint deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting WhatsApp endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}