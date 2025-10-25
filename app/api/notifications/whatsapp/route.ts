import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp/whatsapp-service';

interface WhatsAppNotificationRequest {
  phoneNumber: string;
  message: string;
  tenantId?: string;
  type?: 'booking_reminder' | 'payment_reminder' | 'booking_confirmation' | 'booking_cancellation' | 'general';
  bookingId?: string;
  customerId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: WhatsAppNotificationRequest = await request.json();
    const { phoneNumber, message, tenantId, type = 'general', bookingId, customerId } = body;

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Log the notification attempt
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'whatsapp_notification',
      notificationType: type,
      phoneNumber,
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      tenantId,
      bookingId,
      customerId,
      status: 'attempted'
    };

    console.log('WhatsApp Notification:', JSON.stringify(logEntry));

    // If tenantId is provided, try to send via WhatsApp service
    if (tenantId) {
      try {
        // Get tenant devices to find an active one
        const devices = await whatsappService.getTenantDevices(tenantId);
        const activeDevice = devices.find(d => d.status === 'connected');

        if (activeDevice) {
          const sentMessage = await whatsappService.sendMessage(
            tenantId,
            activeDevice.id,
            phoneNumber,
            {
              content: message,
              type: 'text'
            }
          );

          // Log success
          console.log('WhatsApp Notification Sent:', {
            ...logEntry,
            status: 'sent',
            messageId: sentMessage.id
          });

          return NextResponse.json({
            success: true,
            messageId: sentMessage.id,
            status: 'sent'
          });
        } else {
          // Log no device available
          console.log('WhatsApp Notification Failed:', {
            ...logEntry,
            status: 'failed',
            reason: 'No active device found'
          });

          return NextResponse.json({
            success: false,
            error: 'No active WhatsApp device found',
            status: 'failed'
          });
        }
      } catch (error) {
        // Log error
        console.error('WhatsApp Notification Error:', {
          ...logEntry,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to send WhatsApp message',
          status: 'error'
        });
      }
    } else {
      // Log that no tenantId was provided (mock/development mode)
      console.log('WhatsApp Notification (Mock):', {
        ...logEntry,
        status: 'mock_sent',
        reason: 'No tenantId provided - mock mode'
      });

      return NextResponse.json({
        success: true,
        status: 'mock_sent',
        message: 'Message logged (mock mode - no tenantId provided)'
      });
    }

  } catch (error) {
    console.error('WhatsApp Notification API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
