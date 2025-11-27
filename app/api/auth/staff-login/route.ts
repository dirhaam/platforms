import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { SecurityService } from '@/lib/security/security-service';

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

    // 4. Verify password using bcrypt
    let isValidPassword = false;

    if (staff.password_hash) {
      try {
        isValidPassword = await bcrypt.compare(password, staff.password_hash);
        console.log('[staff-login] Password verification result:', isValidPassword, 'for', email);
      } catch (pwError) {
        console.error('[staff-login] Password verification error:', pwError);
        isValidPassword = false;
      }
    } else {
      console.warn('[staff-login] No password hash set for staff:', email);
      isValidPassword = false;
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

      // Log failed login attempt
      await SecurityService.logSecurityEvent(
        tenant.id,
        staff.id,
        'login',
        false,
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        request.headers.get('user-agent') || 'unknown',
        'staff-login',
        { email, reason: 'invalid_password', attempts: newAttempts }
      );

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

    // 6. Session will be set via cookie (no need for token)

    // 7. Set secure cookie with session using inline encoding
    // Use same format as other auth endpoints for consistency
    const sessionData = {
      userId: staff.id,
      tenantId: tenant.id,
      role: staff.role || 'staff',
      permissions: [] as string[],
      email: staff.email,
      name: staff.name,
    };

    const cookieStore = await cookies();
    // Use inline encoding like other auth endpoints
    const inlineSession = 'inline.' + btoa(JSON.stringify(sessionData));
    cookieStore.set({
      name: 'tenant-auth',  // Same cookie name as other auth endpoints
      value: inlineSession,
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    // Log successful login
    await SecurityService.logSecurityEvent(
      tenant.id,
      staff.id,
      'login',
      true,
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      request.headers.get('user-agent') || 'unknown',
      'staff-login',
      { email, role: staff.role }
    );

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
