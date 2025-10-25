export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp/whatsapp-service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await context.params;
    
    if (!deviceId) {
      return NextResponse.json(
        { error: 'Missing deviceId' },
        { status: 400 }
      );
    }

    const device = await whatsappService.getDevice(deviceId);
    
    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(device);
  } catch (error) {
    console.error('Error getting WhatsApp device:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await context.params;
    
    if (!deviceId) {
      return NextResponse.json(
        { error: 'Missing deviceId' },
        { status: 400 }
      );
    }

    const updates = await request.json();
    
    const device = await whatsappService.updateDevice(deviceId, updates);

    return NextResponse.json(device);
  } catch (error) {
    console.error('Error updating WhatsApp device:', error);
    
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
  context: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await context.params;
    
    if (!deviceId) {
      return NextResponse.json(
        { error: 'Missing deviceId' },
        { status: 400 }
      );
    }

    await whatsappService.deleteDevice(deviceId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting WhatsApp device:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await context.params;
    
    if (!deviceId) {
      return NextResponse.json(
        { error: 'Missing deviceId' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'connect':
        try {
          const connectionResult = await whatsappService.connectDevice(deviceId);
          const deviceState = await whatsappService.getDevice(deviceId);
          return NextResponse.json({ success: true, result: connectionResult, device: deviceState });
        } catch (connectError) {
          const message =
            connectError instanceof Error
              ? connectError.message
              : 'Failed to connect device';

          if (message.includes('not found')) {
            return NextResponse.json(
              { success: false, error: message },
              { status: 404 }
            );
          }

          if (message.includes('WhatsApp client not available')) {
            return NextResponse.json(
              {
                success: false,
                error: 'WhatsApp endpoint is not configured or unavailable',
              },
              { status: 503 }
            );
          }

          const deviceState = await whatsappService.getDevice(deviceId);
          return NextResponse.json(
            {
              success: false,
              error: message,
              device: deviceState,
            },
            { status: 200 }
          );
        }

      case 'disconnect':
        await whatsappService.disconnectDevice(deviceId);
        return NextResponse.json({ success: true });

      case 'refresh-status':
        const device = await whatsappService.refreshDeviceStatus(deviceId);
        return NextResponse.json(device);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error performing device action:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      if (error.message.includes('WhatsApp client not available')) {
        return NextResponse.json(
          { error: 'WhatsApp endpoint is not configured or unavailable' },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: error.message },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}