export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { ServiceService } from '@/lib/booking/service-service';
import { createClient } from '@supabase/supabase-js';

// Helper function to resolve tenant ID
async function resolveTenantId(tenantIdentifier: string, supabase: any): Promise<string | null> {
  const isUUID = tenantIdentifier.length === 36;
  
  if (isUUID) {
    return tenantIdentifier;
  }
  
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('subdomain', tenantIdentifier)
    .single();
  
  return tenant?.id || null;
}

// GET /api/services/[id]/stats - Get statistics for a specific service
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const headerTenantId = request.headers.get('x-tenant-id');
    
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
    
    // Verify service exists and belongs to tenant
    const service = await ServiceService.getService(resolvedTenantId, id);
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    
    const stats = await ServiceService.getServiceStats(resolvedTenantId, id);
    
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching service stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}