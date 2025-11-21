import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const getSupabaseClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
};

// GET /api/staff/[id] - Get staff details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = getSupabaseClient();
        const tenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
        }

        const { id } = await params;

        const { data: staff, error } = await supabase
            .from('staff')
            .select('*')
            .eq('id', id)
            .eq('tenant_id', tenantId)
            .single();

        if (error || !staff) {
            return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
        }

        return NextResponse.json(staff);
    } catch (error) {
        console.error('Error fetching staff details:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/staff/[id] - Update staff details
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = getSupabaseClient();
        const tenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
        }

        const { id } = await params;
        const body = await request.json();

        // Prevent updating sensitive fields or tenant_id
        const { id: _, tenant_id: __, created_at: ___, ...updates } = body;

        const { data: staff, error } = await supabase
            .from('staff')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('tenant_id', tenantId)
            .select()
            .single();

        if (error) {
            console.error('Error updating staff:', error);
            return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 });
        }

        return NextResponse.json(staff);
    } catch (error) {
        console.error('Error updating staff details:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/staff/[id] - Delete staff member
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = getSupabaseClient();
        const tenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
        }

        const { id } = await params;

        const { error } = await supabase
            .from('staff')
            .delete()
            .eq('id', id)
            .eq('tenant_id', tenantId);

        if (error) {
            console.error('Error deleting staff:', error);
            return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting staff:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
