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
      endpoints: config.endpoints.map(endpoint => ({
        ...endpoint,
        apiKey: endpoint.apiKey ? '***' : undefined,
        webhookSecret: endpoint.webhookSecret ? '***' : undefined
      }))
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
      endpoints: updatedConfig.endpoints.map(endpoint => ({
        ...endpoint,
        apiKey: endpoint.apiKey ? '***' : undefined,
        webhookSecret: endpoint.webhookSecret ? '***' : undefined
      }))
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
      // Create default configuration
      const defaultConfig: WhatsAppConfiguration = {
        tenantId,
        endpoints: [],
        failoverEnabled: true,
        autoReconnect: true,
        reconnectInterval: 30,
        healthCheckInterval: 60,
        webhookRetries: 3,
        messageTimeout: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await whatsappService.updateTenantConfiguration(defaultConfig);
      return NextResponse.json(defaultConfig);
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error initializing WhatsApp configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}