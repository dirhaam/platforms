export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const VALID_TEMPLATES = ['modern', 'classic', 'minimal', 'beauty', 'healthcare'];

export async function POST(request: NextRequest) {
  try {
    // Get tenant ID from header, query params, or body
    let tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      const url = new URL(request.url);
      tenantId = url.searchParams.get('subdomain') || url.searchParams.get('tenant');
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const { template } = await request.json();

    // Validate template
    if (!template || !VALID_TEMPLATES.includes(template)) {
      return NextResponse.json(
        { error: `Invalid template. Must be one of: ${VALID_TEMPLATES.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Resolve subdomain to tenant ID if needed
    let resolvedTenantId = tenantId;
    const isUUID = tenantId.length === 36;

    if (!isUUID) {
      // It's a subdomain, lookup the UUID
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', tenantId.toLowerCase())
        .single();

      if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
      }
      resolvedTenantId = tenant.id;
    }

    // Update tenant template
    console.log('[template POST] Updating tenant:', { resolvedTenantId, template });
    
    const { data, error } = await supabase
      .from('tenants')
      .update({
        template_id: template,
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedTenantId)
      .select();

    console.log('[template POST] Update result:', { data, error });

    if (error || !data || data.length === 0) {
      console.error('Error updating template:', error);
      return NextResponse.json({ 
        error: 'Failed to update template',
        details: error?.message || 'Unknown error',
        resolvedTenantId
      }, { status: 400 });
    }

    // Clear cache for this tenant to ensure fresh data on next load
    try {
      const { CacheService } = await import('@/lib/cache/cache-service');
      // Clear tenant-specific cache - if we have a subdomain, use it for cache key
      if (isUUID) {
        // If tenantId was already a UUID, we don't have the subdomain for cache key
        await CacheService.invalidateTenant(resolvedTenantId);
      } else {
        // If tenantId was a subdomain, clear both UUID and subdomain cache
        await CacheService.invalidateTenant(resolvedTenantId, tenantId);
      }
      console.log('[template POST] Cache cleared for tenant:', resolvedTenantId, 'subdomain:', tenantId);
    } catch (cacheError) {
      console.warn('Could not clear cache after template update:', cacheError);
    }

    return NextResponse.json({
      success: true,
      message: 'Landing page template updated successfully',
      template: data[0]?.template_id
    });
  } catch (error) {
    console.error('Error in template update:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get tenant ID from header, query params, or body
    let tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      const url = new URL(request.url);
      tenantId = url.searchParams.get('subdomain') || url.searchParams.get('tenant');
    }

    console.log('[template GET] Request with tenantId:', tenantId);

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Resolve subdomain to tenant ID if needed
    let resolvedTenantId = tenantId;
    const isUUID = tenantId.length === 36;

    if (!isUUID) {
      // It's a subdomain, lookup the UUID
      console.log('[template GET] Looking up subdomain:', tenantId);
      
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('id, template_id')
        .eq('subdomain', tenantId.toLowerCase())
        .single();

      console.log('[template GET] Subdomain lookup result:', { tenant, error });

      if (!tenant || error) {
        return NextResponse.json({ 
          error: 'Tenant not found',
          details: error?.message || 'No tenant found',
          subdomain: tenantId
        }, { status: 404 });
      }
      
      return NextResponse.json({
        template: tenant.template_id || 'modern'
      });
    }

    // Direct UUID lookup
    console.log('[template GET] Direct UUID lookup:', tenantId);
    
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('template_id')
      .eq('id', tenantId)
      .single();

    console.log('[template GET] UUID lookup result:', { tenant, error });

    if (!tenant || error) {
      return NextResponse.json({ 
        error: 'Tenant not found',
        details: error?.message || 'No tenant found',
        tenantId
      }, { status: 404 });
    }

    return NextResponse.json({
      template: tenant.template_id || 'modern'
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
