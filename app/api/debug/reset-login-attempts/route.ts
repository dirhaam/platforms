import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { email, subdomain, type } = await request.json();

    if (!email || !type) {
      return NextResponse.json(
        { error: 'email and type (staff|owner) required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (type === 'staff') {
      if (!subdomain) {
        return NextResponse.json(
          { error: 'subdomain required for staff reset' },
          { status: 400 }
        );
      }

      // Get tenant by subdomain
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', subdomain.toLowerCase())
        .single();

      if (tenantError || !tenant) {
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 404 }
        );
      }

      // Reset staff login attempts
      const { data, error } = await supabase
        .from('staff')
        .update({
          login_attempts: 0,
          locked_until: null,
        })
        .eq('tenant_id', tenant.id)
        .eq('email', email)
        .select();

      if (error || !data) {
        return NextResponse.json(
          { error: 'Staff not found or reset failed' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Staff login attempts reset',
        staff: {
          id: data[0]?.id,
          email: data[0]?.email,
          login_attempts: 0,
          locked_until: null,
        },
      });
    } else if (type === 'owner') {
      // Reset owner login attempts
      const { data, error } = await supabase
        .from('tenants')
        .update({
          login_attempts: 0,
          locked_until: null,
        })
        .eq('email', email)
        .select();

      if (error || !data) {
        return NextResponse.json(
          { error: 'Owner not found or reset failed' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Owner login attempts reset',
        owner: {
          id: data[0]?.id,
          email: data[0]?.email,
          login_attempts: 0,
          locked_until: null,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'type must be "staff" or "owner"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Reset login attempts error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
