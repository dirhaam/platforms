export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '@/lib/booking/customer-service';
import { createClient } from '@supabase/supabase-js';

// GET /api/customers/stats - Get customer statistics for a tenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let tenantId = request.headers.get('x-tenant-id');
    
    // Fallback: also check query params
    if (!tenantId) {
      tenantId = searchParams.get('tenantId');
    }
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
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
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
      }
      tenantId = tenant.id;
    }
    
    const stats = await CustomerService.getCustomerStats(tenantId);
    
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}