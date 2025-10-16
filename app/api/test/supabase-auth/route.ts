import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    console.log('🧪 Supabase auth test:', { email, password: '***' });
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables not configured');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Find superadmin
    const { data: superadmin, error: fetchError } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', email)
      .single();
    
    if (fetchError || !superadmin) {
      return NextResponse.json({
        success: false,
        error: 'SuperAdmin not found',
        details: fetchError?.message
      });
    }
    
    // Check if active
    if (!superadmin.is_active) {
      return NextResponse.json({
        success: false,
        error: 'Account is deactivated'
      });
    }
    
    // Check if locked
    if (superadmin.locked_until && new Date(superadmin.locked_until) > new Date()) {
      return NextResponse.json({
        success: false,
        error: 'Account is temporarily locked'
      });
    }
    
    // Verify password
    let isValidPassword = false;
    if (superadmin.password_hash) {
      isValidPassword = await bcrypt.compare(password, superadmin.password_hash);
    }
    
    if (!isValidPassword) {
      // Increment login attempts
      await supabase
        .from('super_admins')
        .update({ 
          login_attempts: superadmin.login_attempts + 1,
          locked_until: (superadmin.login_attempts + 1) >= 5 
            ? new Date(Date.now() + 30 * 60 * 1000).toISOString() 
            : null
        })
        .eq('id', superadmin.id);
      
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Reset login attempts on success
    await supabase
      .from('super_admins')
      .update({ 
        login_attempts: 0,
        locked_until: null,
        last_login_at: new Date().toISOString()
      })
      .eq('id', superadmin.id);
    
    return NextResponse.json({
      success: true,
      authenticated: true,
      superAdmin: {
        id: superadmin.id,
        email: superadmin.email,
        name: superadmin.name,
        isActive: superadmin.is_active,
        loginAttempts: superadmin.login_attempts,
      },
      method: 'supabase',
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('❌ Supabase auth test error:', error);
    return NextResponse.json({
      success: false,
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Supabase auth test endpoint',
    usage: 'POST with email and password to test authentication',
    testCredentials: {
      email: 'superadmin@booqing.my.id',
      password: 'ChangeThisPassword123!',
    }
  });
}
