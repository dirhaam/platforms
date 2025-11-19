export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp/whatsapp-service';

/**
 * GET /api/whatsapp/devices
 * List devices for a tenant
 */
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

    // Prefer provider API (no DB dependency)
    try {
      const client = await whatsappService.getWhatsAppClient(tenantId);
      if (client && typeof (client as any).getDevices === 'function') {
        const devices = await client.getDevices();
        return NextResponse.json({ devices });
      }
    } catch (e) {
      console.warn('[WhatsApp] Fallback to cached devices due to provider error');
    }

    // Fallback to cached devices (if any)
    const cached = await whatsappService.getTenantDevices(tenantId);
    return NextResponse.json({ devices: cached });
  } catch (error) {
    console.error('Error listing WhatsApp devices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/whatsapp/devices
 * Create a new device
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, endpointId, deviceName } = body;

    // Validate inputs
    if (!tenantId || !endpointId || !deviceName) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, endpointId, deviceName' },
        { status: 400 }
      );
    }

    const device = await whatsappService.createDevice(tenantId, endpointId, deviceName);

    return NextResponse.json(device, { status: 201 });
  } catch (error) {
    console.error('Error creating WhatsApp device:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
