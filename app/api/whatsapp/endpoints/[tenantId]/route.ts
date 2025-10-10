import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp/whatsapp-service';
import { WhatsAppEndpoint } from '@/types/whatsapp';

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params;
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId' },
        { status: 400 }
      );
    }

    const endpoints = await whatsappService.getEndpoints(tenantId);
    
    // Sanitize sensitive data
    const sanitizedEndpoints = endpoints.map(endpoint => ({
      ...endpoint,
      apiKey: endpoint.apiKey ? '***' : undefined,
      webhookSecret: endpoint.webhookSecret ? '***' : undefined
    }));

    return NextResponse.json({ endpoints: sanitizedEndpoints });
  } catch (error) {
    console.error('Error getting WhatsApp endpoints:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params;
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId' },
        { status: 400 }
      );
    }

    const endpointData = await request.json();
    
    // Validate required fields
    if (!endpointData.name || !endpointData.apiUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: name, apiUrl' },
        { status: 400 }
      );
    }

    // Generate webhook URL
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/whatsapp/webhook/${tenantId}`;

    const endpoint = await whatsappService.addEndpoint(tenantId, {
      ...endpointData,
      tenantId,
      webhookUrl,
      healthStatus: 'unknown' as const,
      lastHealthCheck: new Date()
    });

    // Sanitize response
    const sanitizedEndpoint = {
      ...endpoint,
      apiKey: endpoint.apiKey ? '***' : undefined,
      webhookSecret: endpoint.webhookSecret ? '***' : undefined
    };

    return NextResponse.json(sanitizedEndpoint, { status: 201 });
  } catch (error) {
    console.error('Error creating WhatsApp endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}