import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

interface AuthRequest {
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

      if (error || !admin || !admin.is_active) {
          console.error('SuperAdmin login error:', error);
          return NextResponse.json({
            success: false,
            error: 'Invalid superadmin credentials'
          }, { status: 401 });
        }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, admin.password_hash);
      if (!isValidPassword) {
          return NextResponse.json({
            success: false,
            error: 'Invalid password'
          }, { status: 401 });
        }

      // Update last login timestamp
      await supabase
        .from('super_admins')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', admin.id);

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

      // Set response with auth cookie using inline session encoding
      const response = NextResponse.json({
        success: true,
        message: 'SuperAdmin login successful',
        user: {
          name: sessionData.name,
          email: sessionData.email,
          role: sessionData.role,
          tenantId: sessionData.tenantId,
          isSuperAdmin: sessionData.isSuperAdmin,
        }
      });

      // Use inline session encoding like in /api/auth/login
      const inlineSession = 'inline.' + btoa(JSON.stringify(sessionData));
      response.cookies.set('tenant-auth', inlineSession, {
        httpOnly: true,
        secure: true, // Always use true in production
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;

    } else {
      // Owner/Staff authentication via tenants/staff tables  
      return handleTenantAuth(request, supabase, loginType, email, password);
    }

  } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 500 }
      );
    }
  }

// Helper function for Owner/Staff authentication
async function handleTenantAuth(
  request: NextRequest,
  supabase: any,
  loginType: 'owner' | 'staff',
  email: string,
  password: string
) {
  try {
    console.log('[handleTenantAuth] Login attempt:', { loginType, email });
    
    // First, find the tenant by subdomain or email
    // Since we don't have subdomain context here, we'll need to determine the proper approach
    // For now, we'll look for a tenant with the given email
    let tenant = null;
    
    // Try to find existing tenant
    const { data: existingTenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('[handleTenantAuth] Error finding tenant:', error.message);
    }
    
    console.log('[handleTenantAuth] Tenant found:', existingTenant ? 'YES' : 'NO');
    
    if (error || !existingTenant) {
      console.error('[handleTenantAuth] Tenant not found for email:', email);
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }

    tenant = existingTenant;

    // Now find the user (owner or staff) based on loginType
    if (loginType === 'owner') {
      // Verify password hash for owner
      console.log('[handleTenantAuth] Owner login - checking password_hash exists:', !!tenant.password_hash);
      
      if (tenant.password_hash) {
        try {
          const isValidPassword = await bcrypt.compare(password, tenant.password_hash);
          console.log('[handleTenantAuth] Password verification result:', isValidPassword);
          
          if (!isValidPassword) {
            // Increment login attempts
            const newLoginAttempts = (tenant.login_attempts || 0) + 1;
            const shouldLock = newLoginAttempts >= 5;
            await supabase
              .from('tenants')
              .update({ 
                login_attempts: newLoginAttempts,
                locked_until: shouldLock ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : null
              })
              .eq('id', tenant.id);
              
            console.error('[handleTenantAuth] Invalid password for owner:', email);
            return NextResponse.json({
              success: false,
              error: 'Invalid credentials'
            }, { status: 401 });
          }
        } catch (bcryptError) {
          console.error('[handleTenantAuth] Bcrypt compare error:', bcryptError);
          return NextResponse.json({
            success: false,
            error: 'Authentication error'
          }, { status: 401 });
        }
        
        // Reset login attempts and update last login on success
        await supabase
          .from('tenants')
          .update({ 
            login_attempts: 0,
            locked_until: null,
            last_login_at: new Date().toISOString()
          })
          .eq('id', tenant.id);
      } else {
        return NextResponse.json({
          success: false,
          error: 'No password set for this tenant'
        }, { status: 400 });
      }

      // Create session data for owner
      const sessionData = {
        userId: tenant.id,
        tenantId: tenant.id,
        role: 'owner',
        permissions: ['*'], // Owner has all permissions
        email: tenant.email,
        name: tenant.owner_name,
      };

      // Set response with auth cookie using inline session encoding
      const response = NextResponse.json({
        success: true,
        message: 'Business owner login successful',
        user: {
          name: sessionData.name,
          email: sessionData.email,
          role: sessionData.role,
          tenantId: sessionData.tenantId,
        }
      });

      // Use inline session encoding
      const inlineSession = 'inline.' + btoa(JSON.stringify(sessionData));
      response.cookies.set('tenant-auth', inlineSession, {
        httpOnly: true,
        secure: true, // Always use true in production
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;
      
    } else { // Staff login
      // Find staff member
      const { data: staffMember, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (staffError || !staffMember) {
        console.error('Staff member not found:', staffError);
        return NextResponse.json({
          success: false,
          error: 'Staff member not found'
        }, { status: 401 });
      }

      // Verify staff password
      if (staffMember.password_hash) {
        const isValidPassword = await bcrypt.compare(password, staffMember.password_hash);
        if (!isValidPassword) {
          // Increment login attempts
          const newLoginAttempts = (staffMember.login_attempts || 0) + 1;
          const shouldLock = newLoginAttempts >= 5;
          await supabase
            .from('staff')
            .update({ 
              login_attempts: newLoginAttempts,
              locked_until: shouldLock ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : null
            })
            .eq('id', staffMember.id);
            
          return NextResponse.json({
            success: false,
            error: 'Invalid password'
          }, { status: 401 });
        }
        
        // Reset login attempts and update last login on success
        await supabase
          .from('staff')
          .update({ 
            login_attempts: 0,
            locked_until: null,
            last_login_at: new Date().toISOString()
          })
          .eq('id', staffMember.id);
      } else {
        return NextResponse.json({
          success: false,
          error: 'No password set for this staff member'
        }, { status: 400 });
      }

      // Create session data for staff
      const sessionData = {
        userId: staffMember.id,
        tenantId: tenant.id,
        role: staffMember.role || 'staff',
        permissions: Array.isArray(staffMember.permissions) ? staffMember.permissions : [],
        email: staffMember.email,
        name: staffMember.name,
      };

      // Set response with auth cookie using inline session encoding
      const response = NextResponse.json({
        success: true,
        message: 'Staff member login successful',
        user: {
          name: sessionData.name,
          email: sessionData.email,
          role: sessionData.role,
          tenantId: sessionData.tenantId,
        }
      });

      // Use inline session encoding
      const inlineSession = 'inline.' + btoa(JSON.stringify(sessionData));
      response.cookies.set('tenant-auth', inlineSession, {
        httpOnly: true,
        secure: true, // Always use true in production
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;
    }
  } catch (error) {
    console.error('Tenant auth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      success: false,
      error: `Authentication failed: ${errorMessage}`
    }, { status: 500 });
  }
}
