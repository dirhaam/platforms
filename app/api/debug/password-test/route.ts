export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('🔍 Testing password for:', email);
    console.log('🔍 Password provided:', password);

    // Get user data
    const { data: admin, error: findError } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', email)
      .single();

    if (findError || !admin) {
      console.log('❌ User not found:', findError?.message);
      return NextResponse.json({
        success: false,
        error: 'User not found',
        details: findError?.message
      });
    }

    console.log('✅ User found:', admin.email);
    console.log('🔍 Password hash:', admin.password_hash.substring(0, 20) + '...');

    // Test password comparison
    try {
      const result = await bcrypt.compare(password, admin.password_hash);
      console.log('🔍 Password compare result:', result);

      // Test with wrong password
      const wrongResult = await bcrypt.compare('wrongpassword', admin.password_hash);
      console.log('🔍 Wrong password result:', wrongResult);

      return NextResponse.json({
        success: true,
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          isActive: admin.is_active
        },
        passwordValid: result,
        passwordHash: admin.password_hash,
        tests: {
          correctPassword: result,
          wrongPassword: wrongResult
        }
      });

    } catch (bcryptError) {
      const errorMessage = bcryptError instanceof Error ? bcryptError.message : 'Unknown error occurred';
      console.log('❌ bcrypt error:', bcryptError);
      return NextResponse.json({
        success: false,
        error: 'Password comparison failed',
        details: errorMessage
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.log('❌ Server error:', error);
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}
