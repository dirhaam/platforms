import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { email, subdomain } = await request.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const result: any = {
      email,
      subdomain,
      checks: {},
    };

    // Check tenant by email
    if (email) {
      const { data: tenantByEmail, error: emailError } = await supabase
        .from('tenants')
        .select('id, email, subdomain, password_hash, owner_name')
        .eq('email', email)
        .single();

      result.checks.tenantByEmail = {
        found: !!tenantByEmail,
        error: emailError?.message,
        data: tenantByEmail ? {
          id: tenantByEmail.id,
          email: tenantByEmail.email,
          subdomain: tenantByEmail.subdomain,
          owner_name: tenantByEmail.owner_name,
          hasPasswordHash: !!tenantByEmail.password_hash,
        } : null,
      };
    }

    // Check tenant by subdomain
    if (subdomain) {
      const { data: tenantBySubdomain, error: subdomainError } = await supabase
        .from('tenants')
        .select('id, email, subdomain, password_hash, owner_name')
        .eq('subdomain', subdomain.toLowerCase())
        .single();

      result.checks.tenantBySubdomain = {
        found: !!tenantBySubdomain,
        error: subdomainError?.message,
        data: tenantBySubdomain ? {
          id: tenantBySubdomain.id,
          email: tenantBySubdomain.email,
          subdomain: tenantBySubdomain.subdomain,
          owner_name: tenantBySubdomain.owner_name,
          hasPasswordHash: !!tenantBySubdomain.password_hash,
        } : null,
      };
    }

    // Get all tenants count
    const { data: allTenants, error: allError } = await supabase
      .from('tenants')
      .select('id, email, subdomain', { count: 'exact' });

    result.checks.allTenants = {
      count: allTenants?.length || 0,
      error: allError?.message,
      tenants: allTenants?.map(t => ({
        id: t.id,
        email: t.email,
        subdomain: t.subdomain,
      })) || [],
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Debug auth check error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
