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

    // Get the device to check if it has a QR code
    const device = await whatsappService.getDevice(deviceId);
    
    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    if (!device.qrCode) {
      return NextResponse.json(
        { error: 'No QR code available for this device' },
        { status: 404 }
      );
    }

    // If the QR code is a base64 string, return it directly
    if (device.qrCode.startsWith('data:image/')) {
      try {
        // Extract the base64 data
        const [metadata, base64Data] = device.qrCode.split(',');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Determine content type from the data URL
        const contentType = metadata.match(/data:([^;]+)/)?.[1] || 'image/png';
        
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
      } catch (base64Error) {
        console.error('Error processing base64 QR code:', base64Error);
        // Fall through to URL handling
      }
    }

    // If the QR code is a URL, try to fetch it server-side
    if (device.qrCode.startsWith('http')) {
      try {
        console.log('Fetching QR code from URL:', device.qrCode);
        
        // Fetch the QR code image with basic headers
        const response = await fetch(device.qrCode, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
          console.error(`Failed to fetch QR code: ${response.status} ${response.statusText}`);
          throw new Error(`Failed to fetch QR code: ${response.status}`);
        }

        const imageBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(imageBuffer);
        
        // Get content type from response headers
        const contentType = response.headers.get('content-type') || 'image/png';
        
        console.log('Successfully fetched QR code, content-type:', contentType);
        
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        });
      } catch (fetchError) {
        console.error('Error fetching QR code from URL:', fetchError);
        
        // Return error information to help with debugging
        return NextResponse.json({
          error: 'Failed to fetch QR code from external URL',
          originalUrl: device.qrCode,
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error',
          suggestion: 'Try opening the QR code URL directly in a new tab'
        }, { status: 400 });
      }
    }

    // If we get here, the QR code format is not supported
    return NextResponse.json({
      error: 'Invalid QR code format',
      qrCode: device.qrCode,
      supportedFormats: ['data:image/...', 'http://...', 'https://...']
    }, { status: 400 });
  } catch (error) {
    console.error('Error serving QR code:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
