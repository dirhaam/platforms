import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const headerTenantId = request.headers.get('x-tenant-id');
        const queryTenantId = searchParams.get('tenantId');
        const tenantIdentifier = headerTenantId ?? queryTenantId;

        if (!tenantIdentifier) {
            return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
        }

        const supabase = getSupabaseClient();

        // Resolve tenant ID if subdomain
        let resolvedTenantId = tenantIdentifier;
        const isUUID = resolvedTenantId.length === 36;

        if (!isUUID) {
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

        // SIMPLIFIED: Get all active staff without schedule checks
        const { data: staffList, error } = await supabase
            .from('staff')
            .select('id, name, email, phone, role, is_active, created_at, updated_at')
            .eq('tenant_id', resolvedTenantId)
            .eq('is_active', true)
            .order('name');

        if (error) {
            console.error('Error fetching staff:', error);
            return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
        }

        const staff = (staffList || []).map((s: any) => ({
            id: s.id,
            tenantId: resolvedTenantId,
            name: s.name,
            email: s.email,
            phone: s.phone,
            role: s.role,
            isActive: s.is_active,
            createdAt: s.created_at,
            updatedAt: s.updated_at
        }));

        return NextResponse.json({ staff });
    } catch (error) {
        console.error('Error fetching staff:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
