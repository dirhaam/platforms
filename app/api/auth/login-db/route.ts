import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

interface LoginRequest {
  email: string;
  password: string;
  loginType: 'owner' | 'staff' | 'superadmin';
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, loginType } = await request.json();

    // Validate input
    if (!email || !password || !loginType) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and login type are required' },
        { status: 400 }
      );
    }

    console.log('🔐 Database authentication request:', { email, loginType });

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (loginType === 'superadmin') {
      // SuperAdmin authentication via super_admins table
      const { data: admin, error } = await supabase
        .from('super_admins')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !admin?.is_active) {
        return NextResponse.json(
          { success: false, error: 'Invalid superadmin credentials' },
          { status: 401 }
        );
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, admin.password_hash);
      if (!isValidPassword) {
        return NextResponse.json(
          { success: false, error: 'Invalid password' },
          { status: 401 }
        );
      }

      // Create session and set cookie
      const sessionData = {
        userId: admin.id,
        tenantId: 'platform',
        role: 'superadmin',
        permissions: admin.permissions || ['*'],
        email: admin.email,
        name: admin.name,
        isSuperAdmin: true,
      };

      const response = NextResponse.json({
        success: true,
        message: 'SuperAdmin login successful',
        user: sessionData
      });

      response.cookies.set('auth-token', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 2 days
        path: '/',
      });

      return response;
    }

    // Owner/Staff authentication via tenants table  
    console.log('🏢 Tenant authentication for:', loginType);
    
    let tenant = null;
    
    // Check if tenant exists
    const { data: existingTenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('email', email)
      .single();

    console.log('📋 Existing tenant found:', existingTenant?.business_name || 'Not found');

    if (error || !existingTenant?.is_active) {
      return NextResponse.json(
        { success: false, error: error?.message || 'Tenant not found or inactive' },
        { status: 401 }
      );
    }

    tenant = existingTenant;

    // Check password
    if (tenant.password_hash) {
      const isValidPassword = await bcrypt.compare(password, tenant.password_hash);
      if (!isValidPassword) {
        return NextResponse.json(
          { success: false, error: 'Incorrect password' },
          { status: 401 }
        );
      }
    } else {
      // Require password if user doesn't have one
      return NextResponse.json({
        success: false,
        error: 'No password set for this tenant'
      }, { status: 400 });
    }

    // Create session data
    const sessionData = {
      userId: tenant.id,
      tenantId: tenant.id,
      role: loginType === 'owner' ? 'owner' : 'staff',
      permissions: loginType === 'owner' 
        ? ['tenant.*', 'read.*', 'write.*'] 
        : ['read.*'],
      email: tenant.email,
      name: tenant.business_name || tenant.email.split('@')[0],
      loginTime: new Date().toISOString(),
    };

    const response = NextResponse.json({
      success: true,
      message: `${loginType} login successful`,
      user: sessionData
    });

    response.cookies.set('auth-token', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 2 days
      path: '/',
    });

    console.log('🔐 Auth response created for:', loginType);
    return response;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ Database auth error:', errorMessage);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
