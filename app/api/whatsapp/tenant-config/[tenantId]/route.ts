import { NextRequest, NextResponse } from 'next/server';
import { createClient, PostgrestError } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { envEndpointManager } from '@/lib/whatsapp/env-endpoint-manager';
import { whatsappEndpointManager } from '@/lib/whatsapp/simplified-endpoint-manager';

export const runtime = 'nodejs';

class WhatsAppConfigError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'WhatsAppConfigError';
  }
}

function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new WhatsAppConfigError(
      'SUPABASE_URL_MISSING',
      'Server misconfiguration: NEXT_PUBLIC_SUPABASE_URL is not set.'
    );
  }

  if (!serviceRoleKey) {
    throw new WhatsAppConfigError(
      'SUPABASE_SERVICE_ROLE_KEY_MISSING',
      'Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY is not set.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function extractPostgrestError(error: unknown): PostgrestError | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const maybeError = error as Partial<PostgrestError>;
  if (typeof maybeError.code === 'string' && typeof maybeError.message === 'string') {
    return maybeError as PostgrestError;
  }

  return null;
}

function mapSupabaseError(error: PostgrestError | null, action: string): WhatsAppConfigError {
  if (!error) {
    return new WhatsAppConfigError('SUPABASE_ERROR', `[${action}] Unknown database error`);
  }

  if (
    error.code === '42P01' ||
    error.message.includes('whatsapp_endpoints') ||
    error.message.includes('tenant_whatsapp_config')
  ) {
    return new WhatsAppConfigError(
      'WHATSAPP_TABLES_MISSING',
      'Required WhatsApp tables are missing. Run fix-whatsapp-endpoints-types.sql on Supabase.'
    );
  }

  if (error.code === '23503') {
    return new WhatsAppConfigError(
      'TENANT_FOREIGN_KEY_VIOLATION',
      'Tenant record could not be linked. Ensure the tenant exists and WhatsApp tables use UUID types.'
    );
  }

  if (error.code === '42501') {
    return new WhatsAppConfigError(
      'SUPABASE_PERMISSION_DENIED',
      'Supabase service role is missing required permissions for WhatsApp tables.'
    );
  }

  return new WhatsAppConfigError('SUPABASE_ERROR', `[${action}] ${error.message}`);
}

/**
 * IMPORTANT: Requires these Supabase tables to be created:
 * - whatsapp_endpoints (UUID tenant_id, api_url, api_key, webhook_url, webhook_secret)
 * - tenant_whatsapp_config (UUID tenant_id, endpoint_name, is_configured, health_status)
 * 
 * Run: fix-whatsapp-endpoints-types.sql to create/fix these tables with proper UUID types
 */

/**
 * Helper function to resolve tenant ID from either UUID or subdomain
 */
async function resolveTenantId(tenantIdentifier: string): Promise<{ resolved: string | null; error?: string }> {
  if (!tenantIdentifier) {
    return { resolved: null, error: 'Tenant ID required' };
  }

  // If it's already a UUID (36 characters), use it directly
  const isUUID = tenantIdentifier.length === 36;
  if (isUUID) {
    return { resolved: tenantIdentifier };
  }

  // It's a subdomain, lookup the UUID
  try {
    const supabase = createServiceRoleClient();

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', tenantIdentifier.toLowerCase())
      .single();

    if (error) {
      console.warn('[WhatsApp] Supabase error resolving tenant:', error);
      if (error.code === '42P01') {
        throw mapSupabaseError(error, 'resolving tenant subdomain');
      }
      return { resolved: null, error: 'Tenant not found' };
    }

    if (!tenant) {
      return { resolved: null, error: 'Tenant not found' };
    }

    return { resolved: tenant.id };
  } catch (error) {
    if (error instanceof WhatsAppConfigError) {
      throw error;
    }
    console.error('[WhatsApp] Failed to resolve tenant:', error);
    return { resolved: null, error: 'Failed to resolve tenant' };
  }
}

/**
 * GET /api/whatsapp/tenant-config/[tenantId]
 * Get tenant's WhatsApp configuration (endpoint assignment)
 * tenantId can be either a UUID or subdomain
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await context.params;

    // Resolve tenant ID (handles both UUID and subdomain)
    const { resolved: resolvedTenantId, error: resolveError } = await resolveTenantId(tenantId);
    if (!resolvedTenantId) {
      return NextResponse.json(
        { error: resolveError || 'Tenant not found' },
        { status: 404 }
      );
    }

    const supabase = createServiceRoleClient();

    const { data: config, error } = await supabase
      .from('tenant_whatsapp_config')
      .select('*')
      .eq('tenant_id', resolvedTenantId)
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
    if (error instanceof WhatsAppConfigError) {
      console.error('[WhatsApp GET] Config error:', error);
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 500 }
      );
    }
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
 * tenantId can be either a UUID or subdomain
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    console.log('[WhatsApp POST] Starting endpoint assignment...');
    
    const { tenantId } = await context.params;
    console.log('[WhatsApp POST] tenantId:', tenantId);
    
    const { endpoint_name } = await request.json();
    console.log('[WhatsApp POST] endpoint_name:', endpoint_name);

    if (!endpoint_name) {
      console.warn('[WhatsApp POST] Missing endpoint_name');
      return NextResponse.json(
        { error: 'endpoint_name is required' },
        { status: 400 }
      );
    }

    // Validate endpoint exists in ENV
    console.log('[WhatsApp POST] Validating endpoint in ENV...');
    if (!envEndpointManager.isValidEndpoint(endpoint_name)) {
      console.warn('[WhatsApp POST] Endpoint not found in ENV:', endpoint_name);
      return NextResponse.json(
        { error: `Endpoint "${endpoint_name}" not found in configuration` },
        { status: 400 }
      );
    }
    console.log('[WhatsApp POST] Endpoint validated ✓');

    // Resolve tenant ID (handles both UUID and subdomain)
    console.log('[WhatsApp POST] Resolving tenant ID...');
    const { resolved: resolvedTenantId, error: resolveError } = await resolveTenantId(tenantId);
    if (!resolvedTenantId) {
      console.warn('[WhatsApp POST] Failed to resolve tenant:', resolveError);
      return NextResponse.json(
        { error: resolveError || 'Tenant not found' },
        { status: 404 }
      );
    }
    console.log('[WhatsApp POST] Tenant resolved:', resolvedTenantId);

    console.log('[WhatsApp POST] Getting endpoint config...');
    const endpointConfig = envEndpointManager.getEndpointConfig(endpoint_name);

    if (!endpointConfig) {
      console.warn('[WhatsApp POST] Could not get endpoint config');
      return NextResponse.json(
        { error: `Endpoint "${endpoint_name}" not found in configuration` },
        { status: 400 }
      );
    }
    console.log('[WhatsApp POST] Endpoint config retrieved ✓');

    // Ensure endpoint record exists in persistent storage
    console.log('[WhatsApp POST] Syncing endpoint to database...');
    const syncedEndpoint = await syncTenantEndpoint(resolvedTenantId, endpointConfig);
    console.log('[WhatsApp POST] Endpoint synced ✓');
    const supabase = createServiceRoleClient();

    // Check if config already exists
    const { data: existingConfig } = await supabase
      .from('tenant_whatsapp_config')
      .select('id')
      .eq('tenant_id', resolvedTenantId)
      .single();

    const now = new Date().toISOString();
    const configData = {
      tenant_id: resolvedTenantId,
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
        .eq('tenant_id', resolvedTenantId)
        .select()
        .single();

      if (error) {
        console.error('[WhatsApp POST] Supabase error updating tenant config:', error);
        throw mapSupabaseError(error, 'updating tenant_whatsapp_config');
      }
      config = data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('tenant_whatsapp_config')
        .insert([{ ...configData, created_at: now }])
        .select()
        .single();

      if (error) {
        console.error('[WhatsApp POST] Supabase error inserting tenant config:', error);
        throw mapSupabaseError(error, 'inserting tenant_whatsapp_config');
      }
      config = data;
    }

    console.log('[WhatsApp POST] Config saved ✓');
    console.log('[WhatsApp POST] Returning success response...');
    
    return NextResponse.json(
      {
        config,
        endpoint: {
          id: syncedEndpoint.id,
          name: endpointConfig.name,
          apiUrl: endpointConfig.apiUrl,
          webhookUrl: syncedEndpoint.webhookUrl,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('[WhatsApp POST] ERROR:', errorMsg);
    console.error('[WhatsApp POST] Stack:', errorStack);

    let publicMessage = 'Internal server error';
    let code: string | undefined;

    if (error instanceof WhatsAppConfigError) {
      publicMessage = error.message;
      code = error.code;
    } else if (error instanceof Error && error.message.includes('SUPABASE_ENV_MISSING')) {
      publicMessage = 'Supabase environment variables are missing.';
      code = 'SUPABASE_ENV_MISSING';
    }

    return NextResponse.json(
      {
        error: publicMessage,
        code,
        details: process.env.NODE_ENV === 'development' ? errorMsg : undefined,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/whatsapp/tenant-config/[tenantId]
 * Remove WhatsApp endpoint assignment from tenant
 * tenantId can be either a UUID or subdomain
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await context.params;

    // Resolve tenant ID (handles both UUID and subdomain)
    const { resolved: resolvedTenantId, error: resolveError } = await resolveTenantId(tenantId);
    if (!resolvedTenantId) {
      return NextResponse.json(
        { error: resolveError || 'Tenant not found' },
        { status: 404 }
      );
    }

    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .from('tenant_whatsapp_config')
      .delete()
      .eq('tenant_id', resolvedTenantId);

    if (error) {
      console.error('[WhatsApp DELETE] Supabase error deleting tenant config:', error);
      throw mapSupabaseError(error, 'deleting tenant_whatsapp_config');
    }

    await whatsappEndpointManager.deleteEndpoint(resolvedTenantId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof WhatsAppConfigError) {
      console.error('[WhatsApp DELETE] Config error:', error);
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 500 }
      );
    }
    console.error('Error deleting tenant config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function syncTenantEndpoint(
  tenantId: string,
  endpointConfig: { name: string; apiUrl: string; apiKey: string }
) {
  const existingEndpoint = await whatsappEndpointManager.getEndpoint(tenantId);

  const endpointId = existingEndpoint?.id ?? randomUUID();
  const webhookSecret = existingEndpoint?.webhookSecret ?? randomUUID();
  const webhookUrl =
    existingEndpoint?.webhookUrl ??
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/whatsapp/webhook/${tenantId}/${endpointId}`;

  const now = new Date().toISOString();
  let synced;
  try {
    synced = await whatsappEndpointManager.setEndpoint(tenantId, {
      id: endpointId,
      tenantId,
      name: endpointConfig.name,
      apiUrl: endpointConfig.apiUrl,
      apiKey: endpointConfig.apiKey,
      webhookUrl,
      webhookSecret,
      isActive: true,
      healthStatus: existingEndpoint?.healthStatus ?? 'unknown',
      lastHealthCheck: existingEndpoint?.lastHealthCheck ?? new Date(now),
    });
  } catch (error) {
    if (error instanceof WhatsAppConfigError) {
      throw error;
    }

    const supabaseError = extractPostgrestError(error);
    if (supabaseError) {
      throw mapSupabaseError(supabaseError, 'syncing whatsapp_endpoints');
    }

    throw error;
  }

  return {
    id: synced.id,
    webhookUrl: synced.webhookUrl,
  };
}
