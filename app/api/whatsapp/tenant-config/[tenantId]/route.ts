import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { envEndpointManager } from '@/lib/whatsapp/env-endpoint-manager';

export const runtime = 'nodejs';

/**
 * GET /api/whatsapp/tenant-config/[tenantId]
 * Get tenant's WhatsApp configuration (endpoint assignment)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await context.params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: config, error } = await supabase
      .from('tenant_whatsapp_config')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!config) {
      return NextResponse.json({
        config: null,
        message: 'No configuration found for this tenant',
      });
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching tenant config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/whatsapp/tenant-config/[tenantId]
 * Create or update tenant's WhatsApp endpoint assignment
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await context.params;
    const { endpoint_name } = await request.json();

    if (!endpoint_name) {
      return NextResponse.json(
        { error: 'endpoint_name is required' },
        { status: 400 }
      );
    }

    // Validate endpoint exists in ENV
    if (!envEndpointManager.isValidEndpoint(endpoint_name)) {
      return NextResponse.json(
        { error: `Endpoint "${endpoint_name}" not found in configuration` },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if config already exists
    const { data: existingConfig } = await supabase
      .from('tenant_whatsapp_config')
      .select('id')
      .eq('tenant_id', tenantId)
      .single();

    const now = new Date();
    const configData = {
      tenant_id: tenantId,
      endpoint_name,
      is_configured: true,
      health_status: 'unknown',
      last_health_check: now,
      updated_at: now,
    };

    let config;

    if (existingConfig) {
      // Update existing
      const { data, error } = await supabase
        .from('tenant_whatsapp_config')
        .update(configData)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;
      config = data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('tenant_whatsapp_config')
        .insert([{ ...configData, created_at: now }])
        .select()
        .single();

      if (error) throw error;
      config = data;
    }

    return NextResponse.json({ config }, { status: 201 });
  } catch (error) {
    console.error('Error updating tenant config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/whatsapp/tenant-config/[tenantId]
 * Remove WhatsApp endpoint assignment from tenant
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await context.params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from('tenant_whatsapp_config')
      .delete()
      .eq('tenant_id', tenantId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tenant config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
