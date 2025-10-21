import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword, subdomain, type } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'email and newPassword required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    if (type === 'staff' && subdomain) {
      // Get tenant first
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', subdomain.toLowerCase())
        .single();

      if (!tenant) {
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 404 }
        );
      }

      // Update staff password
      const { data, error } = await supabase
        .from('staff')
        .update({
          password_hash: passwordHash,
          login_attempts: 0,
          locked_until: null,
        })
        .eq('tenant_id', tenant.id)
        .eq('email', email.toLowerCase())
        .select();

      if (error || !data || data.length === 0) {
        return NextResponse.json(
          { error: 'Staff not found or update failed' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Staff password updated successfully',
        staff: {
          id: data[0]?.id,
          email: data[0]?.email,
          name: data[0]?.name,
          newPassword: newPassword,
          loginAttempts: 0,
          lockedUntil: null,
        },
      });
    } else if (type === 'owner') {
      // Update owner (tenant) password
      const { data, error } = await supabase
        .from('tenants')
        .update({
          password_hash: passwordHash,
          login_attempts: 0,
          locked_until: null,
        })
        .eq('email', email)
        .select();

      if (error || !data || data.length === 0) {
        return NextResponse.json(
          { error: 'Owner not found or update failed' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Owner password updated successfully',
        owner: {
          id: data[0]?.id,
          email: data[0]?.email,
          subdomain: data[0]?.subdomain,
          newPassword: newPassword,
          loginAttempts: 0,
          lockedUntil: null,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'type must be "staff" or "owner"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Set password error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
