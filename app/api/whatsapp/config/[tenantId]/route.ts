export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp/whatsapp-service';
import { WhatsAppConfiguration } from '@/types/whatsapp';

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

    const config = await whatsappService.getTenantConfiguration(tenantId);
    
    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    // Remove sensitive data before sending to client
    const sanitizedConfig = {
      ...config,
      endpoint: {
        ...config.endpoint,
        apiKey: config.endpoint.apiKey ? '***' : undefined,
        webhookSecret: config.endpoint.webhookSecret ? '***' : undefined
      }
    };

    return NextResponse.json(sanitizedConfig);
  } catch (error) {
    console.error('Error getting WhatsApp configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const updates = await request.json();
    
    // Get existing configuration
    const existingConfig = await whatsappService.getTenantConfiguration(tenantId);
    
    if (!existingConfig) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    // Update configuration
    const updatedConfig: WhatsAppConfiguration = {
      ...existingConfig,
      ...updates,
      tenantId, // Ensure tenantId cannot be changed
      updatedAt: new Date()
    };

    await whatsappService.updateTenantConfiguration(updatedConfig);

    // Return sanitized configuration
    const sanitizedConfig = {
      ...updatedConfig,
      endpoint: {
        ...updatedConfig.endpoint,
        apiKey: updatedConfig.endpoint.apiKey ? '***' : undefined,
        webhookSecret: updatedConfig.endpoint.webhookSecret ? '***' : undefined
      }
    };

    return NextResponse.json(sanitizedConfig);
  } catch (error) {
    console.error('Error updating WhatsApp configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Initialize WhatsApp configuration for tenant
    await whatsappService.initializeTenant(tenantId);

    const config = await whatsappService.getTenantConfiguration(tenantId);
    
    if (!config) {
      return NextResponse.json(
        { error: 'Failed to initialize configuration' },
        { status: 500 }
      );
    }

    // Return sanitized configuration
    const sanitizedConfig = {
      ...config,
      endpoint: {
        ...config.endpoint,
        apiKey: config.endpoint.apiKey ? '***' : undefined,
        webhookSecret: config.endpoint.webhookSecret ? '***' : undefined
      }
    };

    return NextResponse.json(sanitizedConfig);
  } catch (error) {
    console.error('Error initializing WhatsApp configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}