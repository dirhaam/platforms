import { NextResponse } from 'next/server';
import { SuperAdminService } from '@/lib/auth/superadmin-service';

export async function POST() {
  try {
    console.log('🔧 Production SuperAdmin setup started...');
    
    const DEFAULT_EMAIL = 'superadmin@booqing.my.id';
    const DEFAULT_PASSWORD = 'ChangeThisPassword123!';
    
    // Check if superadmin already exists
    const existing = await SuperAdminService.findByEmail(DEFAULT_EMAIL);
    
    if (existing) {
      console.log('✅ SuperAdmin already exists in production');
      return NextResponse.json({
        success: true,
        message: 'SuperAdmin already exists',
        exists: true,
        email: DEFAULT_EMAIL,
        name: existing.name,
        isActive: existing.isActive,
      });
    }
    
    console.log('❌ SuperAdmin not found, creating in production...');
    
    // Create superadmin
    const superadmin = await SuperAdminService.create({
      email: DEFAULT_EMAIL,
      name: 'Production Super Admin',
      password: DEFAULT_PASSWORD,
    });
    
    console.log('✅ Production SuperAdmin created successfully');
    
    // Test authentication
    console.log('🧪 Testing production authentication...');
    const authResult = await SuperAdminService.authenticate(DEFAULT_EMAIL, DEFAULT_PASSWORD);
    
    if (authResult.success) {
      console.log('✅ Production authentication test successful');
    } else {
      console.error('❌ Production authentication test failed:', authResult.error);
    }
    
    return NextResponse.json({
      success: true,
      message: 'SuperAdmin created successfully',
      created: true,
      email: DEFAULT_EMAIL,
      password: DEFAULT_PASSWORD,
      name: superadmin.name,
      id: superadmin.id,
      authTest: {
        success: authResult.success,
        error: authResult.error,
      }
    });
    
  } catch (error) {
    console.error('💥 Production SuperAdmin setup failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const DEFAULT_EMAIL = 'superadmin@booqing.my.id';
    
    // Check if superadmin exists
    const existing = await SuperAdminService.findByEmail(DEFAULT_EMAIL);
    
    if (existing) {
      return NextResponse.json({
        success: true,
        exists: true,
        email: DEFAULT_EMAIL,
        name: existing.name,
        isActive: existing.isActive,
        loginAttempts: existing.loginAttempts,
        message: 'SuperAdmin exists - use POST to recreate or test'
      });
    } else {
      return NextResponse.json({
        success: false,
        exists: false,
        email: DEFAULT_EMAIL,
        message: 'SuperAdmin not found - use POST to create'
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
