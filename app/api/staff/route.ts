import { NextRequest, NextResponse } from 'next/server';
import { StaffAvailabilityService } from '@/lib/booking/staff-availability-service';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const headerTenantId = request.headers.get('x-tenant-id');
        const queryTenantId = searchParams.get('tenantId');
        const tenantIdentifier = headerTenantId ?? queryTenantId;

        if (!tenantIdentifier) {
            return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
        }

        // Resolve tenant ID if subdomain
        let resolvedTenantId = tenantIdentifier;
        const isUUID = resolvedTenantId.length === 36;

        if (!isUUID) {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            const { data: tenant } = await supabase
                .from('tenants')
                .select('id')
                .eq('subdomain', resolvedTenantId)
                .single();

            if (!tenant) {
                return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
            }
            resolvedTenantId = tenant.id;
        }

        const staff = await StaffAvailabilityService.getActiveStaffForTenant(resolvedTenantId);

        return NextResponse.json({ staff });
    } catch (error) {
        console.error('Error fetching staff:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
