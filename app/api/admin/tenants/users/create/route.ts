import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SecurityService } from '@/lib/security/security-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, email, name, role = 'staff', password } = body;

    // Validate inputs
    if (!tenantId || !email || !name || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, email, name, password' },
        { status: 400 }
      );
    }

    if (!['admin', 'staff'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "admin" or "staff"' },
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

    // Check if user with this email already exists
    const { data: existingUser } = await supabase
      .from('staff')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists for this tenant' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await SecurityService.hashPassword(password);

    // Determine permissions based on role
    let permissions: string[] = [];
    if (role === 'admin') {
      permissions = ['*']; // Full access
    } else {
      permissions = [
        'bookings.view',
        'bookings.create',
        'bookings.update',
        'customers.view',
        'customers.create',
        'customers.update',
      ];
    }

    // Create user
    const { data: user, error: userError } = await supabase
      .from('staff')
      .insert({
        tenant_id: tenantId,
        email,
        name,
        role,
        password_hash: passwordHash,
        permissions,
        is_active: true,
      })
      .select()
      .single();

    if (userError) {
      console.error('[create-user] Error creating user:', userError);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    console.log(`[create-user] Created ${role} user: ${email} for tenant: ${tenant.subdomain}`);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantSubdomain: tenant.subdomain,
      },
      message: `${role === 'admin' ? 'Owner/Admin' : 'Staff'} user created successfully. Can access ${tenant.subdomain}.booqing.my.id/admin`,
    });
  } catch (error) {
    console.error('[create-user] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
