import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get('subdomain') || 'test-demo';

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, subdomain')
      .eq('subdomain', subdomain)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({
        error: 'Tenant not found',
        subdomain,
        tenantError
      });
    }

    // Get customers
    const { data: customers, error: customersError, count } = await supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenant.id);

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        subdomain: tenant.subdomain
      },
      customersCount: count,
      customersError: customersError?.message || null,
      customers: customers || [],
      apiCall: {
        url: `/api/customers?tenantId=${tenant.id}`,
        headers: { 'x-tenant-id': subdomain }
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
