export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper function to resolve tenant ID
async function resolveTenantId(tenantIdentifier: string, supabase: any): Promise<string | null> {
  // UUIDs are always 36 chars long (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
  const isUUID = tenantIdentifier.length === 36;
  
  if (isUUID) {
    return tenantIdentifier;
  }
  
  // It's a subdomain, lookup the UUID
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('subdomain', tenantIdentifier)
    .single();
  
  return tenant?.id || null;
}

// GET /api/services/[id] - Get service details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headerTenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');

    if (!headerTenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const resolvedTenantId = await resolveTenantId(headerTenantId, supabase);
    if (!resolvedTenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const { data: service, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', resolvedTenantId)
      .single();

    if (error || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json({ error: 'Failed to fetch service' }, { status: 500 });
  }
}

// PUT /api/services/[id] - Update service
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headerTenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');
    
    if (!headerTenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const body = await request.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const resolvedTenantId = await resolveTenantId(headerTenantId, supabase);
    if (!resolvedTenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const { data: service, error } = await supabase
      .from('services')
      .update(body)
      .eq('id', id)
      .eq('tenant_id', resolvedTenantId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
  }
}

// DELETE /api/services/[id] - Delete service
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headerTenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');

    if (!headerTenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const resolvedTenantId = await resolveTenantId(headerTenantId, supabase);
    if (!resolvedTenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)
      .eq('tenant_id', resolvedTenantId);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
}
