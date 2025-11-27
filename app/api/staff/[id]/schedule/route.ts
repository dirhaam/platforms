export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// GET /api/staff/[id]/schedule - Get staff working hours schedule
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

    const { id: staffId } = await params;

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

    // Get staff schedule
    const { data, error } = await supabase
      .from('staff_schedule')
      .select('*')
      .eq('staff_id', staffId)
      .order('day_of_week', { ascending: true });

    if (error) {
      console.error('Error fetching staff schedule:', error);
      return NextResponse.json(
        { error: 'Failed to fetch schedule' },
        { status: 500 }
      );
    }

    // Get staff home visit config
    const { data: staffData } = await supabase
      .from('staff')
      .select('home_visit_config')
      .eq('id', staffId)
      .single();

    // Format response
    const schedule = (data || []).map(record => ({
      id: record.id,
      dayOfWeek: record.day_of_week,
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][record.day_of_week],
      startTime: record.start_time,
      endTime: record.end_time,
      isAvailable: record.is_available,
      breakStart: record.break_start,
      breakEnd: record.break_end,
      notes: record.notes
    }));

    // Parse home visit config
    const homeVisitConfig = staffData?.home_visit_config || {
      canDoHomeVisit: true,
      maxDailyHomeVisits: 3,
      maxTravelDistanceKm: 20,
      preferredAreas: []
    };

    return NextResponse.json({
      staffId,
      schedule,
      homeVisitConfig
    });
  } catch (error) {
    console.error('Error in staff schedule GET endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/staff/[id]/schedule - Set staff working hours
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const tenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const { id: staffId } = await params;
    const body = await request.json();
    const {
      dayOfWeek,
      startTime,
      endTime,
      isAvailable = true,
      notes
    } = body;

    if (dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'dayOfWeek, startTime, and endTime are required' },
        { status: 400 }
      );
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json(
        { error: 'dayOfWeek must be between 0 (Sunday) and 6 (Saturday)' },
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

    // Create or update staff schedule
    const { data, error } = await supabase
      .from('staff_schedule')
      .upsert({
        staff_id: staffId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        is_available: isAvailable,
        notes: notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'staff_id,day_of_week'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating staff schedule:', error);
      return NextResponse.json(
        { error: 'Failed to update schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      schedule: {
        id: data.id,
        dayOfWeek: data.day_of_week,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][data.day_of_week],
        startTime: data.start_time,
        endTime: data.end_time,
        isAvailable: data.is_available,
        notes: data.notes
      }
    });
  } catch (error) {
    console.error('Error in staff schedule POST endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/staff/[id]/schedule - Bulk update all schedule and home visit config
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const tenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const { id: staffId } = await params;
    const body = await request.json();
    const { schedule, homeVisitConfig } = body;

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

    // Update all schedule items
    if (schedule && Array.isArray(schedule)) {
      for (const item of schedule) {
        const { dayOfWeek, startTime, endTime, isAvailable, breakStart, breakEnd } = item;
        
        if (dayOfWeek === undefined) continue;

        await supabase
          .from('staff_schedule')
          .upsert({
            staff_id: staffId,
            day_of_week: dayOfWeek,
            start_time: startTime || '08:00',
            end_time: endTime || '17:00',
            is_available: isAvailable !== false,
            break_start: breakStart || null,
            break_end: breakEnd || null,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'staff_id,day_of_week'
          });
      }
    }

    // Update home visit config in staff table
    if (homeVisitConfig) {
      const { error: updateError } = await supabase
        .from('staff')
        .update({
          home_visit_config: homeVisitConfig,
          updated_at: new Date().toISOString()
        })
        .eq('id', staffId)
        .eq('tenant_id', tenantId);

      if (updateError) {
        console.error('Error updating home visit config:', updateError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Schedule and configuration updated successfully'
    });
  } catch (error) {
    console.error('Error in staff schedule PUT endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
