export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/services/[id] - Get service details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headerTenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: service, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', headerTenantId)
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
    const body = await request.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: service, error } = await supabase
      .from('services')
      .update(body)
      .eq('id', id)
      .eq('tenant_id', headerTenantId)
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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)
      .eq('tenant_id', headerTenantId);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
}
