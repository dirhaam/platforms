export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// GET /api/staff/[id]/leave - Get staff leave/vacation records
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseClient();
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const staffId = params.id;
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    // Verify staff exists
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id')
      .eq('id', staffId)
      .eq('tenant_id', tenantId)
      .single();

    if (staffError || !staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Get staff leave
    let query = supabase
      .from('staff_leave')
      .select(`
        id,
        date_start,
        date_end,
        reason,
        is_paid,
        approver_id,
        notes,
        created_at
      `)
      .eq('staff_id', staffId)
      .order('date_start', { ascending: false });

    if (activeOnly) {
      const today = new Date().toISOString().split('T')[0];
      query = query.lte('date_start', today).gte('date_end', today);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching staff leave:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leave records' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      staffId,
      leave: data || [],
      total: data?.length || 0
    });
  } catch (error) {
    console.error('Error in staff leave GET endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/staff/[id]/leave - Create staff leave record
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseClient();
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const staffId = params.id;
    const body = await request.json();
    const {
      dateStart,
      dateEnd,
      reason,
      isPaid = true,
      approverId,
      notes
    } = body;

    if (!dateStart || !dateEnd || !reason) {
      return NextResponse.json(
        { error: 'dateStart, dateEnd, and reason are required' },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(dateStart);
    const end = new Date(dateEnd);

    if (start > end) {
      return NextResponse.json(
        { error: 'dateStart must be before dateEnd' },
        { status: 400 }
      );
    }

    // Verify staff exists
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id')
      .eq('id', staffId)
      .eq('tenant_id', tenantId)
      .single();

    if (staffError || !staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // If approverId provided, verify approver exists
    if (approverId) {
      const { data: approver, error: approverError } = await supabase
        .from('staff')
        .select('id')
        .eq('id', approverId)
        .eq('tenant_id', tenantId)
        .single();

      if (approverError || !approver) {
        return NextResponse.json({ error: 'Approver not found' }, { status: 404 });
      }
    }

    // Create leave record
    const { data, error } = await supabase
      .from('staff_leave')
      .insert({
        staff_id: staffId,
        date_start: dateStart,
        date_end: dateEnd,
        reason: reason,
        is_paid: isPaid,
        approver_id: approverId || null,
        notes: notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating staff leave:', error);
      return NextResponse.json(
        { error: 'Failed to create leave record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      leave: {
        id: data.id,
        dateStart: data.date_start,
        dateEnd: data.date_end,
        reason: data.reason,
        isPaid: data.is_paid,
        approverId: data.approver_id,
        notes: data.notes,
        createdAt: data.created_at
      }
    });
  } catch (error) {
    console.error('Error in staff leave POST endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/staff/[id]/leave/[leaveId] - Delete staff leave record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseClient();
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const staffId = params.id;
    const { searchParams } = new URL(request.url);
    const leaveId = searchParams.get('leaveId');

    if (!leaveId) {
      return NextResponse.json(
        { error: 'leaveId query parameter is required' },
        { status: 400 }
      );
    }

    // Verify leave record belongs to the staff member
    const { data: leave, error: leaveError } = await supabase
      .from('staff_leave')
      .select('id')
      .eq('id', leaveId)
      .eq('staff_id', staffId)
      .single();

    if (leaveError || !leave) {
      return NextResponse.json({ error: 'Leave record not found' }, { status: 404 });
    }

    // Delete the record
    const { error: deleteError } = await supabase
      .from('staff_leave')
      .delete()
      .eq('id', leaveId);

    if (deleteError) {
      console.error('Error deleting staff leave:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete leave record' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in staff leave DELETE endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
