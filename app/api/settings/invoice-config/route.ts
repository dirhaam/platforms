export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { InvoiceSettingsService } from '@/lib/invoice/invoice-settings-service';
import { getTenantFromRequest } from '@/lib/auth/tenant-auth';

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await InvoiceSettingsService.getSettings(tenant.id);
    
    // Cache for 5 minutes (300 seconds) - settings change less frequently
    const response = NextResponse.json({ settings });
    response.headers.set('Cache-Control', 'private, max-age=300');
    return response;
  } catch (error) {
    console.error('[InvoiceSettings] GET failed:', error);
    return NextResponse.json({ error: 'Failed to load invoice settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();

    console.log('[InvoiceSettings] POST payload received:', {
      tenantId: tenant.id,
      hasSettings: !!payload
    });

    const result = await InvoiceSettingsService.updateSettings(tenant.id, payload);

    if (!result.success) {
      console.log('[InvoiceSettings] POST update failed:', result.error);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const refreshed = await InvoiceSettingsService.getSettings(tenant.id);

    console.log('[InvoiceSettings] POST settings saved and refreshed');

    return NextResponse.json({ settings: refreshed }, { status: 200 });
  } catch (error) {
    let errorMessage = 'Failed to save invoice settings';

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error('[InvoiceSettings] POST failed:', {
      message: errorMessage,
      error
    });

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
