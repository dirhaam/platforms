export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const VALID_TEMPLATES = ['modern', 'classic', 'minimal', 'beauty', 'healthcare'];

export async function POST(request: NextRequest) {
  try {
    const headerTenantId = request.headers.get('x-tenant-id');
    if (!headerTenantId) {
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
    let resolvedTenantId = headerTenantId;
    const isUUID = headerTenantId.length === 36;

    if (!isUUID) {
      // It's a subdomain, lookup the UUID
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', headerTenantId.toLowerCase())
        .single();

      if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
      }
      resolvedTenantId = tenant.id;
    }

    // Update tenant template
    const { data, error } = await supabase
      .from('tenants')
      .update({
        template_id: template,
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedTenantId)
      .select();

    if (error || !data || data.length === 0) {
      console.error('Error updating template:', error);
      return NextResponse.json({ error: 'Failed to update template' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Landing page template updated successfully',
      template: data[0]?.template_id
    });
  } catch (error) {
    console.error('Error in template update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const headerTenantId = request.headers.get('x-tenant-id');
    if (!headerTenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Resolve subdomain to tenant ID if needed
    let resolvedTenantId = headerTenantId;
    const isUUID = headerTenantId.length === 36;

    if (!isUUID) {
      // It's a subdomain, lookup the UUID
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id, template_id')
        .eq('subdomain', headerTenantId.toLowerCase())
        .single();

      if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
      }
      
      return NextResponse.json({
        template: tenant.template_id || 'modern'
      });
    }

    // Direct UUID lookup
    const { data: tenant } = await supabase
      .from('tenants')
      .select('template_id')
      .eq('id', headerTenantId)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({
      template: tenant.template_id || 'modern'
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
