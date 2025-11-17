import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('business_hours')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) {
      // Return default hours if not found
      return NextResponse.json({
        schedule: {
          monday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
          tuesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
          wednesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
          thursday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
          friday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
          saturday: { isOpen: false, openTime: '09:00', closeTime: '14:00' },
          sunday: { isOpen: false, openTime: '09:00', closeTime: '14:00' },
        },
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching business hours:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business hours' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, schedule, timezone = 'Asia/Jakarta' } = body;

    if (!tenantId || !schedule) {
      return NextResponse.json(
        { error: 'Tenant ID and schedule required' },
        { status: 400 }
      );
    }

    // Validate schedule format
    console.log('[business-hours PUT] Received schedule:', JSON.stringify(schedule, null, 2));

    for (const [day, hours] of Object.entries(schedule)) {
      if (hours.isOpen) {
        // Validate time format HH:MM
        if (!/^\d{2}:\d{2}$/.test(hours.openTime) || !/^\d{2}:\d{2}$/.test(hours.closeTime)) {
          console.error(`[business-hours PUT] Invalid time format for ${day}:`, { 
            openTime: hours.openTime, 
            closeTime: hours.closeTime 
          });
          return NextResponse.json(
            { error: `Invalid time format for ${day}. Expected HH:MM format.` },
            { status: 400 }
          );
        }
      }
    }

    const supabase = getSupabaseClient();

    // Try to update, if not found insert
    const { data: existing } = await supabase
      .from('business_hours')
      .select('id')
      .eq('tenant_id', tenantId)
      .single();

    const dataToSave = {
      schedule,
      timezone,
      updated_at: new Date().toISOString(),
    };

    console.log('[business-hours PUT] Saving to database:', {
      tenantId,
      dataToSave,
    });

    if (existing) {
      const { error } = await supabase
        .from('business_hours')
        .update(dataToSave)
        .eq('tenant_id', tenantId);

      if (error) {
        console.error('[business-hours PUT] Update error:', error);
        throw error;
      }
      console.log('[business-hours PUT] Update successful');
    } else {
      const { error } = await supabase
        .from('business_hours')
        .insert({
          tenant_id: tenantId,
          ...dataToSave
        });

      if (error) {
        console.error('[business-hours PUT] Insert error:', error);
        throw error;
      }
      console.log('[business-hours PUT] Insert successful');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating business hours:', error);
    return NextResponse.json(
      { error: 'Failed to update business hours' },
      { status: 500 }
    );
  }
}
