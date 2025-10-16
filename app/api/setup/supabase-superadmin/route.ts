import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    console.log('🔧 Supabase SuperAdmin setup started...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables not configured');
    }
    
    console.log('🔗 Connecting to Supabase:', supabaseUrl);
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const DEFAULT_EMAIL = 'superadmin@booqing.my.id';
    const DEFAULT_PASSWORD = 'ChangeThisPassword123!';
    
    // Check if superadmin already exists
    const { data: existing, error: fetchError } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', DEFAULT_EMAIL)
      .single();
    
    if (existing) {
      console.log('✅ SuperAdmin already exists in Supabase');
      return NextResponse.json({
        success: true,
        message: 'SuperAdmin already exists',
        exists: true,
        email: DEFAULT_EMAIL,
        name: existing.name,
        isActive: existing.is_active,
      });
    }
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(`Failed to check existing superadmin: ${fetchError.message}`);
    }
    
    console.log('❌ SuperAdmin not found, creating in Supabase...');
    
    // Generate password hash
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
    
    // Create superadmin using Supabase client
    const { data: created, error: insertError } = await supabase
      .from('super_admins')
      .insert({
        email: DEFAULT_EMAIL,
        name: 'Production Super Admin',
        password_hash: passwordHash,
        is_active: true,
        login_attempts: 0,
        permissions: ['*'],
        can_access_all_tenants: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (insertError) {
      throw new Error(`Failed to create superadmin: ${insertError.message}`);
    }
    
    console.log('✅ Supabase SuperAdmin created successfully');
    
    // Test authentication (we'll need to implement this with Supabase)
    return NextResponse.json({
      success: true,
      message: 'SuperAdmin created successfully via Supabase',
      created: true,
      email: DEFAULT_EMAIL,
      password: DEFAULT_PASSWORD,
      name: created.name,
      id: created.id,
      method: 'supabase',
    });
    
  } catch (error) {
    console.error('💥 Supabase SuperAdmin setup failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase environment variables not configured',
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const DEFAULT_EMAIL = 'superadmin@booqing.my.id';
    
    // Check if superadmin exists
    const { data: existing, error } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', DEFAULT_EMAIL)
      .single();
    
    if (existing) {
      return NextResponse.json({
        success: true,
        exists: true,
        email: DEFAULT_EMAIL,
        name: existing.name,
        isActive: existing.is_active,
        loginAttempts: existing.login_attempts,
        method: 'supabase',
        message: 'SuperAdmin exists via Supabase'
      });
    } else {
      return NextResponse.json({
        success: false,
        exists: false,
        email: DEFAULT_EMAIL,
        method: 'supabase',
        message: 'SuperAdmin not found - use POST to create via Supabase'
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
