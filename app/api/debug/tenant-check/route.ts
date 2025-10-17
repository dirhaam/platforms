import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const subdomain = request.nextUrl.searchParams.get('subdomain') || 'demo';
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check tenants table
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('*')
      .eq('subdomain', subdomain.toLowerCase());

    // Check tenant_subdomains table (legacy)
    const { data: legacyTenants, error: legacyError } = await supabase
      .from('tenant_subdomains')
      .select('*')
      .eq('subdomain', subdomain);

    return NextResponse.json({
      subdomain,
      tenants: {
        data: tenants,
        error: tenantsError?.message,
        count: tenants?.length || 0
      },
      legacyTenants: {
        data: legacyTenants,
        error: legacyError?.message,
        count: legacyTenants?.length || 0
      },
      allTenants: {
        data: tenants,
        error: tenantsError?.message
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
