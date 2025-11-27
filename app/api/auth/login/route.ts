export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { SecurityService } from '@/lib/security/security-service';

interface LoginRequest {
  email: string;
  password: string;
  loginType: 'owner' | 'staff' | 'superadmin';
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password, loginType } = body;

    // Validate input
    if (!email || !password || !loginType) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and login type are required' },
        { status: 400 }
      );
    }

    console.log('🔐 Login attempt:', { email, loginType });

    // For SuperAdmin, use Supabase directly
    if (loginType === 'superadmin') {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json(
          { success: false, error: 'Server configuration error' },
          { status: 500 }
        );
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Find superadmin
      const { data: superadmin, error: fetchError } = await supabase
        .from('super_admins')
        .select('*')
        .eq('email', email)
        .single();
      
      if (fetchError || !superadmin) {
        console.log('❌ SuperAdmin not found:', fetchError?.message);
        return NextResponse.json(
          { success: false, error: 'Invalid credentials' },
          { status: 401 }
        );
      }
      
      // Check if active
      if (!superadmin.is_active) {
        return NextResponse.json(
          { success: false, error: 'Account is deactivated' },
          { status: 401 }
        );
      }
      
      // Check if locked
      if (superadmin.locked_until && new Date(superadmin.locked_until) > new Date()) {
        return NextResponse.json(
          { success: false, error: 'Account is temporarily locked due to too many failed attempts' },
          { status: 401 }
        );
      }
      
      // Verify password
      let isValidPassword = false;
      if (superadmin.password_hash) {
        isValidPassword = await bcrypt.compare(password, superadmin.password_hash);
      }
      
      if (!isValidPassword) {
        // Increment login attempts
        const newAttempts = superadmin.login_attempts + 1;
        const shouldLock = newAttempts >= 5;
        
        await supabase
          .from('super_admins')
          .update({ 
            login_attempts: newAttempts,
            locked_until: shouldLock 
              ? new Date(Date.now() + 30 * 60 * 1000).toISOString() 
              : null
          })
          .eq('id', superadmin.id);
        
        // Log failed login
        await SecurityService.logSecurityEvent(
          'platform',
          superadmin.id,
          'login',
          false,
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          request.headers.get('user-agent') || 'unknown',
          'superadmin-login',
          { email, reason: 'invalid_password', attempts: newAttempts }
        );
        
        console.log('❌ Invalid password for:', email);
        return NextResponse.json(
          { success: false, error: 'Invalid credentials' },
          { status: 401 }
        );
      }
      
      // Reset login attempts on successful login
      await supabase
        .from('super_admins')
        .update({ 
          login_attempts: 0,
          locked_until: null,
          last_login_at: new Date().toISOString()
        })
        .eq('id', superadmin.id);
      
      // Create session
      const session = {
        userId: superadmin.id,
        tenantId: 'platform',
        role: 'superadmin',
        permissions: ['*'],
        email: superadmin.email,
        name: superadmin.name,
        isSuperAdmin: true,
      };
      
      // Create response with authentication cookie
      const response = NextResponse.json({
        success: true,
        user: {
          name: session.name,
          email: session.email,
          role: session.role,
          tenantId: session.tenantId,
          isSuperAdmin: session.isSuperAdmin,
        },
      });
      
      // Set authentication cookie using inline session for production
      const inlineSession = 'inline.' + btoa(JSON.stringify(session));
      response.cookies.set('tenant-auth', inlineSession, {
        httpOnly: true,
        secure: true, // Always use true in production
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
      
      // Log successful login
      await SecurityService.logSecurityEvent(
        'platform',
        superadmin.id,
        'login',
        true,
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        request.headers.get('user-agent') || 'unknown',
        'superadmin-login',
        { email }
      );
      
      console.log('✅ SuperAdmin login successful:', email);
      return response;
    }

    // For owner and staff, keep the original logic (will need Supabase conversion later)
    // For now, return error to prevent database connection issues
    return NextResponse.json(
      { success: false, error: 'Owner and Staff login temporarily disabled. Please use SuperAdmin.' },
      { status: 503 }
    );

  } catch (error) {
    console.error('💥 Login API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}