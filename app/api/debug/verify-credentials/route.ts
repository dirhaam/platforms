import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, subdomain, type } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'email and password required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const result: any = {
      type: type || 'owner',
      email,
      password: '***hidden***',
      subdomain,
      checks: {},
    };

    if (type === 'staff' && subdomain) {
      // Get tenant first
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id, subdomain, business_name')
        .eq('subdomain', subdomain.toLowerCase())
        .single();

      result.checks.tenant = {
        found: !!tenant,
        error: tenantError?.message,
      };

      if (!tenant) {
        return NextResponse.json(result);
      }

      // Get staff
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('id, name, email, role, password_hash, is_active, locked_until, login_attempts')
        .eq('tenant_id', tenant.id)
        .eq('email', email.toLowerCase())
        .single();

      result.checks.staff = {
        found: !!staff,
        error: staffError?.message,
      };

      if (!staff) {
        return NextResponse.json(result);
      }

      // Check password
      if (staff.password_hash) {
        try {
          const isValid = await bcrypt.compare(password, staff.password_hash);
          result.checks.passwordMatch = isValid;
          result.checks.hashPrefix = staff.password_hash.substring(0, 10) + '...';
        } catch (err) {
          result.checks.passwordCheckError = (err as Error).message;
        }
      } else {
        result.checks.passwordMatch = false;
        result.checks.note = 'No password hash stored';
      }

      // Check lock status
      result.checks.isActive = staff.is_active;
      result.checks.loginAttempts = staff.login_attempts;
      result.checks.lockedUntil = staff.locked_until;
      result.checks.isLocked = staff.locked_until ? new Date(staff.locked_until) > new Date() : false;
    } else {
      // Owner check
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id, email, subdomain, password_hash, owner_name, login_attempts, locked_until')
        .eq('email', email)
        .single();

      result.checks.tenant = {
        found: !!tenant,
        error: tenantError?.message,
        subdomain: tenant?.subdomain,
      };

      if (!tenant) {
        return NextResponse.json(result);
      }

      // Check password
      if (tenant.password_hash) {
        try {
          const isValid = await bcrypt.compare(password, tenant.password_hash);
          result.checks.passwordMatch = isValid;
          result.checks.hashPrefix = tenant.password_hash.substring(0, 10) + '...';
        } catch (err) {
          result.checks.passwordCheckError = (err as Error).message;
        }
      } else {
        result.checks.passwordMatch = false;
        result.checks.note = 'No password hash stored';
      }

      // Check lock status
      result.checks.loginAttempts = tenant.login_attempts;
      result.checks.lockedUntil = tenant.locked_until;
      result.checks.isLocked = tenant.locked_until ? new Date(tenant.locked_until) > new Date() : false;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Verify credentials error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
