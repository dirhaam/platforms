import { NextRequest, NextResponse } from 'next/server';
import { AuthMiddleware } from '@/lib/auth/auth-middleware';
import { SettingsService } from '@/lib/settings/settings-service';

export async function PUT(request: NextRequest) {
  try {
    // Authenticate and check permissions
    const { session, error } = await AuthMiddleware.authenticateApiRoute(
      request,
      ['manage_settings']
    );

    if (error || !session) {
      return NextResponse.json(
        { success: false, error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['businessName', 'businessCategory', 'ownerName', 'email', 'phone'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Update business profile
    const result = await SettingsService.updateBusinessProfile(session.tenantId, body);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Business profile updated successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Business profile update API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}