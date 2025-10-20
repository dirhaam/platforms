export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { ServiceService } from '@/lib/booking/service-service';
import { updateServiceSchema } from '@/lib/validation/booking-validation';
import type { UpdateServiceRequest } from '@/types/booking';
import { createClient } from '@supabase/supabase-js';

// Helper function to resolve tenant ID
async function resolveTenantId(request: NextRequest): Promise<string | null> {
  const { searchParams } = new URL(request.url);
  let tenantId = request.headers.get('x-tenant-id');

  // Fallback: also check query params
  if (!tenantId) {
    tenantId = searchParams.get('tenantId');
  }

  if (!tenantId) {
    return null;
  }

  // If tenantId is subdomain (not UUID), lookup the actual tenant ID
  // UUIDs are always 36 chars long (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
  const isUUID = tenantId.length === 36;

  if (!isUUID) {
    // It's a subdomain, lookup the UUID
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', tenantId)
      .single();

    if (!tenant) {
      return null;
    }
    return tenant.id;
  }

  return tenantId;
}

// GET /api/services/[id] - Get a specific service
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await resolveTenantId(request);
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required or invalid' }, { status: 400 });
    }
    
    const { id } = await context.params;
    const service = await ServiceService.getService(tenantId, id);
    
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    
    return NextResponse.json({ service });
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/services/[id] - Update a service
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await resolveTenantId(request);
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required or invalid' }, { status: 400 });
    }
    
    const body = await request.json();
    
    // Validate request body
    const validation = updateServiceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.issues 
      }, { status: 400 });
    }
    
    const { id } = await context.params;
    const updatePayload: UpdateServiceRequest = {
      ...validation.data,
      homeVisitSurcharge: validation.data.homeVisitSurcharge ?? undefined
    };
    const result = await ServiceService.updateService(tenantId, id, updatePayload);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ service: result.service });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/services/[id] - Delete a service
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await resolveTenantId(request);
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required or invalid' }, { status: 400 });
    }
    
    const { id } = await context.params;
    const result = await ServiceService.deleteService(tenantId, id);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}