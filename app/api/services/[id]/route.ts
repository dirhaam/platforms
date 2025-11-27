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

    // Map snake_case to camelCase for frontend
    const formattedService = {
      id: service.id,
      tenantId: service.tenant_id,
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
      category: service.category,
      isActive: service.is_active,
      homeVisitAvailable: service.home_visit_available,
      homeVisitSurcharge: service.home_visit_surcharge,
      serviceType: service.service_type,
      images: service.images,
      requirements: service.requirements,
      createdAt: service.created_at,
      updatedAt: service.updated_at,
    };

    return NextResponse.json(formattedService);
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

    // Map camelCase to snake_case for database
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    // Map known fields from camelCase to snake_case
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.duration !== undefined) updateData.duration = body.duration;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.isActive !== undefined) updateData.is_active = body.isActive;
    if (body.homeVisitAvailable !== undefined) updateData.home_visit_available = body.homeVisitAvailable;
    if (body.homeVisitSurcharge !== undefined) updateData.home_visit_surcharge = body.homeVisitSurcharge;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.requirements !== undefined) updateData.requirements = body.requirements;
    
    // Also accept snake_case directly (for backward compatibility)
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.home_visit_available !== undefined) updateData.home_visit_available = body.home_visit_available;
    if (body.home_visit_surcharge !== undefined) updateData.home_visit_surcharge = body.home_visit_surcharge;
    if (body.service_type !== undefined) updateData.service_type = body.service_type;

    const { data: service, error } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', resolvedTenantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating service:', error);
      return NextResponse.json({ error: 'Failed to update service', details: error.message }, { status: 500 });
    }

    // Map snake_case to camelCase for frontend
    const formattedService = {
      id: service.id,
      tenantId: service.tenant_id,
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
      category: service.category,
      isActive: service.is_active,
      homeVisitAvailable: service.home_visit_available,
      homeVisitSurcharge: service.home_visit_surcharge,
      serviceType: service.service_type,
      images: service.images,
      requirements: service.requirements,
      createdAt: service.created_at,
      updatedAt: service.updated_at,
    };

    return NextResponse.json(formattedService);
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
