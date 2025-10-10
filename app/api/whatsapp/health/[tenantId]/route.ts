import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp/whatsapp-service';

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

    const healthStatus = await whatsappService.getTenantHealthStatus(tenantId);

    return NextResponse.json(healthStatus);
  } catch (error) {
    console.error('Error getting WhatsApp health status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}