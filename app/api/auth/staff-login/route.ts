import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SecurityService } from '@/lib/security/security-service';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { email, password, subdomain } = body;
    
    // Also check x-tenant-id header if subdomain not in body
    if (!subdomain) {
      subdomain = request.headers.get('x-tenant-id');
    }

    // Validate inputs
    if (!email || !password || !subdomain) {
      return NextResponse.json(
        { error: 'Missing email, password, or subdomain' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Get tenant by subdomain
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, subdomain, business_name')
      .eq('subdomain', subdomain.toLowerCase())
      .single();

    if (tenantError || !tenant) {
      console.error('[staff-login] Tenant not found:', subdomain);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 2. Get staff member
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id, name, email, role, password_hash, is_active, locked_until, login_attempts')
      .eq('tenant_id', tenant.id)
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (staffError || !staff) {
      console.error('[staff-login] Staff not found:', { email, tenantId: tenant.id });
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 3. Check if account is locked
    if (staff.locked_until && new Date(staff.locked_until) > new Date()) {
      console.warn('[staff-login] Account locked:', staff.id);
      return NextResponse.json(
        { error: 'Account is temporarily locked. Try again later.' },
        { status: 403 }
      );
    }

    // 4. Verify password
    // In development, allow direct test password comparison
    const isDevelopment = process.env.NODE_ENV !== 'production';
    let isValidPassword = false;

    if (isDevelopment && password === 'test123') {
      // Development mode: allow test password directly
      isValidPassword = true;
      console.warn('[staff-login] Using development test password');
    } else {
      // Production: use bcrypt verification
      try {
        isValidPassword = await SecurityService.verifyPassword(password, staff.password_hash);
      } catch (pwError) {
        console.error('[staff-login] Password verification error:', pwError);
        isValidPassword = false;
      }
    }

    if (!isValidPassword) {
      // Increment failed attempts
      const newAttempts = (staff.login_attempts || 0) + 1;
      const shouldLock = newAttempts >= 5;

      await supabase
        .from('staff')
        .update({
          login_attempts: newAttempts,
          locked_until: shouldLock ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : null,
        })
        .eq('id', staff.id);

      console.warn('[staff-login] Invalid password attempt:', { staffId: staff.id, attempts: newAttempts });

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 5. Reset failed attempts on successful login
    await supabase
      .from('staff')
      .update({
        login_attempts: 0,
        locked_until: null,
        last_login_at: new Date().toISOString(),
      })
      .eq('id', staff.id);

    // 6. Create session token
    const sessionToken = await SecurityService.hashPassword(
      `${staff.id}:${Date.now()}:${Math.random()}`
    );

    // Store session in database (optional - for reference)
    await supabase
      .from('sessions')
      .insert({
        id: `staff_${staff.id}_${Date.now()}`,
        user_id: staff.id,
        tenant_id: tenant.id,
        session_data: {
          type: 'staff',
          staffId: staff.id,
          staffName: staff.name,
          staffRole: staff.role,
          tenantId: tenant.id,
          tenantSubdomain: tenant.subdomain,
          tenantName: tenant.business_name,
        },
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      });

    // 7. Set secure cookie with session using inline encoding
    const sessionData = {
      staffId: staff.id,
      staffName: staff.name,
      staffRole: staff.role,
      tenantId: tenant.id,
      tenantSubdomain: tenant.subdomain,
      tenantName: tenant.business_name,
      loginTime: Date.now(),
    };

    const cookieStore = await cookies();
    // Use inline encoding like superadmin
    const inlineSession = 'inline.' + btoa(JSON.stringify(sessionData));
    cookieStore.set({
      name: 'tenant_session',
      value: inlineSession,
      httpOnly: true,
      secure: true, // Always use true in production
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    console.info('[staff-login] Login successful:', { staffId: staff.id, tenantId: tenant.id });

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      redirect: `/tenant/admin?subdomain=${tenant.subdomain}`,
      user: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        tenantId: tenant.id,
        tenantSubdomain: tenant.subdomain,
        tenantName: tenant.business_name,
      },
    });
  } catch (error) {
    console.error('[staff-login] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
