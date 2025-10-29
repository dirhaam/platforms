export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/tenant-auth';
import {
  InvoiceBrandingService,
  InvoiceBrandingSettings,
} from '@/lib/invoice/invoice-branding-service';

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await InvoiceBrandingService.getSettings(tenant.id);
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('[InvoiceBranding] GET failed:', error);
    return NextResponse.json({ error: 'Failed to load invoice settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = (await request.json()) as Partial<InvoiceBrandingSettings>;

    const result = await InvoiceBrandingService.updateSettings(tenant.id, payload);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const refreshed = await InvoiceBrandingService.getSettings(tenant.id);

    return NextResponse.json({ settings: refreshed }, { status: 200 });
  } catch (error) {
    console.error('[InvoiceBranding] POST failed:', error);
    return NextResponse.json({ error: 'Failed to save invoice settings' }, { status: 500 });
  }
}
