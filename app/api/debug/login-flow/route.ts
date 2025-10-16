import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password, loginType } = await request.json();
    
    console.log('🔬 Full Login Flow Debug:');
    console.log('  Email:', email);
    console.log('  Password:', password ? '***' : 'MISSING');
    console.log('  LoginType:', loginType);
    
    // Step 1: Check environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('  Env Check:');
    console.log('    Supabase URL:', supabaseUrl ? '✅ SET' : '❌ MISSING');
    console.log('    Service Key:', supabaseKey ? '✅ SET' : '❌ MISSING');
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Environment variables missing',
        step: 'environment check',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      });
    }
    
    // Step 2: Database connection
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('  ✅ Supabase client created');
    
    // Step 3: Find superadmin
    const { data: superadmin, error: fetchError } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', email)
      .single();
    
    console.log('  Database Query:');
    console.log('    Found user:', !!superadmin);
    console.log('    Query error:', fetchError?.message || 'None');
    
    if (fetchError || !superadmin) {
      return NextResponse.json({
        success: false,
        error: fetchError?.message || 'User not found',
        step: 'database query',
        queryError: fetchError?.message
      });
    }
    
    // Step 4: Check user status
    console.log('  User Status:');
    console.log('    Active:', superadmin.is_active);
    console.log('    Locked until:', superadmin.locked_until);
    
    if (!superadmin.is_active) {
      return NextResponse.json({
        success: false,
        error: 'Account is deactivated',
        step: 'user status check'
      });
    }
    
    if (superadmin.locked_until && new Date(superadmin.locked_until) > new Date()) {
      return NextResponse.json({
        success: false,
        error: 'Account is temporarily locked',
        step: 'account lock check'
      });
    }
    
    // Step 5: Password verification
    console.log('  Password Verification:');
    console.log('    Has password hash:', !!superadmin.password_hash);
    console.log('    Password hash length:', superadmin.password_hash?.length || 0);
    
    if (!superadmin.password_hash) {
      return NextResponse.json({
        success: false,
        error: 'No password hash found',
        step: 'password hash check'
      });
    }
    
    const isValidPassword = await bcrypt.compare(password, superadmin.password_hash);
    console.log('    Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials - password mismatch',
        step: 'password verification',
        debug: {
          providedPassword: password,
          storedHash: superadmin.password_hash.substring(0, 10) + '...'
        }
      });
    }
    
    // Step 6: Success
    console.log('  ✅ Login successful!');
    
    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: superadmin.id,
        email: superadmin.email,
        name: superadmin.name,
        role: 'superadmin',
        tenantId: 'platform',
        isSuperAdmin: true
      },
      allSteps: {
        environment: '✅',
        database: '✅',
        userFound: '✅',
        userStatus: '✅',
        password: '✅'
      }
    });
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Full login flow debug endpoint',
    usage: 'POST with email, password, and loginType to debug complete authentication'
  });
}
