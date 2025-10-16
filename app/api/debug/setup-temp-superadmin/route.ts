import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    console.log('🔧 Creating temporary superadmin for debugging...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase environment variables not configured'
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const email = 'superadmin@booqing.my.id';
    const password = 'ChangeThisPassword123!';
    
    // Generate password hash
    const passwordHash = await bcrypt.hash(password, 12);
    console.log('🔐 Generated password hash:', passwordHash.substring(0, 20) + '...');
    
    // Create or update superadmin
    const { data: existing, error: fetchError } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', email)
      .single();
    
    if (existing) {
      // Update existing one
      const { data: updated, error: updateError } = await supabase
        .from('super_admins')
        .update({
          password_hash: passwordHash,
          is_active: true,
          login_attempts: 0,
          locked_until: null,
          updated_at: new Date().toISOString()
        })
        .eq('email', email)
        .select()
        .single();
      
      if (updateError) {
        throw new Error('Update failed: ' + updateError.message);
      }
      
      console.log('✅ Updated existing superadmin');
      
      return NextResponse.json({
        success: true,
        action: 'updated',
        email: email,
        password: password,
        superadmin: {
          id: updated.id,
          email: updated.email,
          name: updated.name,
          isActive: updated.is_active
        }
      });
    } else {
      // Create new one
      const { data: created, error: insertError } = await supabase
        .from('super_admins')
        .insert({
          email: email,
          name: 'Production Super Admin',
          password_hash: passwordHash,
          is_active: true,
          login_attempts: 0,
          permissions: ['*'],
          can_access_all_tenants: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        throw new Error('Insert failed: ' + insertError.message);
      }
      
      console.log('✅ Created new superadmin');
      
      return NextResponse.json({
        success: true,
        action: 'created',
        email: email,
        password: password,
        superadmin: {
          id: created.id,
          email: created.email,
          name: created.name,
          isActive: created.is_active
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Setup error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Temporary superadmin setup endpoint',
    usage: 'POST to create/update superadmin@example.com credentials'
  });
}
