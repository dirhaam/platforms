export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { TenantAuth } from '@/lib/auth/tenant-auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('🔍 Testing full authentication...');
    console.log('🔍 Email:', email);
    console.log('🔍 Password:', password);

    // Test SuperAdminService directly
    let result = null;
    try {
      const { SuperAdminService } = await import('@/lib/auth/superadmin-service');
      console.log('🔍 Testing SuperAdminService directly...');
      
      const authResult = await SuperAdminService.authenticate(email, password);
      console.log('🔍 SuperAdminService result:', authResult);
      
      // Then test TenantAuth
      console.log('🔍 Testing TenantAuth...');
      result = await TenantAuth.authenticateSuperAdmin(
        email, 
        password, 
        '127.0.0.1', 
        'Mozilla/5.0 (debug)'
      );

      console.log('🔍 TenantAuth result:', result);

    } catch (importError) {
      const errorMessage = importError instanceof Error ? importError.message : 'Unknown error occurred';
      console.log('❌ Import error:', importError);
      return NextResponse.json({
        success: false,
        error: 'Import failed',
        details: errorMessage
      });
    }

    return NextResponse.json({
      success: true,
      result: result
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('❌ Full auth error:', error);
    return NextResponse.json({
      success: false,
      error: errorMessage,
      stack: errorStack
    }, { status: 500 });
  }
}
