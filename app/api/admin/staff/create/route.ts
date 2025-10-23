import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SecurityService } from '@/lib/security/security-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { tenantId, email, name, role = 'staff', password } = body;

    // Validate inputs
    if (!tenantId || !email || !name || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, email, name, password' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if tenantId is a subdomain (not UUID), if so, lookup the actual ID
    let tenantSubdomain: string;
    const isUUID = tenantId.length === 36;
    if (!isUUID) {
      const { data: tenantLookup } = await supabase
        .from('tenants')
        .select('id, subdomain')
        .eq('subdomain', tenantId.toLowerCase())
        .single();

      if (!tenantLookup) {
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 404 }
        );
      }
      tenantId = tenantLookup.id;
      tenantSubdomain = tenantLookup.subdomain;
    } else {
      // Check if tenant exists
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id, subdomain')
        .eq('id', tenantId)
        .single();

      if (tenantError || !tenant) {
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 404 }
        );
      }
      tenantSubdomain = tenant.subdomain;
    }

    // Check if staff with this email already exists
    const { data: existingStaff } = await supabase
      .from('staff')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('email', email)
      .single();

    if (existingStaff) {
      return NextResponse.json(
        { error: 'Staff with this email already exists for this tenant' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await SecurityService.hashPassword(password);

    // Create staff user
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .insert({
        tenant_id: tenantId,
        email,
        name,
        role,
        password_hash: passwordHash,
        is_active: true,
      })
      .select()
      .single();

    if (staffError) {
      console.error('[create-staff] Error creating staff:', staffError);
      return NextResponse.json(
        { error: 'Failed to create staff user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      staff: {
        id: staff.id,
        email: staff.email,
        name: staff.name,
        role: staff.role,
        tenantSubdomain,
      },
      message: `Staff user created successfully. Can access ${tenantSubdomain}.booqing.my.id/admin`,
    });
  } catch (error) {
    console.error('[create-staff] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
