export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '@/lib/booking/customer-service';
import { createCustomerSchema } from '@/lib/validation/booking-validation';

// POST /api/customers/find-or-create - Find existing customer or create new one
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const headerTenantId = request.headers.get('x-tenant-id');
    const querySubdomain = searchParams.get('subdomain');
    
    let resolvedTenantId = headerTenantId;
    
    // If no header tenant ID but have subdomain, lookup the tenant ID
    if (!resolvedTenantId && querySubdomain) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data: tenant, error: tenantErr } = await supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', querySubdomain)
        .single();
      
      if (!tenant || tenantErr) {
        return NextResponse.json({ error: 'Tenant not found', debug: { subdomain: querySubdomain } }, { status: 404 });
      }
      resolvedTenantId = tenant.id;
    }
    
    if (!resolvedTenantId) {
      return NextResponse.json({ error: 'Tenant ID required (via x-tenant-id header or subdomain param)' }, { status: 400 });
    }
    
    const body = await request.json();
    console.log('[find-or-create] Request body:', body);
    
    // Validate request body
    const validation = createCustomerSchema.safeParse(body);
    if (!validation.success) {
      console.error('[find-or-create] Validation failed:', validation.error.issues);
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 });
    }
    
    console.log('[find-or-create] Validation passed, creating/finding customer for tenant:', resolvedTenantId);
    
    const result = await CustomerService.findOrCreateCustomer(resolvedTenantId, validation.data);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    const statusCode = result.created ? 201 : 200;
    return NextResponse.json({ 
      customer: result.customer, 
      created: result.created 
    }, { status: statusCode });
  } catch (error) {
    console.error('Error finding or creating customer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}